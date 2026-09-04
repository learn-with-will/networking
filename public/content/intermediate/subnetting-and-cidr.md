---
id: lesson-09
slug: subnetting-and-cidr
title: "Subnetting and CIDR"
level: intermediate
order: 9
duration: 24
tags:
  - subnetting
  - cidr
  - subnet-mask
  - network-address
  - broadcast
summary: "How an IP address splits into a network part and a host part — reading CIDR notation and subnet masks, finding the network and broadcast addresses, and counting usable hosts."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain how a **subnet mask** splits an address into **network** and **host** parts.
- Read and write **CIDR** notation (e.g. `/24`) and its dotted-decimal mask.
- Compute the **network address**, **broadcast address**, and **usable host range** of a subnet.
- Apply the **usable hosts = 2^(host bits) − 2** rule and its **/31** and **/32** exceptions.
- Understand why **classful** addressing was replaced by CIDR.

# Why It Matters

Subnetting is where a lot of learners freeze — but it's just splitting an address into "which network"
and "which host." Every router decision, firewall rule, cloud VPC, and DHCP scope is defined by a
subnet. Once the mask clicks, you can look at `10.1.4.0/22` and immediately know its size, its range,
and whether two hosts can talk directly. This is one of the highest-leverage skills in networking.

# Concept Explanation

### An address has two parts

Every IP address is split into a **network portion** (which network this address belongs to) and a
**host portion** (which host on that network). The **subnet mask** marks the boundary: the mask's
`1` bits cover the network part, the `0` bits cover the host part.

```text
   IP:    192.168.1.42    = 11000000.10101000.00000001.00101010
   Mask:  255.255.255.0   = 11111111.11111111.11111111.00000000
                             \___ network (24 bits) ___/\_ host _/
```

Hosts whose addresses share the same network portion are on the **same subnet** and can talk directly
(link-layer); to reach a different subnet, they go through a router.

### CIDR notation

Writing masks in dotted decimal is clumsy, so **CIDR** (Classless Inter-Domain Routing) writes the
mask as a **prefix length**: the number of network bits, after a slash.

```text
   /24  =  255.255.255.0      (24 network bits, 8 host bits)
   /16  =  255.255.0.0        (16 network bits, 16 host bits)
   /26  =  255.255.255.192    (26 network bits, 6 host bits)
```

`192.168.1.0/24` means "the network where the first 24 bits are fixed." The larger the prefix, the
**smaller** the network (fewer host bits).

### Network and broadcast addresses

Within any IPv4 subnet, two addresses are reserved:

- The **network address** has **all host bits = 0** — it names the subnet itself.
- The **broadcast address** has **all host bits = 1** — a packet sent here reaches every host on the
  subnet.

Neither can be assigned to a host, which is where the "**− 2**" comes from.

```text
   192.168.1.0/24:
     Network address:    192.168.1.0     (host bits all 0)
     Broadcast address:  192.168.1.255   (host bits all 1)
     Usable hosts:       192.168.1.1  –  192.168.1.254
```

### Counting hosts: 2^(host bits) − 2

If a subnet has `h` host bits, it has `2^h` total addresses and **`2^h − 2` usable host addresses**
(subtracting network + broadcast).

```text
   /24  -> 8 host bits  -> 2^8  = 256 addresses -> 254 usable
   /26  -> 6 host bits  -> 2^6  =  64 addresses ->  62 usable
   /30  -> 2 host bits  -> 2^2  =   4 addresses ->   2 usable
```

**Exceptions to the − 2 rule:**

- **/31** (RFC 3021): 2 addresses, **both usable** — designed for point-to-point links (no broadcast
  needed).
- **/32**: a single address — one specific host (used for routes and loopbacks).

### Why CIDR replaced classes

The original internet used **classful** addressing: Class A (`/8`), B (`/16`), C (`/24`), fixed by the
first bits of the address. It was wasteful — an organization needing 300 hosts had to take a whole
Class B (65,534 hosts). **CIDR (1993, RFC 4632)** replaced classes with arbitrary prefix lengths, so
you can size a network to fit (a `/23` gives ~510 hosts) and aggregate routes. Treat "Class A/B/C" as
**history**, not current practice.

# Key Terminology

- **Subnet mask** — the bit pattern separating the network part (`1`s) from the host part (`0`s).
- **CIDR / prefix length** — the mask written as `/N`, where N is the number of network bits.
- **Network address** — all host bits 0; names the subnet (not assignable to a host).
- **Broadcast address** — all host bits 1; reaches every host on the subnet.
- **Usable hosts** — `2^(host bits) − 2` (except `/31` and `/32`).
- **Classful addressing** — the obsolete fixed A/B/C scheme replaced by CIDR.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Point-to-point link | /30 (2 usable, 1 wasted pair) | /31 (2 usable, none wasted) | /31 is efficient (RFC 3021) if devices support it; /30 is the traditional fallback. |
| Sizing a subnet | Round up to a class (/24) | Fit the prefix to demand (CIDR) | CIDR — size to the host count to avoid wasting addresses. |
| Splitting a network | Many small subnets | One large subnet | Small subnets limit broadcast domains and isolate segments; a large one is simpler but noisier. |

# Worked Example

Given `172.16.20.0/22`, find its size and range.

```text
   /22 -> 22 network bits, 10 host bits.
   Total addresses:  2^10 = 1024
   Usable hosts:     1024 - 2 = 1022

   The /22 fixes the first 22 bits. The third octet's block size is:
     256 - 252 = 4  (mask third octet = 252)  -> networks step by 4 in the 3rd octet
   So this block covers 172.16.20.0 through 172.16.23.255.

   Network address:    172.16.20.0
   Broadcast address:  172.16.23.255
   Usable range:       172.16.20.1  –  172.16.23.254
```

