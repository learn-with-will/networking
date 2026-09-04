---
id: lesson-19
slug: firewalls-and-network-security
title: "Firewalls and Network Security Basics"
level: advanced
order: 19
duration: 20
tags:
  - firewall
  - stateful
  - packet-filtering
  - default-deny
  - security
summary: "How networks control what traffic is allowed — packet-filtering vs stateful firewalls, default-deny policy, where firewalls sit, and how they fit into defense in depth."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **firewall** does and the rules it enforces.
- Contrast **stateless packet filtering** with **stateful** firewalls.
- Apply a **default-deny** policy and reason about rule order.
- Distinguish **host-based** from **network** firewalls.
- Place firewalls within **defense in depth** and reduce **attack surface**.

# Why It Matters

A firewall is the most common network security control you'll configure or debug. Knowing how rules are
evaluated, why **stateful** tracking matters, and why **default-deny** is the safe posture prevents both
outages (blocking legitimate traffic) and breaches (leaving services exposed). It also corrects the
frequent misconception — from the last lesson — that NAT alone keeps you safe.

# Concept Explanation

### What a firewall does

A **firewall** enforces a policy about which traffic may pass between networks or into/out of a host. It
inspects packets and **allows** or **denies** them based on rules, typically matching on:

```text
   - direction        (inbound / outbound)
   - protocol         (TCP / UDP / ICMP ...)
   - source IP/port
   - destination IP/port
```

For example: "allow inbound TCP to port 443; deny everything else inbound." The firewall is where you
decide what your network's **attack surface** is.

### Stateless packet filtering

A **stateless** (packet-filtering) firewall judges each packet **in isolation**, using only its header
fields against the rule list. It's fast and simple but has no memory: to allow a TCP reply to come back,
you'd have to write explicit rules for both directions, which is clumsy and error-prone.

### Stateful firewalls

A **stateful** firewall keeps a **connection-tracking table**. When an internal host opens a connection
outbound, the firewall records it and **automatically allows the matching replies** back — without a
separate inbound rule. It understands that a packet is "part of an established connection" vs a brand-new
unsolicited one.

```text
   Stateless:  every packet judged alone -> you must allow both directions manually.
   Stateful:   remembers connections -> "allow established/related" handles replies.
```

Most modern firewalls are stateful; it's both safer and easier to manage.

### Default-deny and rule order

The safe posture is **default-deny** (a.k.a. **allow-list**): block everything, then explicitly allow
only what's needed. The opposite, **default-allow** (block only known-bad), inevitably leaves gaps as
new services or threats appear.

Rules are usually evaluated **top to bottom, first match wins**, ending in a **default-deny** catch-all:

```text
   1. allow  in  tcp  any -> me:443     (web)
   2. allow  in  tcp  10.0.0.0/24 -> me:22   (SSH from admin subnet only)
   3. deny   in  any                    (default deny — everything else)
```

Order matters: a broad `deny` placed above a needed `allow` would block it. Put specific allows before
the final catch-all deny.

### Host-based vs network firewalls

- A **host-based firewall** runs on an individual machine (e.g. Linux `nftables`/`iptables`, `ufw`;
  Windows Firewall), protecting just that host.
- A **network firewall** sits at a boundary (router/appliance/cloud security group) and protects an
  entire network segment.

They complement each other: the network firewall guards the perimeter; host firewalls protect each
machine even if something gets past the perimeter.

```bash
# Linux examples (syntax varies by tool)
sudo ufw default deny incoming
sudo ufw allow 443/tcp
sudo nft list ruleset          # view active nftables rules
```

### Defense in depth and attack surface

A firewall is **one layer**, not the whole strategy. **Defense in depth** stacks controls —
firewalls, TLS, authentication, patching, least privilege, monitoring — so no single failure is fatal.
Reducing **attack surface** means running fewer exposed services and closing unused ports: the safest
port is one that isn't listening at all. Firewalls also can't protect against threats *inside* allowed
traffic (a vulnerability in your web app on the port you deliberately opened) — hence the other layers.

# Key Terminology

- **Firewall** — a control that allows/denies traffic by policy.
- **Stateless / packet filter** — judges each packet alone by its headers.
- **Stateful** — tracks connections and auto-allows their replies (established/related).
- **Default-deny (allow-list)** — block all, then allow only what's explicitly needed.
- **Attack surface** — the set of exposed services/ports an attacker could target.
- **Defense in depth** — layering multiple independent security controls.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Default policy | Default-deny | Default-allow | Default-deny — allow only what's needed; default-allow leaves gaps as things change. |
| Firewall type | Stateless | Stateful | Stateful for almost everything (safer, simpler); stateless only for very high-speed, simple filters. |
| Placement | Host-based only | Host + network | Both — network firewall for the perimeter, host firewalls for depth on each machine. |

# Worked Example

Lock down a web server that should accept only HTTPS publicly and SSH from the admin subnet:

```text
   Policy: default-deny inbound.
   1. allow  in  tcp  any            -> server:443    (public HTTPS)
   2. allow  in  tcp  10.0.0.0/24    -> server:22     (SSH, admin subnet only)
   3. (stateful) allow established/related              (replies to outbound)
   4. deny   in  any                                    (catch-all)

   Result: the internet can reach 443; only 10.0.0.0/24 can SSH; all other
   inbound is dropped; the server's own outbound replies are allowed back by
   the stateful rule.
```

