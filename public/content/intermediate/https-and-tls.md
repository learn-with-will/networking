---
id: lesson-15
slug: https-and-tls
title: "HTTPS and TLS: Encryption on the Wire"
level: intermediate
order: 15
duration: 22
tags:
  - https
  - tls
  - certificates
  - encryption
  - handshake
summary: "How the Web is secured — TLS provides confidentiality, integrity, and server authentication via certificates, using asymmetric crypto to agree a key and symmetric crypto for the data."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain that **HTTPS = HTTP over TLS** and what **TLS** guarantees.
- Describe the roles of **asymmetric** and **symmetric** cryptography in TLS.
- Explain how **certificates** and **certificate authorities (CAs)** establish server identity.
- Outline the **TLS handshake** at a high level.
- State accurately what the **padlock** does and does not mean.

# Why It Matters

Anything private on the Web — logins, payments, personal data — depends on **TLS**. Getting the mental
model right protects you from dangerous misconceptions ("the padlock means the site is trustworthy")
and helps you debug certificate errors, mixed content, and handshake failures. TLS is also the security
layer beneath HTTP/2 and HTTP/3, so understanding it pays off across the stack.

# Concept Explanation

### HTTPS is HTTP over TLS

Plain **HTTP** sends everything in the clear — anyone on the path can read or alter it. **HTTPS** is the
exact same HTTP, wrapped in **TLS** (Transport Layer Security), which runs between TCP and HTTP:

```text
   HTTP                         HTTPS
   [ HTTP ]                     [ HTTP ]
   [ TCP  ]                     [ TLS  ]   <- encryption/authentication added here
   [ IP   ]                     [ TCP  ]
                                [ IP   ]
```

TLS provides three guarantees:

- **Confidentiality** — eavesdroppers can't read the data (it's encrypted).
- **Integrity** — tampering in transit is detected (the data can't be silently altered).
- **Authentication** — the client verifies it's really talking to the intended **server** (via a
  certificate).

> Terminology: "**SSL**" is the obsolete predecessor of TLS. The modern protocol is **TLS** (current
> version **TLS 1.3**); people still say "SSL" loosely, but the secure protocol in use is TLS.

### Two kinds of cryptography, each for its strength

TLS combines two families of cryptography:

- **Asymmetric (public-key)** crypto uses a **key pair**: a public key anyone can use and a private key
  the owner keeps secret. It's great for establishing trust and agreeing on a secret, but slow.
- **Symmetric** crypto uses **one shared key** for both encrypting and decrypting. It's fast, ideal for
  bulk data — but both sides must already share the key.

TLS uses **asymmetric** crypto during the handshake to **authenticate the server and agree on a shared
symmetric key**, then switches to fast **symmetric** encryption for the actual data. Best of both.

### Certificates and the chain of trust

How do you know the public key really belongs to `example.com` and not an impostor? A **certificate**:
a document binding a domain name to a public key, **digitally signed** by a **Certificate Authority
(CA)** your system already trusts.

```text
   Root CA (trusted by your OS/browser)
        signs
   Intermediate CA
        signs
   example.com's certificate  (contains example.com's public key + domain name)
```

Your browser ships with a list of trusted **root** CAs. It verifies the chain from the server's
certificate up to a trusted root; if the chain is valid, unexpired, and the name matches, the identity
checks out. A broken chain, expired cert, or name mismatch triggers the scary browser warning.

### The TLS handshake (simplified, TLS 1.3)

Before any HTTP flows, TLS negotiates security:

```text
   1. Client Hello   -> supported versions/ciphers, a key-share, and the SNI (server name)
   2. Server Hello   <- chosen cipher, its key-share, and its certificate
   3. Client verifies the certificate chain and that the name matches.
   4. Both derive the same symmetric session key from the exchanged key-shares.
   5. Encrypted application data (your HTTP request) flows using that key.
```

TLS 1.3 streamlined this to effectively one round trip. The **SNI** (Server Name Indication) tells the
server which site you want (so one IP can serve many HTTPS sites) — but note the SNI hostname is sent
**before** encryption is fully established, so it is visible on the wire unless **Encrypted Client
Hello** is used.

### What the padlock really means

The padlock means the connection is **encrypted and the server's identity was verified** against a
trusted certificate for that domain. It does **not** mean the site is honest, safe, or reputable — a
phishing site can obtain a valid certificate for its own domain. TLS secures the **channel**, not the
**intentions** of whoever is on the other end. TLS also does **not** hide the destination **IP
address**.

# Key Terminology

- **TLS** — the protocol providing confidentiality, integrity, and authentication (current: TLS 1.3).
- **HTTPS** — HTTP carried over TLS.
- **Asymmetric / symmetric crypto** — key-pair (trust, key agreement) vs shared-key (fast bulk data).
- **Certificate** — a signed binding of a domain name to a public key.
- **Certificate Authority (CA)** — a trusted issuer that signs certificates.
- **Chain of trust** — the path from a server's certificate up to a trusted root CA.
- **SNI** — the hostname the client indicates so one IP can serve many TLS sites.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Transport security | Plain HTTP | HTTPS (TLS) | Always HTTPS for anything non-trivial; plain HTTP exposes and allows tampering. |
| Cipher for bulk data | Asymmetric | Symmetric | Symmetric — it's far faster; asymmetric is used only to bootstrap the shared key. |
| Certificate source | Public CA | Self-signed | Public CA for anything users reach (auto-trusted); self-signed only for internal/testing (manual trust). |

# Worked Example

Inspect a site's TLS with `curl`:

