---
id: lesson-05
slug: packets-frames-and-encapsulation
title: "Packets, Frames, and Encapsulation"
level: beginner
order: 5
duration: 18
tags:
  - encapsulation
  - headers
  - mtu
  - fragmentation
  - payload
summary: "What is actually inside a packet — the headers each layer adds, the payload they carry, and how MTU limits frame size and forces fragmentation or a smaller MSS."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Break a message into its **headers** and **payload** at each layer.
- Explain what key **IP header** fields do (addresses, TTL, protocol) at a high level.
- Define **MTU** and explain why frames have a maximum size.
- Describe **fragmentation** and how IPv4 and IPv6 handle oversized packets differently.
- Explain **MSS** and why it's derived from the MTU.

# Why It Matters

"Encapsulation" sounds abstract until something goes wrong: a VPN that mysteriously breaks large
downloads, a tunnel that needs its MTU lowered, a capture full of "fragmented" packets. All of these
come from the concrete reality that data is wrapped in nested headers and that each link caps how big a
frame can be. Once you can picture the bytes, these problems stop being mysterious.

# Concept Explanation

### Headers wrap a payload

At every layer, the data handed down from above becomes the **payload**, and the layer prepends its own
**header** (control information). The result is handed further down as the *next* layer's payload. This
nesting is **encapsulation**:

```text
   Application data:                         [ HTTP request ]
   Transport (TCP) makes it a segment:  [TCP hdr][ HTTP request ]
   Internet (IP) makes it a packet:  [IP hdr][TCP hdr][ HTTP request ]
   Link (Ethernet) makes it a frame: [Eth hdr][IP hdr][TCP hdr][ HTTP request ][Eth trl]
```

Every header is **overhead** — bytes that aren't your data but are needed to deliver it. The useful
data-to-overhead ratio is why we don't send one byte per packet.

### What's in an IP header (the essentials)

You don't need every field, but a few IPv4 header fields come up constantly:

```text
   +----------------------------------------------------+
   | version | header len | ... | total length         |
   | identification | flags | fragment offset           |
   | TTL | protocol | header checksum                   |
   | source IP address (32 bits)                        |
   | destination IP address (32 bits)                   |
   +----------------------------------------------------+
```

- **Source / Destination IP** — the true endpoints of the packet.
- **TTL** (Time To Live) — a hop counter, decremented by each router; at 0 the packet is dropped. This
  prevents packets from looping forever (and is what `traceroute` exploits). IPv6 calls it **Hop
  Limit**.
- **Protocol** — what's inside the payload: TCP (6), UDP (17), ICMP (1). This is how the receiver knows
  which transport handler to use.

Note there is **no port** in the IP header — **ports live in the TCP/UDP header** (next lessons),
because ports are a transport-layer idea.

### MTU: the maximum a link will carry

Each link has a **Maximum Transmission Unit (MTU)** — the largest payload a single frame can carry. For
standard Ethernet the MTU is **1500 bytes**. A packet larger than the path's MTU can't fit in one
frame, so something has to give.

```text
   Ethernet frame budget (typical):
   [ 14-byte Eth header ][ up to 1500 bytes payload ][ 4-byte FCS ]
                                  \_______ the IP packet must fit here _______/
```

### Fragmentation: splitting an oversized packet

If an IPv4 packet is too big for the next link's MTU, a router can **fragment** it into smaller packets
that each fit; the destination reassembles them. Fragmentation is costly and fragile (lose one fragment
and the whole packet is lost), so it's avoided when possible.

**IPv4 vs IPv6 differ here:**

- **IPv4** routers may fragment in transit (unless the "Don't Fragment" flag is set).
- **IPv6** routers **never fragment in transit**. If a packet is too big, the router drops it and sends
  back an ICMPv6 **"Packet Too Big"** message; the sender must use **Path MTU Discovery** to pick a
  size that fits.

### MSS: TCP's answer to MTU

