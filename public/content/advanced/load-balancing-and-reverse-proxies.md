---
id: lesson-20
slug: load-balancing-and-reverse-proxies
title: "Load Balancing and Reverse Proxies"
level: advanced
order: 20
duration: 20
tags:
  - load-balancing
  - reverse-proxy
  - health-checks
  - tls-termination
  - scaling
summary: "How sites serve many users reliably — reverse proxies that front backend servers, load-balancing algorithms, Layer 4 vs Layer 7 balancing, health checks, and TLS termination."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **reverse proxy** is and how it differs from a **forward proxy**.
- Describe common **load-balancing algorithms** and when each fits.
- Contrast **Layer 4** and **Layer 7** load balancing.
- Explain **health checks** and how they enable high availability.
- Describe **TLS termination** and other jobs a reverse proxy offloads.

# Why It Matters

No single server can handle a large site's traffic, and any server can fail. **Reverse proxies** and
**load balancers** are how real systems scale out and stay up: they spread requests across many
backends, remove failed ones automatically, and centralize cross-cutting work like TLS. Nearly every
production web architecture has one in front — understanding it is essential for deploying and debugging
real services.

# Concept Explanation

### Forward proxy vs reverse proxy

A **proxy** is an intermediary that forwards traffic. Direction distinguishes the two kinds:

- A **forward proxy** sits in front of **clients** and forwards their requests out (e.g. a corporate
  proxy filtering employee web access). The server sees the proxy, not the client.
- A **reverse proxy** sits in front of **servers** and receives requests on their behalf (e.g. nginx,
  HAProxy, a cloud load balancer). The client sees the proxy, not the individual backends.

```text
   Forward:  [clients] -> (forward proxy) -> internet -> server
   Reverse:  client -> internet -> (reverse proxy) -> [backend servers]
```

This lesson is about **reverse proxies**, which usually double as **load balancers**.

### Load balancing: spread the work

A **load balancer** distributes incoming requests across a pool of backend servers so no single one is
overwhelmed. Common **algorithms**:

```text
   Round-robin        each new request to the next server in turn (simple, even)
   Least-connections  to the server with the fewest active connections (good for uneven load)
   Weighted           bigger servers get proportionally more traffic
   IP hash            same client IP -> same server (a form of session stickiness)
```

Round-robin is the simple default; least-connections adapts to requests that take unequal time; IP hash
(or cookie-based **stickiness**) keeps a user pinned to one backend when needed.

### Layer 4 vs Layer 7

Load balancers operate at different layers:

- **Layer 4 (transport)** balances by **IP and port** — it forwards TCP/UDP connections without looking
  inside. Fast and protocol-agnostic, but it can't route by URL or read HTTP.
- **Layer 7 (application)** understands **HTTP** — it can route by path/host/header (e.g.
  `/api` to one pool, `/images` to another), terminate TLS, and rewrite requests. More capable, slightly
  more overhead.

```text
   L4: "send this TCP connection to a backend"      (by IP/port)
   L7: "GET /api/... -> API pool; GET /img/... -> image pool"   (by HTTP content)
```

### Health checks and high availability

A load balancer continuously runs **health checks** against each backend (e.g. periodically requesting
`/health` and expecting `200`). An unhealthy backend is **removed from rotation** automatically and
re-added when it recovers, so failures don't reach users. This is how a pool stays available even as
individual servers crash, deploy, or restart.

### TLS termination and offloading

A reverse proxy commonly **terminates TLS**: it holds the certificate, decrypts HTTPS at the edge, and
talks to backends over the internal network (often plain HTTP, or re-encrypted for zero-trust setups).
This centralizes certificate management and frees backends from crypto work. Reverse proxies also often
handle **caching**, **compression**, **rate limiting**, and **request routing** — cross-cutting jobs
better done once at the edge than in every backend.

# Key Terminology

- **Reverse proxy** — an intermediary in front of servers that receives client requests on their behalf.
- **Forward proxy** — an intermediary in front of clients that forwards their outbound requests.
- **Load balancer** — distributes requests across a backend pool.
- **Round-robin / least-connections / IP hash** — request-distribution algorithms.
- **Layer 4 / Layer 7** — balancing by transport (IP/port) vs by application (HTTP) content.
- **Health check** — a periodic probe that removes unhealthy backends from rotation.
- **TLS termination** — decrypting HTTPS at the proxy edge.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Balancing layer | Layer 4 (fast, opaque) | Layer 7 (routes by HTTP) | L4 for raw speed/any protocol; L7 when you need path/host routing, TLS termination, or header logic. |
| Algorithm | Round-robin | Least-connections | Round-robin for uniform requests; least-connections when request durations vary widely. |
| TLS | Terminate at proxy | End-to-end to backend | Terminate at edge for simplicity/central certs; re-encrypt to backends for zero-trust/internal security. |

# Worked Example

A site scales from one server to a pool behind a reverse proxy:

```text
   client --HTTPS--> [ reverse proxy / L7 load balancer ]  (holds the cert, terminates TLS)
                         |  round-robin across healthy backends
             +-----------+-----------+
        web-1:80     web-2:80     web-3:80     (plain HTTP internally)

   - Proxy health-checks each backend at /health every few seconds.
   - web-2 crashes -> fails its check -> removed from rotation; users unaffected.
   - Deploy web-2 fresh -> it passes checks -> auto-added back.
```

