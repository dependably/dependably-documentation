# Settings

These are the per-organization settings an owner or admin configures in the web
UI (or the API). All writes require the `tenant:configure` capability; reads
require `read:tenant`.

Settings fall into three groups: **general**, **retention**, and **proxy &
security gates**.

## General settings

Organization-wide switches every member inherits.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| `anonymousPull` | `true` / `false` | `false` | Allow unauthenticated clients to pull from this org's registries. |
| `allowlistMode` | `true` / `false` | `false` | Restrict proxying to packages on the org allowlist (deny-by-default ingest). |
| `maxUploadBytes` | bytes, or empty | none | Org-wide upload size ceiling. |
| `maxUploadBytes{PyPi,Npm,NuGet,Maven,Rpm,Oci,Cargo}` | bytes, or empty | none | Per-ecosystem upload ceiling, overriding the org-wide value. |
| `defaultLanguage` | `en`, `fr` | `en` | Default UI language new users inherit. |
| `versionOverwritePolicy` | `block`, `exception`, `allow` | `block` | Same-version re-push policy. `block` always rejects duplicates; `exception` rejects by default but a package may opt in; `allow` accepts by default but a package may opt out. |
| `airGapped` | `true` / `false` | `false` | Air-gap the organization: no outbound requests; proxy passthrough forced off. |
| `requireMfa` | `true` / `false` | `false` | Require every user in this org to complete MFA enrollment. |

## Retention

Per-organization retention budgets. An empty field means that dimension is
unbounded. Enforcement runs in the scheduled GC pass.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| `keepVersions` | integer, or empty | unbounded | Maximum versions to retain per package; older versions become eligible for cleanup. |
| `keepDays` | days, or empty | unbounded | Age ceiling for retained versions. |
| `activityRetentionDays` | days, or empty | unbounded | How long per-org activity-log entries are kept. All-time download counts survive pruning. |

## Proxy & security gates

The supply-chain enforcement layer applied to **proxy-fetched** (upstream)
versions: whether to proxy at all, plus independent gates keyed on vulnerability
score, exploit signals, malware advisories, deprecation, install scripts,
release age, and per-ecosystem signature verification. Most gates are tri-state:
`off` (allow), `warn` (surface in the UI only), `block` (fail closed — refuse to
fetch, cache, or serve). A manual per-version allow override always wins.

| Setting | Values | Default | What it does |
| ------- | ------ | ------- | ------------ |
| `proxyPassthroughEnabled` | `true` / `false` | `true` | Master switch for fetching uncached versions from upstreams. Forced off when air-gapped. |
| `maxOsvScoreTolerance` | 0.0–10.0 (CVSS) | `10.0` | Block a version whose max OSV/CVSS score exceeds this. `10.0` blocks nothing on score. |
| `minReleaseAgeHours` | 0–8760, or empty | off | Supply-chain hold: block an upstream version until it is at least this many hours old. |
| `blockDeprecated` | `off`, `warn`, `block_new`, `block_all` | `off` | Gate deprecated versions. `block_new` refuses on cache miss but keeps serving cached; `block_all` also denies cached. |
| `blockMalicious` | `off`, `warn`, `block` | `block` | Gate versions carrying an OSV `MAL-` (malicious-package) advisory. |
| `blockKev` | `off`, `warn`, `block` | `off` | Gate versions matching a CISA Known-Exploited-Vulnerabilities entry. |
| `maxEpssTolerance` | 0.0–1.0 (EPSS), or empty | off | Block a version whose max advisory EPSS exploit probability exceeds this. |
| `blockInstallScripts` | `off`, `warn`, `block` | `off` | Gate artifacts that ship an install / lifecycle script. |
| `verifyNpmSignatures` | `off`, `warn`, `block` | `off` | Verify npm registry signatures on proxied versions. |
| `verifyNuGetSignatures` | `off`, `warn`, `block` | `off` | Verify NuGet `.nupkg` signatures. |
| `verifyPyPiAttestations` | `off`, `warn`, `block` | `off` | Verify PyPI PEP 740 attestations. |
| `verifyRpmSignatures` | `off`, `warn`, `block` | `off` | Verify RPM GPG header signatures. |
| `verifyMavenSignatures` | `off`, `warn`, `block` | `off` | Verify Maven detached `.asc` signatures. |
