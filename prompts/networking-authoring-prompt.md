# Computer Networking Course — Authoring Prompt & No-Hallucination Contract

This file is the contract for writing and maintaining the **Computer Networking** course in this
repo. Every lesson and quiz must obey it. The goal: a beginner-friendly, **source-verified** course
on how the internet actually works for developers — the layered models, addressing and subnetting,
DNS, the transport protocols, HTTP/HTTPS and TLS, routing and NAT, and hands-on troubleshooting with
real CLI tools — with **zero invented facts**.

## Audience & voice

- **Suitable for everyone.** Assume the reader is new to networking and may be new to the command
  line. Define every term the first time it appears. Prefer short sentences and concrete examples.
- Explain the *why*, not just the *how*. Use **one plain-language analogy per lesson** (the postal
  system, a phone book, an apartment building's mailboxes, a highway, etc.).
- Be honest about limits and simplifications. Networking is full of "it depends" — say so. Never
  present a simplification as the whole truth without flagging it ("in practice…", "simplified…").
- Keep commands **minimal and runnable** on a normal Linux/macOS shell using standard tools
  (`ping`, `traceroute`, `dig`, `curl`, `ss`/`netstat`, `tcpdump`, `ip`/`ifconfig`, `nc`). Show
  representative output as a `text` fence when it aids understanding, and label anything that will
  vary between machines/networks. Never invent specific output (real IPs, exact timings, TTLs) as if
  it were universal — mark it as an example.

## Currency & honesty

- Protocols and tools evolve. Do **not** hard-code exact version numbers, benchmark timings, or
  "fastest/best" claims as fixed facts. Say "as of writing" and link the current spec/docs.
- Prefer the **current** standard and name the RFC. Examples that are easy to get stale-wrong:
  **TLS 1.3 (RFC 8446)** is current and SSL/TLS 1.0/1.1 are deprecated; **HTTP/1.1 semantics are
  now RFC 9110/9112**, **HTTP/2 is RFC 9113**, **HTTP/3 is RFC 9114**; **classful addressing was
  replaced by CIDR (RFC 4632)**. When you show a header, flag, or field, it must match the spec.
- Use documentation/example addresses in prose where possible: `192.0.2.0/24`, `198.51.100.0/24`,
  `203.0.113.0/24` (RFC 5737), `2001:db8::/32` (RFC 3849), and `example.com`/`example.org`
  (RFC 2606). Don't hard-code someone's real public IP.

## Authoritative sources (cite these; do not invent)

- **IETF RFCs** (the primary specs), via the RFC Editor / Datatracker — https://www.rfc-editor.org/
  and https://datatracker.ietf.org/ . Anchor claims on the relevant RFC:
  - IP (IPv4) **RFC 791**; ICMP **RFC 792**; IPv6 **RFC 8200**; TCP **RFC 9293** (obsoletes 793);
    UDP **RFC 768**; ARP **RFC 826**; DNS **RFC 1034/1035**; DHCP **RFC 2131**; CIDR **RFC 4632**;
    private addresses **RFC 1918**; link-local IPv4 **RFC 3927**; special-use registry **RFC 6890**;
    HTTP semantics **RFC 9110**, HTTP/1.1 **RFC 9112**, HTTP/2 **RFC 9113**, HTTP/3 **RFC 9114**;
    QUIC **RFC 9000**; TLS 1.3 **RFC 8446**; NAT/PAT terminology **RFC 2663/3022**; BGP **RFC 4271**.
- **IANA registries** (authoritative for numbers) — https://www.iana.org/ : the Service Name and
  Transport Protocol Port Number registry, and the IPv4/IPv6 Special-Purpose Address registries.
- **MDN Web Docs — HTTP** — https://developer.mozilla.org/en-US/docs/Web/HTTP (methods, status
  codes, headers, HTTPS).
- **Cloudflare Learning Center** — https://www.cloudflare.com/learning/ (clear conceptual overviews;
  verify specifics against the RFC).
