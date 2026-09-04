---
id: lesson-02
slug: osi-and-tcp-ip-models
title: "The OSI and TCP/IP Models"
level: beginner
order: 2
duration: 18
tags:
  - osi
  - tcp-ip
  - layers
  - encapsulation
  - models
summary: "How networking is organized into layers — the 7-layer OSI reference model, the 4-layer TCP/IP model the internet actually runs, and how encapsulation wraps data as it moves down the stack."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why networking is split into **layers**.
- List the **7 OSI layers** and the **4 TCP/IP layers**, and map one onto the other.
- Place common protocols (**IP**, **TCP/UDP**, **HTTP**) on the correct layer.
- Describe **encapsulation** and name each layer's unit of data (**PDU**).
- Say why the internet runs the **TCP/IP model**, and what OSI is really for.

# Why It Matters

Networking looks overwhelming because so much happens at once: cables, addresses, delivery, security,
web pages. Layering is the trick that tames it. Each layer solves one problem and trusts the layer
below to solve the rest. Once you can place a protocol on its layer, a flood of confusing terms snaps
into order — and troubleshooting becomes "which layer is broken?" instead of "everything is broken."

# Concept Explanation

### Why layers?

A **layered model** breaks communication into independent levels, each with a single job and a clean
boundary. A layer uses the service of the one **below** it and provides a service to the one
**above** it. The payoff: you can change one layer without touching the others. Switching from Wi-Fi
to Ethernet (bottom layer) doesn't change how a web page (top layer) is written, because everything in
between stays the same.

### The OSI model (7 layers — the reference)

The **OSI model** (Open Systems Interconnection) is a *reference* model with seven layers. Read it
bottom to top:

```text
  7  Application    Data for the user's app (HTTP, DNS, SMTP)
  6  Presentation   Formatting, encoding, encryption (e.g. TLS sits around here)
  5  Session        Setting up / managing conversations
  4  Transport      End-to-end delivery between programs (TCP, UDP)
  3  Network        Addressing and routing between networks (IP)
  2  Data Link      Delivery on one local link; MAC addresses (Ethernet, Wi-Fi)
  1  Physical       The actual signal: cables, radio, voltages, light
```

A memory aid (top to bottom): **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing.

### The TCP/IP model (4 layers — what the internet runs)

The internet was built on the **TCP/IP model**, which has **four** layers. It predates OSI and is what
real machines implement:

```text
  Application   HTTP, DNS, TLS, SSH, SMTP          (OSI 5-7)
  Transport     TCP, UDP                            (OSI 4)
  Internet      IP, ICMP                            (OSI 3)
  Link          Ethernet, Wi-Fi, ARP                (OSI 1-2)
```

Some books draw a **5-layer hybrid** that splits the Link layer into Physical + Data Link — handy for
teaching, but the four-layer TCP/IP model is the standard the internet is described by. **The internet
does not "run OSI."** OSI is a shared vocabulary and teaching tool; TCP/IP is the working machinery.

### Put protocols on the right layer

This is the part worth memorizing, because people mix it up constantly:

- **IP** is the **Internet / Network** layer (layer 3) — addressing and routing between networks.
- **TCP and UDP** are the **Transport** layer (layer 4) — delivery between two programs.
- **HTTP, DNS, TLS** are **Application** layer — the thing the user or app actually wants.

So "TCP/IP" names the two workhorse layers: **TCP** (transport) on top of **IP** (internet).

### Encapsulation: wrapping data on the way down

When you send data, it travels **down** the stack, and each layer wraps it with its own **header**
(the Link layer also adds a trailer). The wrapped unit has a name at each layer — its **PDU** (Protocol
Data Unit):

```text
  Application     [ data ]
  Transport       [ TCP header | data ]              -> "segment" (TCP) / "datagram" (UDP)
  Internet        [ IP header | TCP header | data ]  -> "packet"
  Link            [ frame hdr | IP ... | data | trl ] -> "frame"
  Physical        1010101110100...                    -> "bits" on the wire
```

At the receiver the process runs in reverse (**de-encapsulation**): each layer reads and removes its
own header, then hands the rest up. Every layer talks to its **peer** layer on the other machine as if
directly — your browser's HTTP "speaks to" the server's HTTP, even though the bytes really went all
the way down to the wire and back up.

# Key Terminology

- **Layer** — one level of the model with a single responsibility and clean interfaces.
- **OSI model** — a 7-layer *reference* model used for teaching and vocabulary.
- **TCP/IP model** — the 4-layer model the internet is actually built on.
- **Encapsulation** — wrapping data with a header (and trailer) at each layer going down.
- **PDU (Protocol Data Unit)** — the name of the data unit at a layer: segment/datagram, packet, frame.
- **Header** — control information a layer prepends to the data.
- **Peer layers** — the same layer on two hosts, which logically communicate with each other.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Which model to reason with | OSI (7 layers) | TCP/IP (4 layers) | OSI for precise vocabulary and teaching; TCP/IP to describe what really runs. |
| Where does TLS sit? | "Layer 6.5" / presentation-ish | Application layer (TCP/IP) | Both are defended; in the TCP/IP model TLS is an application-layer protocol over TCP. |
| Split the Link layer? | Keep it as one (4-layer) | Split into Physical + Data Link (5-layer) | Split it when teaching hardware vs framing; combine it for the standard TCP/IP view. |

# Worked Example

Trace a single HTTP request down your machine's stack:

