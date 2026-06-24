# Dependably

**A private package registry you host yourself.**

Dependably sits between your developers and the public package registries. It
caches every package your team pulls, verifies its checksum before storing it,
and keeps a full audit trail — so the same build works tomorrow even if a
package disappears from the internet, and nothing enters your codebase
unnoticed.

It speaks the native protocol of each tool you already use. Point npm, pip,
NuGet, Maven, Cargo, `go`, `dnf`, or `docker` at your Dependably URL and they
behave exactly as before — they just talk to your registry instead of the
public one.

---

## What it does

- **Pull-through cache** — the first request for a package is fetched from
  upstream, verified against its published checksum, and stored. Every later
  request is served locally, even if upstream is down or the package is removed.
- **Supply-chain controls** — first-fetch detection, per-version checksum
  verification, allowlists, and policy gates for vulnerabilities, malware,
  deprecation, and unsigned artifacts.
- **One URL per ecosystem** — npm, PyPI, NuGet, Maven, Cargo, Go, RPM, and
  Docker, all from a single self-hosted instance.
- **No cloud account, no per-seat licence** — runs on your own infrastructure as
  a container (or a single self-contained binary), with no external services
  required.

---

## Supported ecosystems

| Tool                       | Use it for                          | Guide |
| -------------------------- | ----------------------------------- | ----- |
| **npm** / yarn / pnpm      | JavaScript & Node.js packages       | [npm](package-managers/npm.md) |
| **pip** / uv               | Python packages (PyPI)              | [PyPI](package-managers/pypi.md) |
| **dotnet**                 | C# / .NET packages (NuGet)          | [NuGet](package-managers/nuget.md) |
| **Maven** / Gradle         | Java & JVM artifacts                | [Maven](package-managers/maven.md) |
| **cargo**                  | Rust crates                         | [Cargo](package-managers/cargo.md) |
| **go**                     | Go modules                          | [Go](package-managers/go.md) |
| **docker** / podman        | Container images (OCI)              | [Docker](containers-and-system/docker.md) _(Beta)_ |
| **dnf** / yum              | RPM packages (Linux)                | [RPM](containers-and-system/rpm.md) _(Beta)_ |

---

## Getting started

Every guide needs the same information about your instance.
[**Start here**](getting-started.md) to gather it once, then jump to the guide
for your tool:

**Developer package managers**
[npm](package-managers/npm.md) ·
[PyPI](package-managers/pypi.md) ·
[NuGet](package-managers/nuget.md) ·
[Maven](package-managers/maven.md) ·
[Cargo](package-managers/cargo.md) ·
[Go](package-managers/go.md)

**Containers & system packages**
[Docker](containers-and-system/docker.md) _(Beta)_ ·
[RPM](containers-and-system/rpm.md) _(Beta)_

---

## The web UI

Dependably has a built-in web console. Open your base URL in a browser to browse
packages, see which versions carry advisories, create the token your tools need,
and copy a ready-made setup snippet. See [**The web UI**](web-ui/index.md) for a
tour of every page:
[Overview](web-ui/dashboard.md) ·
[Packages](web-ui/packages.md) ·
[Vulnerabilities](web-ui/vulnerabilities.md) ·
[Licenses](web-ui/license-policy.md) ·
[Tokens](web-ui/tokens.md) ·
[Setup](web-ui/setup.md) ·
[Profile](web-ui/profile.md)

---

## Running Dependably

If you operate the instance or administer an organization, see
[**Administration**](admin/index.md): deployment and configuration, access
control (RBAC), users and tokens, organization settings, authentication
(SAML SSO), and upstream registries.

---

## Reference

- [**Glossary**](glossary.md) — PURL, CVSS, EPSS, KEV, OSV, SPDX, and the other
  terms used across the UI and the supply-chain gates.