Every exposed door is deliberate, and the stateful rule spares you from writing manual return-path
rules.

# Real World Analogy

A firewall is a **building's security desk with an access policy**. A **default-deny** policy is "no one
enters unless they're on the list." A **stateless** guard checks each person with no memory — so a
visitor and their escort must *each* be pre-approved. A **stateful** guard remembers "this visitor was
signed in by an employee," so their return from the restroom is allowed automatically (**established
connection**). The desk controls the doors (**attack surface**), but it can't stop someone who was
legitimately let in from misbehaving inside — which is why the building also has locks on individual
offices (**defense in depth**).

# Examples

## Example 1 — Basic: opening one port

A fresh server denies all inbound by default. To serve a website you add one rule: `allow 443/tcp`.
Nothing else is reachable, minimizing the attack surface to exactly the service you intend to run.

**Why this works:** default-deny plus a single explicit allow exposes only what's necessary.

## Example 2 — Real-world: stateful replies

A host makes an outbound API call over TCP. A stateful firewall records the connection and permits the
API's response back automatically — no inbound rule needed. A stateless firewall would have blocked the
reply unless you'd opened the return path manually.

**Why this works:** connection tracking recognizes the reply as "established/related" to a permitted
outbound flow.

## Example 3 — Pitfall: rule order blunder

An admin adds `allow 22/tcp from admin-subnet` *below* a broad `deny all inbound`. Because rules match
top-to-bottom and the deny comes first, SSH is blocked despite the allow. Reordering (specific allows
above the catch-all deny) fixes it.

**Why this bites:** first-match evaluation means a broad deny placed too early silently overrides later
allows.

# Common Mistakes

- **Using default-allow.** Block everything and allow-list what you need; default-allow leaves gaps.
- **Forgetting rule order.** First match wins — put specific allows **before** the final deny.
- **Relying on a firewall alone.** It can't stop attacks inside allowed traffic; layer other controls.
- **Confusing NAT with a firewall.** NAT hides addresses; a firewall enforces an actual policy.

# Best Practices

- Adopt **default-deny** and open only the specific ports/sources you need.
- Prefer **stateful** firewalls and an **"allow established/related"** rule for return traffic.
- Combine **network** and **host-based** firewalls; don't depend on the perimeter alone.
- **Minimize attack surface** — turn off unused services; the safest port isn't listening at all.

# Summary

- A **firewall** allows or denies traffic by policy, matching direction, protocol, and source/dest
  IP/port.
- **Stateless** filters judge packets alone; **stateful** firewalls track connections and auto-allow
  their replies.
- Use **default-deny** and remember rules are **first-match** — specific allows before the catch-all
  deny.
- **Host-based** and **network** firewalls complement each other (perimeter + per-machine depth).
- A firewall is **one layer** of **defense in depth**; reduce **attack surface** and don't mistake NAT
  for security.

# Flash Cards

Q: What is the difference between a stateless and a stateful firewall?
A: A stateless (packet-filtering) firewall judges each packet in isolation; a stateful firewall tracks connections and automatically allows replies to permitted outbound flows.

Q: What is a default-deny policy?
A: Block all traffic by default and explicitly allow only what's needed — the safe posture, versus default-allow which leaves gaps.

Q: Why does firewall rule order matter?
A: Rules are typically evaluated top-to-bottom with first-match-wins, so a broad deny placed above a needed allow will block it.

Q: How do host-based and network firewalls differ?
A: A host-based firewall protects a single machine; a network firewall protects an entire segment at a boundary. They complement each other.

Q: Can a firewall protect against attacks inside allowed traffic?
A: No — it can't stop a vulnerability in a service on a port you deliberately opened, which is why defense in depth layers other controls.

Q: What does "reducing attack surface" mean?
A: Running fewer exposed services and closing unused ports, so there are fewer targets — the safest port is one that isn't listening at all.

# Exercises

### Easy
On a machine you control (or on paper), write a default-deny inbound policy that allows only HTTPS
(443/tcp) from anywhere. List the rules in the correct order.

### Medium
Explain, with an example, why a stateful firewall makes return traffic easier to allow than a stateless
one. Write the minimal rules each approach would need for a host making outbound HTTPS calls.

### Challenging
You must expose a public website (443), allow SSH (22) only from `10.0.0.0/24`, permit the server's
outbound updates, and block everything else. Write an ordered, stateful default-deny rule set, and
explain what would break if you moved the catch-all deny to the top.

# Further Reading

- Cloudflare — *What is a firewall?*: <https://www.cloudflare.com/learning/security/what-is-a-firewall/>
- NIST — *Guidelines on Firewalls and Firewall Policy* (SP 800-41r1): <https://csrc.nist.gov/pubs/sp/800/41/r1/final>
- netfilter/nftables project documentation: <https://wiki.nftables.org/>
- IETF — *Benchmarking Terminology for Firewall Performance* (RFC 2647): <https://www.rfc-editor.org/rfc/rfc2647>
