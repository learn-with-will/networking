---
id: lesson-22
slug: http2-http3-and-quic
title: "HTTP/2, HTTP/3, and QUIC"
level: advanced
order: 22
duration: 22
tags:
  - http2
  - http3
  - quic
  - multiplexing
  - head-of-line
summary: "How the web's transport evolved — HTTP/2's binary multiplexing over TCP, the TCP head-of-line blocking it couldn't escape, and HTTP/3 solving it by running over QUIC on UDP."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the limitations of **HTTP/1.1** that motivated newer versions.
- Explain **HTTP/2**'s binary framing, **multiplexing**, and **HPACK** compression.
- Explain **TCP head-of-line blocking** and why HTTP/2 still suffers it.
- Describe **HTTP/3** running over **QUIC** (over **UDP**) and its advantages.
- State what stays the **same** across all HTTP versions.

# Why It Matters

The web moved from HTTP/1.1 to HTTP/2 to HTTP/3 to make pages load faster, especially on high-latency
and lossy networks. Knowing what each version changed — and, crucially, what it **didn't** — helps you
reason about real-world performance, configure servers correctly, and avoid myths (like "HTTP/3 uses
TCP" or "HTTP/2 fixed all blocking"). The semantics you learned for HTTP still apply; only the delivery
changed.

# Concept Explanation

### Where HTTP/1.1 struggled

**HTTP/1.1** is textual and sends **one request/response at a time per connection**. A page needing many
resources either serializes them or opens many parallel TCP connections. Worse, a slow response can hold
up the ones behind it on the same connection — **application-level head-of-line (HOL) blocking**.
Workarounds (spriting, sharding across domains, inlining) were hacks around the protocol.

### HTTP/2: binary framing and multiplexing

**HTTP/2** (RFC 9113) keeps the same HTTP **semantics** but changes the wire format:

- **Binary framing** — messages are split into binary **frames** instead of text, which is efficient and
  unambiguous to parse.
- **Multiplexing** — many **streams** (independent request/response pairs) share **one TCP connection**
  concurrently, interleaved as frames. No more one-at-a-time or many connections.
- **HPACK header compression** — repetitive headers (cookies, user-agent) are compressed, cutting
  overhead.
- **Stream prioritization** — clients can hint which resources matter most.

```text
   HTTP/1.1: [req1][resp1][req2][resp2]...    (serial, or N connections)
   HTTP/2:   one TCP connection, frames interleaved:
             [s1 hdr][s3 hdr][s1 data][s3 data][s5 hdr]...   (concurrent streams)
```

(Note: HTTP/2 "Server Push" existed but proved rarely beneficial and has been **deprecated/removed** in
practice — don't rely on it.)

### The catch: TCP head-of-line blocking

HTTP/2 multiplexes at the **application** layer, but all those streams still ride a **single TCP
connection**. TCP guarantees **in-order** delivery of its byte stream, so if **one** TCP segment is
lost, TCP holds back **all** the data behind it — including bytes belonging to *other* streams — until
the lost segment is retransmitted. This is **TCP head-of-line blocking**: HTTP/2 removed
application-level HOL blocking but is still stuck with TCP's. On lossy networks, this hurts.

### HTTP/3 and QUIC: escaping TCP

**HTTP/3** (RFC 9114) keeps HTTP semantics again, but runs over **QUIC** (RFC 9000) instead of TCP —
and **QUIC runs over UDP**:

```text
   HTTP/2:   HTTP/2  ->  TLS  ->  TCP  ->  IP
   HTTP/3:   HTTP/3  ->  QUIC (includes TLS 1.3)  ->  UDP  ->  IP
```

QUIC gives HTTP/3 several wins:

- **No TCP HOL blocking** — QUIC has **independent streams**; a lost packet only stalls **its own**
  stream, not the others.
- **TLS 1.3 built in** — encryption is part of QUIC, and the combined transport+crypto handshake is
  faster (often **1-RTT**, or **0-RTT** on resumption) than TCP+TLS done separately.
- **Connection migration** — a QUIC connection is identified by a **connection ID**, not the IP/port
  4-tuple, so it can survive a network change (Wi-Fi → cellular) without reconnecting.

Because QUIC lives in **UDP** and largely in **user space**, it can evolve faster than TCP (which is
baked into operating systems and middleboxes).

### What stays the same

Across HTTP/1.1, /2, and /3, the **semantics are identical**: the same **methods**, **status codes**,
**headers**, and URL structure. Only the **framing and transport** change. Your knowledge of GET/POST,
200/404, and headers carries over unchanged — which is exactly why the version can be negotiated
transparently.

# Key Terminology

- **Multiplexing** — carrying many concurrent streams over one connection.
- **Stream** — an independent request/response flow within a connection.
- **HPACK** — HTTP/2's header-compression scheme (QPACK is HTTP/3's equivalent).
- **Head-of-line (HOL) blocking** — one stalled item holding up those behind it.
- **QUIC** — a UDP-based transport with independent streams and built-in TLS 1.3.
- **Connection migration** — a QUIC connection surviving an IP/network change via its connection ID.
- **0-RTT / 1-RTT** — handshake round-trip costs; lower is faster to first byte.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Protocol version | HTTP/2 (TCP) | HTTP/3 (QUIC/UDP) | HTTP/3 shines on lossy/mobile networks (no TCP HOL, migration); HTTP/2 is fine on stable links and where UDP is filtered. |
| Fixing HOL blocking | More TCP connections (HTTP/1.1 era) | Independent streams (QUIC) | QUIC solves it properly; multiple TCP connections was an HTTP/1.1 workaround with its own costs. |
| UDP concerns | Rely on HTTP/3 everywhere | Fall back to HTTP/2 | Some networks block/limit UDP; browsers negotiate and fall back to HTTP/2 automatically. |

# Worked Example

Loading a page with 30 small resources on a slightly lossy connection:

```text
   HTTP/1.1: serialize on one connection (slow) or open ~6 connections per host.
   HTTP/2:   all 30 over ONE TCP connection, multiplexed — great, UNTIL a packet
             is lost: TCP stalls every stream until retransmission (TCP HOL blocking).
   HTTP/3:   all 30 over QUIC streams — a lost packet stalls only the one affected
             stream; the other 29 keep flowing. Plus a faster initial handshake.
```

Same page, same HTTP methods and status codes — the difference is purely in how bytes are framed and
which transport carries them.

# Real World Analogy

Think of delivering many parcels down one road. **HTTP/1.1** is a single-lane road where each truck must
wait for the one ahead. **HTTP/2** is one road with a clever dispatcher interleaving many deliveries —
but it's still **one road**, so a single stalled truck (a lost TCP segment) jams everything behind it
(**TCP HOL blocking**). **HTTP/3/QUIC** gives each delivery its **own lane**: if one lane has a
breakdown, the others keep moving. And the QUIC "delivery contract" (connection ID) lets a truck switch
roads mid-route (**connection migration**) without starting the paperwork over.

# Examples

## Example 1 — Basic: negotiating the version

A browser and server negotiate the highest version both support (via ALPN during the TLS/QUIC
handshake, and HTTP/3 is advertised via `Alt-Svc`). You might load the same site over HTTP/2 on one
network and HTTP/3 on another — with identical page behavior.

**Why this works:** because semantics are identical across versions, the transport can be chosen
transparently.

## Example 2 — Real-world: mobile hand-off

On a phone, you walk out of Wi-Fi range onto cellular mid-download. With TCP (HTTP/2) the connection's
4-tuple changes and it must reconnect. With QUIC (HTTP/3), the connection ID lets it **migrate** and
continue with minimal disruption.

**Why this works:** QUIC identifies connections by an ID rather than IP/port, so a changed network
doesn't break the connection.

## Example 3 — Pitfall: assuming HTTP/2 removed all HOL blocking

A team blames their app for stalls on a lossy link, expecting HTTP/2 to have eliminated blocking. But
HTTP/2 only removed **application-level** HOL blocking; **TCP-level** HOL blocking remains. Moving to
HTTP/3 (QUIC) is what actually addresses it.

**Why this bites:** conflating the two kinds of HOL blocking leads to chasing the wrong fix; the
limitation is TCP's, not the app's.

# Common Mistakes

- **Thinking HTTP/3 uses TCP.** HTTP/3 runs over **QUIC**, which runs over **UDP**.
- **Believing HTTP/2 fixed all HOL blocking.** It removed app-level HOL but not **TCP** HOL blocking.
- **Assuming semantics changed.** Methods, status codes, and headers are the **same** across versions.
- **Relying on HTTP/2 Server Push.** It's been deprecated/removed in practice.

# Best Practices

- Enable **HTTP/2** (and **HTTP/3** where supported); let clients negotiate and fall back automatically.
- Expect **HTTP/3** to help most on **lossy/high-latency/mobile** networks; verify UDP isn't blocked in
  your path.
- Don't re-architect around **Server Push**; prefer resource hints (`preload`) instead.
- Remember your HTTP knowledge (methods/status/headers) **transfers unchanged** — optimize transport,
  not semantics.

# Summary

- **HTTP/1.1** sends one request at a time per connection and suffers application-level HOL blocking.
- **HTTP/2** adds **binary framing**, **multiplexed streams** over one TCP connection, and **HPACK** —
  but is still limited by **TCP head-of-line blocking**.
- **HTTP/3** runs over **QUIC** (over **UDP**), giving **independent streams** (no TCP HOL), **built-in
  TLS 1.3**, faster handshakes, and **connection migration**.
- Some networks filter UDP, so clients negotiate and **fall back** to HTTP/2 when needed.
- **HTTP semantics are identical** across versions — only framing and transport change.

# Flash Cards

Q: What did HTTP/2 change compared to HTTP/1.1?
A: It added binary framing, multiplexing of many concurrent streams over one TCP connection, and HPACK header compression — while keeping the same HTTP semantics.

Q: What is TCP head-of-line blocking, and why does HTTP/2 still have it?
A: If one TCP segment is lost, TCP holds back all later bytes (including other streams') until retransmission. HTTP/2 multiplexes over a single TCP connection, so it's subject to this.

Q: What transport does HTTP/3 use?
A: QUIC, which runs over UDP — not TCP.

Q: How does QUIC avoid TCP head-of-line blocking?
A: QUIC has independent streams, so a lost packet stalls only its own stream, not the others.

Q: What is QUIC connection migration?
A: A QUIC connection is identified by a connection ID rather than the IP/port tuple, so it can survive a network change (e.g. Wi-Fi to cellular) without reconnecting.

Q: Do HTTP methods and status codes differ between HTTP/1.1, /2, and /3?
A: No — the semantics (methods, status codes, headers) are identical; only the framing and transport differ.

# Exercises

### Easy
List one key improvement each version introduced: HTTP/1.1 → HTTP/2, and HTTP/2 → HTTP/3. Name the
transport each version runs over.

### Medium
Explain the difference between application-level HOL blocking and TCP-level HOL blocking. Which did
HTTP/2 solve, which did it not, and how does HTTP/3 address the remaining one?

### Challenging
A mobile app has great performance on Wi-Fi but stalls and drops connections on flaky cellular. Explain
how HTTP/3/QUIC's independent streams, faster handshake, and connection migration each help, and note
one situation where HTTP/3 might not be available and what happens then.

# Further Reading

- IETF — *HTTP/2* (RFC 9113): <https://www.rfc-editor.org/rfc/rfc9113>
- IETF — *HTTP/3* (RFC 9114): <https://www.rfc-editor.org/rfc/rfc9114>
- IETF — *QUIC: A UDP-Based Multiplexed and Secure Transport* (RFC 9000): <https://www.rfc-editor.org/rfc/rfc9000>
- Cloudflare — *HTTP/3 and QUIC*: <https://www.cloudflare.com/learning/performance/what-is-http3/>
