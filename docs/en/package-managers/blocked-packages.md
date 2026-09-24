---
description: "What a 403 Forbidden from your package manager means when Dependably's policy blocks a package, which policy did it, and what to do next."
order: 9
---

# Blocked packages

Your package manager reports `403 Forbidden` and the build fails. This page
tells you whether your own policy did it, which policy, and what to do next.

## Is it policy, or is it authentication?

A missing, invalid, or wrong-organization token is answered `401`, not `403`.
If you got a `401`, fix the token; see [Access tokens](../web-ui/tokens.md).

A `403` means Dependably refused the request. For npm, PyPI, NuGet and RPM
downloads, and for Docker images refused by the licence policy, the response
names the gate that refused it. Check the response header:

```bash
curl -sS -o /dev/null -D - -u user:<your token> \
  https://repo.example.com/packages/idna-3.19-py3-none-any.whl
```

```
HTTP/1.1 403 Forbidden
X-Dependably-Block-Reason: release_age
```

The header names the gate and nothing else. Your configured thresholds, and the
advisory IDs behind them, stay out of the response, because an error body
travels further than the request did, into CI logs, screenshots, and support
tickets.

Other ecosystems, and refusals by your organization's package **Allowlist** or
**Blocklist**, answer a plain `403` without the header. The
[Audit log](#finding-it-after-the-fact) records which gate it was.

## What each reason means

| Reason | What happened | What to do |
| ------ | ------------- | ---------- |
| `release_age` | The version is newer than your organization's cooldown window. | Wait for the hold to expire on its own, or pin an older version. |
| `manual` | An Admin or Owner blocked this version by hand. | Ask why. An Admin or Owner can lift it: open **Packages**, then the package, then the version's **Actions** menu, then **Unblock**. |
| `deprecated` | Upstream marked the version deprecated or yanked. | Move to a supported version. |
| `revoked` | The version has disappeared from upstream. | Move off it. The block lifts if the version reappears upstream. |
| `malicious` | An OSV `MAL-` advisory names this version. | Do not bypass. Treat any machine that already installed it as suspect. |
| `malicious_live` | The vulnerability tracker found this exact version still serving compromised bytes. | Do not bypass. Treat any machine that already installed it as suspect. |
| `kev` | A CVE in the CISA Known Exploited Vulnerabilities Catalog affects it. | Upgrade. This is being exploited in the wild. |
| `kev_ransomware` | A CVE that CISA marks as used in ransomware campaigns affects it. | Upgrade. |
| `ssvc_exploitation` | CISA's exploitation assessment rates an advisory on it as actively exploited, or the assessment data is out of date. | Upgrade. If the data is out of date, ask your operator to check the vulnerability tracker connection. |
| `epss` | Its exploit-likelihood score exceeds your organization's tolerance. | Upgrade, or raise the tolerance deliberately. |
| `epss_percentile` | An advisory on it ranks above your organization's **EPSS percentile ceiling**. | Upgrade, or raise the ceiling deliberately. |
| `vuln_score` | Its CVSS score exceeds your organization's tolerance. | Upgrade, or raise the tolerance deliberately. |
| `provenance` | Signature or attestation verification failed, found no signature, or had no trust anchor to check against. | Open **Settings**, then **Signatures**, and check the **Signature trust anchors** section. |
| `install_script` | The package ships install or lifecycle scripts, which your organization blocks. | Add it to the **Install-script allowlist** if it is known-good. |
| `license` | Its licence is not on your organization's allowed list, is on its blocked list, or is not declared. | Use a differently licensed package, or amend the policy. |

**Unblock overrides every gate.** An unblocked version is served even if a
malicious, exploited, or licence gate would refuse it, so use it only on a
version you have reviewed.

The gates themselves, and who can change them, are described in
[Settings](../admin/settings.md).

## Why the version was listed at all

A package index leaves out versions that the gates Dependably can decide from
stored data would refuse. Some refusals can only happen at download.

**A version nobody has fetched yet.** Only the gates decidable from upstream
metadata apply to it in the index: release age, where the upstream publishes a
timestamp, and deprecation, where it publishes a marker. The vulnerability,
provenance, install-script, and licence gates need the artefact itself, so
they run on the first fetch instead. A build can therefore meet one of those
reasons on a version the index listed.

**The licence gate, and the signature gate with no trust anchor configured,**
are applied at download only, even for a version already cached.

**Alpine `apk`.** The index is upstream bytes that the client itself
signature-verifies, so rewriting the index would invalidate that signature.
`apk` is gated at download only.

## Finding it after the fact

Every refusal writes an entry to the **Activity** tab of the
[Audit log](../web-ui/audit.md). Filter the event type by **Blocked (all)** to
see every refusal with its package, actor, and source address; each gate also
has its own `blocked_` event, such as `blocked_release_age`.

An automatic block also opens a [Quarantine](../web-ui/quarantine.md) review
entry, so a refusal you disagree with has somewhere to be approved rather than
needing the policy turned off. A manual block does not. Release-age holds leave
that queue on their own once the version is old enough.

## Making a hold less surprising

If developers hit `release_age` often, the cooldown is doing its job but
arriving too late to be useful. Pinning your dependencies helps more than
lowering it, because a build then resolves to a version that is already past
the window. Watching the quarantine queue helps too: you see the hold before a
build fails.
