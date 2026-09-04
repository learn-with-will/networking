---
id: lesson-06
slug: ports-and-sockets
title: "Ports and Sockets"
level: beginner
order: 6
duration: 18
tags:
  - ports
  - sockets
  - tcp
  - udp
  - five-tuple
summary: "How one host runs many network services at once — port numbers and their ranges, the socket as an endpoint, and the five-tuple that uniquely identifies a connection."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **port** is and why a host needs them.
- State the **port number range** and the well-known / registered / ephemeral bands.
- Recall common default ports (HTTP, HTTPS, DNS, SSH, DHCP).
- Define a **socket** and the **five-tuple** that identifies a connection.
- Explain why TCP port 80 and UDP port 80 are **different** ports.

# Why It Matters

An IP address gets data to the right *machine*, but a machine runs many programs at once — a web
server, an SSH daemon, a database. **Ports** are how the machine knows which program a packet is for.
Every time you run a server on `:3000`, open a firewall rule, or read `ss -tlnp`, you are working with
ports and sockets. They're the address system *inside* a host.

# Concept Explanation

### A port identifies a service on a host

A **port** is a **16-bit number (0–65535)** in the TCP or UDP header that identifies which application
endpoint a packet belongs to. If the IP address is the building's street address, the port is the
apartment number inside. A packet carries both a **source port** and a **destination port**.

When a server "listens on port 443," the operating system sends any incoming packet with destination
port 443 to that server process. Two programs can't listen on the same port + protocol at once — that's
why you get "address already in use."

### Port ranges (IANA)

IANA divides the port space into three bands:

```text
   0     – 1023    Well-known ports     (HTTP 80, HTTPS 443, SSH 22, DNS 53 ...)
   1024  – 49151   Registered ports     (assigned to specific apps, e.g. 3306 MySQL)
   49152 – 65535   Dynamic / ephemeral  (temporary source ports for outgoing connections)
```

- **Well-known** ports are for standard services; binding to them usually requires elevated
  privileges.
- **Registered** ports are reserved by IANA for particular applications.
- **Ephemeral** ports are picked automatically by your OS as the **source port** when *you* start an
  outgoing connection.

### Common default ports worth memorizing

```text
   20/21  FTP            53   DNS            443  HTTPS
   22     SSH            67/68 DHCP          587  SMTP (submission)
   25     SMTP           80    HTTP          3306 MySQL
   23     Telnet         123   NTP           5432 PostgreSQL
```

These are **defaults**, not laws — you can run HTTP on 8080 or SSH on 2222. Following defaults just
means clients know where to look.

### A socket is an endpoint

A **socket** is one end of a network connection: the combination of an **IP address and a port**
(plus the transport protocol). Programs open a socket to send/receive data. A server socket **binds**
to an address+port and **listens**; a client socket **connects** to the server's address+port.

```text
   Server socket:  0.0.0.0:443    (listening on all interfaces, port 443)
   Client socket:  192.168.1.10:52344   (an ephemeral source port)
```

### The five-tuple uniquely identifies a connection

A single server port (say 443) can handle thousands of simultaneous clients. How does the OS keep them
apart? Each **connection** is identified by a **five-tuple**:

```text
   ( protocol , source IP , source port , destination IP , destination port )
```

Because every client uses a different source IP and/or ephemeral source port, each connection's
five-tuple is unique — even though they all share the server's destination port 443.

```text
   TCP  203.0.113.7 : 52344  ->  198.51.100.9 : 443     connection A
   TCP  203.0.113.7 : 52345  ->  198.51.100.9 : 443     connection B  (different source port)
   TCP  192.0.2.5   : 40001  ->  198.51.100.9 : 443     connection C  (different source IP)
```

### TCP port 80 and UDP port 80 are different

Ports are **per transport protocol**. There is a TCP port 80 *and* a separate UDP port 80; they are
unrelated namespaces. That's why a firewall rule must specify the protocol, and why `ss -t` (TCP) and
`ss -u` (UDP) show different sockets.

# Key Terminology

- **Port** — a 16-bit number (0–65535) identifying an application endpoint within a host.
- **Well-known ports** — 0–1023, standard services (HTTP 80, HTTPS 443, SSH 22, DNS 53).
- **Ephemeral ports** — 49152–65535, temporary source ports the OS assigns to outgoing connections.
- **Socket** — one endpoint of a connection: an IP address + port (for a given protocol).
- **Bind / listen** — a server claims an address+port and waits for connections.
- **Five-tuple** — (protocol, source IP, source port, dest IP, dest port); uniquely identifies a flow.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Server port | Standard default (443) | Custom (8443) | Defaults let clients find you automatically; custom ports avoid conflicts or add mild obscurity. |
| Listen address | `0.0.0.0` (all interfaces) | `127.0.0.1` (localhost only) | Bind to localhost for local-only services; all-interfaces to accept remote clients. |
| Identify a flow | By destination port alone | By the full five-tuple | The five-tuple — many clients share one server port, so the tuple is what's unique. |

# Worked Example

Inspect what's listening on your machine and trace a connection:

