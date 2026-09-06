---
description: "The Vulnerabilities page of the Dependably web console: every advisory affecting a cached version, ranked by exploitation risk, with a fix recipe for your AI assistant."
---

# Vulnerabilities

The **Vulnerabilities** page lists every known security advisory affecting a
version in your registry, so you can see your exposure across all ecosystems
in one place. Advisories come from the [OSV](https://osv.dev) database. For
CVSS, EPSS, KEV, and other terms, see the [Glossary](../glossary.md).

![The Vulnerabilities page: a search box, ecosystem and severity filters, a Revoked only toggle, and a table of advisories with Package, Version, Severity, Score, EPSS, OSV ID, Apps, Summary, Age, and Published columns.](images/vulnerabilities.png)

## Find an advisory

- **Search** by package name, version, OSV ID, or summary text.
- **Filter** by ecosystem with the dropdown, by severity with the **Critical**,
  **High**, **Medium**, and **Low** chips, or show **Revoked only**.
- **Sort** by selecting a column header. The list opens in risk order —
  advisories in the CISA Known Exploited Vulnerabilities Catalog first, then by
  exploitation probability, then by CVSS score — which is not a column sort,
  so no header is highlighted until you choose one.
- **Page** through results at the bottom; choose 20, 50, 100, or 200 rows per
  page. Filters and sort are kept in the page address, so a copied link opens
  the same view.

| Column | Meaning |
| ------ | ------- |
| **Package** | The affected package, with its ecosystem badge. |
| **Version** | The specific cached version the advisory applies to. A **revoked** badge means the version has disappeared from the upstream registry — a lifecycle signal rather than a vulnerability, though a takedown can indicate a compromised release. |
| **Severity** | **Critical** (CVSS 9.0 and above), **High** (7.0–8.9), **Medium** (4.0–6.9), or **Low**. Two more badges can appear here: **KEV**, for an advisory in the CISA Known Exploited Vulnerabilities Catalog, or **KEV · Ransomware** for entries CISA has tied to ransomware campaigns; and **MALICIOUS** for an OSV `MAL-` report — a verdict that the package itself is malicious, not a score. Remove such a package rather than looking for a fix. |
| **Score** | The CVSS base score, taken from the advisory or computed from its vector, or a dash when the advisory has none. |
| **EPSS** | The probability, as a percentage, that the vulnerability is exploited in the wild within the next 30 days. Refreshed daily. Use it to rank *which* High you fix first. |
| **OSV ID** | The advisory identifier (for example `GHSA-…`), linking to its record on osv.dev. |
| **Apps** | How many of your [projects](projects.md) ship the affected package in their latest version. A dash means the count could not be loaded, not zero. |
| **Summary** | A one-line description of the issue. |
| **Age** | How many days the advisory has been open against this version. |
| **Published** | When the advisory was published. |

> **An advisory with no score is unscored, not safe.** It shows no severity band
> and never meets an alert threshold. Read it and judge it yourself rather than
> reading the empty band as a clean result.

## Read one advisory

Select a row to expand it. From the top:

- **Copy remediation brief** — a Markdown summary of the advisory, the
  affected package and versions, the weakness classes, and the recommended
  skill, ready to paste into a ticket or an assistant.
- **When it was checked, published, and modified**, the EPSS value, the KEV
  badge, and links to the OSV record and, for a CVE, to NVD.
- **Applications affected** — which projects ship the package.
- **Aliases** and **Related** advisories, each linked to its home database:
  GHSA to the GitHub Advisory Database, CVE to NVD, RUSTSEC, GO, and PYSEC to
  theirs.
- **References**, then the **Remediation** section described below, then the
  **Affected** ranges, **Credits**, the advisory's full **Details**, and the
  raw database-specific data.

### Remediation

- **Fixed in** — the version to upgrade to. Dependably resolves the fix of the
  affected range *containing your installed version*, using the ecosystem's
  own version ordering for npm, PyPI, NuGet, Maven, Cargo, Terraform, and Hex.
  For RPM, Docker, Go, and Alpine apk it falls back to the first fixed version
  the advisory names.
- **CWE chips** — the Common Weakness Enumeration classes the advisory
  carries, linked to cwe.mitre.org and each mapped to its
  [OWASP Top 10:2025](https://owasp.org/Top10/2025/) category, the background
  reading on what the class is and how to prevent it structurally.
- **Fix with your AI agent** — a curated remediation playbook, below.

## Fix it with an AI assistant

A skill is a Markdown playbook an AI coding assistant follows. Your instance
serves nine, and shows the ones that match what the advisory carries:

| Skill | Applies when |
| ----- | ------------ |
| `fix-vulnerable-dependency` | Any advisory with a fixed version — the lockfile-aware upgrade recipe, direct and transitive, per ecosystem |
| `fix-injection` | SQL, command, LDAP, XPath, and code injection |
| `fix-xss` | Cross-site scripting |
| `fix-path-traversal` | Path traversal and symlink following |
| `fix-ssrf` | Server-side request forgery |
| `fix-unsafe-deserialization` | Unsafe deserialization and mass assignment |
| `fix-broken-access-control` | Missing or incorrect authorization and insecure direct object references |
| `fix-weak-cryptography` | Outdated algorithms, hard-coded keys, and non-cryptographic randomness |
| `fix-authentication-failures` | Broken or missing authentication, rate limiting, certificate and session validation |

The playbook itself is assistant-neutral. Pick your assistant in the
remediation section and the install command adapts:

| Assistant | Installs to | Invoked |
| --------- | ----------- | ------- |
| Claude Code | `~/.claude/skills/<id>/SKILL.md` | discovered by name |
| OpenAI Codex | `~/.codex/prompts/<id>.md` | `/<id>` |
| GitHub Copilot | `.github/prompts/<id>.prompt.md`, in your repository | `/<id>` |

The **Install skill** one-liner needs no token — the endpoint it fetches from
is anonymous. The **Prompt** beside it is pre-filled with the advisory ID, the
affected package, your installed version, and the resolved fixed version;
paste it into the assistant after installing. Using no assistant is fine too:
the playbooks are plain Markdown, so open the same URL and follow the recipe
by hand.

## What an advisory does and does not do

Seeing an advisory here does not by itself stop the version being served —
whether a vulnerable version is blocked depends on your organization's
supply-chain gates (vulnerability score, KEV, EPSS, malware). Those gates, and
the scores they key on, are set by an administrator in
[Settings](../admin/settings.md). Versions a gate has blocked wait in the
Quarantine queue for an administrator's decision; a package manager refused a
download sees [a blocked package](../package-managers/blocked-packages.md).
This page has no block or allow controls; administrators and owners use them
on the [package page](packages.md). A member cannot block a version.

On an air-gapped instance, advisories come from the local OSV mirror, and the
KEV and EPSS columns stay empty because those feeds are not fetched.
