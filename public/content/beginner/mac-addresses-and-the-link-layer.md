---
id: lesson-04
slug: mac-addresses-and-the-link-layer
title: "MAC Addresses and the Link Layer"
level: beginner
order: 4
duration: 18
tags:
  - mac
  - ethernet
  - arp
  - switch
  - link-layer
summary: "How devices talk on one local network — 48-bit MAC addresses, Ethernet frames, how switches learn where hosts are, and how ARP maps an IP address to a MAC address."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the job of the **link layer** and how it differs from the Internet layer.
- Read a **MAC address** and explain what makes it different from an IP address.
- Explain how a **switch** learns which host is on which port.
- Describe how **ARP** maps an IP address to a MAC address on a local network.
- Explain why the **MAC address changes at each hop** but the **IP address stays end-to-end**.

# Why It Matters

IP addresses get a packet *across* networks, but the actual delivery on each individual wire or Wi-Fi
link is done by the **link layer** using **MAC addresses**. This is the layer where "the packet
physically moves to the next device." Understanding it explains a lot of everyday behavior: why two
machines on the same Wi-Fi can talk without a router, what a switch is really doing, and what the
`arp` table on your computer means.

# Concept Explanation

### The link layer delivers on one hop

The **link layer** (layers 1–2 in OSI, the Link layer in TCP/IP) is responsible for moving data
between two devices **on the same physical or wireless link** — one "hop." Its PDU is the **frame**.
Ethernet and Wi-Fi are link-layer technologies. The link layer doesn't know or care about the whole
internet; it just gets a frame to the next device on the local network.

### MAC addresses identify a network interface

A **MAC address** (Media Access Control address) is a **48-bit** identifier burned into (or assigned
to) a network interface — your Ethernet port or Wi-Fi radio. It's written as six hex pairs:

```text
   00:1A:2B:3C:4D:5E
   \_____/ \________/
   first 3 bytes    last 3 bytes
   (OUI: vendor)    (per-device)
```

The first half often identifies the **manufacturer** (the OUI, assigned by the IEEE); the second half
makes it unique per device. Key differences from an IP address:

- A MAC address is **flat and local** — meaningful only within one link/broadcast domain. It is not
  routable across the internet.
- An IP address is **hierarchical and routable** — its network portion tells routers where it lives.
- MAC is layer 2; IP is layer 3. You generally **need both**: IP to decide the far-away destination,
  MAC to hand the frame to the next device on this link.

### An Ethernet frame

A frame wraps the IP packet with link-layer addressing:

```text
   +-------------+-------------+------+------------------+-----+
   | dest MAC    | source MAC  | type | payload (IP pkt) | FCS |
   +-------------+-------------+------+------------------+-----+
     6 bytes       6 bytes       2       up to ~1500       4
```

The **FCS** (Frame Check Sequence) is a checksum the receiver uses to detect corruption. The `type`
field says what's inside (e.g. IPv4 or IPv6).

### Switches learn who is where

A **switch** connects many hosts and forwards frames only to the port where the destination lives. It
learns this automatically: when a frame arrives, the switch notes the **source MAC** and the port it
came in on, building a **MAC address table**. When it needs to send to that MAC later, it forwards out
only the right port instead of flooding every port.

```text
   Port 1 -- 00:1A:.. (laptop)
   Port 2 -- 00:2B:.. (server)      MAC table:  00:1A:.. -> Port 1
   Port 3 -- 00:3C:.. (printer)                 00:2B:.. -> Port 2
```

All devices reachable without crossing a router form one **broadcast domain** — a frame sent to the
broadcast MAC `FF:FF:FF:FF:FF:FF` reaches all of them.

### ARP: from IP to MAC

Here's the glue. To send an IP packet to a host on the **same** local network, your computer knows the
destination **IP** but needs the destination **MAC** to build the frame. **ARP** (Address Resolution
Protocol) fills the gap:

