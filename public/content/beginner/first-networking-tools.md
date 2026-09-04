---
id: lesson-08
slug: first-networking-tools
title: "Your First Networking Tools"
level: beginner
order: 8
duration: 20
tags:
  - ping
  - ip
  - troubleshooting
  - icmp
  - cli
summary: "The first commands every developer should know — checking your own address with ip/ifconfig, testing reachability with ping, and a layer-by-layer method for finding where a connection breaks."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Inspect your own network settings with **`ip`** (or `ifconfig`/`ipconfig`).
- Test reachability and measure round-trip time with **`ping`**.
- Explain what **ICMP** is and why ping isn't always conclusive.
- Find your **default gateway** and confirm you can reach it.
- Follow a **bottom-up troubleshooting method** to locate where connectivity fails.

# Why It Matters

When "the internet is down," guessing wastes time. A handful of commands, run in the right order, tell
you *exactly* which layer failed — your interface, your address, your gateway, routing, or DNS. This
lesson gives you that first toolkit and, more importantly, a **method**. Later lessons go deeper into
`dig`, `traceroute`, `curl`, and `tcpdump`; this is the foundation they build on.

# Concept Explanation

### See your own settings: `ip` / `ifconfig`

Before testing anything, know your own address, gateway, and DNS. On modern Linux, the `ip` command is
standard (`ifconfig` is older; `ipconfig` is Windows):

```bash
ip addr                 # interfaces and their IP addresses
ip route                # the routing table, including the default gateway
```

Look for three things: an interface that is **UP**, an **IP address** on it (e.g. `inet
192.168.1.42/24`), and a **default route** (e.g. `default via 192.168.1.1`). If any is missing, you've
already found a clue.

### Test reachability: `ping`

**`ping`** sends **ICMP Echo Request** messages to a target and times the **Echo Reply** that comes
back. It answers "can I reach this host, and how long does a round trip take?"

```bash
ping -c 4 1.1.1.1
# 64 bytes from 1.1.1.1: icmp_seq=1 ttl=56 time=12.3 ms
# 64 bytes from 1.1.1.1: icmp_seq=2 ttl=56 time=11.9 ms
# --- 1.1.1.1 ping statistics ---
# 4 packets transmitted, 4 received, 0% packet loss, ...
```

- **`time=`** is the **round-trip time (RTT)** — how long the request+reply took.
- **packet loss** shows how many replies never came back.
- Pinging an **IP** tests connectivity without involving DNS; pinging a **name** also tests DNS.

### ICMP, and why ping can mislead

**ICMP** (Internet Control Message Protocol) is a layer-3 helper protocol for diagnostics and error
messages — it is **not** TCP or UDP. `ping` and `traceroute` rely on it. But many hosts and firewalls
**deliberately drop ICMP**, so **"no ping reply" does not always mean "host down"** — the host may be
up and simply ignoring pings while happily serving web traffic. Treat ping as one signal, not proof.

### Your default gateway

The **default gateway** is the router your host sends packets to when the destination is on another
network. Find it in `ip route` (`default via …`) and confirm you can reach it:

```bash
ip route | grep default        # default via 192.168.1.1 dev wlan0
ping -c 2 192.168.1.1          # can I reach my own router?
```

If you can't reach your gateway, nothing beyond your local network will work — start there.

### A bottom-up troubleshooting method

Test one layer at a time, from closest to farthest. The first failing step is where the problem is:

```text
   1. Interface up + has an IP?          ip addr        (link + address)
   2. Can I reach my gateway?            ping <gateway> (local network)
   3. Can I reach the internet by IP?    ping 1.1.1.1   (routing/NAT works)
   4. Can I resolve a name?              ping example.com  OR  dig example.com (DNS)
   5. Can I reach the service?           curl https://example.com (application)
```

If step 3 works but step 4 fails, it's **DNS** (you can reach the internet, just can't resolve names).
If step 2 fails, it's **local** (Wi-Fi, cable, or address). This ordering turns "it's broken" into a
precise diagnosis.

# Key Terminology

- **`ip` / `ifconfig` / `ipconfig`** — commands to view/manage interfaces, addresses, and routes.
- **`ping`** — tests reachability using ICMP Echo, reporting RTT and packet loss.
- **ICMP** — a layer-3 protocol for diagnostics/errors; not TCP or UDP.
- **RTT (round-trip time)** — time for a request to reach a host and the reply to return.
- **Default gateway** — the router used to reach destinations outside the local network.
- **Packet loss** — the fraction of sent probes that got no reply.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Ping a name or an IP | Name (`ping example.com`) | IP (`ping 1.1.1.1`) | Ping an **IP** to isolate connectivity from DNS; ping a **name** to also test DNS. |
| "No ping reply" means… | Host is down | Host may just block ICMP | Don't conclude "down" — confirm with a real service test (curl/TCP). |
| Where to start | Test the far endpoint | Test the nearest hop first | Start **near** (interface, gateway) and move out; the first failure localizes the problem. |

# Worked Example

The internet "isn't working." Diagnose methodically:

```bash
ip addr                    # inet 192.168.1.42/24 on wlan0, state UP     -> OK
ip route | grep default    # default via 192.168.1.1                     -> OK
ping -c2 192.168.1.1       # 0% loss                                     -> gateway OK
ping -c2 1.1.1.1           # 0% loss                                     -> internet OK (by IP)
ping -c2 example.com       # "Name or service not known"                 -> FAILS HERE
```

