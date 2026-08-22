# Settings

These are the per-organization settings an Owner or Admin configures on the
**Settings** page in the web UI. Each section below matches a tab on that page.

## General

Organization-wide switches every member inherits.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| **Anonymous pull** | on / off | off | Allow unauthenticated clients to install and download packages from this organization's registries. |
| **Default language** | English, French | English | UI language new users start with. Each user can override it in their profile. |
| **Air-gapped environment** | on / off | off | Stop all outbound requests for this organization: uncached upstream packages return 404 and vulnerability scanning skips this organization. When the operator sets `AIR_GAPPED` on the instance, this is enforced instance-wide and cannot be changed here. |
| **Require MFA enrolment** | on / off | off | Every user in the organization must complete MFA enrolment before using the API or UI. |

## Storage

**Upload limits** — a size ceiling for package uploads, in bytes: one value for
all ecosystems plus optional per-ecosystem overrides (npm, PyPI, NuGet, Maven,
RPM, OCI, Cargo). Empty fields inherit from the instance; no limit may exceed
the instance ceiling.

**Retention** — per-organization retention budgets. An empty field means that
dimension is unbounded; enforcement runs in the scheduled cleanup pass.

| Setting | Default | What it does |
| ------- | ------- | ------------ |
| **Keep versions** | unlimited | Maximum versions to retain per package; older versions become eligible for cleanup. |
| **Keep days (proxy blobs)** | unlimited | Evict proxy-cached artefacts unused for this many days. |
| **Activity retention days** | unlimited | How long activity-log entries are kept. All-time download counts survive pruning. |
| **Purge unlisted after (days)** | off | Hard-delete uploaded versions that have been unlisted longer than this. |

## Proxy

Controls what the registry fetches from upstream sources.

| Setting | Default | What it does |
| ------- | ------- | ------------ |
| **Proxy passthrough enabled** | on | Master switch for fetching uncached versions from upstreams. When disabled, only packages already cached are served. Forced off while air-gapped. |
| **Proxy: allowlist & blocklist only** | off | Restrict proxying to packages on the allowlist (deny-by-default ingest). |

The tab also manages the **Allowlist** and **Blocklist** entries themselves,
and the per-ecosystem **upstream registries** the proxy fetches from — see
[Upstreams](upstreams.md).

## Gates

The supply-chain enforcement layer applied to **proxy-fetched** (upstream)
versions. Most gates are tri-state: **Off** (allow), **Warn** (flag in the UI
only), **Block** (fail closed — refuse to fetch, cache, or serve). A manual
per-version allow override always wins.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| **Version overwrite policy** | Block, Exception, Allow | Block | Same-version re-push policy (applies to your own publishes). Block rejects all duplicates; Exception rejects by default with per-package overrides; Allow permits overwrites. |
| **Max OSV score tolerance** | 0.0–10.0 (CVSS) | 10.0 | Block a version whose highest vulnerability score exceeds this. 10.0 blocks nothing on score. |
| **EPSS probability ceiling** | 0.0–1.0, or empty | off | Block a version whose highest EPSS exploit probability exceeds this. |
| **Known-exploited (KEV) policy** | Off, Warn, Block | Off | Gate versions whose advisories match a CVE in the CISA Known Exploited Vulnerabilities Catalog. |
| **Malicious package policy** | Off, Warn, Block | Block | Gate versions carrying a malicious-package advisory (OpenSSF malicious-packages feed). |
| **Deprecated package policy** | Off, Warn, Block new, Block all | Off | Gate upstream-deprecated versions. Block new refuses uncached deprecated versions but keeps serving cached ones; Block all also stops serving cached. |
| **Revoked (removed upstream) policy** | Off, Warn, Block | Warn | Gate versions removed from the upstream registry (npm unpublish, PyPI delete, a takedown of a compromised release). |
| **Minimum release age** | hours or days, or empty | off | Supply-chain hold: block an upstream version until it is at least this old, giving the community time to catch bad releases. Held versions serve automatically once they age past the threshold. |
| **Install-script policy** | Off, Warn, Block | Off | Gate artefacts that ship an install / lifecycle script (such scripts run automatically on install). The **install-script allowlist** on the same tab exempts named packages from the block. |

## Signatures

Origin verification for proxy-fetched artefacts, per ecosystem — each is
**Off** (default), **Warn** (verify and flag), or **Block** (refuse versions
that fail verification or are unsigned):

- **npm** — the registry's signature on each version.
- **NuGet** — the signature embedded in each `.nupkg`.
- **PyPI** — PEP 740 digital attestations.
- **RPM** — the GPG signature in each package header.
- **Maven** — the detached `.asc` signature for each artefact.

Verification checks against **trust anchors** — per-organization public key
material (registry keys, signing certificates, Sigstore roots and trusted
publishers, GPG keys) managed on the same tab. Warn and Block only take effect
once the matching anchor is configured.

## Namespaces

**Reserved namespaces** — a dependency-confusion guard. Names matching these
per-ecosystem patterns are never fetched or merged from upstream, so a public
package can't shadow your internal names.

## Webhooks

Subscribe HTTPS endpoints to organization events — package publish, replace,
import, unlist, yank, and new vulnerability. Dependably posts a signed JSON
payload to each URL when a matching event occurs; an optional signing secret
adds an HMAC-SHA-256 `X-Dependably-Signature` header (storing secrets requires
the operator to configure a master key — see
[Configuration](configuration.md)). Use **Send test** to verify an endpoint.

## Banners

Post announcement banners to your organization's users: message, severity,
optional link, an optional target role, and a start/end window.

## Other tabs

- **Authentication** — sign-in methods, MFA, and SAML single sign-on; see
  [Authentication](authentication.md).
- **Licenses** — the SPDX license policy; see
  [License policy](../web-ui/license-policy.md).
- **Service tokens** — credentials for CI and automation; see
  [Users & tokens](users-and-tokens.md).
- **Instance settings** and **Metrics access** — instance-wide limits,
  schedules, and Prometheus metrics exposure. Shown to the operator (in a
  single-organization deployment, the owner is also the operator). For metrics,
  see the [Grafana integration](../integrations/grafana/index.md).