```text
  Application (HTTP):  GET /index.html
  Transport  (TCP):   add a TCP header (ports, sequence numbers) -> segment
  Internet   (IP):    add an IP header (source & dest IP)        -> packet
  Link       (Wi-Fi): add a frame header + trailer (MAC addrs)   -> frame
  Physical:           send the frame as radio/electrical signals -> bits
```

The server receives the bits and unwraps them layer by layer until its web server reads the same
`GET /index.html` your browser wrote. Each header you added is read and stripped by the matching layer
on the far side.

# Real World Analogy

Think of sending a gift by courier. You write a **note** (application data). You put it in a **box**
with a packing slip (transport header). The box goes in a **shipping envelope** with the street
address (network/IP header). The courier puts that on a **truck** with a route sheet for the next
depot (link/frame). At each depot the truck's route sheet is replaced, but the address on the envelope
stays the same — just like the **MAC address changes each hop while the IP address stays end-to-end**.
The recipient unwraps each layer in turn and finally reads your note.

# Examples

## Example 1 — Basic: naming the PDU

Someone says "the router dropped a packet." That word is precise: a **packet** is the Internet-layer
PDU (IP). If a switch "dropped a frame," that's the Link-layer PDU. If TCP "retransmitted a segment,"
that's the Transport-layer PDU. Using the right word tells others exactly which layer you mean.

**Why this works:** each layer has its own unit name, so the vocabulary itself pinpoints the layer.

## Example 2 — Real-world: swapping Wi-Fi for Ethernet

You unplug from Wi-Fi and connect an Ethernet cable. Your web apps keep working with no changes. Only
the **Link** and **Physical** layers changed; the Internet, Transport, and Application layers above
them were untouched.

**Why this works:** layering isolates change — the upper layers depend on the *service* below, not on
how it's delivered.

## Example 3 — Pitfall: putting a protocol on the wrong layer

A student labels TCP a "network layer protocol" and IP a "transport protocol." Then nothing about
ports, routing, or addresses lines up. TCP is **Transport (layer 4)**; IP is **Internet/Network
(layer 3)**. Getting these two backwards quietly breaks your whole mental model.

**Why this bites:** later topics (ports, sockets, routing, NAT) all assume you know which layer each
protocol lives on.

# Common Mistakes

- **Thinking the internet "runs OSI."** It runs the **TCP/IP** model; OSI is a reference/teaching model.
- **Swapping TCP and IP layers.** TCP is Transport (4); IP is Internet/Network (3).
- **Forgetting encapsulation direction.** Headers are *added going down* the sender's stack and
  *removed going up* the receiver's.
- **Using "packet" for everything.** Segment/datagram (transport), packet (IP), and frame (link) name
  different layers.

# Best Practices

- When debugging, ask **"which layer?"** — cable (1-2), addressing/routing (3), delivery/ports (4), or
  the app (5-7).
- Learn the protocol-to-layer mapping cold: **IP = 3, TCP/UDP = 4, HTTP/DNS/TLS = application**.
- Use the **PDU name** that matches the layer you mean, so others know exactly what you're describing.
- Reason with the **4-layer TCP/IP model** for real systems; reach for OSI's 7 layers for precise talk.

# Summary

- Networking is split into **layers**; each does one job and uses the layer below it.
- **OSI** has **7 layers** (a reference model); **TCP/IP** has **4 layers** and is what the internet
  actually runs.
- **IP = layer 3 (Internet)**, **TCP/UDP = layer 4 (Transport)**, **HTTP/DNS/TLS = application**.
- **Encapsulation** wraps data with a header at each layer going down; the PDU is a **segment/datagram
  → packet → frame → bits**.
- Layering means you can change one layer (Wi-Fi → Ethernet) without touching the others.

# Flash Cards

Q: How many layers does the OSI model have, and how many does the TCP/IP model have?
A: OSI has 7 layers; the TCP/IP model has 4 layers (Link, Internet, Transport, Application).

Q: Which layer is IP on, and which layer are TCP and UDP on?
A: IP is the Internet/Network layer (layer 3); TCP and UDP are the Transport layer (layer 4).

Q: What is encapsulation?
A: Wrapping data with a header (and, at the link layer, a trailer) at each layer as it moves down the sending stack; the receiver strips them going up.

Q: Name the PDU at the transport, internet, and link layers.
A: Transport = segment (TCP) or datagram (UDP); Internet = packet; Link = frame.

Q: Does the internet "run" the OSI model?
A: No. The internet runs the TCP/IP model. OSI is a reference and teaching model that gives everyone shared vocabulary.

Q: Where does HTTP sit in the TCP/IP model?
A: At the Application layer, running on top of TCP (Transport) which runs on top of IP (Internet).

# Exercises

### Easy
Write out the four TCP/IP layers from top to bottom, and next to each write one protocol that lives
there.

### Medium
For each of these, name the layer and the PDU: an Ethernet **frame**, an IP **packet**, a TCP
**segment**, and an HTTP request. Then order them by how "deep" they are in encapsulation.

### Challenging
Explain how layering lets you switch from Wi-Fi to a wired Ethernet connection without changing your
web browser at all. Which layers change, which stay the same, and why does the change stay contained?

# Further Reading

- Cloudflare — *What is the OSI model?*: <https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/>
- IETF — *Requirements for Internet Hosts* (RFC 1122, the TCP/IP layering): <https://www.rfc-editor.org/rfc/rfc1122>
- MDN — *The TCP/IP model*: <https://developer.mozilla.org/en-US/docs/Glossary/TCP>
- Kurose & Ross — *Computer Networking: A Top-Down Approach*, ch. 1 (protocol layers)
