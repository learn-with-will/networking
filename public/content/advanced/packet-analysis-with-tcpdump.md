---
id: lesson-21
slug: packet-analysis-with-tcpdump
title: "Packet Analysis with tcpdump"
level: advanced
order: 21
duration: 22
tags:
  - tcpdump
  - packet-capture
  - bpf
  - pcap
  - analysis
summary: "Seeing the actual bytes on the wire — capturing traffic with tcpdump, writing capture filters, reading a TCP handshake in the output, and saving pcap files for deeper analysis."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what **packet capture** is and when it's the right tool.
- Run **tcpdump** on a chosen interface with a capture **filter**.
- Read tcpdump output well enough to recognize a **TCP handshake**.
- Save captures to a **pcap** file for analysis in tools like Wireshark.
- Capture responsibly — only traffic you're **authorized** to inspect.

# Why It Matters

When higher-level tools disagree with reality — "the request looks fine but the server never sees it" —
**packet capture** settles it by showing the actual bytes on the wire. `tcpdump` is the ubiquitous
command-line capture tool: it's on nearly every server, needs no GUI, and turns "I think" into "I can
see." It's the ground truth beneath `curl`, `dig`, and `traceroute`.

# Concept Explanation

### What packet capture is

**Packet capture** records frames as they arrive at or leave a network interface, letting you inspect
their real headers and (for unencrypted traffic) contents. **tcpdump** captures and prints them; it uses
the **BPF** (Berkeley Packet Filter) system to select only the packets you care about, so you aren't
drowned in traffic.

> **Authorization first.** Capturing traffic can expose sensitive data. Only capture on networks and
> hosts you **own or are explicitly authorized** to monitor. Note that TLS-encrypted payloads appear as
> ciphertext — you'll see the connection, ports, and TLS handshake metadata, but not the decrypted
> application data.

### Choosing an interface and a filter

```bash
tcpdump -D                          # list capturable interfaces
sudo tcpdump -i eth0                # capture on eth0 (needs privileges)
sudo tcpdump -i any                 # capture on all interfaces
```

A **capture filter** (BPF expression) limits what you record:

```bash
sudo tcpdump -i eth0 host 93.184.216.34         # only traffic to/from that host
sudo tcpdump -i eth0 port 443                    # only port 443 (either direction)
sudo tcpdump -i eth0 tcp and port 80             # TCP on port 80
sudo tcpdump -i eth0 'src 10.0.0.5 and dst port 53'   # DNS queries from one host
```