```text
   Host A wants to reach 192.168.1.20 but doesn't know its MAC.
   A broadcasts:  "Who has 192.168.1.20? Tell 192.168.1.10"   (to FF:FF:FF:FF:FF:FF)
   Host B replies: "192.168.1.20 is at 00:2B:3C:4D:5E:6F"      (unicast back to A)
   A caches the mapping in its ARP table and sends the frame.
```

IPv6 doesn't use ARP; it uses **NDP** (Neighbor Discovery Protocol) for the same purpose. You can view
the learned mappings:

```bash
ip neigh        # Linux: show the ARP/neighbor table
arp -a          # macOS/Windows: show cached IP -> MAC mappings
```

### The crucial insight: MAC changes each hop, IP stays

When a packet crosses several networks, the **source and destination IP** normally stay the same all
the way (they name the true endpoints). But at **every hop**, the frame is rebuilt with a **new source
and destination MAC** — the MAC of "this device" and "the next device." Routers strip the old frame
and build a fresh one for the next link.

```text
  Laptop -> Router A -> Router B -> Server
  IP  src/dst:  stays  Laptop -> Server  the whole way (barring NAT)
  MAC src/dst:  Laptop->RtrA, then RtrA->RtrB, then RtrB->Server  (new every hop)
```

# Key Terminology

- **Link layer** — moves frames between two devices on the same link (one hop).
- **Frame** — the link-layer PDU; wraps an IP packet with MAC addresses and a checksum.
- **MAC address** — a 48-bit, locally-meaningful hardware address (six hex pairs).
- **OUI** — the vendor prefix in the first half of a MAC address.
- **Switch** — forwards frames to the correct port using a learned MAC table.
- **Broadcast domain** — the set of hosts a broadcast frame reaches (no router crossed).
- **ARP** — resolves an IPv4 address to a MAC on the local link (IPv6 uses **NDP**).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Reach a host on the same LAN | Use ARP to find its MAC, send directly | Send via the router | Same subnet -> ARP + direct frame; different subnet -> hand it to the router. |
| Connect several hosts locally | Hub (floods everything) | Switch (learns MACs) | A switch — it forwards only to the right port, cutting needless traffic. |
| Identify a device | MAC address | IP address | MAC for local delivery on this link; IP for end-to-end routing across networks. |

# Worked Example

Two laptops on the same Wi-Fi, `192.168.1.10` (MAC `AA:..`) and `192.168.1.20` (MAC `BB:..`):

```text
1. .10 wants to send to .20. Same subnet, so it needs .20's MAC.
2. .10 checks its ARP cache -> not found.
3. .10 broadcasts an ARP request: "Who has 192.168.1.20?"
4. .20 replies (unicast): "That's me, at BB:..".
5. .10 caches 192.168.1.20 -> BB:.. and builds a frame: dst MAC BB:.., src MAC AA:..
6. The access point/switch delivers the frame straight to .20.
```

No router was involved — both hosts share one broadcast domain, so link-layer delivery is enough.

# Real World Analogy

Think of an office building. Your **IP address** is like the recipient's full mailing address, used to
route a letter to the right building across the city. But once the letter reaches the building, the
**mailroom clerk** needs the recipient's **desk/room** to hand it over — that's the **MAC address**,
meaningful only inside this building. **ARP** is walking up and asking "who sits at desk 20?" The
street address (IP) is the same the whole journey; the "hand it to this specific person here" step
(MAC) is redone in every building along the way.

# Examples

## Example 1 — Basic: reading your ARP table

After pinging your router, your computer has learned its MAC:

```bash
ping -c 1 192.168.1.1
ip neigh                     # shows: 192.168.1.1 dev wlan0 lladdr a1:b2:c3:d4:e5:f6 REACHABLE
```

The `lladdr` is the router's MAC that ARP resolved. Your machine will reuse it (from cache) for
subsequent frames until the entry expires.

**Why this works:** ARP maps the router's known IP to the MAC needed to actually deliver frames to it.

## Example 2 — Real-world: why a switch beats a hub

An old **hub** copies every incoming frame to every port, so all hosts see all traffic and collisions
rise. A **switch** learns each host's port from source MACs and forwards a frame only where it needs to
go, so unrelated conversations don't interfere.

