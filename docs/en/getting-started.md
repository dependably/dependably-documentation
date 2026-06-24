# Getting started

Before you configure any tool, gather the information every guide in this site
asks for: your **base URL** and a **token**.

## 1. Base URL

The address of your Dependably instance, for example:

```
https://repo.example.com
```

for a single-organization deployment, or

```
https://acme.repo.example.com
```

for multi-tenant (the organization is a subdomain).

On a local network the IP and port also work:

```
http://192.168.1.50:8080
```

The organization is resolved from the **host**, never from a path — registry
URLs are always `<base>/npm/`, `<base>/simple/`, and so on, with no `/o/<org>/`
prefix.

## 2. How your organization appears

Dependably groups packages by organization. How the organization shows up
depends on how your instance is deployed:

- **Single-organization instance (most common):** the bare host serves the one
  organization. You do not put the organization anywhere in your URLs.
- **Multi-tenant instance:** the organization is the subdomain — for the org
  `acme`, every URL is under `https://acme.repo.example.com/`. You can see your
  organization in the address bar when logged into the web UI.

Each ecosystem guide uses `repo.example.com` (single-organization form) in its
examples; substitute your own host.

## 3. Token

Every guide authenticates with a token. Create one in the web UI:

- **Tokens** — a personal token tied to your account. Best for your own machine.
- **Settings → Service tokens** — a long-lived token not tied to a person. Best
  for CI and shared automation.

How the token is sent depends on the tool, and each guide shows the exact form:

- **HTTP Basic** (pip, uv, NuGet, Maven, Gradle, `dnf`, `docker`) — the token is
  the password; the username is ignored, so any value works (the guides use
  `user`).
- **Bearer token** (npm, Cargo) — the token is sent directly, via npm's
  `_authToken` or Cargo's `CARGO_REGISTRIES_<NAME>_TOKEN`.

> **Keep tokens secret.** Never commit a token to source control. The
> per-project recipes in each guide reference an environment variable instead of
> pasting the literal value.

---

## Project vs. global configuration

Most guides show two ways to point a tool at Dependably:

- **Per-project** — config lives in the repository, so everyone who clones it
  uses Dependably automatically. The token is read from an environment variable
  so no secret is committed. Use this for shared projects.
- **Global (per-machine)** — config lives in your home directory and applies to
  every project on your machine. The token is stored directly in the file, so
  keep its permissions tight. Use this for your personal workstation.

---

## The plain-HTTP gotcha

Self-hosted registries are often served over plain **HTTP** on an internal
network (a URL starting with `http://`, not `https://`). Most package managers
refuse to talk to a plaintext registry by default — this is intentional, and you
override it deliberately per tool:

| Tool          | Override |
| ------------- | -------- |
| npm           | `strict-ssl=false` |
| pip           | `trusted-host = <host>` |
| uv            | `--allow-insecure-host <host>` |
| NuGet         | `allowInsecureConnections="true"` (or `--allow-insecure-connections`) |
| Maven / Gradle| Gradle needs `allowInsecureProtocol = true`; Maven 3.8.1+ blocks HTTP repos by default |
| docker        | add the host to `insecure-registries` in the daemon config |
| dnf           | `sslverify=0` |

Each guide repeats the exact line you need. If your instance is served over
HTTPS, ignore this section entirely.

---

## Verify you can reach the instance

Open the base URL in a browser, or check the health endpoint:

```bash
curl https://repo.example.com/health      # 200 OK when the instance is running
```

Once that succeeds, head to the guide for your tool:

- [npm](package-managers/npm.md)
- [PyPI](package-managers/pypi.md)
- [NuGet](package-managers/nuget.md)
- [Maven](package-managers/maven.md)
- [Cargo](package-managers/cargo.md)
- [Go](package-managers/go.md)
- [Docker](containers-and-system/docker.md)
- [RPM](containers-and-system/rpm.md)
