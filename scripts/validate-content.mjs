// Course content validator. Run with `node scripts/validate-content.mjs`.
// Checks the 24↔24↔manifest invariants the authoring contract promises:
//   - manifest has 24 entries, 8/8/8 per level, orders 1..24 unique
//   - every lesson file's front-matter matches its manifest entry, filename, level
//   - each lesson has all required H1 sections (in order), Example 1/2/3,
//     Easy/Medium/Challenging exercises, >=5 flash cards, exactly 5 tags
//   - code fences are only `bash` or `text`
//   - each quiz matches its lesson, has passingScore 60, 5-6 questions spanning
//     all five question types, and internally-consistent answers + explanations
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = resolve(root, 'public', 'content');
const quizDir = resolve(root, 'public', 'quizzes');
const manifestPath = resolve(contentDir, 'course-manifest.json');

const errors = [];
const err = (m) => errors.push(m);

const REQUIRED_SECTIONS = [
  'Learning Objectives',
  'Why It Matters',
  'Concept Explanation',
  'Key Terminology',
  'Options and Trade-offs',
  'Worked Example',
  'Real World Analogy',
  'Examples',
  'Common Mistakes',
  'Best Practices',
  'Summary',
  'Flash Cards',
  'Exercises',
  'Further Reading',
];
const ALLOWED_FENCES = new Set(['bash', 'text']);
const QUESTION_TYPES = ['single-choice', 'multiple-choice', 'fill-blank', 'ordering', 'match-pair'];

