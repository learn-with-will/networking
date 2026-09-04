---
id: lesson-13
slug: udp-connectionless-delivery
title: "UDP: Fast, Connectionless Delivery"
level: intermediate
order: 13
duration: 18
tags:
  - udp
  - datagram
  - connectionless
  - real-time
  - transport
summary: "The lightweight transport protocol — UDP sends independent datagrams with no handshake, ordering, or delivery guarantees, trading reliability for speed and simplicity where that trade-off makes sense."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe what **UDP** provides — and what it deliberately does not.
- Contrast **UDP** with **TCP** across the guarantees that matter.
- Explain why "unreliable" is a technical description, not a value judgment.
- Identify applications that choose UDP (**DNS, DHCP, real-time media, QUIC**).
- Explain how an application can add reliability on top of UDP when needed.

# Why It Matters

Not everything wants TCP's careful guarantees. A video call would rather skip a lost frame than pause to
retransmit it; a DNS lookup is a single quick question and answer. **UDP** is the transport for these
cases. Knowing when UDP is the right tool — and what you give up — helps you design real-time systems
and understand protocols like DNS, DHCP, and modern **HTTP/3 (over QUIC)**.

# Concept Explanation

### What UDP is

**UDP** (User Datagram Protocol) is a **connectionless** transport that sends independent messages
called **datagrams**. It adds only a tiny header on top of IP and otherwise stays out of the way:

```text
   UDP header (8 bytes total):
   +------------+------------+------------+------------+
   | src port   | dst port   | length     | checksum   |
   +------------+------------+------------+------------+
        2 bytes      2 bytes     2 bytes      2 bytes
```

Compare that to TCP's 20-byte (minimum) header. UDP has ports (like TCP) so datagrams reach the right
application, plus a length and an optional checksum — and nothing else.

### What UDP does NOT provide

UDP deliberately omits almost everything TCP does:

- **No connection / handshake** — just send; no setup round trip.
- **No reliability** — lost datagrams are *not* retransmitted.
- **No ordering** — datagrams may arrive out of order (or not at all).
- **No flow or congestion control** — UDP won't slow down on its own.

"**Unreliable**" here is a precise term meaning "no delivery guarantee," **not** "bad." For many jobs,
these omissions are exactly what you want.

### UDP vs TCP at a glance

```text
                     TCP                         UDP
   Connection        yes (handshake)             none
   Reliability       yes (retransmit)            none (fire and forget)
   Ordering          yes                         none
   Flow/congestion   yes                         none
   Header overhead   20+ bytes                   8 bytes
   Good for          web, files, SSH, email      DNS, DHCP, VoIP, video, games, QUIC
```

### Why choose "unreliable"?

Three reasons make UDP the better fit sometimes:

1. **Latency over completeness.** In a live call, a packet that arrives late is useless — you'd rather
   drop it and keep going than stall to retransmit.
2. **Small request/response.** A DNS query is one datagram out, one back. TCP's handshake would triple
   the round trips for no benefit.
3. **The app wants control.** Some applications implement *their own* reliability tuned to their needs —
   which is exactly what **QUIC** (the basis of HTTP/3) does over UDP.

### Adding reliability on top

Because UDP is minimal, an application can build only the guarantees it needs. It might add sequence
numbers to detect loss, selective retransmission for important data, or forward error correction to
tolerate loss without retransmitting. QUIC layers streams, reliability, congestion control, *and*
encryption over UDP — proving you can rebuild TCP-like features when you want them, while keeping UDP's
flexibility.

# Key Terminology

- **UDP** — a connectionless, best-effort transport that sends independent datagrams.
- **Datagram** — UDP's PDU: a self-contained message with no relationship to others.
- **Connectionless** — no handshake or session state; each datagram stands alone.
- **Best-effort / unreliable** — delivered if possible, with no guarantee or retransmission.
- **Checksum** — an optional integrity check in the UDP header.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Transport | UDP | TCP | UDP for real-time/small-message/low-overhead needs; TCP when every byte must arrive in order. |
| Handle loss | Ignore it (media) | Retransmit (app-level or TCP) | Ignore for live media where late data is useless; retransmit for data that must be complete. |
| Reliability logic | Let TCP handle it | Build it over UDP (like QUIC) | Use TCP for simplicity; build over UDP when you need custom control and can invest in it. |

# Worked Example

Compare a DNS lookup (UDP) with an HTTP fetch (TCP):

```text
   DNS over UDP:
     1 datagram out:  "A record for example.com?"
     1 datagram back: "93.184.216.34"
     Total: ~1 round trip, no handshake.

   HTTP over TCP:
     3 segments to handshake (SYN, SYN-ACK, ACK)
     then the request and response segments, then teardown.
     Total: handshake round trip BEFORE any data.
```

