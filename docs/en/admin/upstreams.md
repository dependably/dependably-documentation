# Upstreams

Dependably acts as a pull-through cache in front of public registries. Each
organization has its own upstreams. When a client requests a package that is not
held locally, Dependably consults the configured upstream list for the matching
ecosystem, fetches and verifies the artifact, caches it, and serves it.

If an ecosystem has **no upstream configured**, proxying for that ecosystem is
disabled — Dependably serves only locally published packages.

## Configuring upstreams

Each upstream is a priority-ordered entry per ecosystem. Entries are tried in
order; on a miss or an unreachable upstream, Dependably falls through to the
next.

A new organization is seeded with the standard public upstream for each
ecosystem, so it works out of the box:

| Ecosystem | Default upstream |
| --------- | ---------------- |
| PyPI | `https://pypi.org` |
| npm | `https://registry.npmjs.org` |
| NuGet | `https://api.nuget.org/v3` |
| Maven | `https://repo1.maven.org/maven2` |
| Go | `https://proxy.golang.org` |
| Cargo | `https://index.crates.io` (sparse index) |
| RPM | *(none — see below)* |
| OCI | MCR + Docker Hub (see below) |

RPM has no built-in default (RPM repos are distro-specific): an RPM upstream
must be added explicitly.

## OCI upstream routing & auth

OCI upstreams live in the same per-organization store as every other ecosystem.
An organization can have **multiple** OCI upstreams, routed by repository-name
prefix: Dependably selects the first upstream (in priority order) whose prefix
list matches the requested repository name. An empty-string prefix (`""`) is the
catch-all, so it belongs on your last-resort upstream.

A new organization is seeded with two OCI upstreams:

1. **`mcr.microsoft.com`** (anonymous) — prefixes `dotnet/` and `playwright`.
2. **`registry-1.docker.io`** (Docker Hub token exchange) — prefixes `library/`
   and `""` (catch-all). Anything not matched by MCR routes here.

Each OCI upstream carries an auth type: `anonymous` (public images), `basic`
(static username + password), `dockerhub_token_exchange` (Docker Hub's
bearer-token flow), or `aws_ecr` (Amazon ECR). A `401` from an upstream causes
Dependably to evict the cached token and retry once. Every proxied blob is
streamed through a SHA-256 verifier; if the bytes do not hash to the requested
digest, the fetch fails closed and nothing is cached or served.
