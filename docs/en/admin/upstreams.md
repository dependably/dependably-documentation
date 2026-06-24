# Upstreams & signatures

Dependably acts as a pull-through cache in front of public registries. Each
organization configures its own upstreams — there is no global upstream. When a
client requests a package that is not held locally, Dependably consults that
organization's configured upstream list for the matching ecosystem, fetches and
verifies the artifact, caches it, and serves it.

If an ecosystem has **no upstream configured** for an organization, proxying for
that ecosystem is disabled — Dependably serves only locally published packages.

## Configuring upstreams

Each upstream is a priority-ordered entry per (organization, ecosystem). Entries
are tried in order; on a miss or an unreachable upstream, Dependably falls
through to the next.

A newly created organization is seeded with the standard public upstream for
each ecosystem, so it behaves like a fresh install. Override the default before
the organization is created by setting the matching environment variable:

| Ecosystem | Default upstream | Override env var |
| --------- | ---------------- | ---------------- |
| PyPI | `https://pypi.org` | `PyPI:Upstream` |
| npm | `https://registry.npmjs.org` | `Npm:Upstream` |
| NuGet | `https://api.nuget.org/v3` | `NuGet:Upstream` |
| Maven | `https://repo1.maven.org/maven2` | `Maven:Upstream` |
| Go | `https://proxy.golang.org` | `Go:Upstream` |
| Cargo | `https://index.crates.io` (sparse index) | `Cargo:Upstream` |
| RPM | *(none — see below)* | `Rpm:Upstream` |
| OCI | MCR + Docker Hub (see below) | *(DB-backed only)* |

RPM has no built-in default (RPM repos are distro-specific): an RPM upstream is
seeded only when `Rpm:Upstream` is set, and otherwise must be added explicitly.

### RPM: passthrough vs merged

A second instance-level switch, `Rpm:UpstreamMode`, defaults to `passthrough`
and controls how an org's RPM upstream interacts with hosted (locally published)
RPMs:

- **`passthrough`** (default) — Dependably resolves packages straight from the
  upstream repo. Because a locally published RPM would silently shadow upstream
  content and break `dnf`/`yum` resolution, **hosted publishing is refused**: a
  PUT to `/rpm/upload` returns 409 Conflict whenever the org has an RPM upstream
  configured.
- **`merged`** — Dependably serves merged repodata where locally published RPMs
  shadow upstream entries, so hosted publishing and proxying coexist.

To let an organization publish its own RPMs, switch to merged mode or remove its
RPM upstream.

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

## Signature & provenance verification

Provenance verification has two layers: an **instance-level trust anchor** the
operator pins out of band, and a **per-organization verify mode** that decides
what to do with the result (see [Settings](settings.md)). The trust root is
always operator-pinned — Dependably never trusts a signing key served by the
upstream itself.

The per-org verify modes (`off` / `warn` / `block`) only take effect when the
matching instance-level trust anchor is configured. Setting a verify mode to
`warn` or `block` while the anchor is unconfigured is rejected at the API,
naming the config key to pin first:

| Ecosystem | Per-org verify setting | Required instance trust anchor |
| --------- | ---------------------- | ------------------------------ |
| npm | `verifyNpmSignatures` | `Npm:SignatureKeys` (base64 SPKI keys, by keyid) |
| NuGet | `verifyNuGetSignatures` | `NuGet:SignatureCertificates` (pinned X.509 anchors) |
| PyPI | `verifyPyPiAttestations` | `PyPI:SigstoreRoots` + `PyPI:TrustedPublishers` |
| RPM | `verifyRpmSignatures` | `Rpm:GpgKey` (operator-pinned OpenPGP public key) |
| Maven | `verifyMavenSignatures` | `Maven:SignatureKeys` (armored/base64 publisher keys) |

> **RPM repomd note.** Separately from per-package verification, the RPM proxy
> can verify the upstream `repomd.xml` signature against `Rpm:GpgKey` (enabled
> automatically when that key parses). If you configure an RPM upstream without
> pinning `Rpm:GpgKey`, Dependably warns at startup: it fetches `repomd.xml`
> from upstream but cannot verify it, so a tampered mirror could poison the
> checksum chain. Pin `Rpm:GpgKey`.
