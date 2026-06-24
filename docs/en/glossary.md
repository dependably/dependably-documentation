# Glossary

Short definitions of the identifiers and scoring systems Dependably surfaces
across the web UI, the audit log, and the supply-chain gates. The gates that use
these scores are configured in [Settings](admin/settings.md).

| Term | Meaning |
| ---- | ------- |
| **PURL** | Package URL — a standard identifier for a package, e.g. `pkg:npm/@babel/core`. Used in the package list, the audit log, and search. |
| **CVSS** | Common Vulnerability Scoring System — a 0.0–10.0 severity score for a vulnerability. The OSV-score gate (`maxOsvScoreTolerance`) keys on it. |
| **EPSS** | Exploit Prediction Scoring System — a 0.0–1.0 probability that a vulnerability will be exploited in the wild. The `maxEpssTolerance` gate keys on it. |
| **KEV** | CISA's Known Exploited Vulnerabilities catalogue — vulnerabilities confirmed to be actively exploited. The `blockKev` gate keys on it. |
| **OSV** | Open Source Vulnerabilities — the open advisory database and schema Dependably consults when scanning packages. |
| **MAL- advisory** | An OSV malicious-package advisory (its ID starts with `MAL-`) flagging a version as known-malicious. The `blockMalicious` gate keys on it. |
| **SPDX** | The standard license-identifier scheme (e.g. `MIT`, `Apache-2.0`). Dependably records the SPDX license of every package and enforces the [license policy](web-ui/license-policy.md) against it. |
