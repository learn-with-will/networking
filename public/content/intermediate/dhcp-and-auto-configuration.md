---
id: lesson-11
slug: dhcp-and-auto-configuration
title: "DHCP and Automatic Configuration"
level: intermediate
order: 11
duration: 18
tags:
  - dhcp
  - dora
  - lease
  - gateway
  - auto-config
summary: "How a device gets an IP address the moment it joins a network — the DHCP DORA exchange, what a lease includes, how renewal works, and what happens when no DHCP server answers."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what **DHCP** does and why it beats manual configuration.
- Walk through the **DORA** exchange (Discover, Offer, Request, Acknowledge).
- List what a DHCP **lease** provides beyond just an IP address.
- Describe how a lease is **renewed** and what a lease **time** means.
- Recognize the **link-local (APIPA)** fallback when no DHCP server responds.

# Why It Matters

When you connect to Wi-Fi, your device instantly gets an IP address, a gateway, and DNS servers —
without you typing anything. That "just works" magic is **DHCP**. Knowing how it works explains a whole
class of problems: a device stuck with a `169.254.x.x` address, an exhausted address pool, or a wrong
gateway. It's also how nearly every network you'll manage hands out addresses.

# Concept Explanation

### The problem DHCP solves

Every host needs at least four things to work on a network: an **IP address**, a **subnet mask**, a
**default gateway**, and **DNS servers**. Configuring these by hand on every device is tedious and
error-prone (typos, duplicate addresses). **DHCP** (Dynamic Host Configuration Protocol) automates it:
a **DHCP server** hands out this configuration on demand when a device joins.

### DORA: the four-step exchange

A new client and the DHCP server complete a four-message handshake, remembered as **DORA**:

```text
   Client                                   DHCP Server
     |  1. DISCOVER  (broadcast) --------->    |   "Any DHCP servers out there?"
     |  <---------------- 2. OFFER ---------   |   "You can have 192.168.1.42"
     |  3. REQUEST   (broadcast) --------->    |   "I'd like that one, please"
     |  <------------- 4. ACK --------------   |   "It's yours; here's the full config + lease"
```

- **Discover** — the client broadcasts (it has no address yet), asking for a server.
- **Offer** — one or more servers offer an address and settings.
- **Request** — the client picks one offer and broadcasts its acceptance (so other servers know it
  declined theirs).
- **Acknowledge** — the chosen server confirms and finalizes the lease.

DHCP runs over **UDP**, with the **server on port 67** and the **client on port 68**. Because the
client has no IP at first, early messages are **broadcast**.

### What a lease includes

The ACK delivers more than an address — a full starter kit:

```text
   IP address:        192.168.1.42
   Subnet mask:       255.255.255.0        (/24)
   Default gateway:   192.168.1.1
   DNS servers:       192.168.1.1, 1.1.1.1
   Lease time:        86400 seconds (1 day)
   (optionally) NTP servers, domain name, and more via DHCP "options"
```

### Leases and renewal

An address is a **lease**, not a permanent gift — it's valid for a set **lease time**. The client tries
to **renew** before it expires (typically at ~50% of the lease, then ~87.5%), usually keeping the same
address. If the client leaves and the lease expires, the address returns to the pool for reuse. This
lets a network with a limited address pool serve far more devices over time than it has addresses at
any instant.

```bash
# Linux (varies by distro/manager): release and re-acquire a lease
sudo dhclient -r        # release current lease
sudo dhclient           # request a new one
```

### When no server answers: link-local (APIPA)

If a client sends Discover and **no DHCP server replies**, it can't route anywhere. Rather than have no
address at all, the OS may self-assign a **link-local** address from **169.254.0.0/16** (called
**APIPA** on Windows). Such an address works *only* on the local link — no gateway, no internet. So
**seeing `169.254.x.x` is a strong sign that DHCP failed.**

# Key Terminology

- **DHCP** — the protocol that automatically assigns IP configuration to hosts.
- **DORA** — Discover, Offer, Request, Acknowledge: the four-step lease exchange.
- **Lease** — a time-limited assignment of an address and settings.
- **Lease time** — how long the assignment is valid before it must be renewed.
- **DHCP options** — extra settings delivered alongside the address (gateway, DNS, NTP, domain…).
- **Link-local / APIPA** — a `169.254.x.x` self-assigned address used when DHCP fails.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Address assignment | Static (manual) | DHCP (dynamic) | DHCP for most clients (easy, no conflicts); static for servers/printers that need a fixed address. |
| Fixed address via… | Static on the device | DHCP reservation (by MAC) | Reservations keep central control while still giving a device the same address every time. |
| Lease time | Short | Long | Short for busy/guest networks (recycle addresses fast); long for stable offices (less churn). |

# Worked Example

A laptop joins a café's Wi-Fi:

```text
1. DISCOVER: laptop broadcasts "I need an address" (from 0.0.0.0 to 255.255.255.255).
2. OFFER:    the café router offers 10.0.0.57, mask /24, gateway 10.0.0.1, DNS 10.0.0.1.
3. REQUEST:  laptop broadcasts "I accept 10.0.0.57".
4. ACK:      router confirms; lease time 3600s (1 hour).
5. The laptop configures itself and can now reach the internet.
6. ~30 min in, the laptop quietly renews the lease to keep 10.0.0.57.
```