- **Tool documentation / man pages** — `man ping`, `man traceroute`, `man dig`, `curl` docs
  (https://curl.se/docs/), `man ss`, `man tcpdump` (https://www.tcpdump.org/), `man ip`.
- **Textbooks** — *Computer Networking: A Top-Down Approach* (Kurose & Ross); *TCP/IP Illustrated*
  (Stevens); *Beej's Guide to Network Programming* (https://beej.us/guide/bgnet/) for sockets.

If a claim isn't backed by one of these (or another primary source), don't write it. If unsure,
qualify it or leave it out.

## High-risk facts to get right (anti-hallucination checklist)

These are the classic places networking material goes wrong. Getting them right is the point.

1. **OSI vs TCP/IP models.** OSI is a **7-layer reference model**; the internet runs the **TCP/IP
   model** (4 layers: link, internet, transport, application — sometimes drawn as 5 by splitting the
   link layer into physical + data-link). Map protocols correctly: **IP = layer 3 (network/
   internet)**, **TCP/UDP = layer 4 (transport)**. Don't imply the internet "uses OSI" operationally.
2. **Encapsulation & PDU names.** Going **down** the sending stack, each layer **adds a header**
   (and L2 a trailer): application data → **segment** (TCP) / **datagram** (UDP) → **packet** (IP)
   → **frame** (L2) → bits. The receiver strips them going **up**. Use the right PDU name per layer.
3. **Classful addressing is obsolete.** Teach **CIDR** (RFC 4632). Mention Class A/B/C only as
   history — do **not** present "Class C = /24" as current practice.
4. **Private ranges (RFC 1918)** — exactly: **10.0.0.0/8**, **172.16.0.0/12**
   (172.16.0.0–172.31.255.255 — *not* 172.16–172.168), **192.168.0.0/16**. Also flag **loopback
   127.0.0.0/8**, **link-local 169.254.0.0/16** (RFC 3927), and IPv6 **link-local fe80::/10**,
   **loopback ::1**, **documentation 2001:db8::/32**. Public vs private is about routability.
5. **Subnet math.** In IPv4 the **network address** (all host bits 0) and **broadcast address**
   (all host bits 1) are not usable hosts, so **usable hosts = 2^(host bits) − 2**. A **/24** = 256
   addresses, **254 usable**. Note the exceptions: **/31** (RFC 3021, point-to-point, 2 usable) and
   **/32** (single host). The mask separates network bits from host bits.
6. **IPv6 essentials.** 128-bit, written in hex groups; **`::` compresses one run of all-zero groups
   and may appear only once**. IPv6 has **no broadcast** — it uses **multicast** and **anycast**.
   Don't claim IPv6 has broadcast or reserves a broadcast address per subnet.
7. **MAC vs IP; ARP/NDP.** **MAC** is a 48-bit **layer-2** address used **within one link/broadcast
   domain**; **IP** is the routable **layer-3** address. **ARP** resolves IPv4→MAC on the local link
   (RFC 826); IPv6 uses **NDP**. Across a path the **destination MAC changes every hop**, while the
   **source/destination IP stays the same end-to-end** (except where NAT rewrites it).
8. **TCP correctly.** Connection setup is the **three-way handshake (SYN, SYN-ACK, ACK)**; teardown
   is typically **four segments (FIN/ACK each direction)**. TCP is connection-oriented, **reliable,
   ordered**, with **flow control** (receive window) and **congestion control**. **Sequence numbers
   count bytes, not segments.** TCP does **not** encrypt data (that's TLS).
9. **UDP correctly.** **Connectionless**, no delivery/ordering guarantees, no congestion control,
   **8-byte header**. "Unreliable" is a technical term, not "bad" — it's the right choice for DNS,
   real-time media, and QUIC. Reliability, if needed, is added by the application.
10. **Ports & sockets.** Ports are **16-bit (0–65535)**. IANA ranges: **well-known 0–1023**,
    **registered 1024–49151**, **dynamic/ephemeral 49152–65535**. A TCP/UDP connection is identified
    by the **5-tuple** (protocol, source IP, source port, dest IP, dest port). TCP port 80 and UDP
    port 80 are **different** ports. Common defaults: HTTP **80**, HTTPS **443**, DNS **53**, SSH
    **22**, DHCP **67/68**.
11. **DNS correctly.** Hierarchical and distributed. Resolution flow: **stub resolver → recursive
    resolver → root → TLD → authoritative**. The **13 root “servers” (A–M)** are named authorities
    served by **anycast** across many physical instances — *not* 13 machines. Records: **A** (IPv4),
    **AAAA** (IPv6), **CNAME** (alias — cannot sit at the zone apex or coexist with other records at
    the same name), **MX** (has a priority; points to a name, not an IP), **NS**, **TXT**, **PTR**
    (reverse), **SOA**. **TTL** governs caching. DNS is usually **UDP/53**, with **TCP/53** for large
    responses and zone transfers. Plain DNS is **unencrypted** (DoH/DoT add privacy).
12. **DHCP correctly.** **DORA: Discover, Offer, Request, Acknowledge.** UDP, **client port 68 /
    server port 67**, broadcast to start. Hands out IP address, subnet mask, **default gateway**, DNS
    servers, and a **lease** with a time.
13. **HTTP correctly.** **Stateless.** Method properties: **GET/HEAD are safe and idempotent; PUT
    and DELETE are idempotent but not safe; POST is neither; PATCH is not idempotent** — *safe ≠
    idempotent*. Status classes: **1xx** info, **2xx** success, **3xx** redirect, **4xx** client
    error, **5xx** server error; know **301 vs 302**, **401 (unauthenticated) vs 403 (forbidden)**,
    **404**, **429**, **500 vs 502/503/504**. HTTP is the same semantics across versions.
14. **HTTPS / TLS correctly.** **HTTPS = HTTP over TLS.** TLS provides **confidentiality, integrity,
    and server authentication** (via an X.509 **certificate** chained to a trusted **CA**). **TLS
    1.3 (RFC 8446)** is current; **“SSL” is obsolete** — say TLS. The handshake uses **asymmetric**
    crypto to agree a key, then **symmetric** crypto for bulk data. The **padlock means encrypted +
    identity-verified transport, not “this site is safe/honest.”** TLS does **not** hide the
    destination IP, and hides the **SNI** hostname only with Encrypted Client Hello.
15. **NAT correctly.** NAT (usually **PAT/“overload”** using ports, RFC 3022) maps many private
    addresses to one public address; it enables inbound only via **port forwarding**. NAT is **not a
    firewall/security feature** by design (it incidentally hides internal addresses). IPv6 largely
    removes the need for NAT.
16. **Routing vs forwarding; TTL.** **Routing** = deciding paths (building tables); **forwarding** =
    moving a packet to the next hop. Routers use **longest-prefix match**; **0.0.0.0/0** is the
    default route. IP is **best-effort, hop-by-hop**. The **TTL / hop limit** is **decremented each
    hop**; at 0 the router drops it and returns **ICMP Time Exceeded** — which is how **traceroute**
    works. **BGP (RFC 4271)** is the internet's inter-domain routing protocol; OSPF/IS-IS/RIP are
    interior.
17. **ICMP & ping.** **ICMP** is its own layer-3 protocol (RFC 792), **not** TCP or UDP. **ping**
    uses ICMP **Echo Request/Reply** and reports **round-trip time (RTT)**. Some hosts/firewalls drop
    ICMP, so "no ping reply" does not always mean "host down."
18. **Bandwidth vs throughput vs latency.** **Bandwidth** = maximum capacity; **throughput** =
    actual achieved rate; **latency** = delay (often **RTT**). They are distinct. Watch units:
    network rates are in **bits/second** (Mb/s), storage in **bytes** (**8 bits = 1 byte**) — don't
    confuse MB and Mb. TCP throughput is bounded by **window / RTT**.
19. **MTU / MSS / fragmentation.** Ethernet payload **MTU is typically 1500 bytes**; the TCP **MSS**
    is derived from it. Oversized IP packets are fragmented (IPv4) or dropped with "Packet Too Big"
    (IPv6, which does **not** fragment in transit). Don't quote MTU as a universal constant.
20. **HTTP/2 vs HTTP/3.** **HTTP/2** (RFC 9113) is **binary framing + multiplexing over one TCP
    connection** with **HPACK** header compression — but still suffers **TCP head-of-line blocking**.
    **HTTP/3** (RFC 9114) runs over **QUIC** (RFC 9000), which is over **UDP**, and has **TLS 1.3
    built in**. Don't say HTTP/2 uses UDP — it's **TCP**.

## Lesson structure (match the shell + the other courses)

Front-matter (YAML): `id` (`lesson-NN`), `slug`, `title`, `level` (`beginner|intermediate|advanced`),
`order` (1–24), `duration` (minutes), `tags` (**exactly 5**), `summary` (one sentence — used to
generate the manifest). Then these H1 (`#`) sections, in order:

`Learning Objectives` · `Why It Matters` · `Concept Explanation` (use `###` subsections) ·
`Key Terminology` · `Options and Trade-offs` (a table) · `Worked Example` · `Real World Analogy` ·
`Examples` (`## Example 1/2/3`: basic, real-world, pitfall) · `Common Mistakes` · `Best Practices` ·
`Summary` · `Flash Cards` (≥5 `Q:`/`A:` pairs; put **6**) · `Exercises`
(`### Easy/Medium/Challenging`) · `Further Reading` (links to the sources above).

## Code fences (only these languages — enforced by the validator)

`bash` (command-line tool sessions — `ping`, `dig`, `curl`, `traceroute`, `ss`, `tcpdump`, `ip`,
`nc`, and their output shown inline) and `text` (packet/segment/header field layouts, ASCII network
topology, address/subnet tables, and raw console output). **No other fence languages** — this topic
has no application source language, so there is deliberately no `python`/`js`/etc.

## Curriculum (24 lessons, 8/8/8)

Beginner: 01 what-is-a-network · 02 osi-and-tcp-ip-models · 03 ip-addresses · 04
mac-addresses-and-the-link-layer · 05 packets-frames-and-encapsulation · 06 ports-and-sockets · 07
client-server-model · 08 first-networking-tools.

Intermediate: 09 subnetting-and-cidr · 10 dns-the-internet-phonebook · 11 dhcp-and-auto-configuration
· 12 tcp-reliable-delivery · 13 udp-connectionless-delivery · 14 http-the-web-protocol · 15
https-and-tls · 16 troubleshooting-dig-curl-traceroute.

Advanced: 17 routing-and-packet-forwarding · 18 nat-and-port-forwarding · 19
firewalls-and-network-security · 20 load-balancing-and-reverse-proxies · 21
packet-analysis-with-tcpdump · 22 http2-http3-and-quic · 23 network-performance · 24
capstone-trace-a-request.

## Quizzes

One per lesson: `public/quizzes/lesson-NN.json`, `id` `quiz-lesson-NN`, `lessonId` `lesson-NN`,
`passingScore` 60, **5–6 questions spanning the five types** (`single-choice`, `multiple-choice`,
`fill-blank`, `ordering`, `match-pair`). Every answer must be **traceable to the lesson text**; add
an `explanation` to each. Keep `fill-blank` answers short and provide case/format variants (e.g.
`["443", "port 443"]`). Use the quiz to reinforce the anti-hallucination points above — especially
the subnet "− 2" rule, TCP vs UDP, the DNS resolution order, HTTP idempotency/status codes, TLS
guarantees, NAT-is-not-a-firewall, and how traceroute uses TTL.
