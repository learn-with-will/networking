---
id: lesson-12
slug: tcp-reliable-delivery
title: "TCP: Reliable, Ordered Delivery"
level: intermediate
order: 12
duration: 22
tags:
  - tcp
  - handshake
  - reliability
  - flow-control
  - sequence-numbers
summary: "How TCP turns the internet's best-effort delivery into a reliable, ordered byte stream — the three-way handshake, sequence and acknowledgement numbers, retransmission, flow control, and connection teardown."
---

# Learning Objectives

By the end of this lesson you will be able to:

- List what **TCP** guarantees: connection, reliability, ordering, flow control.
- Walk through the **three-way handshake** (SYN, SYN-ACK, ACK).
- Explain how **sequence and acknowledgement numbers** provide reliability and ordering.
- Describe **flow control** via the receive **window**.
- Explain connection **teardown** and that TCP does **not** encrypt data.

# Why It Matters

IP delivery is **best-effort**: packets can be lost, duplicated, delayed, or reordered. Yet when you
download a file or load a page, the bytes arrive complete and in order. **TCP** is what bridges that
gap. It underpins HTTP(S), SSH, email, and most of what you build. Understanding its handshake and
acknowledgements demystifies latency, connection resets, and why a new connection has a startup cost.

# Concept Explanation

### What TCP guarantees

**TCP** (Transmission Control Protocol) is a **connection-oriented, reliable, ordered, byte-stream**
transport built on top of unreliable IP. It provides:

- **Connection** — both sides establish and agree on state before sending data.
- **Reliability** — lost data is detected and **retransmitted**; corruption is caught by a checksum.
- **Ordering** — bytes are delivered to the application in the exact order sent.
- **Flow control** — the receiver can slow a fast sender so it isn't overwhelmed.
- **Congestion control** — TCP backs off when the network is congested (a later lesson touches this).

Note what it does **not** do: TCP does **not** encrypt or authenticate the *content* — that's **TLS**'s
job (next lesson).

### The three-way handshake

Before any data flows, TCP sets up the connection with three segments, using two control flags **SYN**
(synchronize) and **ACK** (acknowledge):

```text
   Client                                Server
     |  --- SYN (seq=x) ------------------> |    "Let's talk; my start seq is x"
     |  <-- SYN-ACK (seq=y, ack=x+1) ------ |    "OK; my start seq is y, I got yours"
     |  --- ACK (ack=y+1) ----------------> |    "Got yours; connection established"
     |  ====== data can now flow =========  |
```

Each side picks a random **initial sequence number** and confirms it saw the other's. After the third
segment, the connection is **established**. This round trip is why every new TCP connection has a small
built-in latency cost before the first byte of data.

### Sequence and acknowledgement numbers

TCP treats data as a continuous **stream of bytes** and numbers them. The **sequence number** marks
where a segment's data starts in the stream; the **acknowledgement number** tells the sender the next
byte the receiver expects (i.e. everything before it arrived).

```text
   Sender sends bytes 1001–1500 (seq=1001, 500 bytes).
   Receiver replies ack=1501  -> "I have everything up to 1500; send 1501 next."
   If seq 1001 never arrives, the receiver keeps ack=1001 -> sender retransmits.
```

Crucially, **sequence numbers count bytes, not segments.** Ordering falls out of this: the receiver
buffers out-of-order segments and reassembles them by sequence number before handing bytes up.

### Flow control: the receive window

Each side advertises a **window size** — how many more bytes it can accept right now (buffer space). A
sender must not have more unacknowledged data in flight than the receiver's window allows. If the
receiver is busy, it shrinks the window, slowing the sender; as it drains its buffer, it grows the
window again. This is **flow control** — protecting the *receiver* from being overrun (distinct from
congestion control, which protects the *network*).

### Retransmission and reliability

If an acknowledgement doesn't arrive within a timeout (or duplicate ACKs signal a gap), the sender
**retransmits** the missing data. Because every byte must eventually be acknowledged, nothing is
silently lost — at the cost of extra round trips when loss occurs.

### Teardown

Closing is graceful and independent per direction, using the **FIN** flag — often described as a
**four-way** exchange:

```text
   A -> FIN ------> B      A: "I'm done sending"
   A <- ACK ------- B      B: "OK"
   A <- FIN ------- B      B: "I'm done sending too"
   A -> ACK ------> B      A: "OK" -> connection closed
```

Either side can start the close; each direction is shut down separately (so one side can finish sending
while the other still has data).

# Key Terminology

- **TCP** — a connection-oriented, reliable, ordered byte-stream transport protocol.
- **Three-way handshake** — SYN, SYN-ACK, ACK; establishes a connection.
- **Sequence number** — the position of a segment's first data byte in the stream.
- **Acknowledgement number** — the next byte the receiver expects (confirms prior bytes).
- **Window** — how many unacknowledged bytes the receiver can currently accept (flow control).
- **Retransmission** — resending data that wasn't acknowledged in time.
- **FIN** — the flag used to gracefully close one direction of a connection.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Transport | TCP | UDP | TCP when you need reliability/ordering (web, files, SSH); UDP when speed/low overhead matters more. |
| New connection cost | Reuse an existing connection | Open a fresh one each time | Reuse (keep-alive) to avoid repeated handshakes; open fresh only when needed. |
| Encryption | Rely on TCP | Add TLS on top | TCP alone is plaintext; add TLS whenever confidentiality/integrity/identity matter. |

# Worked Example

