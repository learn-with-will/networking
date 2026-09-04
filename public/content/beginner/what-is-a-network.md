---
id: lesson-01
slug: what-is-a-network
title: "What Is a Network?"
level: beginner
order: 1
duration: 15
tags:
  - foundations
  - packets
  - hosts
  - internet
  - protocols
summary: "What a computer network actually is — hosts, links, and switches passing small packets by agreed-upon rules — and how a network of networks becomes the internet."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **computer network** is in plain language.
- Name the basic pieces: **hosts**, **links**, **switches/routers**, and **packets**.
- Describe why data travels in small **packets** instead of one big stream.
- Explain what a **protocol** is and why networks need agreed-upon rules.
- Say what the **internet** is: a network *of* networks that speak the same protocols.

# Why It Matters

Almost everything you build as a developer talks to something else over a network: a browser fetching
a page, an app calling an API, a server reading a database on another machine. When it works, it feels
like magic; when it breaks, it feels impossible. It is neither. A network is a small set of simple
ideas stacked on top of each other. This lesson draws the map — the words and pieces the rest of the
course fills in — so that later, when you read `ping`, `dig`, or a packet capture, you already know
what you are looking at.

# Concept Explanation

### A network is machines that can pass messages

A **computer network** is two or more devices connected so they can exchange data. Each device on a
network is called a **host** (or **node**) — your laptop, a phone, a server, a printer, a smart bulb.
The connections between them are **links**: a physical cable (like Ethernet) or a radio signal (like
Wi-Fi). The simplest possible network is two computers joined by one cable.

Real networks have many hosts, so we add devices whose job is to connect other devices:

- A **switch** connects many hosts on the *same local network* and forwards messages between them.
- A **router** connects *different networks* to each other — for example, your home network to your
  internet provider's network.

### Data travels in packets, not one big lump

When one host sends data to another, the data is chopped into small chunks called **packets**. Each
packet carries a piece of the data plus a header that says, among other things, where it came from and
where it is going — like an address on an envelope.

```text
  A 2 MB photo is not sent as one 2 MB blob. It is split into
  thousands of small packets, each addressed and sent independently:

   [pkt 1] [pkt 2] [pkt 3] ........ [pkt N]
      |       |       |                |
      +-------+-------+----> network >--+---> reassembled at the destination
```

Why bother? Because many hosts **share** the same links. If one host sent a huge file as a single
unbroken stream, everyone else would have to wait. Splitting data into packets lets many conversations
take turns on the same wire, lets packets take different routes, and lets the network resend just the
missing piece if one packet is lost — instead of the whole file.

### Protocols: the rules everyone agrees to follow

For two hosts to understand each other, they must agree on the **format** of the messages and the
**order** of the steps. That agreement is a **protocol**: a precise set of rules for communication.
"Send a packet with this layout, wait for this kind of reply, then continue." Humans have protocols
too — you say "hello," the other person says "hello" back, and only then do you start talking.

Networks use *many* protocols, each for a specific job (addressing, delivery, naming, security). The
whole rest of this course is, in a sense, a tour of the most important ones.

### The internet is a network of networks

The **internet** is not one giant network. It is millions of separate networks — home networks,
company networks, university networks, data centers — all connected by routers and all agreeing to
speak the same core protocols (the **TCP/IP** family, covered next lesson). "Inter-net" literally
means *between networks*. No one owns it; it works because everyone follows the same rules.

The **Web** (HTTP pages you open in a browser) is just *one* of many things that run on top of the
internet — alongside email, video calls, game traffic, and software updates. The internet is the road
system; the Web is one kind of vehicle on it.

# Key Terminology

- **Host / node** — any device connected to a network (laptop, server, phone, printer).
- **Link** — a connection between devices: a cable (wired) or radio (wireless).
- **Switch** — a device that connects hosts within one local network.
- **Router** — a device that connects different networks together.
- **Packet** — a small, individually addressed chunk of data sent across a network.
- **Protocol** — an agreed set of rules for the format and order of network messages.
- **Bandwidth** — how much data a link can carry per second (e.g. megabits per second).
- **The internet** — the global network of interconnected networks that share common protocols.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Send data as… | One continuous stream | Many small packets | Packets — they share links fairly and allow retransmitting only what's lost. |
| Connect two hosts on one LAN | A **switch** | A **router** | A switch (same network); a router joins *different* networks. |
| Physical link | Wired (Ethernet) | Wireless (Wi-Fi) | Wired for speed/stability; wireless for convenience and mobility. |

# Worked Example

Imagine sending the message `HELLO` from your laptop to a friend's laptop across the internet.

```text
1. Your laptop splits the message into one or more packets and addresses each one.
2. The packet goes over Wi-Fi to your home router.
3. Your router forwards it to your internet provider's routers.
4. Router by router, each reads the destination address and passes it toward the goal.
5. Your friend's router delivers it over their link to their laptop.
6. Their laptop reads the packet(s), reassembles them, and shows "HELLO".
```

