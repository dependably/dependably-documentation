---
order: 4
---

# Settings

These are the per-organization settings an Owner or Admin configures on the
**Settings** page in the web UI. Each section below matches a tab on that page,
in the order the tabs appear; tabs with their own page link to it.

## General

Organization-wide switches every member inherits.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| **Anonymous pull** | on / off | off | Allow unauthenticated clients to install and download packages from this organization's registries. |
| **Default language** | English, Français | English | UI language new users start with. Each user can override it in their profile. |
| **Default timezone** | IANA time zones | UTC | Time zone new users see timestamps in. Each user can override it in their profile; stored times are always UTC. |
| **Air-gapped environment** | on / off | off | Stop all outbound requests for this organization: upstream proxy fetches are disabled (uncached packages return 404), and vulnerability and deprecation-metadata scans skip this organization. When the operator sets `AIR_GAPPED` on the instance, this is enforced instance-wide and cannot be changed here. |
| **Require MFA enrolment** | on / off | off | Every user in the organization must complete MFA enrolment before accessing any API endpoint. When the operator sets `REQUIRE_MFA` on the instance, this is enforced for every organization and cannot be changed here. |

## Authentication

Sign-in methods and SAML single sign-on; see
[Authentication](authentication.md).

## Storage

**Upload limits** cap the size of a single upload, in MB: an **All ecosystems**
value plus optional per-ecosystem overrides (PyPI, npm, NuGet, Maven, RPM,
Docker, Cargo, Hex). A blank per-ecosystem field uses the **All ecosystems**
value, or the instance limit if that is blank too. No limit may exceed the
instance ceiling.

**Retention** controls how long old versions, cached proxy files, and activity
history are kept. Cleanup runs as a scheduled job.

| Setting | Default | What it does |
| ------- | ------- | ------------ |
| **Keep versions** | unlimited | Maximum versions to retain per package; older versions become eligible for cleanup. |
| **Keep days (proxy blobs)** | unlimited | Evict proxy-cached artefacts unused for this many days. |
| **Activity retention days** | instance default (90 days unless the operator sets `ACTIVITY_RETENTION_DAYS`) | How long activity-log entries are kept. Blank means the instance default, not unlimited, because activity rows carry per-download IP data. All-time download counts survive pruning. |
| **Purge unlisted after (days)** | off | Hard-delete uploaded versions that have been unlisted longer than this. |
| **Keep project versions** | unlimited | Maximum SBOM, VEX, and SARIF versions kept per project. A project's latest version and any version marked active are never removed. |

## Proxy

**Proxy passthrough enabled** (default on) is the master switch for fetching
uncached versions from upstreams. When it is off, only packages already cached
are served; it is forced off while the organization is air-gapped.

The tab also holds the per-ecosystem **Upstream registries** the proxy fetches
from; see [Upstreams](upstreams.md).

## Gates

The supply-chain enforcement layer applied to **proxy-fetched** (upstream)
versions, apart from **Version overwrite policy**, which applies to your own
publishes. Most gates are tri-state: **Off** (allow), **Warn** (flag the
version without blocking it), or **Block** (refuse it with a 403 on fetch and
serve). For the malicious-package, KEV, and install-script gates, a manual
per-version allow override still wins.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| **Proxy: allowlist & blocklist only** | on / off | off | Proxy only packages on the **Allowlist** (deny-by-default ingest). Enforced on npm, PyPI, and NuGet proxy fetches. |
| **Version overwrite policy** | Block, Exception, Allow | Block | Same-version re-push policy for your own publishes; Maven publishes don't apply it. Block rejects all overwrites; Exception allows per-package overrides set on the Packages page; Allow permits overwrites organization-wide. Changing it is audited. |
| **Deprecated package policy** | Off, Warn, Block new, Block all | Off | Gate upstream-deprecated versions. Block new refuses uncached deprecated versions but keeps serving cached ones; Block all also stops serving cached. |
| **Revoked (removed upstream) policy** | Off, Warn, Block | Warn | Gate versions removed from the upstream registry (npm unpublish, PyPI delete, a takedown of a compromised release). Block also quarantines the version for review. npm and PyPI only. |
| **Malicious package policy** | Off, Warn, Block | Block | Gate versions carrying a malicious-package advisory (OpenSSF malicious-packages feed). |
| **Still-live malicious version** | Off, Warn, Block | Off | A narrower malicious gate: acts only when the vulnerability tracker finds this exact version is still serving compromised bytes. Requires the vulnerability tracker connection. |
| **Known-exploited (KEV) policy** | Off, Warn, Block | Off | Gate versions whose advisories match a CVE in the CISA Known Exploited Vulnerabilities Catalog. |
| **Ransomware-linked exploited CVEs** | Off, Warn, Block | Off | A narrower KEV gate: acts only on CVEs CISA marks as used in ransomware campaigns. |
| **Actively exploited (CISA assessment)** | Off, Warn, Block | Off | Gate on CISA's Vulnrichment exploitation assessment, which covers more CVEs than the KEV catalogue. Requires the vulnerability tracker connection. |
| **Max OSV score tolerance** | 0 to 10 (CVSS) | 10 | Block a version whose highest vulnerability score exceeds this. 10 blocks nothing on score. |
| **Minimum release age** | hours or days, or empty | off | Supply-chain hold: block an upstream version until it is at least this old, giving the community time to catch bad releases. Held versions serve automatically once they age past the threshold; versions with no upstream timestamp are allowed through. |
| **EPSS probability ceiling** | 0.0 to 1.0, or empty | off | Block a version whose highest EPSS exploit probability exceeds this. |
| **EPSS percentile ceiling** | 0.00 to 1.00, or empty | off | Block a version with an advisory ranked above this EPSS percentile. With the probability ceiling also set, whichever trips first blocks. |
| **Install-script policy** | Off, Warn, Block | Off | Gate artefacts that ship an install or lifecycle script (such scripts run automatically on install). |