For a tiny one-shot question like DNS, UDP's no-handshake model is a clear win; for a stream of ordered
bytes like a web response, TCP's guarantees are worth the setup cost.

# Real World Analogy

TCP is a **registered letter with a signature on delivery** — you know it arrived, in order, and you'll
resend if it's lost. UDP is a **postcard**: you drop it in the mailbox and hope it arrives. Postcards
are cheap and quick, and for a short, time-sensitive note ("running 5 min late!") a postcard is
perfect — resending a late postcard would be pointless. You wouldn't mail a legal contract as loose
postcards, but you wouldn't send "happy birthday" by registered mail either.

# Examples

## Example 1 — Basic: DNS uses UDP

A name lookup is a single question and answer, so DNS uses **UDP/53** by default — no handshake, minimal
overhead. It only falls back to TCP for oversized responses or zone transfers.

**Why this works:** a one-shot request/response doesn't benefit from a connection, so UDP's low overhead
wins.

## Example 2 — Real-world: a video call

In a live call, audio and video go over UDP (often via RTP). If a packet is lost, the app conceals the
gap and moves on rather than freezing to retransmit — because a frame that arrives 300 ms late is
useless anyway.

**Why this works:** for real-time media, *timeliness* beats *completeness*, exactly UDP's trade-off.

## Example 3 — Pitfall: expecting UDP to guarantee delivery

A developer sends important telemetry over UDP and assumes it all arrives. Under load, some datagrams
are silently dropped and never resent, so metrics go missing with no error. UDP made no promise to
deliver.

**Why this bites:** UDP won't retransmit or even tell you about loss; if the data must arrive, use TCP
or add reliability at the application level.

# Common Mistakes

- **Reading "unreliable" as "broken."** It means *no delivery guarantee* — often the right choice.
- **Assuming UDP keeps order or resends loss.** It does neither; the app must, if it cares.
- **Using UDP for data that must be complete** (files, transactions) without adding reliability.
- **Thinking HTTP/3 uses TCP.** HTTP/3 runs over **QUIC**, which runs over **UDP**.

# Best Practices

- Choose **UDP** for real-time media, tiny request/response protocols, and when you'll build custom
  reliability.
- If delivery must be guaranteed, use **TCP** — or implement acknowledgements/retransmission over UDP
  deliberately.
- Don't rely on ordering with UDP; include your **own sequence numbers** if order matters.
- Remember UDP's tiny **8-byte header** is part of the appeal for high-rate, low-latency traffic.

# Summary

- **UDP** is a **connectionless, best-effort** transport that sends independent **datagrams** with only
  an **8-byte header**.
- It provides **no** handshake, reliability, ordering, or congestion control — by design.
- "**Unreliable**" is technical, not pejorative: latency-sensitive and one-shot workloads prefer it.
- Classic UDP users: **DNS, DHCP, VoIP/video, games**, and **QUIC** (the base of **HTTP/3**).
- Applications can **add reliability** over UDP when they need it, tuned to their requirements.

# Flash Cards

Q: What does "connectionless" mean for UDP?
A: UDP sends each datagram independently with no handshake or session state — you just send, with no setup.

Q: What guarantees does UDP give up compared to TCP?
A: No connection, no reliability (no retransmission), no ordering, and no flow/congestion control.

Q: How big is the UDP header compared to TCP's?
A: UDP's header is 8 bytes; TCP's minimum header is 20 bytes.

Q: Why might a video call use UDP instead of TCP?
A: Because timeliness matters more than completeness — a late-retransmitted frame is useless, so it's better to drop loss and keep going.

Q: Does "unreliable" mean UDP is bad?
A: No — it's a technical term meaning no delivery guarantee, which is exactly the right trade-off for real-time media and small one-shot requests.

Q: Which transport does HTTP/3 (QUIC) run over?
A: UDP — QUIC builds streams, reliability, congestion control, and encryption on top of UDP.

# Exercises

### Easy
List four protocols or applications that use UDP and, for each, give one reason UDP suits it better than
TCP.

### Medium
Make a side-by-side table of TCP vs UDP covering connection, reliability, ordering, header size, and a
typical use case for each.

### Challenging
You're designing a multiplayer game's networking. Which player actions would you send over UDP and why,
and which (if any) need reliability? Describe how you'd add just-enough reliability over UDP for the
actions that require it, without reverting to full TCP.

# Further Reading

- IETF — *User Datagram Protocol* (RFC 768): <https://www.rfc-editor.org/rfc/rfc768>
- IETF — *QUIC: A UDP-Based Multiplexed and Secure Transport* (RFC 9000): <https://www.rfc-editor.org/rfc/rfc9000>
- Cloudflare — *What is UDP?*: <https://www.cloudflare.com/learning/ddos/glossary/user-datagram-protocol-udp/>
- MDN — *UDP glossary*: <https://developer.mozilla.org/en-US/docs/Glossary/UDP>
