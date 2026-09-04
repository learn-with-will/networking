---
id: lesson-24
slug: capstone-trace-a-request
title: "Capstone: Trace a Request End-to-End"
level: advanced
order: 24
duration: 24
tags:
  - capstone
  - end-to-end
  - dns
  - tcp
  - integration
summary: "The whole course in one journey — follow a single HTTPS request from typing a URL to rendered pixels, through DNS, ARP, routing, NAT, the TCP and TLS handshakes, and the HTTP exchange."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Trace a complete web request from **URL to pixels**, naming each step.
- Connect every layer and protocol from the course into **one coherent flow**.
- Identify **which layer** a given step belongs to and what it contributes.
- Reason about **where a failure** in the chain would show up.
- Use the whole journey as a **mental model** for debugging real problems.

# Why It Matters

Each earlier lesson covered one piece: addresses, DNS, ARP, TCP, TLS, HTTP, routing, NAT, performance.
This capstone assembles them into the single most useful mental model in networking — "**what actually
happens when I open a web page?**" Once you can narrate this end to end, you can place any bug, any tool,
and any protocol on the map, and troubleshooting becomes a matter of asking *which step* broke.

# Concept Explanation

We'll trace one request: you type `https://example.com` and press Enter. Assume a typical laptop on home
Wi-Fi, behind a NAT router, first visit (nothing cached).

### Step 1 — Parse the URL

The browser parses `https://example.com`: scheme **https** (so TLS on port **443**), host
`example.com`, path `/`. It now needs the host's **IP address**.

### Step 2 — DNS resolution (name → IP)

The browser asks the OS **stub resolver**, which asks the configured **recursive resolver**. If nothing
is cached, the resolver walks the hierarchy: **root → .com TLD → example.com authoritative**, and gets
back an address (say `93.184.216.34`), with a **TTL** for caching.

```text
   stub -> recursive -> root -> TLD(.com) -> authoritative -> A 93.184.216.34
```

*(This DNS query itself travels over the network — usually UDP/53 — via the same lower layers below.)*

### Step 3 — Is the destination local or remote? (routing decision)

The OS compares `93.184.216.34` against its **routing table**. It's not on the local subnet, so it
matches the **default route** — send it to the **default gateway** (the home router). To build the
Ethernet/Wi-Fi frame to the gateway, the laptop needs the **gateway's MAC address**.

### Step 4 — ARP (IP → MAC for the next hop)

If the gateway's MAC isn't cached, the laptop **ARPs**: "Who has 192.168.1.1?" The router replies with
its MAC. Now the laptop can frame packets to the gateway. Remember: the **destination IP stays**
`93.184.216.34`, but the **destination MAC** is the gateway's — MAC is per hop.

### Step 5 — TCP handshake (establish a connection)

The browser opens a **TCP** connection to `93.184.216.34:443` with the **three-way handshake**:

```text
   SYN     ->      (client: let's connect)
        <- SYN-ACK  (server: ok, and I acknowledge)
   ACK     ->      (client: acknowledged) -> established
```

Each of these segments is wrapped in IP and a frame, sent to the gateway, and routed hop by hop.

### Step 6 — NAT (private → public, on the way out)

As the packets leave through the router, **NAT (PAT)** rewrites the **private source** (`192.168.1.x`
+ port) to the router's **public IP** + a translated port, recording the mapping so replies can be
translated back. The internet sees the request coming from the router's public address.

### Step 7 — Routing across the internet

Router by router, each does a **longest-prefix match** and forwards toward `93.184.216.34`, decrementing
the **TTL** each hop. Between ISPs, **BGP** decides the inter-network path. Eventually a router directly
connected to the server's network delivers the packets.

### Step 8 — TLS handshake (secure the channel)

Over the established TCP connection, **TLS** negotiates security: the client sends a Client Hello (with
**SNI** = `example.com`); the server responds with its **certificate**; the client verifies the **chain
of trust** and that the name matches; both derive a **symmetric key**. Now the channel is encrypted,
integrity-protected, and the server's identity is verified.

### Step 9 — HTTP request and response

Inside the encrypted channel, the browser sends the **HTTP request**:

```text
   GET / HTTP/2
   Host: example.com
```

The server returns a **status code** and the HTML body:

```text
   HTTP/2 200 OK
   Content-Type: text/html
   <html>...</html>
```

