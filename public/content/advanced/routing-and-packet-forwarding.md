---
id: lesson-17
slug: routing-and-packet-forwarding
title: "Routing and Packet Forwarding"
level: advanced
order: 17
duration: 22
tags:
  - routing
  - forwarding
  - bgp
  - routing-table
  - longest-prefix
summary: "How packets find their way across the internet — the difference between routing and forwarding, routing tables and longest-prefix match, the default route, and how BGP ties independent networks together."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Distinguish **routing** (choosing paths) from **forwarding** (moving a packet).
- Read a **routing table** and apply **longest-prefix match**.
- Explain the **default route** (`0.0.0.0/0`) and hop-by-hop, best-effort delivery.
- Contrast **static** vs **dynamic** routing and **interior** vs **exterior** protocols.
- Describe at a high level how **BGP** connects autonomous systems into the internet.

# Why It Matters

Every packet that leaves your subnet is handed from router to router until it reaches its destination.
Understanding how routers *decide* where to send it — and how the whole internet's routers stay
coordinated — explains why some paths are slow, why a misconfigured route can black-hole traffic, and
how a network of networks actually functions. This is the machinery beneath `traceroute`.

# Concept Explanation

### Routing vs forwarding

These two words are often blurred but mean different things:

- **Routing** is the **control-plane** job of *building* the map: learning which networks exist and the
  best next hop for each, and storing that in a **routing table**.
- **Forwarding** is the **data-plane** job of *using* the map: for each arriving packet, look up its
  destination and send it out the right interface toward the next hop.

Routing decides the paths (occasionally, as topology changes); forwarding happens for every single
packet (constantly, at high speed).

### The routing table and longest-prefix match

A **routing table** is a list of destination prefixes and where to send packets for each:

```text
   Destination        Next hop / interface
   0.0.0.0/0          via 192.168.1.1     (default route: everything else)
   192.168.1.0/24     dev eth0            (directly connected)
   10.8.0.0/16        via 10.8.0.1        (a route to a remote network)
```

When a packet arrives, the router finds **every** prefix that contains the destination and picks the
**most specific** one — the **longest prefix match** (the largest prefix length). A packet for
`10.8.5.4` matches both `0.0.0.0/0` and `10.8.0.0/16`; the `/16` wins because it's more specific.

```bash
ip route            # Linux: view the routing table
ip route get 10.8.5.4   # show which route/next-hop a destination would use
```

### The default route and hop-by-hop delivery

`0.0.0.0/0` is the **default route** — the catch-all used when no more specific route matches. On a
home machine it points at your gateway; on your gateway it points at your ISP. IP delivery is
**hop-by-hop and best-effort**: each router makes an **independent** local decision about the next hop,
with no guarantee of delivery and no global coordinator steering a given packet. The **TTL** decrements
each hop so a misrouted packet can't loop forever.

### Static vs dynamic routing

- **Static routing** — routes are configured by hand. Simple and predictable for small or stub
  networks, but doesn't adapt if a link fails.
- **Dynamic routing** — routers run a **routing protocol** to learn routes automatically and reroute
  around failures. Essential at scale.

### Interior vs exterior protocols

Dynamic routing protocols come in two flavors based on scope:

- **Interior Gateway Protocols (IGPs)** run *within* one organization's network: **OSPF** and **IS-IS**
  (link-state), **RIP** (distance-vector, older). They optimize paths inside your **autonomous system**.
- **Exterior Gateway Protocol** — **BGP** runs *between* organizations.

An **Autonomous System (AS)** is a network under one administrative control (an ISP, a big company),
identified by an **AS number**.

### BGP: the internet's routing glue

**BGP** (Border Gateway Protocol) is how autonomous systems exchange reachability: "I can reach these
prefixes, via this AS path." It's a **path-vector** protocol — it advertises the *sequence of ASes* to
reach a destination, which helps avoid loops and lets operators apply policy (preferring some paths for
business reasons, not just shortest distance). BGP is what stitches ~100,000 independent networks into
one internet. Because it's policy-driven and trust-based, a bad BGP announcement can misroute large
swaths of traffic — which is why real-world **BGP route leaks/hijacks** occasionally make the news.

# Key Terminology

- **Routing** — building the map of networks and best next hops (control plane).
- **Forwarding** — moving each packet to its next hop using the map (data plane).
- **Routing table** — destination prefixes mapped to next hops/interfaces.
- **Longest-prefix match** — choosing the most specific matching route.
- **Default route** — `0.0.0.0/0`, used when nothing more specific matches.
- **Autonomous System (AS)** — a network under one administrative control, with an AS number.
- **BGP** — the path-vector protocol that routes between autonomous systems.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Small network routes | Static | Dynamic (OSPF) | Static for a couple of stable links; dynamic once there are many paths or failover matters. |
| Inside vs between orgs | IGP (OSPF/IS-IS) | BGP | IGP within your AS for efficient internal paths; BGP to exchange routes with other ASes. |
| Route selection basis | Shortest metric | Policy (BGP) | Internal metrics for speed; BGP policy when business/peering relationships must decide the path. |

# Worked Example

A packet leaves your laptop for `93.184.216.34`:

```text
   Laptop routing table:
     192.168.1.0/24  dev wlan0        (local)
     0.0.0.0/0       via 192.168.1.1  (default)

   93.184.216.34 doesn't match the /24, so the default route wins ->
   send to the gateway 192.168.1.1.

   The gateway has its own table (a more specific route via the ISP), forwards on.
   Each router repeats: longest-prefix match -> next hop, TTL -= 1.
   Eventually a router directly connected to 93.184.216.0/24 delivers it.
```