**Why this works:** the switch's learned MAC table turns "shout to everyone" into "deliver to the one
right port."

## Example 3 — Pitfall: expecting a MAC to travel end-to-end

Someone tries to identify a remote website by its MAC address and finds only their own router's MAC.
MAC addresses don't survive routing — each hop rewrites them — so a distant server's MAC is simply not
visible to you.

**Why this bites:** using MAC where you need IP (or vice versa) leads to filters and diagnostics that
can never match.

# Common Mistakes

- **Confusing MAC and IP roles.** MAC = local, one hop, layer 2; IP = end-to-end, routable, layer 3.
- **Thinking the MAC address is constant end-to-end.** It's rewritten at **every** hop; the IP is what
  stays the same.
- **Assuming ARP works across the internet.** ARP is **local only** — it resolves addresses within one
  broadcast domain.
- **Believing a switch inspects IP addresses.** A basic switch forwards by **MAC**, not IP.

# Best Practices

- Remember the split: **IP decides *where* far away; MAC delivers *here*, one hop at a time.**
- Use `ip neigh` / `arp -a` to check what your host has learned when local connectivity is flaky.
- Expect a device's MAC to change if it's replaced or randomized (modern phones randomize Wi-Fi MACs
  for privacy).
- When two hosts are on the **same subnet**, think ARP + direct frame; on **different subnets**, think
  "send it to the gateway."

# Summary

- The **link layer** delivers **frames** between two devices on one hop, using **MAC addresses**.
- A **MAC address** is a 48-bit, locally-meaningful hardware address — flat and not routable, unlike a
  hierarchical, routable **IP address**.
- **Switches** learn which MAC lives on which port and forward frames only where needed.
- **ARP** resolves an IPv4 address to a MAC on the local network (IPv6 uses **NDP**).
- Across a path, the **MAC is rewritten every hop** while the **IP stays end-to-end**.

# Flash Cards

Q: How many bits is a MAC address, and how is it written?
A: 48 bits, written as six hexadecimal pairs (e.g. 00:1A:2B:3C:4D:5E).

Q: What is the main difference between a MAC address and an IP address?
A: A MAC is a flat, local, layer-2 address for delivery on one link; an IP is a hierarchical, routable, layer-3 address for end-to-end delivery across networks.

Q: What does ARP do?
A: It resolves an IPv4 address to the MAC address of a host on the same local network so a frame can be built and delivered (IPv6 uses NDP instead).

Q: How does a switch know which port to send a frame to?
A: It learns by recording the source MAC and incoming port of each frame, building a MAC address table, then forwards to the matching port.

Q: When a packet crosses several routers, what changes at each hop and what stays the same?
A: The source/destination MAC is rewritten at every hop; the source/destination IP normally stays the same end-to-end (barring NAT).

Q: Can you identify a remote internet server by its MAC address?
A: No — MAC addresses are local to each link and are rewritten every hop, so you only ever see your local devices' MACs (like your router's).

# Exercises

### Easy
Run `ip neigh` (or `arp -a`) on your computer. List the IP-to-MAC mappings it has learned and identify
which one is your router (default gateway).

### Medium
Explain, step by step, what happens when two laptops on the same Wi-Fi first try to talk: what does
ARP broadcast, who replies, and what gets cached?

### Challenging
A packet goes Laptop → Router A → Router B → Server across three links. Draw the source and destination
**IP** and **MAC** on each of the three links, and explain why the MAC pair differs on each link while
the IP pair does not.

# Further Reading

- IETF — *An Ethernet Address Resolution Protocol* (RFC 826, ARP): <https://www.rfc-editor.org/rfc/rfc826>
- IETF — *Neighbor Discovery for IPv6* (RFC 4861): <https://www.rfc-editor.org/rfc/rfc4861>
- Cloudflare — *What is a MAC address?*: <https://www.cloudflare.com/learning/network-layer/what-is-a-mac-address/>
- IEEE — *Guidelines for MAC addresses / OUI*: <https://standards.ieee.org/products-programs/regauth/>