```bash
curl -v https://example.com/ 2>&1 | grep -Ei "SSL|TLS|subject|issuer"
# * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
# * Server certificate:
# *  subject: CN=example.com
# *  issuer: C=US; O=... (the CA)
```

You can see the negotiated **TLS version and cipher**, the certificate's **subject** (the domain it's
for), and its **issuer** (the CA that signed it). If the subject didn't match `example.com`, or the
issuer weren't trusted, the connection would fail.

# Real World Analogy

TLS is like verifying a **passport** before a private conversation. The certificate is the passport; the
**CA** is the government whose seal you trust. You check the passport is genuine (signed by a trusted
authority), unexpired, and that the photo/name matches the person in front of you (**domain match**).
Only then do you agree on a **shared secret code** (symmetric key) and speak privately. Crucially, a
valid passport proves *who* someone is — not that they're a *good* person. The padlock is the same: it
proves identity and privacy of the channel, not the honesty of the other party.

# Examples

## Example 1 — Basic: why the browser warns

A site's certificate expired yesterday. The chain no longer validates, so the browser blocks it with a
warning even though the site "works." The fix is renewing the certificate, not clicking through.

**Why this works:** TLS treats an invalid/expired certificate as a failure of the identity guarantee,
so it refuses to proceed silently.

## Example 2 — Real-world: one IP, many HTTPS sites

A server hosts dozens of HTTPS domains on a single IP. The client's **SNI** in the Client Hello tells
the server which certificate to present, so each domain gets its correct certificate despite sharing an
address.

**Why this works:** SNI disambiguates the requested site early in the handshake, before the certificate
is chosen.

## Example 3 — Pitfall: trusting the padlock as "safe"

A user sees the padlock on `paypa1-secure.example` and assumes it's PayPal. The padlock only means the
connection to *that domain* is encrypted and the domain's own certificate is valid — not that the site
is legitimate. Phishing sites routinely have valid certificates.

**Why this bites:** conflating "encrypted channel" with "trustworthy site" is exactly the mistake
phishing relies on.

# Common Mistakes

- **Calling it "SSL."** The current protocol is **TLS** (1.3); SSL is obsolete and insecure.
- **Thinking TLS uses only one kind of crypto.** It uses **asymmetric** to agree a key, then
  **symmetric** for data.
- **Believing the padlock means "safe/trustworthy."** It means encrypted + identity-verified for that
  domain, nothing more.
- **Assuming HTTPS hides everything.** The destination **IP** (and often the **SNI** hostname) can still
  be visible.

# Best Practices

- Serve **everything over HTTPS**; redirect HTTP to HTTPS and consider HSTS.
- Keep certificates **valid and auto-renewed**; monitor expiry to avoid outages.
- Prefer modern **TLS 1.3** and strong ciphers; disable obsolete SSL/early TLS.
- Teach users that the padlock verifies the **channel and domain**, not the site's honesty.

# Summary

- **HTTPS = HTTP over TLS**, adding **confidentiality, integrity, and server authentication**.
- TLS uses **asymmetric** crypto to authenticate the server and agree a key, then **symmetric** crypto
  for fast bulk data.
- A **certificate** binds a domain to a public key and is signed by a trusted **CA**; the browser
  verifies the **chain of trust**.
- The **TLS handshake** (streamlined in TLS 1.3) negotiates the cipher, exchanges key material, and
  validates identity before data flows.
- The **padlock** means the channel is encrypted and the domain's identity was verified — **not** that
  the site is safe; it also doesn't hide the destination IP.

# Flash Cards

Q: What three guarantees does TLS provide?
A: Confidentiality (encryption), integrity (tamper detection), and authentication of the server's identity via a certificate.

Q: How do asymmetric and symmetric cryptography each get used in TLS?
A: Asymmetric (public-key) crypto authenticates the server and helps agree a shared key during the handshake; fast symmetric crypto then encrypts the actual data.

Q: What is a certificate authority (CA)?
A: A trusted issuer that digitally signs certificates; browsers ship with trusted root CAs and verify the chain from a server's cert up to one.

Q: Is "SSL" the current protocol name?
A: No — SSL is the obsolete predecessor. The modern, current protocol is TLS (TLS 1.3).

Q: What does the padlock icon actually guarantee?
A: That the connection to that domain is encrypted and the domain's certificate is valid — not that the site is honest or safe.

Q: What is SNI, and why does it matter for privacy?
A: Server Name Indication tells the server which site the client wants (so one IP can host many TLS sites); the hostname is visible on the wire unless Encrypted Client Hello is used.

# Exercises

### Easy
Run `curl -v https://example.com/` and find the negotiated TLS version, the certificate subject, and the
issuer (CA). Write down what each one tells you.

### Medium
Explain, in order, what happens in a TLS handshake and where asymmetric vs symmetric cryptography is
used. Why not just use asymmetric crypto for everything?

### Challenging
A teammate argues "the site has a padlock, so it's safe to enter our credentials." Explain precisely
what the padlock proves and what it doesn't, give a realistic scenario where a padlocked site is still
dangerous, and describe what a user should actually check.

# Further Reading

- IETF — *The Transport Layer Security (TLS) Protocol Version 1.3* (RFC 8446): <https://www.rfc-editor.org/rfc/rfc8446>
- Cloudflare — *How TLS works / What is HTTPS?*: <https://www.cloudflare.com/learning/ssl/what-is-https/>
- MDN — *An overview of HTTPS/TLS*: <https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security>
- Mozilla — *Server Side TLS configuration guidance*: <https://wiki.mozilla.org/Security/Server_Side_TLS>