No router knew the whole path; each made one **local** longest-prefix decision, and the packet arrived
by the sum of those independent hops.

# Real World Analogy

Routing is like a chain of **road-sign decisions** on a road trip without a full map. At each
intersection (**router**), you read the signs (**routing table**) and pick the road whose sign most
specifically names your destination (**longest-prefix match**). If no sign mentions your town, you
follow the generic "All other destinations →" sign (**default route**). No single sign knows the whole
route; you reach your destination by making the best local choice at each junction. **BGP** is like the
agreement between different regions' highway authorities about which roads cross their borders and which
they prefer.

# Examples

## Example 1 — Basic: reading your default route

```bash
ip route
# default via 192.168.1.1 dev wlan0
# 192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.42
```

Local traffic (`192.168.1.0/24`) goes out directly; everything else follows the **default route** to
the gateway. Two lines explain where every packet you send will go.

**Why this works:** longest-prefix match sends same-subnet packets directly and everything else to the
default gateway.

## Example 2 — Real-world: more specific route wins

A VPN adds a route `10.0.0.0/8 via 10.9.0.1`. Now packets for `10.0.5.7` follow the VPN's `/8` instead
of the `0.0.0.0/0` default, because `/8` is more specific than `/0`. Adding an even more specific
`10.0.5.0/24` route would override the `/8` for that subnet.

**Why this works:** longest-prefix match always prefers the most specific route, so specific routes
steer chosen traffic without touching the rest.

## Example 3 — Pitfall: a bad BGP announcement

An operator accidentally announces prefixes they don't own (or leaks routes learned from a peer).
Because BGP is trust/policy-based, other networks may believe it and send traffic the wrong way —
causing outages far beyond the originating AS.

**Why this bites:** BGP propagates announcements widely and largely on trust, so one mistake can
misroute global traffic (mitigations like RPKI exist but aren't universal).

# Common Mistakes

- **Conflating routing and forwarding.** Routing *builds* the table (control plane); forwarding *uses*
  it per packet (data plane).
- **Ignoring longest-prefix match.** A more specific route always beats a less specific one, regardless
  of order.
- **Thinking there's a global path planner.** Delivery is **hop-by-hop**; each router decides
  independently.
- **Assuming BGP picks the shortest path.** BGP is **policy-driven**, not purely shortest-distance.

# Best Practices

- Use `ip route get <dest>` to see **exactly** which route a destination will take before guessing.
- Keep routing **simple** where you can (static/default routes for stubs); use dynamic protocols where
  failover matters.
- Remember the **default route** is the safety net — a missing or wrong one silently black-holes
  traffic.
- Treat **BGP** changes with extreme care; a wrong announcement has wide blast radius.

# Summary

- **Routing** builds the map (control plane); **forwarding** moves each packet using it (data plane).
- Routers pick the next hop by **longest-prefix match** in the **routing table**; `0.0.0.0/0` is the
  **default route**.
- IP delivery is **hop-by-hop and best-effort**; each router decides independently, and **TTL** stops
  loops.
- **Static** vs **dynamic** routing, and **interior** (OSPF/IS-IS/RIP) vs **exterior** (**BGP**)
  protocols, differ by scope.
- **BGP** is the **path-vector**, policy-driven protocol that connects **autonomous systems** into the
  internet — powerful, and fragile to misconfiguration.

# Flash Cards

Q: What is the difference between routing and forwarding?
A: Routing (control plane) builds the routing table of best next hops; forwarding (data plane) uses that table to move each individual packet to its next hop.

Q: What is longest-prefix match?
A: When several routes match a destination, the router chooses the most specific one — the route with the longest prefix length.

Q: What is the default route, and when is it used?
A: 0.0.0.0/0 — the catch-all route used to forward any packet whose destination doesn't match a more specific route.

Q: What is an Autonomous System (AS)?
A: A network under a single administrative control (like an ISP or large org), identified by an AS number.

Q: What kind of protocol is BGP, and what does it route between?
A: BGP is a path-vector protocol that exchanges reachability between autonomous systems, advertising the AS path to each prefix and applying policy.

Q: Does BGP always choose the shortest path?
A: No — BGP is policy-driven; operators can prefer paths for business/peering reasons, not just the fewest AS hops.

# Exercises

### Easy
Run `ip route` on your machine. Identify the default route and its gateway, and one directly-connected
network. Then run `ip route get 8.8.8.8` and explain which route it uses and why.

### Medium
Given a table with `0.0.0.0/0 via A`, `10.0.0.0/8 via B`, and `10.0.5.0/24 via C`, state which next hop
a packet to `10.0.5.20` uses and which a packet to `10.0.9.1` uses. Explain using longest-prefix match.

### Challenging
Explain how the internet routes a packet between two different ISPs when neither knows the other's
internal topology. Cover the roles of interior protocols within each AS and BGP between them, and
describe one way a BGP misconfiguration could cause a widespread outage.

# Further Reading

- IETF — *A Border Gateway Protocol 4 (BGP-4)* (RFC 4271): <https://www.rfc-editor.org/rfc/rfc4271>
- Cloudflare — *What is BGP? / What is routing?*: <https://www.cloudflare.com/learning/network-layer/what-is-routing/>
- IETF — *OSPF Version 2* (RFC 2328): <https://www.rfc-editor.org/rfc/rfc2328>
- `man ip-route`: <https://man7.org/linux/man-pages/man8/ip-route.8.html>
