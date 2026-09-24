---
order: 6
---

# Upstreams

Dependably acts as a pull-through cache in front of public registries. Each
organization has its own upstreams. When a client requests a package that is not
held locally, Dependably consults the configured upstream list for the matching
ecosystem, fetches and verifies the artefact, caches it, and serves it.

If an ecosystem has **no upstream configured**, proxying for that ecosystem is
disabled: Dependably serves packages published to it and packages already in
its cache, and fetches nothing new.

## Configuring upstreams

Manage upstreams in **Settings**: open the **Proxy** tab, then the **Upstream
registries** section, and select **Add registry**. Upstreams are
priority-ordered per ecosystem; drag a row by its handle to reorder.
Entries are tried in order; on a miss or an unreachable upstream, Dependably
falls through to the next. RPM is the exception: only the top RPM entry is
used.

A new organization is seeded with the standard public upstream for each
ecosystem, so proxying works without adding an upstream yourself:

| Ecosystem | Default upstream |
| --------- | ---------------- |
| PyPI | `https://pypi.org` |
| npm | `https://registry.npmjs.org` |
| NuGet | `https://api.nuget.org/v3` |
| Maven | `https://repo1.maven.org/maven2` |
| Go | `https://proxy.golang.org` |
| Cargo | `https://index.crates.io` (sparse index) |
| Alpine apk | `https://dl-cdn.alpinelinux.org/alpine` |
| Terraform | `https://registry.terraform.io` |
| Hex | `https://repo.hex.pm` |
| RPM | *(none; see below)* |
| OCI (**Docker** in the UI) | MCR + Docker Hub (see below) |

RPM has no built-in default (RPM repos are distro-specific): an RPM upstream
must be added explicitly.

### Upstream credentials

An upstream can use **Anonymous**, **Bearer (token)**, or **Basic (username +
password/token)** authentication; RPM upstreams are anonymous only, and OCI
upstreams have their own auth types (below). An upstream with credentials must
use an `https://` URL. The password or token is write-only: the API never
returns it after saving. Storing one, for any ecosystem, requires the operator
to set `DEPENDABLY_MASTER_KEY` (see [Configuration](configuration.md)).

## OCI upstream routing & auth

OCI upstreams live in the same per-organization store as every other ecosystem.
An organization can have **multiple** OCI upstreams, routed by repository-name
prefix: Dependably selects the first upstream (in priority order) whose prefix
list matches the requested repository name. An empty-string prefix (`""`) is the
catch-all, so it belongs on your last-resort upstream; upstreams listed below a
catch-all are never reached.

A new organization is seeded with these OCI upstreams, in this order:

1. `mcr.microsoft.com` (anonymous): prefixes `dotnet/` and `playwright`.
2. `registry-1.docker.io` (Docker Hub token exchange): prefixes `library/`
   and `""` (catch-all). Anything not matched by MCR routes here.

Each OCI upstream carries an auth type: `anonymous` (public images), `basic`
(static username + password or token), or `dockerhub_token_exchange` (Docker
Hub's bearer-token flow). For Amazon ECR, use `basic` with a password obtained
from ECR's `GetAuthorizationToken`. A `401` from an upstream causes Dependably
to evict the cached token and retry once.

Every proxied blob is streamed through a SHA-256 verifier. If the bytes do not
hash to the requested digest, Dependably resets the connection and caches
nothing.
