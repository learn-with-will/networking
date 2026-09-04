---
id: lesson-07
slug: client-server-model
title: "The Client–Server Model"
level: beginner
order: 7
duration: 16
tags:
  - client-server
  - request-response
  - peer-to-peer
  - servers
  - clients
summary: "The dominant pattern of the internet — clients that initiate requests and servers that listen and respond — plus how it compares to peer-to-peer and why the request–response cycle shapes everything above it."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the **client–server model** and the roles of each side.
- Walk through the **request–response** cycle.
- Contrast **client–server** with **peer-to-peer (P2P)**.
- Explain what it means for a server to **listen** and a client to **initiate**.
- Recognize that one program can be **both** a client and a server.

# Why It Matters

Almost every network interaction you'll build or debug follows the **client–server** pattern: a browser
and a web server, an app and an API, a DNS resolver and a name server. Knowing which side **initiates**,
which side **listens**, and how the **request–response** cycle flows tells you where to look when things
break and how to reason about load, latency, and failures.

# Concept Explanation

### Two roles: client and server

In the **client–server model**, one side (the **server**) offers a service and waits; the other side
(the **client**) wants the service and starts the conversation.

- A **server** program **binds** to a port and **listens**, ready to accept incoming connections. It is
  typically always-on and has a known address.
- A **client** program **initiates** a connection to the server's address and port, sends a
  **request**, and waits for a **response**.

The asymmetry is the whole point: the client knows where the server is, but the server doesn't know
about the client until the client reaches out.

### The request–response cycle

Most client–server interactions are a back-and-forth of requests and responses:

```text
   Client                                  Server
     |  --- connect / request ----------->   |   (server was listening)
     |                                        |   processes the request
     |  <-------------- response -----------  |
     |  (uses the response; maybe repeats)    |
```

For the Web this is HTTP: the client sends `GET /page`, the server returns the page and a status code.
The cycle can repeat many times over one connection (fetching a page, then its images, scripts, etc.).

### Stateless vs stateful

Some protocols are **stateless**: each request is independent and the server keeps no memory of past
requests (plain HTTP is like this). Others are **stateful**: the server tracks an ongoing session.
Statelessness makes servers easier to scale (any server can handle any request) but pushes the job of
"remembering" onto tokens, cookies, or databases. (HTTP itself is stateless; sessions are layered on
top.)

### Peer-to-peer: the other model

In **peer-to-peer (P2P)**, there's no fixed server/client split — every node is **both**, requesting
from and serving to other peers directly. File-sharing (BitTorrent), some blockchains, and many
video-call systems use P2P ideas.

```text
   Client–Server                 Peer-to-Peer
      [S]                          [P]---[P]
     / | \                          | \ / |
   [C][C][C]                        [P]---[P]
```

- **Client–server** is simple to manage and secure, but the server is a bottleneck and a single point
  of failure.
- **P2P** scales with the number of peers and has no single point of failure, but is harder to secure,
  coordinate, and moderate.

### A program can be both

The roles are per-connection, not per-machine. A web server is a **server** to browsers, but becomes a
**client** when it calls a database or another API. Your laptop is a **client** to websites but a
**server** if you run a local dev server others connect to. Ask "who initiated *this* connection?" —
that side is the client for that exchange.

# Key Terminology

- **Client** — the side that initiates a connection and sends requests.
- **Server** — the side that listens on a port and responds to requests.
- **Request / response** — the message a client sends and the reply a server returns.
- **Listen / bind** — a server claiming a port and waiting for incoming connections.
- **Stateless** — each request is independent; the server keeps no memory between them.
- **Peer-to-peer (P2P)** — a model where every node acts as both client and server.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Architecture | Client–server | Peer-to-peer | Client–server for control, security, simplicity; P2P for scale and no single point of failure. |
| Session handling | Stateless + tokens | Stateful sessions on the server | Stateless scales horizontally; stateful is simpler for small, sticky workloads. |
| Where logic lives | Thick client | Thick server | Push work to the server for consistency/security; to the client for responsiveness/offline use. |

# Worked Example

Loading a web page is a chain of client–server exchanges:

```text
1. Browser (client) asks a DNS resolver (server): "What's the IP for example.com?"
2. Resolver responds with an address.
3. Browser (client) connects to the web server (server) at that IP, port 443.
4. Browser sends: GET /   ->   Server responds: 200 OK + HTML.
5. The HTML references images/CSS/JS; the browser makes more requests (still the client).
6. For each, the server responds. The page renders.
```

