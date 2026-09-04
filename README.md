# Networking Learning Portal

A **frontend-only** Computer Networking course: read Markdown lessons, take quizzes, and track
your progress — all in the browser. No sign-up, no backend.

Live at **https://learn-with-will.github.io/networking/**

## What this is

The portal shell is built with React 19, Vite, TypeScript, React Router, Tailwind CSS v4,
`marked`, and PrismJS. It renders a **24-lesson curriculum** that takes you from "what is a
network?" through the layered models (OSI and TCP/IP), IP and MAC addressing, packets and frames,
ports and sockets, and the client–server model; on to the core protocols you use every day —
subnetting and CIDR, DNS, DHCP, TCP and UDP, HTTP and HTTPS/TLS; and finally to production topics —
routing, NAT, firewalls, load balancing, packet capture with `tcpdump`, HTTP/2 and HTTP/3 over QUIC,
and performance — ending in an end-to-end capstone that traces one web request from URL to pixels.
Every lesson is written in plain, welcoming English and verified against primary sources (the IETF
RFCs, MDN, and tool documentation — see the authoring contract in `prompts/`).

Progress, bookmarks, and quiz scores live in `localStorage` under `networking-learning-*` keys, so
nothing leaves your machine.

## Run it locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## How the content works

- **Lessons** are Markdown files in `public/content/{beginner,intermediate,advanced}/`, each with
  YAML front-matter (`id`, `slug`, `title`, `level`, `order`, `duration`, `tags`, `summary`).
- **Quizzes** are JSON files in `public/quizzes/` (`lesson-NN.json`), one per lesson, spanning five
  question types (single-choice, multiple-choice, fill-blank, ordering, match-pair).
- **`public/content/course-manifest.json`** is the single source of truth for which lessons exist
  and their order. Adding a lesson is just a Markdown file plus a manifest entry — no code change.
- Only `bash` and `text` code fences are used (tool sessions, and packet/header/topology diagrams).

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds with
`BASE_PATH=/networking/` and publishes `dist/` to GitHub Pages. A `404.html` copy of `index.html`
gives the single-page app a deep-link fallback on Pages.

## Sources

Facts are anchored on primary sources — the IETF RFC series (IP, TCP, UDP, DNS, HTTP, TLS, CIDR,
private addressing…), IANA registries, MDN Web Docs for HTTP, Cloudflare's Learning Center, and the
manual pages for the CLI tools taught. The full list and the no-hallucination contract live in
[`prompts/networking-authoring-prompt.md`](prompts/networking-authoring-prompt.md).
