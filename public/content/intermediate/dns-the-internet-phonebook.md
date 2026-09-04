---
id: lesson-10
slug: dns-the-internet-phonebook
title: "DNS: The Internet's Phonebook"
level: intermediate
order: 10
duration: 22
tags:
  - dns
  - resolver
  - records
  - ttl
  - resolution
summary: "How human-friendly names become IP addresses — the DNS hierarchy from root to authoritative servers, recursive resolution, the common record types, and how TTL-based caching keeps it fast."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what **DNS** does and why the internet needs it.
- Describe the DNS **hierarchy**: root, TLD, and authoritative servers.
- Walk through **recursive resolution** from a stub resolver to an answer.
- Identify common **record types** (A, AAAA, CNAME, MX, NS, TXT, PTR, SOA).
- Explain how **TTL** and caching keep DNS fast, and which transport DNS uses.

# Why It Matters

Every named connection — a website, an API, an email server — starts with a DNS lookup. When DNS is
slow or wrong, *everything* feels broken even though the network is fine. Understanding DNS turns
mysterious failures ("works by IP, not by name") into quick diagnoses, and it's essential for
deploying anything with a domain.

# Concept Explanation

### What DNS does

**DNS** (Domain Name System) translates human-friendly **names** like `example.com` into machine
addresses like `93.184.216.34`. Humans remember names; routers need numbers; DNS is the bridge. It's a
**distributed, hierarchical** database — no single machine holds all of it.

### The name hierarchy

Read a domain name **right to left**; each dot is a level in a tree:

```text
                        . (root)
                        |
            +-----------+-----------+
           com         org         net      ...  (TLDs: top-level domains)
            |
         example                                 (second-level domain)
            |
          www                                     (subdomain / host)

   Fully qualified: www.example.com.
```

- The **root** (`.`) sits at the top, served by the **13 root server identities (A–M)** — which are
  *not* 13 machines but **anycast** clusters of thousands of servers worldwide.
- **TLD** servers handle a top-level domain (`.com`, `.org`, a country code like `.uk`).
- **Authoritative** servers hold the actual records for a specific domain (`example.com`).

### Recursive resolution: who asks whom

Your device runs a lightweight **stub resolver** that just asks a **recursive resolver** (your ISP's,
or a public one like `1.1.1.1` / `8.8.8.8`) to do the legwork. The recursive resolver walks the
hierarchy:

```text
   1. Stub (your OS) -> Recursive resolver:  "IP for www.example.com?"
   2. Resolver -> a Root server:             "Ask the .com servers" (referral)
   3. Resolver -> a .com TLD server:         "Ask example.com's authoritative servers"
   4. Resolver -> example.com authoritative: "www.example.com is 93.184.216.34"
   5. Resolver -> Stub:                       "93.184.216.34"  (and caches it)
```

Steps 2–4 are **iterative** (each server refers the resolver onward); step 1/5 is the **recursive**
service the resolver provides to you. The resolver caches the answer so the next lookup is instant.

### Common record types

A DNS **zone** holds records, each a name → value mapping of a certain **type**:

```text
   A       name -> IPv4 address        example.com.   A     93.184.216.34
   AAAA    name -> IPv6 address        example.com.   AAAA  2606:2800:220:1:...
   CNAME   alias -> another name       www            CNAME example.com.
   MX      mail servers (w/ priority)  example.com.   MX    10 mail.example.com.
   NS      the zone's name servers     example.com.   NS    ns1.example.com.
   TXT     free-form text (SPF, etc.)  example.com.   TXT   "v=spf1 ..."
   PTR     IP -> name (reverse DNS)    ...in-addr.arpa PTR  example.com.
   SOA     zone's authority/metadata   example.com.   SOA   ns1... admin... serial ...
```

Two gotchas: an **MX** record points to a **name** (not an IP), and includes a **priority** (lower =
preferred). A **CNAME** must **not** sit at the zone apex (`example.com` itself) or coexist with other
records at the same name.

### TTL and caching

Every record carries a **TTL** (Time To Live) in seconds — how long resolvers may cache it before
re-asking. A high TTL (e.g. 86400 = 1 day) means fast, cache-friendly lookups but slow propagation of
changes; a low TTL (e.g. 300 = 5 min) propagates changes quickly but increases query load. That's why
you **lower TTLs before a planned migration**, then raise them after.

### Which transport DNS uses

DNS queries usually travel over **UDP port 53** (fast, connectionless, one packet each way). When a
response is too large or for **zone transfers**, DNS falls back to **TCP port 53**. Plain DNS is
**unencrypted**; privacy variants **DoH** (DNS over HTTPS) and **DoT** (DNS over TLS) add encryption.

```bash
dig example.com A +short        # -> 93.184.216.34
dig example.com MX              # show mail servers with priorities
dig +trace example.com          # walk the hierarchy root -> TLD -> authoritative
```

# Key Terminology

- **DNS** — the system that resolves domain names to IP addresses (and other records).
- **Resolver (stub / recursive)** — the client that asks (stub) and the server that does the walk
  (recursive).
- **Root / TLD / authoritative** — the three tiers of the name hierarchy.
- **Record type** — A, AAAA, CNAME, MX, NS, TXT, PTR, SOA, each mapping a name to a value.
- **TTL** — how long a record may be cached before re-querying.
- **Zone** — the portion of the DNS tree an authoritative server is responsible for.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| TTL value | High (1 day) | Low (5 min) | High for stable records (less load); low before changes/migrations for fast propagation. |
| Resolver | ISP default | Public (1.1.1.1 / 8.8.8.8) | Public resolvers can be faster/more private; the ISP's is closest by default. |
| Alias a name | CNAME | A/AAAA record | CNAME for "follow this other name"; A/AAAA to point directly at an address (required at the apex). |