No single wire connects the two laptops. The message is relayed hop by hop, each router making a
local decision about where to send the packet next. That hop-by-hop relay is the heart of how the
internet works.

# Real World Analogy

A network is like the **postal system**. Each home is a **host** with an address. You don't hand your
letter directly to the recipient; you drop it off, and it is passed from post office to post office
(**routers**) until it reaches the destination. A big parcel is split across several boxes
(**packets**), each labeled with the same address, and they might even travel on different trucks and
arrive out of order — then get reassembled at the other end. The agreed way to write an address and a
stamp is the **protocol**. The whole worldwide postal system linking every local one is the
**internet**.

# Examples

## Example 1 — Basic: your home network

Your phone, laptop, and TV connect over Wi-Fi to one home router. Together they form a small **local
network**. When your laptop streams to your TV, the packets never leave the house — the router (acting
as a switch for your local devices) forwards them directly. Only when you load a website do packets
leave your network and travel out to the internet.

**Why this works:** local traffic stays local; the router only sends packets to the wider internet
when the destination is on another network.

## Example 2 — Real-world: loading a web page

You type an address and press Enter. Your computer breaks its request into packets, which travel
across many networks to a web server, which sends the page back — again as packets — that your browser
reassembles and displays. Dozens of separate networks may sit between you and the server, yet it feels
instant.

**Why this works:** every network in between speaks the same core protocols, so a packet you send is
understood by machines you will never see.

## Example 3 — Pitfall: assuming a direct connection

A beginner assumes their computer has a private wire to a website and is surprised that a coffee-shop
Wi-Fi outage, a broken router three hops away, or a distant server can all break the "connection." In
reality there is no single wire — just a chain of independent hops, any of which can fail.

**Why this bites:** treating the network as one direct link hides the many places a problem can
actually be, which makes troubleshooting confusing.

# Common Mistakes

- **Thinking data travels as one continuous stream.** It is split into packets that are sent, routed,
  and sometimes resent independently.
- **Confusing a switch and a router.** A switch connects hosts *within* a network; a router connects
  *between* networks.
- **Equating "the internet" with "the Web."** The Web is one application running on the internet;
  email, video, and games run on it too.
- **Assuming a direct connection.** Traffic is relayed hop by hop through many networks you don't
  control.

# Best Practices

- Picture every network conversation as **packets addressed and relayed**, not a private pipe.
- When something breaks, ask **which hop** failed — your device, your local network, or something
  farther out.
- Learn the **protocol** for whatever you're debugging; the rules tell you what *should* happen.
- Keep the layers separate in your head: physical link, addressing, delivery, application.

# Summary

- A **network** is devices (**hosts**) connected by **links** so they can exchange data.
- Data travels in small, individually addressed **packets** so many hosts can share the same links.
- A **switch** connects hosts on one network; a **router** connects different networks.
- A **protocol** is the agreed set of rules that lets different machines understand each other.
- The **internet** is a network *of* networks that all speak the same core protocols; the **Web** is
  just one thing that runs on it.

# Flash Cards

Q: What is a computer network?
A: Two or more devices (hosts) connected by links so they can exchange data.

Q: Why is data sent in packets instead of one continuous stream?
A: So many hosts can share the same links fairly, packets can take different routes, and only a lost packet — not the whole file — has to be resent.

Q: What is the difference between a switch and a router?
A: A switch connects hosts within one local network; a router connects different networks to each other.

Q: What is a protocol?
A: An agreed set of rules for the format and ordering of network messages, so different machines can understand each other.

Q: What does "the internet" actually mean?
A: A global network of interconnected networks that all agree to speak the same core protocols (the TCP/IP family).

Q: Is the Web the same thing as the internet?
A: No — the Web (HTTP pages) is just one application that runs on top of the internet, alongside email, video calls, games, and more.

# Exercises

### Easy
List five devices in your home or workplace that are hosts on a network. For each, note whether it
connects by cable (wired) or radio (wireless).

### Medium
Draw your home network on paper: your devices, the router, and the link out to your internet provider.
Mark which traffic stays local (device to device) and which must leave for the internet.

### Challenging
Explain, in your own words, why splitting data into packets makes a shared network more reliable *and*
more efficient than sending each file as one unbroken stream. Give one concrete situation where
packetization clearly helps.

# Further Reading

- Cloudflare — *What is the Internet?*: <https://www.cloudflare.com/learning/network-layer/what-is-the-internet/>
- Cloudflare — *What is a packet?*: <https://www.cloudflare.com/learning/network-layer/what-is-a-packet/>
- MDN — *How the Internet works*: <https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work>
- IETF — *Architectural Principles of the Internet* (RFC 1958): <https://www.rfc-editor.org/rfc/rfc1958>
