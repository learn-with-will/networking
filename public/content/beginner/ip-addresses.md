---
id: lesson-03
slug: ip-addresses
title: "IP Addresses"
level: beginner
order: 3
duration: 20
tags:
  - ip
  - ipv4
  - ipv6
  - addressing
  - rfc1918
summary: "How hosts are addressed on the internet — IPv4's 32-bit dotted-decimal format, IPv6's 128-bit hex format, and the difference between public, private, and special-purpose addresses."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what an **IP address** identifies and why it's needed.
- Read an **IPv4** address (dotted decimal, 32 bits) and an **IPv6** address (hex, 128 bits).
- Compress and expand an IPv6 address using the `::` rule.
- Tell apart **public** and **private** addresses, and list the **RFC 1918** private ranges.
- Recognize special addresses: **loopback**, **link-local**, and IPv6 equivalents.

# Why It Matters

Every packet that crosses a network carries a **source** and **destination IP address** — they are how
the network knows where a packet is going. When you read `ping`, `dig`, or a firewall rule, you are
staring at IP addresses. Knowing how to read them, and whether an address is public, private, or
special, is the difference between confidently reasoning about traffic and guessing.

# Concept Explanation

### What an IP address is

An **IP address** (Internet Protocol address) is a numeric label assigned to each host's network
connection. It works at the **Internet layer** (layer 3) and has two jobs baked in: identify the host,
and — via its network portion — say which network the host is on so routers can reach it. There are two
versions in use: **IPv4** and **IPv6**.

### IPv4: 32 bits in dotted decimal

An **IPv4** address is **32 bits**, written as four 8-bit numbers (**octets**) separated by dots, each
from 0 to 255:

```text
   192 . 168 . 1 . 20
    |     |    |   |
    +-----+----+---+--- four octets, 8 bits each = 32 bits total

  Binary: 11000000.10101000.00000001.00010100
```

Because 32 bits give about **4.3 billion** addresses, and the internet has far more devices than that,
IPv4 addresses ran short — which is why techniques like **NAT** (a later lesson) and the newer **IPv6**
exist.

### IPv6: 128 bits in hexadecimal

An **IPv6** address is **128 bits**, written as eight groups of four hex digits separated by colons:

```text
  2001:0db8:0000:0000:0000:ff00:0042:8329
```

That's a lot to type, so two rules shorten it:

- **Drop leading zeros** in each group: `0db8` -> `db8`, `0042` -> `42`.
- **Replace one run of all-zero groups with `::`** — but only **once** per address (otherwise it would
  be ambiguous).

```text
  Full:        2001:0db8:0000:0000:0000:ff00:0042:8329
  Compressed:  2001:db8::ff00:42:8329
```

128 bits is a staggering number of addresses (~340 undecillion), so IPv6 removes the scarcity that
forced IPv4 workarounds. Note IPv6 has **no broadcast address** — it uses **multicast** and
**anycast** instead.

### Public vs private addresses

- A **public** IP address is globally unique and routable on the internet. Your home router has one,
  handed out by your internet provider.
- A **private** IP address is used *inside* a local network and is **not routable on the public
  internet**. Many networks reuse the same private ranges because they never collide out on the
  internet. **RFC 1918** reserves these IPv4 private ranges:

```text
  10.0.0.0/8         10.0.0.0    – 10.255.255.255
  172.16.0.0/12      172.16.0.0  – 172.31.255.255      (note: .16 through .31, not .168)
  192.168.0.0/16     192.168.0.0 – 192.168.255.255
```

Your phone on home Wi-Fi almost certainly has a `192.168.x.x` or `10.x.x.x` address. Getting from a
private address to the public internet is the job of **NAT**, covered later.

### Special-purpose addresses

A few ranges are reserved for specific jobs and are worth recognizing:

- **Loopback** — `127.0.0.0/8` (usually `127.0.0.1`, "localhost"); traffic that never leaves the host.
  IPv6 loopback is `::1`.
- **Link-local** — `169.254.0.0/16` (IPv4, self-assigned when no DHCP answers); IPv6 link-local is
  `fe80::/10`. Valid only on the local link, never routed.
- **Documentation** — `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` (IPv4) and `2001:db8::/32`
  (IPv6) are reserved for examples, which is why they appear throughout this course.

# Key Terminology

- **IP address** — a numeric label identifying a host's connection at the Internet layer.
- **IPv4** — the 32-bit version, written as four dotted decimal octets (0–255 each).
- **IPv6** — the 128-bit version, written as eight colon-separated hex groups.
- **Octet** — one 8-bit part of an IPv4 address (0–255).
- **Public address** — globally unique, routable on the internet.
- **Private address** — used inside a local network; not internet-routable (RFC 1918).
- **Loopback** — `127.0.0.1` / `::1`; refers to the host itself.
- **Link-local** — an address valid only on the local link (`169.254.x.x` / `fe80::/10`).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Address version | IPv4 | IPv6 | IPv4 is universal but scarce (needs NAT); IPv6 is abundant and future-proof. Most networks run both. |
| Inside a LAN | Public addresses | Private (RFC 1918) | Private ranges — they're free, reusable, and shielded behind NAT. |
| Writing an IPv6 example | Full form | Compressed with `::` | Compressed for readability; expand it when you must count the groups. |

# Worked Example

Compress this IPv6 address step by step:

```text
  Start:            2001:0db8:0000:0000:0000:0000:1428:57ab
  Drop leading 0s:  2001:db8:0:0:0:0:1428:57ab
  Collapse zeros:   2001:db8::1428:57ab
```

