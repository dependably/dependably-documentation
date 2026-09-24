---
description: "Definitions of PURL, CVSS, EPSS, KEV, OSV, SPDX, SBOM, VEX, SARIF and other terms used in the Dependably web UI and policy gates."
---

# Glossary

Short definitions of the identifiers and scoring systems Dependably surfaces
across the web UI, the audit log, and the supply-chain gates. The gates that use
these scores are configured in [Settings](admin/settings.md).

| Term | Meaning |
| ---- | ------- |
| **PURL** | Package URL, a standard identifier for a package, e.g. `pkg:npm/@babel/core`. Used in the package list, the audit log, and search. |
| **CVSS** | Common Vulnerability Scoring System, a severity score from 0.0 to 10.0 for a vulnerability. The **Max OSV score tolerance** gate in Settings compares against it. |
| **EPSS** | Exploit Prediction Scoring System, a probability from 0.0 to 1.0 that a vulnerability will be exploited in the wild. The **EPSS probability ceiling** gate in Settings keys on it. |
| **KEV** | CISA's Known Exploited Vulnerabilities Catalog: vulnerabilities confirmed to be actively exploited. The **Known-exploited (KEV) policy** in Settings keys on it. |
| **OSV** | Open Source Vulnerabilities, the open advisory database and schema Dependably consults when scanning packages. |
| **MAL- advisory** | An OSV malicious-package advisory (its ID starts with `MAL-`) flagging a version as known-malicious. The **Malicious package policy** in Settings keys on it. |
| **SPDX** | The standard licence-identifier scheme (e.g. `MIT`, `Apache-2.0`). Dependably records a package's SPDX licence when it is published or cached and checks the [licence policy](web-ui/license-policy.md) against it. |
| **CWE** | Common Weakness Enumeration, the catalogue of weakness classes (for example CWE-79, cross-site scripting) an advisory is tagged with. Shown on each advisory in [Vulnerabilities](web-ui/vulnerabilities.md). |
| **SBOM** | Software bill of materials, a document listing every component an application ships. Dependably accepts CycloneDX JSON (1.4 to 1.7); upload one to describe a version in [Projects](web-ui/projects.md). |
| **VEX** | Vulnerability Exploitability eXchange, a document stating whether each advisory actually affects a product (CycloneDX VEX or OpenVEX). Uploaded alongside an SBOM to record triage decisions. |
| **SARIF** | Static Analysis Results Interchange Format, the output of a code scanner (SARIF 2.1.0). Uploaded alongside an SBOM to add reachability findings. |
| **TOTP** | Time-based one-time password, the 6-digit code an authenticator app generates for two-factor authentication. See [Profile](web-ui/profile.md). |
| **Air-gapped** | An instance with no route to the public registries. Upstream fetches are off, and advisories come from a locally mirrored OSV feed. |
