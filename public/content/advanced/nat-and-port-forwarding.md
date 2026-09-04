---
id: lesson-18
slug: nat-and-port-forwarding
title: "NAT and Port Forwarding"
level: advanced
order: 18
duration: 20
tags:
  - nat
  - pat
  - port-forwarding
  - private-address
  - ipv4
summary: "How many private devices share one public IPv4 address — Network Address Translation rewrites addresses and ports, port forwarding lets inbound connections in, and why NAT is not a security feature."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why **NAT** exists and what problem it solves.
- Describe how NAT (specifically **PAT/overload**) rewrites addresses and ports.
- Read a NAT **translation table** and trace a connection through it.
- Set up **port forwarding** to allow inbound connections.
- Explain why **NAT is not a firewall** and how **IPv6** reduces the need for it.

# Why It Matters

Almost every home and office network uses **NAT** — it's why your laptop's `192.168.x.x` address can
reach the internet even though that address isn't routable. NAT quietly shapes what's possible:
outbound connections just work, but *inbound* ones need **port forwarding**, and peer-to-peer apps must
work around it. Understanding NAT explains a huge class of "why can't I connect to my home server?"
problems.

# Concept Explanation

### Why NAT exists

IPv4 has only ~4.3 billion addresses — far fewer than the world's devices. **NAT** (Network Address
Translation) lets an entire private network share **one public IP address**. Your devices use private
**RFC 1918** addresses internally; the router translates them to its single public address when talking
to the internet.

### PAT: many private hosts, one public IP

The common form is **PAT** (Port Address Translation), also called **NAT overload**. The router rewrites
the **source IP** *and* **source port** of outgoing packets, and remembers the mapping so replies can be
translated back:

```text
   Inside (private)                 Router (NAT)                 Internet
   192.168.1.10:52344  --------->   rewrites src to             --------->  198.51.100.9:443
                                    203.0.113.5:60001

   Reply 198.51.100.9:443 -> 203.0.113.5:60001  --> router looks up mapping -->
   192.168.1.10:52344
```

The router keeps a **translation table** so it can reverse the rewrite on the way back:

```text
   Protocol  Inside              Translated (public)     Remote
   TCP       192.168.1.10:52344  203.0.113.5:60001       198.51.100.9:443
   TCP       192.168.1.11:49555  203.0.113.5:60002       93.184.216.34:443
```

Because each connection gets a **unique public source port**, many internal hosts share one public IP
without their replies getting confused — the port is what disambiguates them.

### The asymmetry: outbound easy, inbound hard

NAT is built around **inside hosts initiating** connections outward — that's what creates the mapping.
An **unsolicited inbound** packet from the internet has no matching entry in the table, so the router
doesn't know which internal host to send it to and **drops it**. This is why:

- Browsing, apps, and updates (all outbound) "just work."
- Running a server others can reach from the internet does **not** work by default.

### Port forwarding: letting inbound in

**Port forwarding** creates a *static* NAT rule: "any inbound connection to my public IP on port X goes
to internal host Y on port Z."

```text
   Rule: TCP  public 203.0.113.5:8080  ->  internal 192.168.1.50:80

   Internet -> 203.0.113.5:8080  --NAT-->  192.168.1.50:80  (your web server)
```

Now external clients can reach an internal service. (Related mechanisms: **UPnP**/**NAT-PMP** let apps
request forwards automatically, and **NAT traversal**/**hole punching** helps peer-to-peer apps
coordinate through NATs.)

### NAT is not a firewall