The four zero groups became a single `::`. Now classify a few addresses:

```text
  192.168.0.10   -> private (RFC 1918, 192.168.0.0/16)
  8.8.8.8        -> public (a well-known public DNS resolver)
  127.0.0.1      -> loopback (this host)
  169.254.13.5   -> link-local (no DHCP answered)
  ::1            -> IPv6 loopback
```

# Real World Analogy

An IP address is like a **mailing address** for a building. A **public** IP is a full street address
the whole world can send mail to. A **private** IP is like an apartment number that only means
something *inside* the building — every apartment block can reuse "Apartment 2A," and mail from outside
can't use it directly; the front desk (**NAT**) has to translate. **Loopback** is a note you write to
yourself and never mail. **Link-local** is a temporary label you scribble when the building has no
official address yet.

# Examples

## Example 1 — Basic: reading your own address

On your laptop, a command like `ip addr` (Linux) or `ipconfig` (Windows) shows something like
`192.168.1.42`. The `192.168` prefix tells you instantly this is a **private** address on your local
network — not the address the internet sees for you.

```bash
ip addr show        # Linux: look for "inet 192.168.x.x"
```

**Why this works:** the `192.168.0.0/16` range is reserved by RFC 1918 for private use, so any
`192.168.x.x` is by definition local.

## Example 2 — Real-world: public vs what the site sees

You check your address two ways: your operating system reports `10.0.0.5` (private), but a "what is my
IP" service reports `203.0.113.24` (public). Both are true — the first is your address on the LAN, the
second is your router's public address that NAT presents to the internet.

**Why this works:** your device has a private address; NAT rewrites outgoing packets to use the
router's single public address.

## Example 3 — Pitfall: mis-reading the 172.16.0.0/12 range

Someone assumes the private Class-B-ish range is "172.16 through 172.168." It is actually **172.16.0.0
to 172.31.255.255** (a /12, covering the second octet 16–31). `172.40.5.1` is **public**, not private.

**Why this bites:** firewall and routing rules that mis-scope this range either leak traffic or block
legitimate hosts.

# Common Mistakes

- **Getting the 172 private range wrong.** It's `172.16.0.0/12` = **172.16–172.31**, not up to 172.168.
- **Using `::` twice in one IPv6 address.** The zero-collapse may appear **only once**.
- **Thinking your device's address is what the internet sees.** Behind NAT, the public address is your
  router's, not your host's.
- **Assuming IPv6 has broadcast.** It does not — it uses multicast/anycast.

# Best Practices

- Memorize the three **RFC 1918** ranges; you'll recognize local vs internet traffic instantly.
- When giving examples, use the **documentation ranges** (`192.0.2.0/24`, `2001:db8::/32`) instead of
  someone's real IP.
- Expect and support **both IPv4 and IPv6** — most networks run them side by side (dual-stack).
- Use `::1` / `127.0.0.1` for local testing; it never touches the network.

# Summary

- An **IP address** identifies a host's connection at the Internet layer and steers each packet.
- **IPv4** is **32 bits** (dotted decimal, 0–255 per octet); **IPv6** is **128 bits** (hex groups),
  compressible with a single `::`.
- **Private** addresses (RFC 1918: `10/8`, `172.16/12`, `192.168/16`) are local and not
  internet-routable; **public** addresses are globally unique.
- **Loopback** (`127.0.0.1` / `::1`) means "this host"; **link-local** (`169.254/16` / `fe80::/10`) is
  valid only on the local link.
- IPv6 has **no broadcast** — it uses multicast and anycast.

# Flash Cards

Q: How many bits are in an IPv4 address, and how many in an IPv6 address?
A: IPv4 is 32 bits (four octets); IPv6 is 128 bits (eight hex groups).

Q: What are the three RFC 1918 private IPv4 ranges?
A: 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31), and 192.168.0.0/16.

Q: What is the rule for using "::" in an IPv6 address?
A: It replaces one run of all-zero 16-bit groups and may be used only once per address.

Q: What is the loopback address in IPv4 and IPv6?
A: 127.0.0.1 (within 127.0.0.0/8) in IPv4 and ::1 in IPv6 — traffic that never leaves the host.

Q: Does IPv6 have a broadcast address?
A: No. IPv6 has no broadcast; it uses multicast and anycast instead.

Q: Why can many different networks all use 192.168.0.0/16 at the same time?
A: Private addresses aren't routable on the public internet, so they never collide out there; NAT translates them to a public address when needed.

# Exercises

### Easy
Find your device's IP address (`ip addr`, `ifconfig`, or `ipconfig`). Is it public or private? Which
RFC 1918 range (if any) does it fall in?

### Medium
Compress these IPv6 addresses: (a) `2001:0db8:0000:0000:0000:0000:0000:0001`, (b)
`fe80:0000:0000:0000:0202:b3ff:fe1e:8329`. Then expand `::ffff:0:0` back to full form.

### Challenging
Classify each as public, private, loopback, or link-local, and justify:
`10.10.10.10`, `172.32.0.1`, `192.168.100.7`, `127.0.0.5`, `169.254.200.9`, `203.0.113.7`.

# Further Reading

- IETF — *Internet Protocol* (RFC 791, IPv4): <https://www.rfc-editor.org/rfc/rfc791>
- IETF — *IPv6 Addressing Architecture* (RFC 4291): <https://www.rfc-editor.org/rfc/rfc4291>
- IETF — *Address Allocation for Private Internets* (RFC 1918): <https://www.rfc-editor.org/rfc/rfc1918>
- Cloudflare — *What is an IP address?*: <https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/>
