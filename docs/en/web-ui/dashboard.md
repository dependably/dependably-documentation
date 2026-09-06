---
description: "The Overview page of the Dependably web console: what each metric card, chart, trend, and prevention count means and where it leads."
order: 1
---

# Overview dashboard

The **Overview** is the first page after sign-in and the page the **Dependably**
logo returns you to. It answers, at a glance: how much is in the registry, what
is being pulled, what is being blocked, and where the risk sits.

![The Overview page: a New vulnerabilities detected ribbon, thirteen metric cards, and a packages-by-ecosystem table beside a doughnut chart, with the downloads chart starting beneath.](images/overview.png)

All numbers cover your organization only. The scoring terms — CVSS, EPSS,
KEV — are defined in the [Glossary](../glossary.md).

## New vulnerabilities

The ribbon in the top corner reads **New vulnerabilities detected** or **No new
vulnerabilities**, with counts for the last **24h**, **7d**, and **30d**. It
counts advisories the scanner matched to one of your cached versions in that
window, so an old advisory on a package you cached yesterday counts as new.
Select it to open [Vulnerabilities](vulnerabilities.md) sorted newest first.

## Metric cards

| Card | What it counts |
| ---- | -------------- |
| **Total packages** | Every package across all ecosystems, split into **hosted** (published to your registry) and **proxied** (cached from an upstream). |
| **Total disk used** | Storage occupied by all cached and published artefacts. When your organization has a storage quota, the card shows it. |
| **Active users (7d)** | Distinct accounts and tokens with recorded activity in the last 7 days. |
| **Downloads (30d)** | Downloads served in the last 30 days, including first fetches from upstream. Blocked attempts are not counted. |
| **Projects** | Projects with an uploaded SBOM, and how many of their latest versions pass, warn, violate, or await policy evaluation. Select it to open [Projects](projects.md). |
| **Blocked pulls (30d)** | Downloads refused by any policy gate in the last 30 days. Hover for the count per gate. |
| **Malicious blocked (30d)** | The share of those blocks made by the malware gate. |
| **KEV blocked (30d)** | The share made by the Known Exploited Vulnerabilities gates, including the ransomware gate. |
| **Operational risk** | Packages with at least one cached version that is 5 or more stable releases behind upstream. Select it to open [Risk](risk.md). |
| **Licence risk** | Cached versions whose licence is on the block list, or that have no licence recorded at all. Select it to open [Risk](risk.md). |
| **Quarantine pending** | Versions a gate has held that are waiting for an administrator's decision. |
| **Active overrides** | Versions an administrator has approved out of quarantine, and how old the oldest approval is. |
| **Scan coverage** | The share of versions the vulnerability scanner has checked, with the scanned and unscanned counts. Versions in an ecosystem that has no vulnerability database are shown as a third count and left out of the percentage. |

Administrators can select the blocked, quarantine, and override cards to open
the matching Audit log or Quarantine view. For a member those cards show the
number only.

## Packages by ecosystem

A doughnut chart shows each ecosystem's share of the package total. Beside it a
table lists, per ecosystem, the package count, disk used, the number of
advisories at each severity (**Critical**, **High**, **Medium**, **Low**, and
**Unscored** for advisories that carry no score), and the total. These are
current counts, not a 30-day window. Ecosystems with no packages are left out.

## Package downloads — last 24 hours

A bar per hour of downloads served over the last day, with the total beneath.
Blocked attempts are not included.

## Trends (30d)

Three cards — **Vulnerabilities**, **Blocked pulls**, and **Downloads** — the
same figures as the cards above, snapshotted once a day. Each shows today's value, the change against the value 7 days ago, and a sparkline of
the last 30 daily snapshots. The section reads **Not enough history yet** until
two daily snapshots exist.

## Prevention (30d)

One count per policy gate — Deprecated, Revoked, Release Age, Licence, Install
Script, Provenance, Malicious, KEV, KEV · Ransomware, EPSS, and Vuln Score —
showing how many downloads that gate refused in the last 30 days; together
they add up to **Blocked pulls (30d)**. A gate that never fired shows 0. When nothing was blocked, a note says whether that is
because every pull passed or because no pulls were served. What each gate
checks, and its enforcement mode, is set by an administrator in
[Settings](../admin/settings.md).
