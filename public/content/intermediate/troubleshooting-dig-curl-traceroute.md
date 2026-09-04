---
id: lesson-16
slug: troubleshooting-dig-curl-traceroute
title: "Troubleshooting with dig, curl, and traceroute"
level: intermediate
order: 16
duration: 22
tags:
  - dig
  - curl
  - traceroute
  - troubleshooting
  - diagnostics
summary: "Three essential command-line tools and how to combine them — dig to debug DNS, curl to probe HTTP/HTTPS, and traceroute to reveal the path and where it breaks."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Use **`dig`** to inspect DNS resolution and record types.
- Use **`curl`** to probe HTTP/HTTPS, read headers, and time requests.
- Use **`traceroute`** to reveal the path to a host and where it fails, and explain how it uses **TTL**.
- Combine the three into a **layered diagnostic** workflow.
- Read tool output to localize a failure to DNS, the network path, or the application.

# Why It Matters

The difference between an hour of guessing and a two-minute fix is often one well-chosen command. `dig`,
`curl`, and `traceroute` cover the three most common failure areas — **name resolution**, the **network
path**, and the **application response**. Together they let you point at a problem and say "it's DNS,"
"it's a routing/path issue," or "the server returned a 502" — with evidence.

# Concept Explanation

### `dig` — debug DNS

**`dig`** queries DNS directly and shows exactly what a resolver returns. It answers "does this name
resolve, to what, and from where?"

```bash
dig example.com A +short          # just the IPv4 answer(s): 93.184.216.34
dig example.com MX                # mail servers with priorities
dig @1.1.1.1 example.com          # ask a specific resolver
dig +trace example.com            # walk root -> TLD -> authoritative yourself
```