# Worked Example

Trace what happens the first time you visit `www.example.com`:

```text
1. Browser asks the OS stub resolver -> asks recursive resolver 1.1.1.1.
2. 1.1.1.1 has nothing cached, so it queries a root server -> "ask .com".
3. It queries a .com TLD server -> "ask example.com's NS (ns1.example.com)".
4. It queries ns1.example.com -> "www.example.com A = 93.184.216.34, TTL 3600".
5. 1.1.1.1 returns 93.184.216.34 and caches it for 3600s.
6. Your browser opens a TCP connection to 93.184.216.34:443.
```

The second visit within the hour skips steps 2–4 entirely — the cached answer is returned instantly.

# Real World Analogy

DNS is like asking directory assistance for a phone number. You (the **stub resolver**) don't know the
number, so you call an operator (**recursive resolver**). The operator, if they don't know it, checks a
tiered directory: the national index (**root**) points to the regional book (**TLD**), which points to
the specific company's own listing (**authoritative**), which has the exact number. The operator
remembers the answer for a while (**TTL/cache**) so the next caller gets it immediately.

# Examples

## Example 1 — Basic: a simple lookup

```bash
dig +short example.com A     # 93.184.216.34
```

One command returns the A record. Behind it, a recursive resolver may have walked the whole hierarchy —
or served it from cache in under a millisecond.

**Why this works:** the resolver hides the multi-step walk behind a single request, and caches the
result.

## Example 2 — Real-world: mail delivery via MX

To send mail to `you@example.com`, a mail server looks up the **MX** records for `example.com`, gets
`10 mail.example.com`, then resolves *that* name's A/AAAA record to an IP, and connects. The MX points
to a name and a priority, not directly to an address.

**Why this works:** MX indirection lets a domain change or load-balance mail servers without changing
the email address.

## Example 3 — Pitfall: forgetting propagation and TTL

An admin changes a site's A record but the old address keeps being used for hours. The record's TTL was
86400 (1 day), so resolvers worldwide keep serving the cached old value until it expires. They should
have lowered the TTL *before* the change.

**Why this bites:** DNS changes don't take effect until cached copies expire, so a high TTL delays
propagation.

# Common Mistakes

- **Thinking there are 13 physical root servers.** There are 13 named identities (A–M), each an
  **anycast** cluster of many machines.
- **Pointing an MX record at an IP address.** MX records point to a **hostname** (with a priority),
  which is then resolved.
- **Putting a CNAME at the zone apex.** A CNAME can't sit at `example.com` itself or coexist with other
  records at the same name.
- **Ignoring TTL when changing records.** Cached copies persist until the TTL expires.

# Best Practices

- **Lower the TTL** a day before a planned DNS change; raise it again once the change is stable.
- Use `dig` (with `+trace` / `+short`) to see exactly what's returned and where it comes from.
- Remember DNS is mostly **UDP/53**, falling back to **TCP/53**; consider **DoH/DoT** for privacy.
- Keep the hierarchy in mind when debugging: is it the resolver, the TLD, or the **authoritative**
  server that's wrong?

# Summary

- **DNS** resolves names to addresses using a **distributed, hierarchical** database.
- The hierarchy is **root → TLD → authoritative**; the **13 root identities** are anycast clusters, not
  single machines.
- A **stub resolver** asks a **recursive resolver**, which walks the tree and **caches** the answer.
- Common records: **A/AAAA** (addresses), **CNAME** (alias), **MX** (mail, by name + priority),
  **NS**, **TXT**, **PTR**, **SOA**.
- **TTL** controls caching; DNS uses **UDP/53** (falling back to **TCP/53**) and is unencrypted unless
  DoH/DoT is used.

# Flash Cards

Q: What does DNS do?
A: It translates human-friendly domain names (like example.com) into IP addresses (and other records), using a distributed, hierarchical database.

Q: What are the three tiers of the DNS hierarchy?
A: Root servers, TLD (top-level domain) servers, and authoritative servers for the specific domain.

Q: Are there really only 13 root servers?
A: There are 13 named root-server identities (A–M), but each is served by many machines via anycast — thousands of instances worldwide.

Q: What does an MX record point to, and what extra value does it carry?
A: It points to a mail server's hostname (not an IP) and includes a priority number, where lower is preferred.

Q: What does a record's TTL control?
A: How long resolvers may cache the record before re-querying; high TTLs are cache-friendly but slow to propagate changes.

Q: Which transport and port does DNS normally use?
A: UDP port 53 for most queries, falling back to TCP port 53 for large responses and zone transfers.

# Exercises

### Easy
Use `dig +short example.com A` and `dig example.com MX`. Write down the address(es) returned and the
mail-server hostname(s) with their priorities.

### Medium
Run `dig +trace example.com` and describe each stage of the walk: which server referred the resolver
onward at root, at the TLD, and at the authoritative level.

### Challenging
You're migrating a website to a new IP next week. Describe the TTL strategy you'd use before and after
the change, and explain what would go wrong if you left a 24-hour TTL in place during the switch.

# Further Reading

- IETF — *Domain Names: Concepts and Facilities* (RFC 1034): <https://www.rfc-editor.org/rfc/rfc1034>
- IETF — *Domain Names: Implementation and Specification* (RFC 1035): <https://www.rfc-editor.org/rfc/rfc1035>
- Cloudflare — *What is DNS?*: <https://www.cloudflare.com/learning/dns/what-is-dns/>
- `man dig`: <https://man.archlinux.org/man/dig.1>