Clients see one address and one certificate; the proxy spreads load and hides individual failures.

# Real World Analogy

A reverse proxy/load balancer is like the **host stand at a busy restaurant**. Guests (**clients**)
arrive at one desk (**one public address**), and the host seats them across many tables/servers
(**backends**) so no server is swamped — round-robin ("next table"), or least-loaded ("that server has
fewer tables right now"). If a server calls in sick (**failed health check**), the host simply stops
seating their section. The host also handles shared front-of-house tasks — checking coats (**TLS
termination**), managing the waitlist (**rate limiting**) — so the kitchen staff can focus on cooking.

# Examples

## Example 1 — Basic: round-robin across two servers

Two identical app servers sit behind a load balancer using round-robin. Request 1 goes to server A,
request 2 to B, request 3 to A, and so on — spreading load evenly with a trivial rule.

**Why this works:** for uniform requests, alternating in turn distributes work evenly without tracking
state.

## Example 2 — Real-world: path-based routing at Layer 7

A Layer 7 proxy routes `/api/*` to a backend API pool and everything else to a static-content pool,
terminating TLS once at the edge. One hostname serves multiple services, each scaled independently.

**Why this works:** Layer 7 can read the HTTP path, so it routes by URL — something a Layer 4 balancer
(which sees only IP/port) can't do.

## Example 3 — Pitfall: no session stickiness for stateful sessions

An app keeps session data in each server's local memory, but the balancer uses plain round-robin. A
user's requests land on different backends, so they appear logged out intermittently. The fix is either
**sticky sessions** (IP hash/cookie) or, better, **shared session state** (a database/cache) so any
backend can serve any user.

**Why this bites:** load balancing assumes backends are interchangeable; local per-server state breaks
that assumption unless you add stickiness or externalize the state.

# Common Mistakes

- **Confusing forward and reverse proxies.** Forward fronts **clients**; reverse fronts **servers**.
- **Expecting Layer 4 to route by URL.** Only **Layer 7** reads HTTP paths/headers.
- **Forgetting health checks.** Without them, the balancer keeps sending traffic to dead backends.
- **Ignoring session state.** Round-robin plus local per-server sessions logs users out; use stickiness
  or shared state.

# Best Practices

- Put a **reverse proxy** in front of backends to centralize **TLS**, routing, and load distribution.
- Always configure **health checks** so failed backends leave rotation automatically.
- Choose the **algorithm** to fit the workload (round-robin for uniform, least-connections for variable).
- Keep backends **stateless** (externalize sessions) so any server can handle any request; add
  stickiness only when necessary.

# Summary

- A **reverse proxy** fronts **servers** (vs a **forward proxy**, which fronts clients) and usually acts
  as a **load balancer**.
- Load balancers spread requests using **round-robin**, **least-connections**, **weighted**, or **IP
  hash** algorithms.
- **Layer 4** balances by IP/port (fast, opaque); **Layer 7** reads **HTTP** to route by path/host and
  terminate TLS.
- **Health checks** remove failed backends automatically, providing high availability.
- Reverse proxies centralize **TLS termination**, caching, compression, and rate limiting at the edge.

# Flash Cards

Q: What is the difference between a forward proxy and a reverse proxy?
A: A forward proxy sits in front of clients and forwards their outbound requests; a reverse proxy sits in front of servers and receives client requests on their behalf.

Q: Name three load-balancing algorithms and when each fits.
A: Round-robin (uniform requests), least-connections (variable request durations), and IP hash (stickiness — same client to same server).

Q: What is the difference between Layer 4 and Layer 7 load balancing?
A: Layer 4 balances by IP/port without reading content (fast, any protocol); Layer 7 understands HTTP and can route by path/host/header and terminate TLS.

Q: What does a health check do?
A: It periodically probes each backend (e.g. GET /health) and removes unhealthy servers from rotation automatically, re-adding them when they recover.

Q: What is TLS termination at a reverse proxy?
A: The proxy holds the certificate and decrypts HTTPS at the edge, then talks to backends over the internal network — centralizing certificate management and offloading crypto.

Q: Why can round-robin balancing log users out if sessions are stored locally on each server?
A: Because consecutive requests may hit different backends that don't share the session; the fix is sticky sessions or shared/external session state.

# Exercises

### Easy
Draw a client, a reverse proxy, and three backend servers. Label where TLS is terminated and which
component the client's browser actually connects to.

### Medium
Explain when you'd choose Layer 7 over Layer 4 load balancing. Give two things a Layer 7 proxy can do
that a Layer 4 one cannot, and one advantage Layer 4 retains.

### Challenging
An app behind a round-robin balancer intermittently logs users out. Diagnose the likely cause, and
describe two different fixes (one with sticky sessions, one with shared state), including the trade-offs
of each for scaling and failover.

# Further Reading

- Cloudflare — *What is load balancing? / What is a reverse proxy?*: <https://www.cloudflare.com/learning/performance/what-is-load-balancing/>
- NGINX — *What is a reverse proxy?*: <https://www.nginx.com/resources/glossary/reverse-proxy-server/>
- HAProxy — *Documentation*: <https://docs.haproxy.org/>
- MDN — *Proxy servers and tunneling*: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling>
