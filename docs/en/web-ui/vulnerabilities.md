# Vulnerabilities

The **Vulnerabilities** page lists every known security advisory affecting a
version cached in your registry, so you can see your exposure across all
ecosystems in one place. Each entry is matched against the
[OSV](https://osv.dev) database.

## Find an advisory

- **Search** by package name, OSV ID, or summary text.
- **Filter by ecosystem** with the dropdown.
- **Sort** by selecting a column header — the list opens sorted by **Severity**,
  most serious first.
- **Page** through results at the bottom; choose 20, 50, 100, or 200 rows per
  page.

Each row shows:

| Column | Meaning |
| ------ | ------- |
| **Package** | The affected package, with its ecosystem badge. |
| **Version** | The specific cached version the advisory applies to. |
| **Severity** | Critical, High, Medium, or Low. |
| **Score** | The CVSS base score, or a dash when the advisory has no score. |
| **OSV ID** | The advisory identifier (for example `GHSA-…`), linking to its full record on osv.dev. |
| **Summary** | A one-line description of the issue. |
| **Published** | When the advisory was published. |

## From advisory to action

Seeing an advisory here does not by itself stop the version being served —
whether a vulnerable version is blocked depends on your organization's
supply-chain gates (vulnerability score, KEV, EPSS, malware). Those gates, and
the scores they key on, are described in [Settings](../admin/settings.md).
Versions a gate has blocked land in the [Quarantine](quarantine.md) queue for
review.

To see the advisories on one package in context, open it from
[Packages](packages.md) — each version's **Status** column shows whether it is
**Vulnerable**.