Everything up to raw-IP internet access works, but name resolution fails — so the problem is **DNS**,
not connectivity. The fix lives in DNS settings, not the Wi-Fi. Without the method, you might have
pointlessly rebooted the router.

# Real World Analogy

Troubleshooting bottom-up is like checking why a **package never arrived**. First, is your mailbox even
installed and labeled (**interface + IP**)? Can mail leave your street (**gateway**)? Does the regional
hub work (**internet by IP**)? Do they recognize the recipient's *name* versus their *address*
(**DNS**)? Checking from your doorstep outward finds the break at the nearest broken link, instead of
assuming the fault is at the far end.

# Examples

## Example 1 — Basic: measuring latency

You ping two servers and compare RTT:

```bash
ping -c3 nearby.example      # time≈8 ms
ping -c3 faraway.example     # time≈180 ms
```

The far server's higher RTT reflects the greater distance and more hops. RTT is a quick proxy for
"how responsive will this feel?"

**Why this works:** ping measures the actual round trip, which is dominated by distance and the number
of hops.

## Example 2 — Real-world: gateway reachable, internet not

`ping gateway` succeeds but `ping 1.1.1.1` times out. Your local network is fine, so the problem is
**upstream** — your router's internet link or your provider. Now you know to check the modem/provider,
not your laptop.

**Why this works:** isolating the last working hop points directly at the first broken segment.

## Example 3 — Pitfall: trusting a blocked ping

You ping a company's web server, get no reply, and conclude it's down — but the website loads fine in a
browser. The server **blocks ICMP** while serving HTTPS normally. Ping failure alone isn't proof.

**Why this bites:** many hosts drop ICMP for security, so "ping fails" can be a false alarm; always
confirm with the actual service (e.g. `curl`).

# Common Mistakes

- **Treating "no ping reply" as "host down."** Many hosts/firewalls drop ICMP on purpose.
- **Starting far away.** Test the **nearest** hop first (interface → gateway → internet → DNS →
  service).
- **Confusing "can't resolve" with "no connectivity."** If IP pings work but names don't, it's **DNS**.
- **Thinking ICMP is TCP or UDP.** ICMP is its own layer-3 protocol.

# Best Practices

- Keep a mental **bottom-up checklist**: interface/IP → gateway → internet-by-IP → DNS → service.
- Ping a **raw IP** (like `1.1.1.1`) to separate connectivity problems from DNS problems.
- Confirm suspected "down" hosts with a **real request** (`curl`) since ICMP may be blocked.
- Learn your **gateway** address; reaching it is the boundary between "local problem" and "beyond."

# Summary

- Use **`ip addr`/`ip route`** (or `ifconfig`/`ipconfig`) to see your interface, address, and gateway.
- **`ping`** tests reachability via **ICMP** and reports **RTT** and packet loss.
- **ICMP is a layer-3 diagnostic protocol** (not TCP/UDP), and it's often blocked — so ping isn't
  proof of "up" or "down."
- The **default gateway** is your exit to other networks; reaching it separates local from upstream
  problems.
- Troubleshoot **bottom-up**: interface → gateway → internet-by-IP → DNS → service; the first failure
  is the culprit.

# Flash Cards

Q: What does `ping` measure, and using what protocol?
A: It tests reachability and measures round-trip time (RTT) using ICMP Echo Request/Reply messages.

Q: Why doesn't "no ping reply" always mean the host is down?
A: Many hosts and firewalls deliberately drop ICMP, so a host can ignore pings while still serving traffic like HTTPS normally.

Q: What is the default gateway?
A: The router a host sends packets to when the destination is on a different network — your exit to the rest of the internet.

Q: If pinging 1.1.1.1 works but pinging example.com fails, what's broken?
A: DNS — you have internet connectivity (raw IP works) but name resolution is failing.

Q: Is ICMP a TCP or UDP protocol?
A: Neither — ICMP is its own layer-3 (Internet-layer) protocol used for diagnostics and error messages.

Q: In what order should you troubleshoot connectivity?
A: Bottom-up: interface/IP, then gateway, then internet by IP, then DNS, then the service — the first step that fails localizes the problem.

# Exercises

### Easy
Run `ip addr` and `ip route` (or your OS equivalent). Write down your IP address, subnet size, and
default gateway. Then `ping` your gateway and note the result.

### Medium
Ping a raw IP (e.g. `1.1.1.1`) and a hostname (e.g. `example.com`). Compare the RTTs and explain what
each result tells you about connectivity vs DNS.

### Challenging
Write a step-by-step bottom-up checklist to diagnose "I can't load any website." For each step, give the
exact command and state what a failure at that step would mean. Include at least one case where ping
succeeds but the service still fails, and explain it.

# Further Reading

- `man ping`: <https://man7.org/linux/man-pages/man8/ping.8.html>
- `man ip`: <https://man7.org/linux/man-pages/man8/ip.8.html>
- IETF — *Internet Control Message Protocol* (RFC 792): <https://www.rfc-editor.org/rfc/rfc792>
- Cloudflare — *What is ICMP?*: <https://www.cloudflare.com/learning/ddos/glossary/internet-control-message-protocol-icmp/>
