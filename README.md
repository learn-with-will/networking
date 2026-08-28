# Computer Networking — Learning-Portal course (to be built)

This repository will host the **Computer Networking** course for the
[Learning Portal](https://thachthanhthien.github.io/) family of self-paced, static course micro-apps.

It is currently seeded with a single build prompt. To create the course, open a Claude Code session
connected to this repo and hand it [`prompts/new-course-prompt.md`](prompts/new-course-prompt.md):
that prompt derives every detail from the topic and builds the full 24-lesson course end-to-end
(React 19 + Vite + TypeScript shell, Markdown lessons, JSON quizzes), then publishes it to GitHub Pages
at `https://thachthanhthien.github.io/networking/`.

> Scope: How the internet actually works, for developers — the OSI & TCP/IP models, IP addressing and subnetting, DNS, TCP vs UDP, HTTP/HTTPS and TLS, ports & sockets, routing, NAT, and hands-on troubleshooting with real CLI tools (ping, traceroute, dig, curl, netstat/ss, tcpdump).