/** Minimal front-matter parser for the small YAML subset the lessons use. */
function parseFrontMatter(src, label) {
  if (!src.startsWith('---\n')) {
    err(`${label}: missing front-matter`);
    return { meta: {}, body: src };
  }
  const end = src.indexOf('\n---', 4);
  if (end === -1) {
    err(`${label}: unterminated front-matter`);
    return { meta: {}, body: src };
  }
  const fmLines = src.slice(4, end).split('\n');
  const body = src.slice(src.indexOf('\n', end + 1) + 1);
  const meta = {};
  let curKey = null;
  for (const line of fmLines) {
    if (/^\s+-\s+/.test(line) && curKey) {
      meta[curKey].push(line.replace(/^\s+-\s+/, '').trim());
    } else {
      const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (rawVal === '') {
        meta[key] = [];
        curKey = key;
      } else {
        let v = rawVal.trim().replace(/^["']|["']$/g, '');
        meta[key] = v;
        curKey = null;
      }
    }
  }
  return { meta, body };
}

function validateLesson(entry) {
  const label = entry.file;
  const filePath = resolve(contentDir, entry.file);
  if (!existsSync(filePath)) {
    err(`${label}: file missing`);
    return;
  }
  const src = readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontMatter(src, label);
  // Prose = body with fenced code blocks removed, so a `# comment` inside a bash
  // fence is never mistaken for an H1 section heading.
  const prose = body.replace(/^```[\s\S]*?^```/gm, '');

  // front-matter <-> manifest / filename / level
  for (const k of ['id', 'slug', 'title', 'level', 'order', 'duration', 'summary']) {
    if (meta[k] === undefined) err(`${label}: front-matter missing '${k}'`);
  }
  if (meta.id !== entry.id) err(`${label}: id '${meta.id}' != manifest '${entry.id}'`);
  if (meta.slug !== entry.slug) err(`${label}: slug '${meta.slug}' != manifest '${entry.slug}'`);
  if (meta.title !== entry.title) err(`${label}: title mismatch vs manifest`);
  if (meta.level !== entry.level) err(`${label}: level '${meta.level}' != manifest '${entry.level}'`);
  if (Number(meta.order) !== entry.order) err(`${label}: order '${meta.order}' != manifest '${entry.order}'`);
  if (String(entry.file) !== `${meta.level}/${meta.slug}.md`)
    err(`${label}: file path should be '${meta.level}/${meta.slug}.md'`);
  if (!/^lesson-\d\d$/.test(meta.id || '')) err(`${label}: id not lesson-NN`);
  if (!Array.isArray(meta.tags) || meta.tags.length !== 5)
    err(`${label}: tags must be exactly 5 (got ${Array.isArray(meta.tags) ? meta.tags.length : 'none'})`);
  if (typeof meta.summary !== 'string' || meta.summary.length < 20)
    err(`${label}: summary too short/missing`);
  if (entry.summary !== meta.summary) err(`${label}: manifest summary != front-matter summary`);
  if (Number(entry.duration) !== Number(meta.duration)) err(`${label}: manifest duration != front-matter`);

  // required H1 sections, in order (scanned on prose so code comments don't count)
  const h1s = [...prose.matchAll(/^# (.+)$/gm)].map((m) => m[1].trim());
  let searchFrom = 0;
  for (const sec of REQUIRED_SECTIONS) {
    const idx = h1s.indexOf(sec, searchFrom);
    if (idx === -1) {
      if (h1s.includes(sec)) err(`${label}: section '${sec}' out of order`);
      else err(`${label}: missing H1 section '${sec}'`);
    } else {
      searchFrom = idx + 1;
    }
  }

  // Examples subsections
  for (const n of [1, 2, 3]) {
    if (!new RegExp(`^## Example ${n}\\b`, 'm').test(prose))
      err(`${label}: missing '## Example ${n}'`);
  }
  // Exercises subsections
  for (const lvl of ['Easy', 'Medium', 'Challenging']) {
    if (!new RegExp(`^### ${lvl}\\b`, 'm').test(prose)) err(`${label}: missing '### ${lvl}' exercise`);
  }

  // Flash cards >= 5 (count Q: lines within the Flash Cards section)
  const fcMatch = prose.match(/^# Flash Cards$([\s\S]*?)^# /m) || prose.match(/^# Flash Cards$([\s\S]*)$/m);
  const fcBody = fcMatch ? fcMatch[1] : '';
  const qCount = (fcBody.match(/^Q:\s/gm) || []).length;
  const aCount = (fcBody.match(/^A:\s/gm) || []).length;
  if (qCount < 5) err(`${label}: only ${qCount} flash-card Q: (need >=5)`);
  if (qCount !== aCount) err(`${label}: flash-card Q/A mismatch (${qCount} Q, ${aCount} A)`);

  // Code fences only bash|text
  const fences = [...body.matchAll(/^```([A-Za-z0-9_-]*)/gm)].map((m) => m[1]);
  // opening fences are even-indexed; closing fences have empty lang. Filter to non-empty.
  for (const f of fences) {
    if (f && !ALLOWED_FENCES.has(f)) err(`${label}: disallowed code fence language '${f}'`);
  }
}

function validateQuiz(entry) {
  const qp = resolve(quizDir, `${entry.id}.json`);
  const label = `${entry.id}.json`;
  if (!existsSync(qp)) {
    err(`${label}: quiz file missing`);
    return;
  }
  let quiz;
  try {
    quiz = JSON.parse(readFileSync(qp, 'utf8'));
  } catch (e) {
    err(`${label}: invalid JSON (${e.message})`);
    return;
  }
  if (quiz.id !== `quiz-${entry.id}`) err(`${label}: id should be 'quiz-${entry.id}'`);
  if (quiz.lessonId !== entry.id) err(`${label}: lessonId should be '${entry.id}'`);
  if (quiz.passingScore !== 60) err(`${label}: passingScore should be 60`);
  const qs = quiz.questions;
  if (!Array.isArray(qs) || qs.length < 5 || qs.length > 6)
    err(`${label}: must have 5-6 questions (got ${Array.isArray(qs) ? qs.length : 'none'})`);
  const typesSeen = new Set();
  const ids = new Set();
  for (const q of qs || []) {
    if (ids.has(q.id)) err(`${label}: duplicate question id '${q.id}'`);
    ids.add(q.id);
    typesSeen.add(q.type);
    if (!q.prompt) err(`${label}/${q.id}: missing prompt`);
    if (!q.explanation) err(`${label}/${q.id}: missing explanation`);
    if (!QUESTION_TYPES.includes(q.type)) {
      err(`${label}/${q.id}: unknown type '${q.type}'`);
      continue;
    }
    if (q.type === 'single-choice') {
      const optIds = (q.options || []).map((o) => o.id);
      if (optIds.length < 2) err(`${label}/${q.id}: single-choice needs >=2 options`);
      if (!optIds.includes(q.answer)) err(`${label}/${q.id}: answer '${q.answer}' not an option`);
    } else if (q.type === 'multiple-choice') {
      const optIds = (q.options || []).map((o) => o.id);
      if (!Array.isArray(q.answer) || q.answer.length < 1)
        err(`${label}/${q.id}: multiple-choice needs answer array`);
      for (const a of q.answer || []) if (!optIds.includes(a)) err(`${label}/${q.id}: answer '${a}' not an option`);
    } else if (q.type === 'fill-blank') {
      if (!Array.isArray(q.answer) || q.answer.length < 1)
        err(`${label}/${q.id}: fill-blank needs a non-empty answer array`);
    } else if (q.type === 'ordering') {
      const itemIds = (q.items || []).map((o) => o.id);
      if (itemIds.length < 2) err(`${label}/${q.id}: ordering needs >=2 items`);
      if (!Array.isArray(q.answer) || q.answer.length !== itemIds.length)
        err(`${label}/${q.id}: ordering answer must list every item id once`);
      else {
        for (const a of q.answer) if (!itemIds.includes(a)) err(`${label}/${q.id}: ordering answer id '${a}' unknown`);
        if (new Set(q.answer).size !== q.answer.length) err(`${label}/${q.id}: ordering answer has duplicates`);
      }
    } else if (q.type === 'match-pair') {
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) err(`${label}/${q.id}: match-pair needs >=2 pairs`);
      for (const p of q.pairs || []) if (!p.left || !p.right) err(`${label}/${q.id}: match-pair entry missing left/right`);
    }
  }
  for (const t of QUESTION_TYPES)
    if (!typesSeen.has(t)) err(`${label}: missing question type '${t}'`);
}

// ---- main ----
if (!existsSync(manifestPath)) {
  err('course-manifest.json missing');
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.length !== 24) err(`manifest has ${manifest.length} entries (need 24)`);
  const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
  const orders = new Set();
  for (const e of manifest) {
    byLevel[e.level] = (byLevel[e.level] || 0) + 1;
    if (orders.has(e.order)) err(`manifest: duplicate order ${e.order}`);
    orders.add(e.order);
  }
  for (let i = 1; i <= 24; i++) if (!orders.has(i)) err(`manifest: missing order ${i}`);
  for (const [lvl, n] of Object.entries(byLevel))
    if (n !== 8) err(`manifest: ${lvl} has ${n} lessons (need 8)`);

  for (const e of manifest) {
    validateLesson(e);
    validateQuiz(e);
  }

  // stray files not in manifest
  for (const lvl of ['beginner', 'intermediate', 'advanced']) {
    const d = resolve(contentDir, lvl);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.md')) continue;
      if (!manifest.some((e) => e.file === `${lvl}/${f}`)) err(`stray lesson file not in manifest: ${lvl}/${f}`);
    }
  }
  for (const f of readdirSync(quizDir)) {
    if (!f.endsWith('.json')) continue;
    if (!manifest.some((e) => `${e.id}.json` === f)) err(`stray quiz file not in manifest: ${f}`);
  }
}

if (errors.length) {
  console.error(`\n❌ Validation FAILED with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error('  • ' + e);
  process.exit(1);
} else {
  console.log('✅ Content valid: 24 lessons, 24 quizzes, manifest consistent.');
}