Now check: are `172.16.20.5` and `172.16.23.200` on the same subnet? Both fall in
`172.16.20.0/22`, so **yes** — they can talk directly without a router.

# Real World Analogy

A subnet mask is like deciding how much of a **phone number** is the **area code** versus the **local
number**. The area code (network part) says "which region," and the local number (host part) says
"which specific phone." A `/24` is like a fixed 3-digit area code with room for many local numbers; a
`/30` is a tiny area code with room for just a couple of phones. The **network address** is like the
region's name and the **broadcast address** like paging everyone in that region at once — neither is a
normal phone you'd dial directly.

# Examples

## Example 1 — Basic: reading a /24

`192.168.10.0/24` has 8 host bits: 256 addresses, **254 usable** (`.1`–`.254`), network `.0`, broadcast
`.255`. This is the most common home/office subnet size.

**Why this works:** 8 host bits give 2^8 = 256 addresses; subtracting the network and broadcast leaves
254 for hosts.

## Example 2 — Real-world: sizing a subnet for a team

A team of 50 devices needs a subnet. A `/26` gives 62 usable hosts — enough, with a little headroom —
while a `/24` (254 usable) wastes most of its space. CIDR lets you pick `/26` instead of rounding up to
a full `/24`.

**Why this works:** matching the prefix to the host count conserves the limited IPv4 address space.

## Example 3 — Pitfall: forgetting the −2

Someone provisions a `/29` (8 addresses) expecting 8 usable hosts, but only **6** are usable (network +
broadcast are reserved). Their DHCP pool overflows and one device can't get an address.

**Why this bites:** the network and broadcast addresses are never assignable (outside /31 and /32), so
always subtract 2 when counting hosts.

# Common Mistakes

- **Forgetting to subtract 2.** Usable hosts = `2^(host bits) − 2`, not `2^(host bits)` (except /31,
  /32).
- **Thinking a bigger prefix means a bigger network.** A larger `/N` means **more** network bits and
  **fewer** hosts — a smaller network.
- **Assigning the network or broadcast address to a host.** They're reserved.
- **Teaching classes as current.** Classful addressing is obsolete; use **CIDR**.

# Best Practices

- Memorize the block-size trick: mask octet value `256 − mask` gives the subnet's step size in that
  octet.
- Use **/31** for point-to-point links (RFC 3021) to avoid wasting two addresses per link.
- Size subnets with **CIDR** to fit real host counts, leaving modest headroom.
- Double-check whether two addresses share a subnet by comparing their **network addresses** under the
  mask.

# Summary

- A **subnet mask** splits an address into a **network** part (`1` bits) and a **host** part (`0` bits).
- **CIDR** writes the mask as a prefix length (`/24`); a larger prefix = fewer hosts = smaller network.
- The **network address** (host bits 0) and **broadcast address** (host bits 1) are reserved.
- **Usable hosts = 2^(host bits) − 2**, except **/31** (2 usable, point-to-point) and **/32** (one host).
- **CIDR replaced classful** addressing so networks can be sized to fit.

# Flash Cards

Q: What does a subnet mask do?
A: It separates an IP address into a network portion (the mask's 1 bits) and a host portion (the mask's 0 bits).

Q: How do you calculate the number of usable hosts in an IPv4 subnet?
A: 2^(number of host bits) − 2, subtracting the network address and the broadcast address (exceptions: /31 and /32).

Q: In a /24, what are the network address, broadcast address, and usable range for 192.168.1.0/24?
A: Network 192.168.1.0, broadcast 192.168.1.255, usable 192.168.1.1–192.168.1.254 (254 hosts).

Q: Does a larger CIDR prefix (like /30 vs /24) mean a bigger or smaller network?
A: Smaller — a larger prefix has more network bits and fewer host bits, so fewer addresses.

Q: What is special about a /31 subnet?
A: It has just 2 addresses and both are usable (no network/broadcast reserved), designed for point-to-point links per RFC 3021.

Q: Why was classful (Class A/B/C) addressing replaced by CIDR?
A: Fixed class sizes wasted huge address ranges; CIDR allows arbitrary prefix lengths so networks can be sized to fit and routes can be aggregated.

# Exercises

### Easy
For `10.0.0.0/24`: give the network address, the broadcast address, the usable host range, and the
number of usable hosts.

### Medium
Convert these prefixes to dotted-decimal masks and give the usable host count: `/26`, `/28`, `/30`,
`/22`. Which would you choose for a link between exactly two routers, and why?

### Challenging
You're given `172.16.0.0/16` and must carve out subnets for four departments needing 100, 50, 25, and 2
hosts. Pick an appropriate prefix for each (smallest that fits), and write the network address and
usable range you'd assign, without overlapping.

# Further Reading

- IETF — *CIDR: The Internet Address Assignment and Aggregation Plan* (RFC 4632): <https://www.rfc-editor.org/rfc/rfc4632>
- IETF — *Using 31-Bit Prefixes on IPv4 Point-to-Point Links* (RFC 3021): <https://www.rfc-editor.org/rfc/rfc3021>
- Cloudflare — *What is a subnet?*: <https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/>
- IETF — *Classless IN-ADDR.ARPA delegation* (RFC 2317): <https://www.rfc-editor.org/rfc/rfc2317>
