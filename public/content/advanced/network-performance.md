---
id: lesson-23
slug: network-performance
title: "Network Performance: Latency, Bandwidth, and Throughput"
level: advanced
order: 23
duration: 20
tags:
  - latency
  - bandwidth
  - throughput
  - congestion
  - performance
summary: "What 'fast' really means on a network — the difference between bandwidth, throughput, and latency, how RTT and loss limit real speed, and why latency often matters more than raw capacity."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Distinguish **bandwidth**, **throughput**, and **latency** precisely.
- Explain **RTT** and the **bandwidth-delay product**.
- Describe how **packet loss** and **congestion control** limit real throughput.
- Explain **jitter** and **bufferbloat** and where they hurt.
- Get **units** right (bits vs bytes) and reason about what dominates performance.

# Why It Matters

"The network is slow" is one of the vaguest complaints in computing — and one of the most misdiagnosed.
People buy more **bandwidth** when the real problem is **latency**, or blame the server when it's
**congestion** or **loss**. Separating these concepts lets you measure the right thing and fix the
actual bottleneck, whether you're tuning an app, choosing hosting, or explaining why a "fast" connection
still feels sluggish.

# Concept Explanation

### Three different things

These words are used interchangeably in casual speech but mean distinct things:

- **Bandwidth** — the **maximum** data rate a link *could* carry, its capacity (e.g. 1 Gb/s). A property
  of the link, like a pipe's width.
- **Throughput** — the data rate you **actually achieve** in practice (e.g. 300 Mb/s), always ≤
  bandwidth, reduced by overhead, loss, congestion, and protocol limits.
- **Latency** — the **delay** for data to travel, often measured as **round-trip time (RTT)**. A
  property of distance and path, largely **independent** of bandwidth.

```text
   Bandwidth  = the pipe's WIDTH   (how much can flow at once)
   Throughput = the water you ACTUALLY get through it
   Latency    = how LONG water takes to travel the pipe's length
```

You can have huge bandwidth *and* high latency (a satellite link), or low bandwidth *and* low latency (a
short slow cable). They're separate axes.

### RTT and why it dominates

**RTT** (round-trip time) is how long a request-plus-reply takes. It's set mostly by **distance** (light
in fiber travels ~200,000 km/s) and the number of hops — and **you can't buy it down with more
bandwidth**. Many workloads are **latency-bound**: loading a page involves DNS, a TCP handshake, a TLS
handshake, then the request — several **round trips** *before* the first byte. On a 200 ms RTT link,
those round trips cost nearly a second no matter how fat the pipe.

### Bandwidth-delay product

The **bandwidth-delay product (BDP)** = bandwidth × RTT — the amount of data "in flight" to keep a link
full. If a protocol's window is smaller than the BDP, it can't fill the pipe and throughput suffers even
with plenty of bandwidth:

```text
   BDP = bandwidth × RTT
   e.g. 100 Mb/s × 100 ms = 10 Mbit ≈ 1.25 MB in flight to saturate the link.
   If TCP's window caps below this, you leave capacity unused.
```

This is why high-bandwidth, high-latency links ("long fat networks") need large TCP windows to perform.

### Loss and congestion control

TCP interprets **packet loss** as a sign of **congestion** and **slows down** (congestion control:
slow-start, then back off on loss). So on a lossy path, throughput drops sharply — not because bandwidth
vanished, but because TCP deliberately reduces its sending rate. A little loss can cost a lot of
throughput on high-RTT links (loss and latency compound).

### Jitter and bufferbloat

- **Jitter** is *variation* in latency — packets arriving unevenly. It barely matters for a file
  download but wrecks real-time media (choppy calls), which is why those apps use jitter buffers.
- **Bufferbloat** is excessive buffering in network gear: oversized queues absorb bursts but add huge
  delay under load, so a saturated link can spike latency (a big download makes video calls stutter).
  Modern queue management (e.g. fq_codel) fights it.

### Units: bits vs bytes

Network rates are in **bits per second** (Mb/s, Gb/s); file sizes are in **bytes** (MB, GB), and **1
byte = 8 bits**. So a "100 Mb/s" link transfers at most ~**12.5 MB/s** *before* overhead. Confusing
megabits and megabytes leads to expecting downloads 8× faster than physically possible.

# Key Terminology

- **Bandwidth** — maximum link capacity (bits per second).
- **Throughput** — actual achieved data rate (≤ bandwidth).
- **Latency / RTT** — delay for data to travel / for a round trip.
- **Bandwidth-delay product (BDP)** — bandwidth × RTT; data needed in flight to fill the link.
- **Congestion control** — TCP reducing its rate in response to loss.
- **Jitter** — variation in latency.
- **Bufferbloat** — latency spikes from oversized buffers under load.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| "Site feels slow" fix | Buy more bandwidth | Reduce latency / round trips | If it's latency-bound (many RTTs, distant server), more bandwidth won't help — cut RTTs or move closer (CDN). |
| Serve global users | One central server | CDN / edge locations | Edge/CDN reduces RTT by serving from nearby, the biggest win for latency-bound loads. |
| Real-time media | Optimize for throughput | Optimize for low latency + jitter | Real-time cares about latency/jitter far more than raw bandwidth. |

# Worked Example

Why a "fast" 1 Gb/s connection still loads a distant site slowly:

```text
   Server is 150 ms RTT away. A cold HTTPS page load needs several round trips:
     DNS lookup            ~1 RTT
     TCP handshake         ~1 RTT
     TLS handshake         ~1 RTT (TLS 1.3)
     First request/response ~1 RTT
   ≈ 4 × 150 ms = 600 ms BEFORE meaningful content — regardless of the 1 Gb/s pipe.

   Fix: reduce RTTs (connection reuse, TLS 1.3/0-RTT, HTTP/3) and reduce distance
   (a CDN edge 10 ms away turns 600 ms of setup into ~40 ms).
```