Replies flow back the reverse way: server → internet routing → the router (where **NAT translates the
public destination back to your laptop's private address**) → your laptop.

### Step 10 — Render (and more requests)

The browser parses the HTML, discovers CSS/JS/images, and makes **more requests** (reusing the
connection where possible, often multiplexed via **HTTP/2/3**). As resources arrive, it renders the
page — pixels on your screen. **Latency** (all those round trips) usually dominates how fast this feels.

### The whole journey at a glance

```text
   URL parse
     -> DNS (name -> IP)                      [application/UDP -> ... ]
     -> routing decision (local vs default)   [internet layer]
     -> ARP (next-hop IP -> MAC)              [link layer]
     -> TCP handshake (SYN/SYN-ACK/ACK)       [transport]
     -> NAT rewrite outbound                  [at the router]
     -> internet routing, hop by hop (TTL)    [internet layer + BGP]
     -> TLS handshake (cert, keys)            [security over TCP]
     -> HTTP request/response (200 + HTML)    [application]
     -> NAT translate replies back            [at the router]
     -> render + more requests                [browser]
```

# Key Terminology

- **End-to-end flow** — the full sequence from URL to rendered page.
- **Stub / recursive resolver** — the client and the server that perform DNS resolution.
- **Default gateway** — the router used to reach non-local destinations.
- **Three-way handshake** — TCP connection setup (SYN, SYN-ACK, ACK).
- **NAT translation** — rewriting private↔public address/port at the router.
- **Chain of trust** — validating a TLS certificate up to a trusted root CA.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Second visit | Redo everything | Use caches (DNS TTL, connection reuse, TLS resumption) | Caches skip whole steps — reuse aggressively; only redo what's expired. |
| Speed up first load | More bandwidth | Fewer round trips + closer server (CDN) | The flow is latency-bound; cut RTTs (HTTP/3, 0-RTT) and distance rather than buying bandwidth. |
| Debugging | Guess a layer | Walk the flow in order | Walk the flow — each step maps to a tool (dig, ip route, tcpdump, curl) that confirms or clears it. |

# Worked Example

Map each step to the tool that inspects it — the course's toolkit, in order:

```text
   URL parse         -> (browser dev tools)
   DNS               -> dig example.com +short        (does it resolve?)
   routing / gateway -> ip route ; ping <gateway>     (right next hop, reachable?)
   ARP               -> ip neigh                       (is the gateway's MAC known?)
   path across net   -> traceroute example.com         (where do packets stop?)
   TCP + TLS + HTTP  -> curl -v https://example.com/    (handshakes, cert, status)
   raw bytes         -> tcpdump -ni any port 443        (ground truth on the wire)
```

If `dig` fails → DNS. If `traceroute` stalls partway → path/routing. If `curl -v` shows a cert error →
TLS. If it shows `502` → the server/app. Each step you clear narrows the problem to the next.

# Real World Analogy

Opening a web page is like **sending an important sealed letter overseas and getting a reply**. You look
up the recipient's address in a directory (**DNS**). You realize they're abroad, so you take it to the
post office, not their door (**routing to the gateway**), and you address the outer envelope to the
right local carrier (**ARP for the next hop**). You and the recipient first exchange a quick "ready?
ready." (**TCP handshake**). Your local post office stamps its own return address on international mail
(**NAT**). It's relayed depot to depot across borders (**internet routing / BGP**). Before discussing
anything sensitive, you verify each other's identity and agree on a private code (**TLS**). Then you
actually exchange the message (**HTTP request/response**), and the reply retraces the route home, where
your post office matches it back to you (**NAT reverse**). Finally you read it (**render**).

# Examples

## Example 1 — Basic: the cached second visit

On your next visit within the DNS TTL, the browser skips the full DNS walk (cached), may reuse the TCP
connection and resume TLS, and jumps almost straight to the HTTP request. The page loads noticeably
faster because several steps are cached away.

**Why this works:** caches at each layer (DNS TTL, connection keep-alive, TLS resumption) let repeat
visits skip work the first visit had to do.

## Example 2 — Real-world: pinpointing a failure

A site won't load. Walking the flow: `dig` resolves fine; `traceroute` reaches the server's network;
`curl -v` completes TLS but returns **503**. Conclusion: DNS, path, and TLS are healthy — the
**server/app** is unavailable. You've localized the fault to the last step without guessing.

**Why this works:** clearing each step in order leaves exactly one place the failure can be.

## Example 3 — Pitfall: blaming the wrong layer

A user with a `169.254.x.x` address says "the website is down." But that address means **DHCP failed** —
step 3's routing can't even begin because there's no valid local config. The website is fine; the
failure is at the very first local step.

**Why this bites:** without the end-to-end model, a local misconfiguration gets mistaken for a remote
outage, sending you to debug the wrong end.

# Common Mistakes

- **Skipping DNS in the mental model.** Resolution happens *before* any connection — and is a common
  failure point.
- **Forgetting MAC changes each hop while IP stays.** The gateway's MAC (via ARP) is only the first hop.
- **Ignoring NAT on the return path.** Replies must be translated back to your private address to reach
  you.
- **Assuming one round trip.** A cold load is DNS + TCP + TLS + HTTP — several RTTs before content.

# Best Practices

- Keep the **end-to-end flow** in your head; it's the master map for both design and debugging.
- Debug **in order** (DNS → routing → path → TCP/TLS → HTTP), matching each step to a tool.
- Exploit **caching** (DNS TTL, keep-alive, TLS resumption, HTTP/3) to cut repeat-visit latency.
- When you hit a wall, ask **"which step?"** rather than "is the network broken?" — the flow gives you
  the answer.

# Summary

- A web request travels a fixed journey: **URL → DNS → routing decision → ARP → TCP handshake → NAT →
  internet routing → TLS → HTTP → render.**
- Each step lives on a specific **layer** and contributes one thing; together they turn a name and a
  keystroke into rendered pixels.
- The **destination IP stays end-to-end** while the **MAC changes each hop**, and **NAT** rewrites
  addresses out and back.
- A cold load costs **several round trips** (DNS, TCP, TLS, HTTP), so it's usually **latency-bound**;
  caches make repeat visits fast.
- The flow is the ultimate **debugging map**: clear each step in order and the failure reveals itself.

# Flash Cards

Q: What is the first network step after the browser parses an HTTPS URL?
A: DNS resolution — turning the hostname into an IP address (stub → recursive resolver → root → TLD → authoritative) before any connection is made.

Q: Why does the laptop ARP for the gateway's MAC when the destination is a remote server?
A: Because the server is on a different network, so the packet goes to the default gateway first; the frame to that next hop needs the gateway's MAC, even though the destination IP is the server's.

Q: In what order do the TCP and TLS handshakes happen?
A: TCP first (SYN, SYN-ACK, ACK) to establish the connection, then TLS over that connection to encrypt and verify identity, then the HTTP request flows.

Q: What does NAT do on the way out and on the way back?
A: Outbound, it rewrites your private source IP/port to the router's public IP/port and records the mapping; inbound, it translates the reply's public destination back to your private address.

Q: Why does a cold page load feel slow even on a fast connection?
A: It requires several sequential round trips (DNS, TCP handshake, TLS handshake, HTTP request) before content arrives, so it's latency-bound — bandwidth doesn't shorten those RTTs.

Q: How do you use the end-to-end flow to debug a failure?
A: Walk it in order (dig for DNS, ip route/ping for routing, traceroute for the path, curl -v for TCP/TLS/HTTP); each step you clear narrows the problem to the next.

# Exercises

### Easy
Write the ordered list of steps from typing `https://example.com` to seeing the page, in your own words.
Aim for at least eight steps.

### Medium
For each step in the flow, name the primary layer it belongs to and one command-line tool you'd use to
verify that step is working.

### Challenging
A colleague reports "example.com is completely down" from their laptop, but you can load it fine.
Design a full end-to-end investigation that walks the request flow to determine whether the cause is
their DHCP/local config, their DNS resolver, a routing/path issue, a TLS problem, or the server —
naming the tool and the expected result at each step, and explaining how each result narrows the cause.

# Further Reading

- MDN — *What happens when you navigate to a URL / How the web works*: <https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works>
- Cloudflare — *What happens in a TLS handshake? / What is DNS?*: <https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/>
- "What happens when..." (a deep community walkthrough of a request): <https://github.com/alex/what-happens-when>
- High Performance Browser Networking (Ilya Grigorik): <https://hpbn.co/>
