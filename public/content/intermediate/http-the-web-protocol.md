---
id: lesson-14
slug: http-the-web-protocol
title: "HTTP: The Web's Protocol"
level: intermediate
order: 14
duration: 22
tags:
  - http
  - methods
  - status-codes
  - headers
  - stateless
summary: "How the Web communicates — the structure of HTTP requests and responses, the meaning of methods and their safe/idempotent properties, the status code families, and how headers and cookies work."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the structure of an HTTP **request** and **response**.
- Explain the common **methods** and the difference between **safe** and **idempotent**.
- Interpret **status code** families (1xx–5xx) and key individual codes.
- Explain what **headers** do and how **cookies** add state to a stateless protocol.
- Recognize that HTTP semantics are the same across HTTP/1.1, /2, and /3.

# Why It Matters

HTTP is the language of the Web and most APIs. Whether you're building a frontend, a backend, or
debugging why a request returns 403 instead of 200, you're speaking HTTP. Its request/response shape,
method semantics, and status codes are among the most useful things a developer can know cold — and
they explain caching, retries, redirects, and authentication behavior.

# Concept Explanation

### Request and response structure

**HTTP** (HyperText Transfer Protocol) is a **stateless**, text-oriented **application-layer** protocol,
normally carried over **TCP** (and secured by TLS as HTTPS). A client sends a **request**; the server
returns a **response**. Each has a start line, headers, a blank line, and an optional body:

```text
   REQUEST                                RESPONSE
   GET /index.html HTTP/1.1               HTTP/1.1 200 OK
   Host: example.com                      Content-Type: text/html
   Accept: text/html                      Content-Length: 1256
   (blank line)                           (blank line)
   (optional body)                        <html>...</html>
```

The request's first line is **method + path + version**; the response's is **version + status code +
reason**. `Host` is required in HTTP/1.1 so one server can host many sites.

### Methods and their properties

The **method** says what action to perform. Two properties matter:

- **Safe** — the method is read-only and shouldn't change server state.
- **Idempotent** — making the same request many times has the same effect as making it once.

```text
   Method   Safe?   Idempotent?   Typical use
   GET      yes     yes           fetch a resource
   HEAD     yes     yes           fetch headers only (no body)
   PUT      no      yes           replace a resource at a known URL
   DELETE   no      yes           remove a resource
   POST     no      no            create/submit; may have side effects each time
   PATCH    no      no            partial update
   OPTIONS  yes     yes           ask what's allowed (used by CORS preflight)
```

Note **safe ≠ idempotent**: `DELETE` is idempotent (deleting twice leaves it deleted) but not safe (it
changes state). `POST` is neither — submitting a payment twice may charge twice.

### Status codes

The response's **status code** is a three-digit number in five families:

```text
   1xx  Informational   (e.g. 100 Continue)
   2xx  Success         200 OK, 201 Created, 204 No Content
   3xx  Redirection     301 Moved Permanently, 302 Found, 304 Not Modified
   4xx  Client error    400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests
   5xx  Server error     500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
```

Distinctions worth memorizing:

- **301 vs 302** — permanent vs temporary redirect (301 may be cached/remembered).
- **401 vs 403** — *unauthenticated* (who are you?) vs *forbidden* (you're known but not allowed).
- **502 vs 503 vs 504** — bad upstream response vs service unavailable/overloaded vs upstream timeout.

### Headers

**Headers** are `Name: value` metadata about the request or response — content type, length, caching,
authentication, compression, and more:

```text
   Content-Type: application/json      what the body is
   Authorization: Bearer <token>       credentials
   Cache-Control: max-age=3600         caching rules
   Accept-Encoding: gzip, br           compressions the client accepts
```

### Cookies: state on a stateless protocol

HTTP itself keeps **no memory** between requests. To recognize a returning user, the server sends a
`Set-Cookie` header; the browser stores it and returns it on later requests via the `Cookie` header:

```text
   Server -> Set-Cookie: session=abc123; HttpOnly; Secure
   Browser -> (next request) Cookie: session=abc123
```

The cookie ties otherwise-independent requests to a session — statefulness *layered on top of* a
stateless protocol.

### Same semantics, different versions

HTTP/1.1, HTTP/2, and HTTP/3 change *how* messages are framed and transported (covered in an advanced
lesson), but the **semantics** — methods, status codes, headers — are the **same**. Learn them once and
they apply everywhere.

# Key Terminology

- **HTTP** — the stateless application-layer protocol of the Web, usually over TCP.
- **Method** — the action verb (GET, POST, PUT, DELETE, …).
- **Safe** — a read-only method that shouldn't change state.
- **Idempotent** — repeating the request has the same effect as doing it once.
- **Status code** — a three-digit result grouped into 1xx–5xx families.
- **Header** — `Name: value` metadata about a request or response.
- **Cookie** — a token the server sets and the browser returns, adding session state.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Create a resource | POST to a collection | PUT to a known URL | POST when the server assigns the URL/ID; PUT when the client picks the URL and wants idempotency. |
| Safe retry after timeout | Retry a GET/PUT | Retry a POST | GET/PUT are idempotent — safe to retry; retrying POST may duplicate side effects. |
| Redirect | 301 permanent | 302 temporary | 301 when the move is permanent (cacheable); 302 for a temporary redirect. |

# Worked Example

Inspect a real exchange with `curl`:

```bash
curl -v https://example.com/
# > GET / HTTP/2
# > Host: example.com
# > Accept: */*
# <
# < HTTP/2 200
# < content-type: text/html; charset=UTF-8
# < cache-control: max-age=604800
# < ...
```

The `>` lines are your request (method, path, headers); the `<` lines are the server's response (status
`200`, then headers, then the body). This is the entire protocol in one view — request out, response
back.