Key things to read: the **ANSWER SECTION** (the records returned), the **status** (`NOERROR`,
`NXDOMAIN` = name doesn't exist, `SERVFAIL` = resolver failure), and the **TTL** on each record. If
`dig` resolves but your app can't, the app may be using a different resolver — `dig @<resolver>`
compares them.

### `curl` — probe HTTP/HTTPS

**`curl`** makes requests and shows the full exchange. It answers "does the server respond, with what
status and headers, and how fast?"

```bash
curl -I https://example.com/                 # HEAD: status line + response headers only
curl -v https://example.com/                 # verbose: request + response + TLS details
curl -sS -o /dev/null -w "%{http_code} %{time_total}s\n" https://example.com/
                                             # just the status code and total time
curl --resolve example.com:443:203.0.113.9 https://example.com/
                                             # test a specific server IP, bypassing DNS
```

`curl -I` quickly reveals the **status code** and redirects; `-v` shows the **TLS handshake** and
headers; the `-w` timing lets you separate slow DNS/connect/TLS from slow servers. The `--resolve`
trick lets you test one backend directly, isolating DNS from the server.

### `traceroute` — reveal the path

**`traceroute`** (Windows: `tracert`) lists the routers (**hops**) between you and a destination and how
long each takes. It answers "how far do my packets get, and where do they stall or stop?"

```bash
traceroute example.com
#  1  192.168.1.1     1.2 ms      (your gateway)
#  2  10.20.0.1       8.4 ms      (ISP)
#  3  * * *                       (a hop not replying)
#  4  93.184.216.34   40.1 ms     (destination)
```

**How it works:** traceroute sends probes with a **TTL of 1, then 2, then 3…**. Each router that
decrements the TTL to 0 drops the probe and returns an **ICMP Time Exceeded** message — revealing that
router's address. Increasing the TTL steps one hop further each round, mapping the path. A row of `* *
*` means a hop didn't reply (often it just deprioritizes/ignores these probes) — that alone is **not**
proof of a failure; look at whether later hops still respond.

### Combining them: a layered workflow

Match each tool to a layer and go in order:

```text
   1. Does the name resolve?      dig example.com +short      (DNS)
   2. Can packets reach the host? traceroute example.com      (path/routing)
   3. Does the service answer?    curl -I https://example.com (application)
```

If `dig` fails, it's **DNS** — stop there. If `dig` works but `traceroute` stalls partway, it's a
**path/routing** problem. If both work but `curl` returns 5xx, it's the **application/server**. Each
tool rules a layer in or out.

# Key Terminology

- **`dig`** — a DNS lookup tool showing records, status, and TTLs.
- **`curl`** — a tool to make HTTP(S) (and other) requests and inspect the full exchange.
- **`traceroute` / `tracert`** — maps the routers along a path using increasing TTLs.
- **Hop** — one router along the path to a destination.
- **NXDOMAIN / SERVFAIL** — DNS statuses for "name doesn't exist" / "resolver failed."
- **ICMP Time Exceeded** — the message a router returns when a packet's TTL hits 0 (enables traceroute).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Suspecting DNS | `dig +short` | `dig @<resolver>` / `+trace` | `+short` for a quick answer; `@resolver`/`+trace` to compare resolvers or find where the walk breaks. |
| Checking a site | `curl -I` (headers) | `curl -v` (full detail) | `-I` for a fast status/redirect check; `-v` when you need TLS and header detail. |
| "It's slow" | `traceroute` for path latency | `curl -w` for request timing | traceroute to see per-hop delay; `curl -w` to split DNS/connect/TLS/server time. |

# Worked Example

"`https://shop.example.com` won't load." Diagnose in three commands:

```bash
dig shop.example.com +short
#   (empty)  -> NXDOMAIN in full output
```

DNS returns nothing — the name doesn't resolve. No need to touch `curl` or `traceroute`; the problem is
**DNS** (a missing or misconfigured record). Contrast with:

```bash
dig shop.example.com +short      # 203.0.113.9   (resolves fine)
traceroute shop.example.com      # reaches hop 203.0.113.9 quickly (path OK)
curl -I https://shop.example.com # HTTP/2 502 Bad Gateway  (app is broken)
```

Here DNS and the path are healthy, but the server returns **502** — the fault is in the
**application/upstream**, not the network.

# Real World Analogy

The three tools are like diagnosing why a **friend didn't get your letter**. **`dig`** is checking the
address book — do you even have the right address for their name? **`traceroute`** is following the
mail route, depot by depot, to see how far the letter got and where it stalled. **`curl`** is knocking
on their door once it arrives to see if anyone answers and what they say. Checking address, then route,
then the door, in that order, finds the break at the right stage instead of blaming the wrong one.

# Examples

## Example 1 — Basic: confirming a redirect

```bash
curl -I http://example.com/
# HTTP/1.1 301 Moved Permanently
# Location: https://example.com/
```

`curl -I` instantly shows the site issues a **301** to HTTPS. You learn the redirect exists without
downloading any page body.

**Why this works:** a HEAD request returns the status line and headers, which is all you need to see a
redirect.

## Example 2 — Real-world: DNS says one thing, app another

`dig` returns `203.0.113.9`, but the app connects to a stale IP. Testing the real backend directly
isolates it:

```bash
curl --resolve example.com:443:203.0.113.9 -I https://example.com/   # 200 OK
```

The backend is fine when reached directly, so the problem is stale DNS/caching on the client side, not
the server.

**Why this works:** `--resolve` bypasses DNS to test the server itself, separating a DNS problem from a
server problem.

## Example 3 — Pitfall: misreading traceroute stars

An admin sees `* * *` at hop 6 and declares the network broken there — but hops 7 and 8 reply normally
and the destination is reached. That middle router simply **rate-limits/ignores** the probes; the path
is fine.

**Why this bites:** intermediate non-replies are common and expected; only a failure to reach the
**destination** (or consistent loss beyond a hop) indicates a real path problem.

# Common Mistakes

- **Reading traceroute `* * *` as "broken here."** Routers often ignore probes; judge by whether the
  destination is reached.
- **Assuming `dig` uses your app's resolver.** Use `dig @<resolver>` to compare; apps may resolve
  differently.
- **Using only `curl` for a "slow site."** Add `-w` timing or `traceroute` to tell DNS/connect/TLS from
  server slowness.
- **Stopping at the first tool.** Confirm the *layer*: DNS (`dig`) → path (`traceroute`) → app
  (`curl`).

# Best Practices

- Diagnose **in layer order**: name (`dig`) → path (`traceroute`) → service (`curl`).
- Use `curl -w` to **split timing** (DNS vs connect vs TLS vs server) when latency is the complaint.
- Use `dig @resolver` and `curl --resolve` to **isolate** DNS problems from server problems.
- Capture the **evidence** (status codes, hop that stalls, DNS status) so the fix targets the real
  layer.

# Summary

- **`dig`** debugs **DNS** — records, status (`NXDOMAIN`/`SERVFAIL`), and TTLs; `@resolver` and
  `+trace` localize where resolution breaks.
- **`curl`** probes **HTTP/HTTPS** — status codes (`-I`), full detail and TLS (`-v`), and timing (`-w`);
  `--resolve` tests a specific backend.
- **`traceroute`** maps the **path** by increasing **TTL** and reading **ICMP Time Exceeded**; `* * *`
  is often benign.
- Combine them in **layer order**: DNS → path → application, letting each rule a layer in or out.
- The goal is **evidence-based** diagnosis: name it as DNS, path, or app — don't guess.

# Flash Cards

Q: Which tool debugs DNS, and what does its ANSWER section show?
A: dig — its ANSWER SECTION shows the records returned (e.g. A/MX), along with the status and each record's TTL.

Q: How does traceroute discover each hop along a path?
A: It sends probes with increasing TTLs; each router that decrements the TTL to 0 returns an ICMP Time Exceeded, revealing its address one hop at a time.

Q: What does a row of "* * *" in traceroute usually mean?
A: A hop that didn't reply to the probes — often because it deprioritizes or ignores them. It's usually benign if later hops and the destination still respond.

Q: How do you check just a website's status code and headers quickly with curl?
A: Use curl -I (a HEAD request), which returns the status line and response headers without the body.

Q: In what order should you use dig, traceroute, and curl to troubleshoot?
A: In layer order — dig (DNS) first, then traceroute (path), then curl (application) — so each tool rules its layer in or out.

Q: How can you test a specific server IP with curl while bypassing DNS?
A: Use curl --resolve host:port:IP, which forces the connection to that IP, isolating server behavior from DNS.

# Exercises

### Easy
Run `dig example.com +short`, `curl -I https://example.com/`, and `traceroute example.com`. Note the
resolved IP, the HTTP status code, and how many hops the path took.

### Medium
A site "loads slowly." Show which commands you'd run to determine whether the delay is in DNS, the
network path, or the server, and what output would point to each.

### Challenging
`app.example.com` is down for you but up for a colleague. Design a step-by-step investigation with
`dig`, `traceroute`, and `curl` (including `dig @resolver` and `curl --resolve`) that determines whether
the cause is your DNS resolver, a path/routing issue, or the server — and explain how each result
narrows it down.

# Further Reading

- `man dig`: <https://man.archlinux.org/man/dig.1>
- curl — *documentation and tutorial*: <https://curl.se/docs/>
- `man traceroute`: <https://man7.org/linux/man-pages/man8/traceroute.8.html>
- Cloudflare — *What is traceroute?*: <https://www.cloudflare.com/learning/network-layer/what-is-traceroute/>