NAT *incidentally* hides internal addresses and drops unsolicited inbound traffic — which **looks** like
protection. But NAT is an **addressing** mechanism, not a **security** one: it doesn't inspect traffic,
enforce policy, or protect against threats inside allowed flows. Relying on NAT "for security" is a
mistake; use an actual **firewall** (next lesson) for that. NAT also **breaks end-to-end connectivity**
(the internet's original design), complicating protocols that embed addresses or need direct reachability.

### IPv6 changes the picture

**IPv6**'s vast address space means every device can have a **globally unique** address — so NAT is
largely **unnecessary**. IPv6 restores end-to-end addressing; security is handled by **firewalls**, not
by hiding behind a shared address. (Some IPv6 deployments still filter inbound by default, but that's a
firewall policy, not NAT.)

# Key Terminology

- **NAT** — translating private addresses to a public one (and back).
- **PAT / NAT overload** — NAT that also rewrites ports so many hosts share one public IP.
- **Translation table** — the router's record mapping inside connections to translated public
  address/port.
- **Port forwarding** — a static rule directing inbound traffic on a public port to an internal host.
- **NAT traversal** — techniques (STUN/TURN/hole punching) that let peers connect through NATs.
- **End-to-end connectivity** — the original design where any host can address any other directly.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Expose an internal service | Port forwarding | A cloud/public host or tunnel | Port forwarding for simple home setups; a hosted endpoint/tunnel avoids exposing your home IP and router. |
| Security model | Rely on NAT | Use a real firewall | Always a firewall — NAT is not security; it just hides addresses incidentally. |
| Address strategy | IPv4 + NAT | IPv6 (end-to-end) | IPv4+NAT where IPv6 isn't available; prefer IPv6 for direct addressing and fewer workarounds. |

# Worked Example

Two laptops behind one home router both browse the web:

```text
   Laptop A 192.168.1.10:52344 -> example.com:443
   Laptop B 192.168.1.11:49555 -> example.com:443

   NAT rewrites both to the router's public IP 203.0.113.5, but with
   DIFFERENT public source ports:
      A -> 203.0.113.5:60001
      B -> 203.0.113.5:60002

   Replies come back to :60001 and :60002; the router uses the port to
   send each reply to the correct laptop.
```

Both share one public address, yet their connections never collide because the **translated source
port** uniquely identifies each.

# Real World Analogy

NAT is like a company with **one public phone number** and a **receptionist**. Employees (private hosts)
can call out; the receptionist places the call using the company's public number and notes which
extension made it, so the return call is routed back correctly (**translation table**). An outsider
calling the public number, though, reaches only the receptionist — they can't reach a specific employee
unless there's a standing rule "calls for sales go to extension 42" (**port forwarding**). The
receptionist screening cold calls *looks* like security, but they're really just a **switchboard**, not
a **guard** (NAT is not a firewall).

# Examples

## Example 1 — Basic: why your public IP differs from your device IP

Your laptop reports `192.168.1.10`, but a "what's my IP" site shows `203.0.113.5`. The first is your
private address; the second is your router's public address that NAT stamps onto your outbound packets.

**Why this works:** NAT rewrites the private source address to the router's public one, so the internet
only ever sees the public IP.

## Example 2 — Real-world: hosting a game server at home

You run a game server on `192.168.1.50:25565`. Friends can't connect until you add a port-forward rule
mapping `203.0.113.5:25565 → 192.168.1.50:25565`. Now inbound connections to your public IP reach the
server.

**Why this works:** the static port-forward rule gives unsolicited inbound traffic a defined internal
destination it otherwise lacks.

## Example 3 — Pitfall: treating NAT as a firewall

An admin skips a firewall because "we're behind NAT." But a compromised internal host still makes
outbound connections freely (NAT allows all outbound), malware can use UPnP to open forwards, and NAT
inspects nothing. The network is exposed despite NAT.

**Why this bites:** NAT blocks only *unsolicited inbound* as a side effect; it enforces no policy, so
real threats pass right through.

# Common Mistakes

- **Believing NAT is a security feature.** It's addressing; use a real **firewall** for security.
- **Expecting inbound connections to work by default.** They don't — you need **port forwarding**.
- **Confusing private and public IP.** Your device's private IP isn't what the internet sees; NAT
  translates it.
- **Assuming IPv6 needs NAT.** It generally doesn't — it has enough addresses for end-to-end
  connectivity.

# Best Practices

- Use **port forwarding** deliberately and minimally; every forward is an exposed door — pair it with a
  firewall.
- Don't rely on NAT for protection; run an actual **firewall** with an explicit policy.
- Prefer **IPv6** where available to regain end-to-end addressing and avoid NAT workarounds.
- For peer-to-peer or remote access, understand **NAT traversal** (STUN/TURN) or use a tunnel/relay.

# Summary

- **NAT** lets many private hosts share one public IPv4 address, working around address scarcity.
- **PAT/overload** rewrites the **source IP and port** and tracks mappings in a **translation table** so
  replies return correctly.
- NAT favors **outbound** connections; **inbound** needs **port forwarding** (a static mapping).
- **NAT is not a firewall** — it hides addresses incidentally but enforces no security policy.
- **IPv6** largely removes the need for NAT by giving every device a globally unique address.

# Flash Cards

Q: Why does NAT exist?
A: IPv4 has too few addresses for all devices, so NAT lets an entire private network share a single public IP address.

Q: What does PAT (NAT overload) rewrite, and why the port?
A: It rewrites the source IP and source port of outbound packets; the unique translated port lets many internal hosts share one public IP without confusing replies.

Q: Why don't unsolicited inbound connections work through NAT by default?
A: NAT only has translation entries for connections started from inside; an unsolicited inbound packet has no matching entry, so the router doesn't know which host to send it to and drops it.

Q: What is port forwarding?
A: A static NAT rule that maps inbound traffic on a public IP/port to a specific internal host and port, letting external clients reach an internal service.

Q: Is NAT a firewall?
A: No — NAT is an addressing mechanism. It incidentally hides internal addresses and drops unsolicited inbound traffic, but it inspects nothing and enforces no security policy.

Q: Why does IPv6 largely remove the need for NAT?
A: IPv6 has enough addresses to give every device a globally unique, routable address, restoring end-to-end connectivity without translation.

# Exercises

### Easy
Compare your device's local IP (`ip addr`) with your public IP (from a "what's my IP" service). Explain
why they differ and which one NAT presents to the internet.

### Medium
Draw the NAT translation table entries for two internal hosts both connecting to the same website on
port 443. Show the inside address:port, the translated public address:port, and how replies find their
way back.

### Challenging
A colleague wants to "secure" the network by relying only on NAT. Explain three concrete ways this fails
to provide security, and describe what NAT actually does vs what a firewall does. Then explain how the
situation changes under IPv6.

# Further Reading

- IETF — *Traditional IP Network Address Translator (Traditional NAT)* (RFC 3022): <https://www.rfc-editor.org/rfc/rfc3022>
- IETF — *IP Network Address Translator (NAT) Terminology* (RFC 2663): <https://www.rfc-editor.org/rfc/rfc2663>
- Cloudflare — *What is NAT?*: <https://www.cloudflare.com/learning/network-layer/what-is-nat/>
- IETF — *Session Traversal Utilities for NAT (STUN)* (RFC 8489): <https://www.rfc-editor.org/rfc/rfc8489>