No human typed an address, and the short 1-hour lease means addresses recycle quickly as customers come
and go.

# Real World Analogy

DHCP is like checking into a **hotel**. You arrive with no room (**no IP**). At the front desk you ask
for a room (**Discover**); the clerk offers room 412 (**Offer**); you say "I'll take it" (**Request**);
they hand you a key and a welcome sheet with the Wi-Fi password, checkout time, and breakfast hours
(**Acknowledge** with the full config and **lease time**). Your key works until checkout (**lease
expiry**), and you can extend your stay (**renew**). If the hotel is full and no clerk helps you
(**no DHCP server**), you're left standing in the lobby with no room number (**169.254 link-local**).

# Examples

## Example 1 — Basic: reading your lease

After connecting, your settings reflect the lease:

```bash
ip addr        # inet 10.0.0.57/24  (leased address + mask)
ip route       # default via 10.0.0.1  (gateway from DHCP)
```

Both the address and gateway came from the DHCP ACK — you configured nothing manually.

**Why this works:** DHCP delivered the address, mask, and gateway together, and the OS applied them.

## Example 2 — Real-world: DHCP reservation for a printer

An office printer needs a stable address so print queues don't break. Instead of a static config on the
printer, the admin adds a **DHCP reservation** tying the printer's MAC to `10.0.0.20`. The printer still
uses DHCP, but always gets the same address.

**Why this works:** the reservation keeps assignment centralized (one place to manage) while
guaranteeing a fixed address.

## Example 3 — Pitfall: the 169.254 mystery address

A user can't reach anything and finds their address is `169.254.10.5`. That's a **link-local** fallback
— DHCP never answered (server down, cable/Wi-Fi issue, or exhausted pool). The fix isn't the laptop;
it's restoring DHCP.

**Why this bites:** a `169.254.x.x` address looks valid but has no gateway and can't route, so
connectivity silently fails.

# Common Mistakes

- **Confusing the DORA order.** It's **Discover, Offer, Request, Acknowledge** — Request comes *after*
  Offer.
- **Thinking a lease is permanent.** It expires and must be renewed; unused addresses return to the
  pool.
- **Missing the meaning of 169.254.x.x.** It's a **DHCP-failed** link-local address, not a normal one.
- **Swapping the ports.** DHCP uses **UDP server 67 / client 68**.

# Best Practices

- Use **DHCP** for general clients; use **reservations** (by MAC) for devices that need a stable
  address.
- If a device shows **`169.254.x.x`**, investigate **DHCP** (server, link, or pool) — not the device's
  IP stack.
- Size the DHCP **pool** and **lease time** to the network: short leases for transient/guest networks.
- Remember DHCP also delivers the **gateway and DNS** — a wrong DHCP config breaks routing and name
  resolution too.

# Summary

- **DHCP** automatically hands new devices their IP configuration, avoiding manual setup and conflicts.
- The exchange is **DORA**: Discover → Offer → Request → Acknowledge, over **UDP (server 67 / client
  68)**.
- A **lease** includes the **IP, subnet mask, default gateway, DNS servers, and a lease time** (plus
  optional DHCP options).
- Clients **renew** leases before expiry, usually keeping the same address; expired addresses recycle.
- A **`169.254.x.x` (APIPA/link-local)** address means **DHCP failed** — no gateway, no internet.

# Flash Cards

Q: What do the four DHCP steps (DORA) stand for?
A: Discover, Offer, Request, Acknowledge — the client discovers servers, one offers an address, the client requests it, and the server acknowledges.

Q: Which ports does DHCP use?
A: UDP, with the server on port 67 and the client on port 68.

Q: What does a DHCP lease provide besides an IP address?
A: A subnet mask, default gateway, DNS servers, a lease time, and optionally other options like NTP servers or a domain name.

Q: What does it mean if a device has a 169.254.x.x address?
A: It self-assigned a link-local (APIPA) address because no DHCP server responded — so it has no gateway and cannot reach the internet.

Q: Is a DHCP address permanent?
A: No — it's a time-limited lease that the client renews before expiry; if it isn't renewed, the address returns to the pool.

Q: How can you give a specific device the same address every time while still using DHCP?
A: Create a DHCP reservation that maps the device's MAC address to a fixed IP.

# Exercises

### Easy
On your machine, view your current address and gateway (`ip addr`, `ip route`). Which of these values
did DHCP most likely provide?

### Medium
Write out the DORA exchange for a phone joining home Wi-Fi, labeling which messages are broadcast and
why, and which UDP ports the server and client use.

### Challenging
A new laptop on the office network ends up with `169.254.44.9` and no internet, while other devices work
fine. List three possible causes at the DHCP layer and how you'd confirm each, then explain why the
laptop's own IP settings are not the root cause.

# Further Reading

- IETF — *Dynamic Host Configuration Protocol* (RFC 2131): <https://www.rfc-editor.org/rfc/rfc2131>
- IETF — *DHCP Options and BOOTP Vendor Extensions* (RFC 2132): <https://www.rfc-editor.org/rfc/rfc2132>
- IETF — *Dynamic Configuration of IPv4 Link-Local Addresses* (RFC 3927): <https://www.rfc-editor.org/rfc/rfc3927>
- Cloudflare — *What is DHCP?*: <https://www.cloudflare.com/learning/network-layer/what-is-dhcp/>
