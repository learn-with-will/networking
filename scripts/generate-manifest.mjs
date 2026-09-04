// Generates public/content/course-manifest.json from each lesson's front-matter.
// The manifest is the single source of truth the app loads, so it must exactly
// mirror the lessons. Run with `node scripts/generate-manifest.mjs`.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = resolve(root, 'public', 'content');
const levels = ['beginner', 'intermediate', 'advanced'];

function parseFrontMatter(src) {
  const end = src.indexOf('\n---', 4);
  const fmLines = src.slice(4, end).split('\n');
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
        meta[key] = rawVal.trim().replace(/^["']|["']$/g, '');
        curKey = null;
      }
    }
  }
  return meta;
}

const entries = [];
for (const level of levels) {
  const dir = resolve(contentDir, level);
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const meta = parseFrontMatter(readFileSync(resolve(dir, file), 'utf8'));
    entries.push({
      id: meta.id,
      slug: meta.slug,
      title: meta.title,
      level: meta.level,
      order: Number(meta.order),
      duration: Number(meta.duration),
      file: `${meta.level}/${meta.slug}.md`,
      summary: meta.summary,
      tags: meta.tags,
    });
  }
}

entries.sort((a, b) => a.order - b.order);
const out = resolve(contentDir, 'course-manifest.json');
writeFileSync(out, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${entries.length} entries to course-manifest.json`);