Rather than send oversized segments and rely on fragmentation, TCP negotiates a **Maximum Segment Size
(MSS)** during connection setup — the largest chunk of *application data* it will put in one segment.
The MSS is derived from the MTU minus the IP and TCP headers:

```text
   MSS ≈ MTU − IP header − TCP header
   1460 ≈ 1500 − 20 (IPv4) − 20 (TCP)      (typical Ethernet values)
```

So on a normal Ethernet path, each full TCP segment carries about **1460 bytes** of your data. This is
why large transfers are naturally chopped into ~1460-byte pieces.

# Key Terminology

- **Payload** — the data a layer is carrying (everything above its own header).
- **Header** — control bytes a layer prepends; the link layer also adds a **trailer**.
- **Overhead** — header/trailer bytes that aren't your data but are needed to deliver it.
- **TTL / Hop Limit** — a counter decremented each hop; at 0 the packet is dropped.
- **MTU** — the largest payload a single frame on a link can carry (Ethernet: 1500 bytes).
- **Fragmentation** — splitting an oversized IP packet into pieces that each fit the MTU.
- **MSS** — the largest chunk of application data TCP puts in one segment (MTU minus headers).
- **Path MTU Discovery** — finding the smallest MTU along a path so nothing needs fragmenting.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Oversized packet | Fragment it | Send smaller segments (right MSS) | Prefer the right MSS — fragmentation is fragile (one lost fragment loses all). |
| IPv6 too-big packet | Fragment in transit | Drop + "Packet Too Big" | IPv6 mandates B: routers never fragment; the sender adapts via Path MTU Discovery. |
| Packet size | Many tiny packets | Fewer full-size packets | Full-size packets amortize header overhead; tiny packets waste capacity. |

# Worked Example

You download a 4000-byte response over a normal Ethernet path (MTU 1500, MSS ≈ 1460):

```text
   4000 bytes of data / 1460 per segment  ->  3 TCP segments:
      segment 1: 1460 bytes
      segment 2: 1460 bytes
      segment 3: 1080 bytes
   Each segment gets a TCP header + IP header + Ethernet frame around it,
   and each fits within the 1500-byte MTU — so no fragmentation is needed.
```

By choosing an MSS that fits the MTU, TCP avoids fragmentation entirely — the segments are sized to fit
from the start.

# Real World Analogy

Encapsulation is like **nested envelopes**. Your letter (payload) goes in an envelope with a note
(transport header), which goes in a bigger envelope with the street address (IP header), which goes in
a courier pouch with the next-depot label (frame). The **MTU** is the size limit of the courier's
pouch: if your parcel is too big, it must be split into several pouches (**fragmentation**) and
reassembled — or, better, you pack it in pouch-sized boxes to begin with (**MSS**).

# Examples

## Example 1 — Basic: seeing the header overhead

A single keystroke sent over SSH is one byte of data — but it still travels inside a TCP header (20+
bytes), an IP header (20 bytes), and an Ethernet frame (18 bytes). The overhead dwarfs the payload.
That's fine for interactive typing, but it's why bulk transfers use full-size segments to be efficient.

**Why this works:** headers are fixed costs per packet, so big payloads spread that cost over more
useful bytes.

## Example 2 — Real-world: a VPN that breaks large pages

A user's VPN adds its own header, shrinking the usable MTU below 1500. Small requests work, but large
downloads stall because full-size packets no longer fit and Path MTU Discovery is being blocked (some
firewall drops the ICMP "too big" messages). Lowering the tunnel's MSS/MTU fixes it.

**Why this works:** the fix aligns the segment size with the real (reduced) MTU so nothing needs
fragmenting or oversized delivery.

## Example 3 — Pitfall: assuming ports live in the IP header

A learner tries to filter by port using only IP header fields and fails. **Ports are in the TCP/UDP
header**, not the IP header — the IP header's "protocol" field only says *which* transport is inside.