More bandwidth changes none of that setup time; **cutting latency and round trips** does.

# Real World Analogy

Bandwidth vs latency is like a **highway**. **Bandwidth** is the number of lanes — how many cars can flow
at once. **Latency** is how long the drive takes end to end. Adding lanes (**bandwidth**) helps when the
road is jammed with volume, but it does **nothing** to shorten a 500 km trip (**latency**). For a single
urgent courier, a shorter route (**lower RTT / a CDN**) beats extra lanes every time. **Bufferbloat** is
like a huge on-ramp queue: it never turns cars away, but everyone waits much longer to get moving.

# Examples

## Example 1 — Basic: bits vs bytes

A user with a "100 Mb/s" plan expects a 100 MB file in 1 second and is confused it takes ~8+. At 100
**megabits**/s, that's ~12.5 **megabytes**/s, so ~8 seconds at best — before overhead. The plan is fine;
the unit confusion isn't.

**Why this works:** rates are in bits and files in bytes; dividing by 8 gives the realistic transfer
time.

## Example 2 — Real-world: CDN cuts latency, not bandwidth

A global site adds a CDN. Users far from the origin see pages load much faster — not because they got
more bandwidth, but because content now comes from an edge a few milliseconds away, slashing the RTTs
that dominated load time.

**Why this works:** the load was latency-bound, so reducing RTT (distance) delivered the win that extra
bandwidth couldn't.

## Example 3 — Pitfall: blaming bandwidth for a latency problem

A team upgrades from 200 Mb/s to 1 Gb/s to fix "slow" API calls and sees no improvement. The calls were
small and **latency-bound** (round trips to a distant region), so capacity was never the limit.

**Why this bites:** throwing bandwidth at a latency problem wastes money and leaves the real bottleneck
(RTT/round trips) untouched.

# Common Mistakes

- **Treating bandwidth and speed as the same.** Latency, loss, and round trips often matter more.
- **Confusing bits and bytes.** Divide a Mb/s rate by 8 to get MB/s.
- **Thinking more bandwidth fixes latency.** RTT is set by distance/path, not capacity.
- **Ignoring loss/congestion.** A little loss can crater throughput because TCP backs off.

# Best Practices

- **Measure the right metric**: RTT/latency for responsiveness, throughput for bulk transfer — don't
  conflate them.
- For latency-bound workloads, **cut round trips** (keep-alive, TLS 1.3/0-RTT, HTTP/3) and **reduce
  distance** (CDN/edge).
- Mind the **bandwidth-delay product** on long fat links; size windows to fill the pipe.
- Watch for **bufferbloat** when a big transfer degrades interactive traffic; use modern queue
  management.

# Summary

- **Bandwidth** (capacity), **throughput** (actual rate), and **latency** (delay/RTT) are **different**
  things.
- Latency is set mostly by **distance/hops** and **can't be bought down with bandwidth**; many web
  loads are **latency-bound** (multiple round trips before first byte).
- The **bandwidth-delay product** is how much data must be in flight to fill a link; small windows waste
  capacity on long fat networks.
- **Packet loss** triggers TCP **congestion control**, cutting throughput; **jitter** and **bufferbloat**
  hurt real-time and interactive traffic.
- Get **units** right (bits vs bytes) and fix the **actual** bottleneck — often RTT, not capacity.

# Flash Cards

Q: What is the difference between bandwidth and throughput?
A: Bandwidth is the maximum capacity a link could carry; throughput is the rate you actually achieve, which is always less due to overhead, loss, and congestion.

Q: Why can't buying more bandwidth reduce latency?
A: Latency (RTT) is set mainly by distance and the number of hops; adding capacity (lanes) doesn't shorten how long data takes to travel the path.

Q: What is the bandwidth-delay product, and why does it matter?
A: Bandwidth × RTT — the data that must be "in flight" to keep a link full. If a protocol's window is smaller than the BDP, throughput suffers even with spare bandwidth.

Q: How does packet loss affect TCP throughput?
A: TCP treats loss as congestion and slows its sending rate (congestion control), so even a little loss can sharply reduce throughput, especially on high-RTT links.

Q: What is bufferbloat?
A: Excessive buffering in network gear that absorbs bursts but adds large delay under load, so a saturated link spikes latency and degrades interactive traffic.

Q: A 100 Mb/s link transfers a file at roughly how many megabytes per second?
A: About 12.5 MB/s, because 1 byte = 8 bits (100 megabits ÷ 8), and that's before protocol overhead.

# Exercises

### Easy
Convert: how long, at minimum, to download a 500 MB file on a 200 Mb/s link (ignore overhead)? Show the
bits-to-bytes step.

### Medium
Explain why a page hosted 150 ms away can take most of a second to start rendering even on a gigabit
connection. List the round trips involved and one technique to reduce each.

### Challenging
A team reports "slow" performance and plans to double their bandwidth. Describe how you'd determine
whether the problem is bandwidth, latency, loss, or bufferbloat, which measurements you'd take for each,
and when doubling bandwidth would — and wouldn't — help.

# Further Reading

- Cloudflare — *What is latency? / bandwidth vs throughput*: <https://www.cloudflare.com/learning/performance/glossary/what-is-latency/>
- IETF — *Controlled Delay Active Queue Management* (CoDel, RFC 8289): <https://www.rfc-editor.org/rfc/rfc8289>
- High Performance Browser Networking (Ilya Grigorik) — primer on latency/BDP: <https://hpbn.co/>
- IETF — *TCP Congestion Control* (RFC 5681): <https://www.rfc-editor.org/rfc/rfc5681>
