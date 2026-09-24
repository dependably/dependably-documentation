---
description: "Check a package for malware, known vulnerabilities, and licence policy in the Dependably web console before you add it, without downloading it."
order: 4
---

# Check a package before you add it

The **Lookup** page checks a candidate package for malware, known
vulnerabilities, and licence policy before you add it to a project. Nothing is
downloaded, cached, or installed. Members, administrators, and owners can use
the page.

![The Check a package page: an Ecosystem dropdown set to npm, a Package name field, a Version field reading Leave blank for latest, and a Check package button.](images/lookup.png)

## Run a check

1. Choose the **Ecosystem**: npm, PyPI, NuGet, Maven, Go, Cargo, or Hex.
   Other ecosystems are not offered, because Lookup has no advisory feed or no
   upstream metadata to check them against.
2. Enter the **Package name**. For Maven, enter the `groupId:artifactId`
   coordinate.
3. Enter a **Version**, or leave it blank to check the latest stable release.
   The result then notes that no version was specified.
4. Select **Check package**.

A package or version that does not exist upstream is reported as **No such
package**, with the name and version that were looked up, so a typo is easy to
spot.

## Read the result

The verdict at the top, beside the package URL that was evaluated, is one of:

- **Allowed**: no policy gate objects.
- **Warn**: something needs your judgement. The licence is outside the allow
  list or conditional (while the licence policy is on), the package is
  deprecated or flagged by a check your organization has set to warn rather
  than block, or the vulnerability data could not be checked. The licence
  policy alone produces at most a warning here.
- **Blocked**: a policy gate would refuse the package if you pulled it. It is
  malicious, in the CISA Known Exploited Vulnerabilities Catalog, too new for
  the release-age hold, deprecated, or above your organization's vulnerability
  score or exploit-likelihood tolerance.

Beneath the verdict, cards give the detail:

| Card | What it shows |
| ---- | ------------- |
| **Malware** | *Known malicious package*, with the advisory identifiers, or *No known malicious advisories*. |
| **Vulnerabilities** | Advisories split into **Scored** and **UNSCORED / NO CVSS**, or *No known vulnerabilities*. An unscored advisory has an undisclosed severity, which is not the same as no risk. A **CISA KEV** badge marks confirmed exploitation; an **EPSS** value gives the probability of exploitation in the next 30 days. When the advisory source could not be reached, the card says the vulnerability data could not be checked. |
| **Licence** | The current policy mode and the licence recorded upstream, with one of: *Allowed by policy*, *Permitted with a condition* (naming the licence), *Not allowed by policy* (naming the licence), *Recorded informationally* when the policy is off, or *Not determinable* for ecosystems whose metadata carries no licence. |

A *Not checked at lookup time* line appears when a check that normally runs
could not: the release-age hold, deprecation status, licence, or the
vulnerability scan. That happens when the ecosystem's metadata does not carry
the fact, when upstream could not be reached, or when the instance is
air-gapped. On an air-gapped instance the page says so, and advisories and
licence come from the local mirror only. Give a version explicitly there,
because "latest" cannot be resolved without upstream. The same applies when
upstream is unreachable: a lookup with no version fails with a message that the
upstream registry is temporarily unavailable.

## What a verdict does not do

Lookup reports what the gates would say today. When your package manager
installs the package, that download goes through the same gates at that
moment, and your organization's policy may have changed in between. Lookup
never downloads the package, so the install-script and signature checks that
inspect the package itself run only on the real download. The gates and their
current settings are listed on the **Controls** tab of
[Policies](license-policy.md); an administrator sets them in
[Settings](../admin/settings.md). The terms are in the
[Glossary](../glossary.md).