```bash
ss -tlnp        # TCP sockets that are Listening, numeric, with process names
# Example output:
# LISTEN  0  128   0.0.0.0:22     0.0.0.0:*   users:(("sshd",...))
# LISTEN  0  511   127.0.0.1:5432 0.0.0.0:*   users:(("postgres",...))
```

- `0.0.0.0:22` — the SSH server accepts connections on port 22 from any interface.
- `127.0.0.1:5432` — PostgreSQL listens only on localhost, so remote hosts can't reach it.

Now an outgoing web request creates a client socket with an ephemeral source port and the server's port
443 as destination — a unique five-tuple the OS tracks until the connection closes.

# Real World Analogy

A host is an **apartment building** and its IP address is the **street address**. **Ports** are the
**apartment numbers** — mail (packets) for "apartment 443" goes to the web-server tenant, "apartment
22" to the SSH tenant. A **socket** is a specific mailbox (this building, this apartment). The
**five-tuple** is like a full conversation record: who wrote (source building+apartment), to whom
(destination building+apartment), and by which postal service (protocol) — enough to keep every
back-and-forth separate even when many letters go to the same apartment.

# Examples

## Example 1 — Basic: running a dev server

You start a local web app and it prints `listening on http://localhost:3000`. Port **3000** is in the
registered/ephemeral area, and `localhost` means it binds to `127.0.0.1` — reachable from your machine
but not from other devices, unless you bind to `0.0.0.0`.

**Why this works:** the bind address controls *who* can reach the service; the port controls *which*
service the packets go to.

## Example 2 — Real-world: thousands of clients on one port

A busy web server listens on a single port 443 yet serves 10,000 simultaneous users. Each user's
connection has a distinct five-tuple (different client IP and/or source port), so the OS routes each
packet to the correct connection without confusion.

**Why this works:** the connection identity is the whole five-tuple, not just the shared destination
port.

## Example 3 — Pitfall: forgetting protocol matters

An admin opens "port 53" on a firewall for DNS but only allows **TCP**. Most DNS uses **UDP/53**, so
lookups still fail. TCP 53 and UDP 53 are different ports and must be allowed separately.

**Why this bites:** ports are per-protocol; a rule that ignores the protocol can silently block the
traffic you meant to allow.

# Common Mistakes

- **Thinking a port belongs to a machine, not a service.** A port identifies an application endpoint
  *within* the host.
- **Believing TCP and UDP share port numbers.** They have **separate** port spaces; specify the
  protocol.
- **Confusing bind address with port.** `127.0.0.1:3000` vs `0.0.0.0:3000` changes *who* can connect,
  not *which* service.
- **Identifying a connection by destination port alone.** Use the full **five-tuple** — many clients
  share one server port.

# Best Practices

- Bind services to **`127.0.0.1`** unless remote access is truly needed; expose deliberately.
- Use **standard ports** for standard services so clients and tooling find them.
- When writing firewall rules, always specify **protocol + port** (e.g. `tcp/443`, `udp/53`).
- Use `ss -tulnp` to see exactly which processes are listening on which ports and protocols.

# Summary

- A **port** is a 16-bit number (0–65535) identifying an application endpoint on a host.
- Ranges: **well-known 0–1023**, **registered 1024–49151**, **ephemeral 49152–65535**.
- A **socket** is an endpoint (IP + port for a protocol); servers **bind/listen**, clients **connect**.
- A connection is uniquely identified by its **five-tuple** — so one server port serves many clients.
- Ports are **per-protocol**: TCP 80 and UDP 80 are different ports.

# Flash Cards

Q: What is a port, and what is its numeric range?
A: A 16-bit number (0–65535) in the TCP/UDP header identifying which application endpoint on a host a packet belongs to.

Q: What are the three IANA port bands?
A: Well-known (0–1023), registered (1024–49151), and dynamic/ephemeral (49152–65535).

Q: What is a socket?
A: One endpoint of a connection — an IP address plus a port for a given transport protocol.

Q: What five values make up the tuple that uniquely identifies a connection?
A: Protocol, source IP, source port, destination IP, and destination port (the five-tuple).

Q: Are TCP port 80 and UDP port 80 the same port?
A: No. Ports are per-protocol, so TCP 80 and UDP 80 are separate; firewall rules must name the protocol.

Q: What are the default ports for HTTP, HTTPS, SSH, and DNS?
A: HTTP 80, HTTPS 443, SSH 22, and DNS 53.

# Exercises

### Easy
Run `ss -tulnp` (or `netstat -tulnp`) on your machine. List three listening services with their port,
protocol, and whether they bind to localhost or all interfaces.

### Medium
Explain how a single web server on port 443 can keep 1,000 client connections separate. Write out two
example five-tuples that share the server's port but are still distinct.

### Challenging
An admin opened `tcp/53` for DNS but lookups still fail. Diagnose why, and write the corrected firewall
rule(s). Then explain the general principle about ports and protocols this illustrates.

# Further Reading

- IANA — *Service Name and Transport Protocol Port Number Registry*: <https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml>
- Beej's Guide to Network Programming (sockets): <https://beej.us/guide/bgnet/>
- Cloudflare — *What is a computer port?*: <https://www.cloudflare.com/learning/network-layer/what-is-a-computer-port/>
- `man ss` — inspecting sockets on Linux: <https://man7.org/linux/man-pages/man8/ss.8.html>