Useful flags: `-n` (don't resolve names/ports — faster and clearer), `-c 10` (stop after 10 packets),
`-v`/`-vv` (more detail), `-A` (print payload as ASCII), `-e` (show link-layer/MAC headers).

### Reading the output

A typical line (with `-n`) looks like:

```text
   12:00:01.123456 IP 10.0.0.5.52344 > 93.184.216.34.443: Flags [S], seq 12345, win 64240, ...
   |__ timestamp    |  src IP.port    dst IP.port         |__ TCP flags   |__ seq/window
```

The **Flags** field is the key to reading TCP:

```text
   [S]     SYN            (connection request)
   [S.]    SYN-ACK        ("." means ACK)
   [.]     ACK
   [P.]    PSH-ACK        (data pushed)
   [F.]    FIN-ACK        (closing)
   [R]     RST            (reset/refused)
```

So a healthy connection start reads as `[S]` → `[S.]` → `[.]` — the three-way handshake you learned,
now visible on the wire.

### Saving to pcap for deeper analysis

Printed output is fine for quick checks, but for real analysis, **write a pcap file** and open it in a
graphical analyzer:

```bash
sudo tcpdump -i eth0 -w capture.pcap port 443      # write raw packets to a file
sudo tcpdump -r capture.pcap                        # read/replay a saved capture
```

`capture.pcap` can be opened in **Wireshark**, which decodes protocols, follows TCP streams, and charts
timing far beyond what the terminal shows. A common workflow: **capture headless with tcpdump on a
server, analyze the pcap in Wireshark on your laptop.**

### Reading a capture to diagnose

Capture turns vague symptoms into concrete evidence:

```text
   Symptom: "connections to the API hang."
   Capture: you see [S] sent repeatedly but never a [S.] back
            -> the SYN isn't being answered (firewall drop? wrong host? service down?).
   Or:      you see [S] -> [R]
            -> the port is actively refused (nothing listening / rejected).
```

The flag sequence tells you *where* in the connection it fails — before you touch the application.

# Key Terminology

- **Packet capture** — recording frames at a network interface for inspection.
- **tcpdump** — the standard CLI capture-and-print tool.
- **BPF (capture filter)** — an expression that selects which packets to record.
- **Flags (S, S., ., P., F., R)** — TCP control bits shown per packet.
- **pcap** — the capture file format read by Wireshark and other analyzers.
- **Promiscuous mode** — an interface mode that captures frames not addressed to the host (where
  permitted).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Where to analyze | tcpdump terminal output | Save pcap → Wireshark | Terminal for a quick yes/no; pcap + Wireshark for deep, protocol-aware analysis. |
| Filtering | Capture everything, filter later | Tight capture filter | Tight filter on busy links (less noise/CPU); capture-all when you're unsure what you need. |
| Name resolution | Resolve names/ports | `-n` (numeric) | `-n` for speed and clarity, especially on busy or DNS-flaky hosts. |

# Worked Example

Capture and read a TCP handshake to a web server:

```bash
sudo tcpdump -ni any -c 6 'host 93.184.216.34 and port 443'
# 12:00:01.100 IP 10.0.0.5.52344 > 93.184.216.34.443: Flags [S],  seq 1000
# 12:00:01.140 IP 93.184.216.34.443 > 10.0.0.5.52344: Flags [S.], seq 9000, ack 1001
# 12:00:01.141 IP 10.0.0.5.52344 > 93.184.216.34.443: Flags [.],  ack 9001
# 12:00:01.142 IP 10.0.0.5.52344 > 93.184.216.34.443: Flags [P.], ... (TLS ClientHello)
```

The first three lines are the handshake (`[S]`, `[S.]`, `[.]`); the fourth is the client starting TLS.
If the second line never appeared, you'd know the SYN went unanswered — a network/firewall problem, not
an application bug.

# Real World Analogy

tcpdump is like putting a **wiretap with a transcript** on a phone line you're allowed to monitor. A
**capture filter** is telling the recorder "only log calls to/from this number" so you don't drown in
everything. The **flags** are like noting each call's stage — "rang," "answered," "hung up." And saving
a **pcap** for Wireshark is like handing the recording to an analyst with better equipment to slow it
down and study it. Crucially, you only tap lines you're **authorized** to — and if the callers spoke in
code (**TLS**), you hear that a call happened but not what was said.

# Examples

## Example 1 — Basic: is anything hitting port 22?

```bash
sudo tcpdump -ni eth0 port 22
```

Watch live whether SSH connection attempts arrive. Silence means nothing is reaching the port; a burst
of `[S]` packets from many IPs might be a scan.

**Why this works:** a port-scoped capture shows exactly what traffic reaches that service, in real time.

## Example 2 — Real-world: proving the request left the box

An app "sends" a webhook that the receiver never gets. Capturing on the sender shows **no** packets to
the receiver's IP on the expected port — proving the request never left, so the bug is local (config,
DNS, or firewall), not the receiver.

**Why this works:** capture is ground truth; if the packet isn't on the wire, the problem is on the
sending side.

## Example 3 — Pitfall: expecting to read encrypted payloads

An engineer captures HTTPS traffic hoping to see the JSON body, but sees only the TLS handshake and
encrypted bytes. TLS encrypts the payload, so capture reveals metadata (IPs, ports, timing, SNI) but not
the plaintext.