Notice the browser is the client in every step, but the DNS resolver — a server to the browser —
becomes a client itself when it queries other DNS servers upstream.

# Real World Analogy

Client–server is like a **restaurant**. The kitchen (**server**) is always open and waiting; it doesn't
cook until an order arrives. You (the **client**) walk in and place an order (**request**); the kitchen
prepares it and brings it out (**response**). The kitchen doesn't come find you. **Peer-to-peer** is
more like a **potluck**: everyone both brings food and eats — each guest is server and client at once.

# Examples

## Example 1 — Basic: SSH into a server

You run `ssh user@host`. Your terminal is the **client**; it initiates a connection to the SSH
**server** listening on port 22. The server authenticates you and responds with a shell. You started
the conversation; the server was waiting.

**Why this works:** the server was already listening on a known port; the client only needed its
address to initiate.

## Example 2 — Real-world: an API gateway that is both

A mobile app (client) calls an API gateway (server). To answer, the gateway turns around and calls three
backend microservices — now it's a **client** to them. One process plays both roles depending on which
connection you look at.

**Why this works:** the client/server label is about who initiates each specific connection, not a
fixed property of the machine.

## Example 3 — Pitfall: expecting the server to reach the client first

A developer wants a server to "push" to a client that never connected. But in the basic model the
server can't initiate to an arbitrary client (which may be behind NAT with no reachable address).
Real-time push needs the client to open a persistent connection first (WebSockets, long-polling, SSE).

**Why this bites:** assuming symmetric initiation leads to designs that can't work across NAT and
firewalls, where only outbound client connections are reliable.

# Common Mistakes

- **Thinking "server" means a big machine.** It's a **role** — the side that listens and responds — not
  a size.
- **Assuming the server can start the conversation.** In the basic model the **client initiates**;
  servers wait.
- **Believing a machine is only ever a client or only a server.** One program is often both, depending
  on the connection.
- **Confusing stateless protocols with "no state anywhere."** HTTP is stateless, but apps add state via
  tokens, cookies, and databases.

# Best Practices

- For each connection, identify **who initiated it** — that side is the client for that exchange.
- Prefer **stateless** designs when you need to scale horizontally; keep session state in tokens or a
  shared store.
- Remember NAT/firewall reality: design push features so the **client connects out** and holds the
  connection open.
- Give servers **known, stable addresses/ports**; clients only need to know where to reach them.

# Summary

- The **client–server model** splits roles: **servers listen** and respond; **clients initiate** and
  request.
- Interactions follow the **request–response** cycle, often many times per page or task.
- **Stateless** protocols (like HTTP) keep no memory between requests, which helps servers scale.
- **Peer-to-peer** removes the fixed split — every node is both client and server.
- The role is **per connection**: one program is frequently both a client and a server.

# Flash Cards

Q: In the client–server model, which side initiates the connection?
A: The client initiates; the server listens on a known port and responds.

Q: What is the request–response cycle?
A: The client sends a request to the server, the server processes it and returns a response, and this can repeat over a connection.

Q: How does peer-to-peer differ from client–server?
A: In P2P there is no fixed server/client split — every node acts as both, requesting from and serving to other peers directly.

Q: What does it mean that HTTP is stateless?
A: Each request is independent and the server keeps no memory of previous requests; any needed continuity is added via cookies, tokens, or a database.

Q: Can one program be both a client and a server?
A: Yes — the role is per connection. A web server is a server to browsers but a client when it calls a database or another API.

Q: Why can't a basic server push data to a client that never connected?
A: The client may be behind NAT with no reachable address, so the server can't initiate; real-time push requires the client to open a persistent connection first.

# Exercises

### Easy
List three everyday apps you use and, for each, name the client, the server, and the kind of request
the client makes.

### Medium
Walk through the client–server exchanges involved in loading a single web page, including the DNS
lookup. Mark which component acts as a client and which as a server at each step.

### Challenging
You need a chat app where the server notifies clients instantly of new messages. Explain why the basic
"server initiates" approach fails across NAT, and describe a design where clients connect out and hold
the connection open. What trade-offs does that introduce?

# Further Reading

- MDN — *Client–server overview*: <https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Client-Server_overview>
- Cloudflare — *What is the client–server model?*: <https://www.cloudflare.com/learning/serverless/glossary/client-side-vs-server-side/>
- MDN — *An overview of HTTP* (request/response): <https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview>
- IETF — *Architectural Principles of the Internet* (RFC 1958): <https://www.rfc-editor.org/rfc/rfc1958>