Below the gates, the tab manages the **Allowlist** and **Blocklist** of package
patterns, and the **Install-script allowlist** of packages exempt from the
install-script block. Blocklisted packages are refused on npm, PyPI, and NuGet
proxy fetches.

## Signatures

Origin verification for proxy-fetched artefacts, per ecosystem. Each is **Off**
(default), **Warn** (verify and record the outcome), or **Block** (refuse
versions that fail verification or are unsigned):

| Ecosystem | What is verified |
| --------- | ---------------- |
| npm | The registry's signature on each version. |
| NuGet | The signature embedded in each `.nupkg`. |
| PyPI | PEP 740 digital attestations. |
| RPM | The GPG signature in each package header. |
| Maven | The detached `.asc` signature for each artefact. |

Verification checks against **trust anchors**, per-organization public key
material (registry keys, signing certificates, Sigstore roots, trusted
publishers and Rekor keys, GPG keys) managed on the same tab. An ecosystem's
policy cannot be changed from Off until its anchor is added.

The tab also shows the organization's **Hex registry signing key** and **SBOM
signing key**: the public keys Hex clients and SBOM recipients use to verify
what Dependably signs.

## Namespaces

**Reserved namespaces** are a dependency-confusion guard. Names matching these
per-ecosystem patterns are never fetched or merged from upstream, so a public
package can't shadow your internal names. Names you have published are
protected automatically; reserve patterns to cover names you have not
published. The package claims workflow sits on the same tab.

## Licences

The SPDX licence policy; see [Licence policy](../web-ui/license-policy.md).

## Service tokens

Credentials for CI and automation; see [Users & tokens](users-and-tokens.md).

## Integrations

Delivery channels, with **Webhooks**, **Email**, and **Slack** sub-tabs. What
triggers an alert is set on the **Alerts** tab.

**Webhooks** subscribe HTTPS endpoints to organization events: publish,
replace, import, unlist, yank, vulnerability, and blocked. Dependably posts a
JSON payload to each URL when a matching event occurs. An optional signing
secret adds an `X-Dependably-Signature: sha256=<hex>` HMAC-SHA-256 header;
without one, deliveries are unsigned. Storing a secret requires the operator to
configure a master key (see [Configuration](configuration.md)). Use **Send
test** to verify an endpoint.

## Alerts

Choose what raises an alert: **Alert on new quarantine items**, **Alert on
vulnerabilities**, and the **Minimum vulnerability severity** a vulnerability
must meet. Unscored advisories never alert. Alerts go out through the channels
on the **Integrations** tab.

## Banners

Post announcement banners to your organization's users. Each banner has a
**Message**, a **Severity**, a **Target role** (all users by default), a
required **Starts at (UTC)** and **Ends at (UTC)** window, an optional **Link
URL** and **Link label**, and an **Enabled** switch.

## Instance settings and Metrics access

These tabs appear, to Owners and Admins, only in a single-organization
deployment, where the Owner is also the operator; in a multi-organization
deployment the system administrator manages instance configuration.
**Instance settings** holds instance-wide limits and schedules, the
**Instance email (SMTP)** relay used for invites, and the vulnerability tracker
connection. **Metrics access** controls access to the
Prometheus `/metrics` endpoint; see the
[Grafana integration](../integrations/grafana/index.md).