**Why this bites:** packet capture can't decrypt TLS without the keys; to inspect encrypted app data you
need logging at the endpoints or a controlled TLS key export — not a passive capture.

# Common Mistakes

- **Capturing without authorization.** Only capture traffic you own or are explicitly permitted to
  monitor.
- **Expecting to read TLS payloads.** Encrypted content stays encrypted; you see metadata, not
  plaintext.
- **Forgetting `-n`.** Name resolution adds noise and delay; use numeric output for clarity.
- **Capturing everything on a busy link.** Use a tight filter or you'll overwhelm the terminal and the
  host.

# Best Practices

- Always confirm you're **authorized** to capture on the interface/network in question.
- Start with a **tight capture filter** (`host`, `port`, `tcp`) and `-n` to cut noise.
- For anything beyond a quick check, **write a pcap** (`-w`) and analyze in **Wireshark**.
- Read the **TCP flags** to localize failures: no `[S.]` = SYN unanswered; `[R]` = refused.

# Summary

- **Packet capture** shows the real bytes on the wire; **tcpdump** captures and prints them using **BPF**
  filters.
- Scope captures with filters (`host`, `port`, `tcp`) and `-n`; a handshake reads as **`[S]` → `[S.]` →
  `[.]`**.
- Save to a **pcap** with `-w` and analyze in **Wireshark** for protocol-aware, deep inspection.
- Flag sequences localize failures — **no SYN-ACK** means the SYN was dropped; **`[R]`** means refused.
- Capture **only what you're authorized to**, and remember **TLS payloads stay encrypted** (metadata
  only).

# Flash Cards

Q: What does tcpdump do, and what selects which packets it records?
A: tcpdump captures and prints packets at a network interface; a BPF capture filter (e.g. 'host X and port 443') selects which packets to record.

Q: How does a TCP handshake appear in tcpdump's Flags field?
A: As [S] (SYN), then [S.] (SYN-ACK), then [.] (ACK) — the three-way handshake, where "." denotes ACK.

Q: If you capture and see [S] sent repeatedly but never [S.], what does that suggest?
A: The SYN is going unanswered — likely a firewall drop, wrong host, or a service that's down — not an application-level bug.

Q: How do you save captured packets for analysis in Wireshark?
A: Write them to a pcap file with tcpdump -w capture.pcap, then open that file in Wireshark.

Q: Can packet capture read HTTPS/TLS application data?
A: No — TLS encrypts the payload, so you see metadata (IPs, ports, timing, the TLS handshake, SNI) but not the plaintext.

Q: What must you confirm before capturing traffic?
A: That you own or are explicitly authorized to monitor the network/host, since captures can expose sensitive data.

# Exercises

### Easy
On a host you control, run `sudo tcpdump -ni any -c 5 port 443` while loading an HTTPS site in another
window. Identify the handshake packets by their flags.

### Medium
Write tcpdump capture filters for: (a) all DNS traffic, (b) TCP traffic to a specific host on port 22,
(c) only packets from your own IP. Explain what each would and wouldn't capture.

### Challenging
An outbound webhook "isn't being received." Describe how you'd use tcpdump on both the sender and (if
permitted) the receiver to determine whether the request left the sender, reached the receiver, and got
a response — and what each observed flag sequence would tell you. Note what you could and couldn't see
if the connection is HTTPS.

# Further Reading

- `man tcpdump` / tcpdump project: <https://www.tcpdump.org/manpages/tcpdump.1.html>
- Wireshark — *User's Guide*: <https://www.wireshark.org/docs/wsug_html_chunked/>
- tcpdump — *pcap-filter (BPF) syntax*: <https://www.tcpdump.org/manpages/pcap-filter.7.html>
- Cloudflare — *What is packet loss / packet capture concepts*: <https://www.cloudflare.com/learning/network-layer/what-is-a-packet/>