Trace the start of an HTTP request over TCP:

```text
1. SYN     client -> server   (seq=1000)                 handshake
2. SYN-ACK server -> client   (seq=5000, ack=1001)       handshake
3. ACK     client -> server   (ack=5001)                 established
4. Data    client -> server   "GET / HTTP/1.1..."        (seq=1001, 80 bytes)
5. ACK     server -> client   (ack=1081)                 "got your request"
6. Data    server -> client   the response bytes...       (seq=5001, ...)
7. ... eventually both sides exchange FIN/ACK to close.
```

The three handshake round trip happens *before* the `GET` is even sent — which is why connection reuse
(keep-alive) noticeably speeds up pages with many requests.

# Real World Analogy

TCP is like a **careful phone call with confirmations**. First you both say hello and confirm you can
hear each other (**handshake**). Then, as you talk, the listener periodically says "got it, go on"
(**acknowledgements**); if they miss a sentence, they say "sorry, repeat that" (**retransmission**). If
they need a moment to write something down, they say "hold on" (**flow control / window**). When
finished, each of you says goodbye separately (**FIN each direction**). The call guarantees the message
arrives complete and in order — but by itself it isn't *private*; anyone on the line could listen
(that's what **TLS** adds).

# Examples

## Example 1 — Basic: watching a handshake

A connection attempt to a closed port gets a **RST** (reset) instead of SYN-ACK, so it fails instantly;
an open port completes SYN → SYN-ACK → ACK. Tools like `curl -v` or a packet capture show these
control segments directly.

**Why this works:** the server's response to the SYN (SYN-ACK vs RST) tells you immediately whether the
port is accepting connections.

## Example 2 — Real-world: reliability over a lossy link

On flaky Wi-Fi, some segments are lost. TCP notices the missing acknowledgements and retransmits just
those bytes, so your download still completes correctly — only a little slower. The application never
sees the loss.

**Why this works:** acknowledgements + retransmission repair loss beneath the application, preserving
the reliable, ordered stream.

## Example 3 — Pitfall: assuming TCP means secure

A team sends passwords over a plain TCP connection assuming "TCP is reliable, so it's safe." TCP
guarantees *delivery*, not *privacy* — anyone on the path can read the bytes. Reliability is not
security.

**Why this bites:** confidentiality, integrity against tampering, and server identity require **TLS**;
TCP alone sends everything in the clear.

# Common Mistakes

- **Thinking sequence numbers count segments.** They count **bytes** in the stream.
- **Believing TCP encrypts data.** It does not — encryption is TLS's job.
- **Confusing flow control with congestion control.** Flow control protects the **receiver** (window);
  congestion control protects the **network**.
- **Forgetting the handshake's latency cost.** Every new connection pays a round trip before data.

# Best Practices

- **Reuse connections** (keep-alive, pooling) to amortize handshake latency across many requests.
- Add **TLS** whenever data is sensitive — TCP alone provides no confidentiality.
- When diagnosing "slow" connections, separate **handshake/RTT** costs from data transfer.
- Expect and tolerate **retransmissions** on lossy links; they're TCP doing its job, not a bug.

# Summary

- **TCP** provides a **connection-oriented, reliable, ordered** byte stream on top of best-effort IP.
- Connections start with the **three-way handshake** (SYN, SYN-ACK, ACK) — a built-in round-trip cost.
- **Sequence and acknowledgement numbers** (counting **bytes**) provide reliability and ordering;
  missing data is **retransmitted**.
- **Flow control** uses the receive **window** to keep a fast sender from overwhelming the receiver.
- Teardown uses **FIN** per direction; TCP does **not** encrypt content — that's **TLS**.

# Flash Cards

Q: What are the three segments of the TCP handshake?
A: SYN (client), SYN-ACK (server), and ACK (client) — after which the connection is established.

Q: Do TCP sequence numbers count segments or bytes?
A: Bytes — the sequence number marks the position of a segment's first data byte within the overall stream.

Q: What does the acknowledgement number tell the sender?
A: The next byte the receiver expects, which confirms that everything before it has arrived.

Q: What is TCP flow control, and how is it enforced?
A: It prevents a fast sender from overwhelming the receiver, enforced by the receiver advertising a window size (how many unacknowledged bytes it can accept).

Q: Does TCP encrypt your data?
A: No. TCP provides reliable, ordered delivery but no confidentiality; encryption and server identity come from TLS layered on top.

Q: How does TCP recover from a lost segment?
A: The missing bytes go unacknowledged (or trigger duplicate ACKs), so the sender retransmits just that data after a timeout or on the loss signal.

# Exercises

### Easy
Write out the three-way handshake with example sequence/ack numbers, labeling what each side is saying
at each step.

### Medium
Explain the difference between flow control and congestion control. Which one uses the receive window,
and which protects the network as a whole?

### Challenging
A colleague says "we use TCP, so our login form is secure." Explain precisely what TCP does and does not
guarantee, what an attacker on the path could still do, and what you'd add to actually protect the
credentials.

# Further Reading

- IETF — *Transmission Control Protocol* (RFC 9293, obsoletes 793): <https://www.rfc-editor.org/rfc/rfc9293>
- Cloudflare — *What is TCP/IP?*: <https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/>
- MDN — *TCP glossary*: <https://developer.mozilla.org/en-US/docs/Glossary/TCP>
- Beej's Guide to Network Programming (TCP sockets): <https://beej.us/guide/bgnet/>