**Why this bites:** looking for a field on the wrong layer wastes time and produces filters that never
match.

# Common Mistakes

- **Forgetting header overhead.** Every packet carries fixed header bytes; tiny payloads are
  inefficient.
- **Thinking IPv6 fragments in transit.** It doesn't — routers drop oversized packets and signal
  "Packet Too Big."
- **Confusing MTU and MSS.** MTU is the whole frame's payload limit; MSS is just the application-data
  chunk TCP sends (MTU minus IP+TCP headers).
- **Looking for ports in the IP header.** Ports are a **transport-layer** field (TCP/UDP), not IP.

# Best Practices

- Assume a **1500-byte Ethernet MTU** and **~1460-byte MSS** as your default mental numbers (and
  verify per link).
- Avoid relying on **fragmentation**; prefer correctly sized segments (right MSS) — it's more robust.
- When tunnels/VPNs misbehave on large transfers, suspect **MTU/MSS** and check that ICMP "too big"
  isn't being blocked.
- Keep the layers straight: **TTL and IP addresses** in the IP header; **ports** in the TCP/UDP header.

# Summary

- **Encapsulation** nests data in headers: each layer's output is the next layer's **payload**.
- The **IP header** carries source/destination IP, **TTL** (hop counter), and a **protocol** field —
  but **no ports** (those are in TCP/UDP).
- **MTU** caps frame size (Ethernet: **1500 bytes**); packets that don't fit must be **fragmented**.
- **IPv4** may fragment in transit; **IPv6** never does — it drops and signals "Packet Too Big."
- TCP avoids fragmentation by choosing an **MSS** (≈ MTU − IP − TCP headers, ~**1460 bytes**).

# Flash Cards

Q: What is the difference between a header and a payload?
A: The header is the control bytes a layer prepends; the payload is the data it's carrying (everything the layer received from above).

Q: What is the MTU, and what is it for standard Ethernet?
A: The Maximum Transmission Unit is the largest payload a single frame can carry on a link; for standard Ethernet it is 1500 bytes.

Q: What does the TTL (Hop Limit) field do?
A: It's a counter decremented by each router; when it reaches 0 the packet is dropped, preventing infinite loops — and enabling traceroute.

Q: How do IPv4 and IPv6 differ in handling packets bigger than the MTU?
A: IPv4 routers may fragment in transit; IPv6 routers never fragment — they drop the packet and send an ICMPv6 "Packet Too Big," so the sender uses Path MTU Discovery.

Q: What is the MSS and how is it related to the MTU?
A: The Maximum Segment Size is the largest chunk of application data TCP puts in one segment; it's roughly the MTU minus the IP and TCP headers (~1460 bytes on Ethernet).

Q: Which header contains port numbers — IP or TCP/UDP?
A: The TCP/UDP (transport) header. The IP header has addresses, TTL, and a protocol field, but no ports.

# Exercises

### Easy
List, from outermost to innermost, the headers wrapped around an HTTP request sent over TCP/IP on
Ethernet. Which part is the payload?

### Medium
On a 1500-byte MTU with a 1460-byte MSS, how many TCP segments are needed to send 5000 bytes of
application data, and how big is each? Show your arithmetic.

### Challenging
A VPN reduces the usable MTU to 1400 bytes but large transfers hang. Explain two things that could be
happening (fragmentation vs blocked Path MTU Discovery) and how adjusting the MSS resolves it.

# Further Reading

- IETF — *Internet Protocol* (RFC 791, IPv4 header & fragmentation): <https://www.rfc-editor.org/rfc/rfc791>
- IETF — *Path MTU Discovery* (RFC 1191): <https://www.rfc-editor.org/rfc/rfc1191>
- IETF — *IPv6 Specification* (RFC 8200, no in-transit fragmentation): <https://www.rfc-editor.org/rfc/rfc8200>
- Cloudflare — *What is MTU?*: <https://www.cloudflare.com/learning/network-layer/what-is-mtu/>
