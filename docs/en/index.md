---
description: "Private package registry and pull-through cache: checksum and signature verification and policy gates before a package reaches a build."
---

# Dependably

**A private package registry that verifies every package before it reaches your build.**

Dependably sits between your developers and the public package registries. It
caches every package your team pulls, verifies its checksum before storing it,
and keeps a full audit trail. The same build works tomorrow even if a package
disappears from the internet, and nothing enters your codebase unnoticed.

It speaks the native protocol of each tool you already use. Point npm, pip,
NuGet, Maven, Cargo, `go`, Terraform, `mix`, `docker`, or `dnf` at your
Dependably URL and they work as before; the only difference is that they talk to
your registry instead of the public one.

---

## What it does

- Each ecosystem gets its own URL on a single self-hosted instance. The table
  below lists the guides.
- Supply-chain controls sit on top of the cache: first-fetch detection,
  allowlists, and policy gates for vulnerabilities, malware, deprecation, and
  unsigned artefacts.
- It runs on your own infrastructure as a container (or a single self-contained
  binary), with no cloud account, no per-seat licence, and no external services
  required.

---

## Supported ecosystems

| Tool                       | Use it for                          | Guide |
| -------------------------- | ----------------------------------- | ----- |
| **npm** / yarn / pnpm      | JavaScript & Node.js packages       | [npm](package-managers/npm.md) |
| **pip** / uv               | Python packages (PyPI)              | [PyPI](package-managers/pypi.md) |
| **dotnet**                 | C# / .NET packages (NuGet)          | [NuGet](package-managers/nuget.md) |
| **Maven** / Gradle         | Java & JVM artefacts                | [Maven](package-managers/maven.md) |
| **cargo**                  | Rust crates                         | [Cargo](package-managers/cargo.md) |
| **go**                     | Go modules                          | [Go](package-managers/go.md) |
| **terraform**              | Terraform providers                 | [Terraform](package-managers/terraform.md) |
| **mix** / rebar3           | Elixir & Erlang packages (Hex)      | [Hex](package-managers/hex.md) |
| **docker** / podman        | Container images (OCI)              | [Docker](containers-and-system/docker.md) |
| **dnf** / yum              | RPM packages (Linux)                | [RPM](containers-and-system/rpm.md) |

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
[Go](package-managers/go.md) ·
[Terraform](package-managers/terraform.md) ·
[Hex](package-managers/hex.md)

**Containers & system packages**
[Docker](containers-and-system/docker.md) ·
[RPM](containers-and-system/rpm.md)

---

## The web UI

Dependably has a built-in web console. Open your base URL in a browser to browse
packages, check a package before you add it, see which versions carry
advisories, create the token your tools need, and copy a ready-made
configuration for your package manager. See [**The web UI**](web-ui/index.md)
for a tour of every page:
[Overview](web-ui/dashboard.md) ·
[Packages](web-ui/packages.md) ·
[Projects](web-ui/projects.md) ·
[Lookup](web-ui/lookup.md) ·
[Vulnerabilities](web-ui/vulnerabilities.md) ·
[Risk](web-ui/risk.md) ·
[Licence policy](web-ui/license-policy.md) ·
[Tokens](web-ui/tokens.md) ·
[Setup](web-ui/setup.md) ·
[Profile](web-ui/profile.md)

Admins and owners also have [Quarantine](web-ui/quarantine.md), and the
[Audit log](web-ui/audit.md) is open to admins, owners, and auditors.

---

## Running Dependably

If you operate the instance or administer an organization, see
[**Administration**](admin/index.md):
[Configuration](admin/configuration.md) ·
[Access control (RBAC)](admin/rbac.md) ·
[Users & tokens](admin/users-and-tokens.md) ·
[Settings](admin/settings.md) ·
[Authentication](admin/authentication.md) ·
[Upstreams](admin/upstreams.md)

---

## Integrations

Connect Dependably to your existing monitoring stack. Metrics are published in
Prometheus format, and a ready-made [**Grafana dashboard**](integrations/grafana/index.md)
shows request rate, tracked advisories, critical findings, supply-chain
blocks, and registry storage at a glance. Structured logs go to stdout for
your aggregator to pick up; see [**Log output**](integrations/logging.md).
[**SIEM and SOC integration**](integrations/siem/index.md) covers feeding
security events to a SIEM, and an AI assistant can query the registry through
the read-only [**MCP server**](integrations/mcp/index.md).
[**Integrations**](integrations/index.md) is the overview.

---

## Reference

- [**Glossary**](glossary.md) defines PURL, CVSS, EPSS, KEV, OSV, SPDX, and the
  other terms used across the UI and the supply-chain gates.
- [**Blocked packages**](package-managers/blocked-packages.md) explains what a
  `403` from your package manager means, and which policy produced it.