# Real World Analogy

HTTP is like **ordering by mail-order form**. You fill in a form: the **action** (order / cancel /
inquire = the method), the **item and address** (the path), and any **notes** (headers), plus maybe an
enclosed payment (the body). The company mails back a slip with a **status code** — "Shipped" (200),
"We don't carry that" (404), "Payment declined" (402/403), or "Our warehouse is down" (503) — plus its
own notes (response headers). Since they forget you between orders (**stateless**), they include a
**membership card number** (cookie) so next time they can tie your orders together.

# Examples

## Example 1 — Basic: 404 vs 200

Requesting an existing page returns `200 OK` with the content; requesting a missing one returns `404 Not
Found`. The status code, not the body, is the machine-readable verdict — clients branch on it.

**Why this works:** the status code communicates the outcome in a standard way every HTTP client
understands.

## Example 2 — Real-world: 401 vs 403

An API returns **401 Unauthorized** when you send no (or invalid) credentials — "authenticate first."
After logging in as a low-privilege user, the same endpoint returns **403 Forbidden** — "we know who you
are, but you may not do this." Two different problems, two different codes.

**Why this works:** separating "unauthenticated" from "not allowed" tells the client whether to
re-authenticate or to stop trying.

## Example 3 — Pitfall: retrying a POST

A payment request times out, so a client blindly retries the **POST** — and the customer is charged
twice, because POST is **not idempotent**. A safer design uses an idempotency key or a method like PUT
so retries don't duplicate the charge.

**Why this bites:** treating all methods as safe to retry ignores that POST may repeat its side effects.

# Common Mistakes

- **Assuming safe means idempotent (or vice versa).** DELETE is idempotent but not safe; POST is
  neither.
- **Confusing 401 and 403.** 401 = not authenticated; 403 = authenticated but not permitted.
- **Retrying non-idempotent requests.** Retrying a POST can duplicate side effects (double charges).
- **Thinking HTTP remembers you.** It's **stateless**; continuity comes from cookies/tokens.

# Best Practices

- Choose methods by **semantics**: GET to read, PUT/DELETE for idempotent writes, POST for
  non-idempotent actions.
- Return **accurate status codes** — clients, caches, and proxies rely on them.
- Only auto-retry **idempotent** requests; use idempotency keys for POSTs that must be retry-safe.
- Use `curl -v` (or browser dev tools) to read the exact request/response when debugging.

# Summary

- **HTTP** is a **stateless** application protocol (over TCP) with a **request/response** structure:
  start line, headers, blank line, optional body.
- **Methods** carry meaning; **safe** = read-only, **idempotent** = repeatable with the same effect —
  and they're independent properties.
- **Status codes** group into **1xx–5xx**; know 200/301/302/304/400/401/403/404/429/500/502/503/504.
- **Headers** carry metadata; **cookies** add session state to a stateless protocol.
- The **semantics are identical** across HTTP/1.1, /2, and /3 — only the framing/transport differs.

# Flash Cards

Q: What is the structure of an HTTP request?
A: A start line (method + path + version), header lines, a blank line, and an optional body.

Q: What is the difference between "safe" and "idempotent" methods?
A: Safe means read-only (no state change); idempotent means repeating the request has the same effect as doing it once. They're independent — DELETE is idempotent but not safe.

Q: What do the five HTTP status code families mean?
A: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error.

Q: What is the difference between 401 and 403?
A: 401 Unauthorized means you're not authenticated (authenticate first); 403 Forbidden means you're authenticated but not allowed to do this.

Q: How do cookies add state to stateless HTTP?
A: The server sends Set-Cookie; the browser stores it and returns it in the Cookie header on later requests, tying independent requests to a session.

Q: Is it safe to automatically retry a POST after a timeout?
A: Not necessarily — POST is not idempotent, so a retry can repeat side effects (e.g. a double charge). Use idempotency keys or an idempotent method for retry safety.

# Exercises

### Easy
Run `curl -v https://example.com/` and identify the request line, two request headers, the status code,
and two response headers in the output.

### Medium
For each method (GET, POST, PUT, DELETE, PATCH), state whether it's safe, whether it's idempotent, and a
one-line example use. Then explain why retrying PUT is safer than retrying POST.

### Challenging
Design the status codes and methods for a small "notes" API: create a note, fetch one, replace one,
delete one, and handle "not logged in" vs "not your note." Justify each method and each status code you
choose.

# Further Reading

- IETF — *HTTP Semantics* (RFC 9110): <https://www.rfc-editor.org/rfc/rfc9110>
- MDN — *HTTP overview*: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview>
- MDN — *HTTP response status codes*: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Status>
- MDN — *HTTP methods*: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods>
