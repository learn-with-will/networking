# Learning Portal card snippet — Computer Networking

Paste these into the **separate** portal repo `ThachThanhThien/LearningPortal` (`index.html`).
The `category: 'Networking'` is a new category and will auto-appear in the portal's filter.

## 1. `COURSES` entry

```js
{ id:'networking', title:'Computer Networking',
  description:'How the internet actually works, for developers — the OSI & TCP/IP models, IP addressing and subnetting, DNS, DHCP, TCP vs UDP, HTTP/HTTPS and TLS, ports & sockets, routing, NAT, firewalls, load balancing, and hands-on troubleshooting with real CLI tools (ping, dig, curl, traceroute, tcpdump), ending in an end-to-end capstone.',
  url:'https://learn-with-will.github.io/networking/', difficulty:'Beginner', category:'Networking',
  tags:['TCP/IP','DNS','HTTP/HTTPS','Subnetting','Routing','CLI Tools'],
  technologies:['TCP/IP','DNS','HTTP','TLS'], themeColor:'#2563EB', icon:'NET',
  estimatedHours:40, topics:24, isNew:true, isFeatured:true }
```

## 2. `LOGOS['networking']` — inline monochrome SVG (uses `currentColor`)

```js
LOGOS['networking'] = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 12 5 5.5M12 12l7-6.5M12 12v7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="5" cy="5.5" r="2.1" fill="currentColor"/>
  <circle cx="19" cy="5.5" r="2.1" fill="currentColor"/>
  <circle cx="12" cy="19.5" r="2.1" fill="currentColor"/>
  <circle cx="12" cy="12" r="2.7" fill="currentColor"/>
</svg>`;
```
