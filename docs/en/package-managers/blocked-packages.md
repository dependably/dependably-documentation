# Blocked packages

Your package manager reports `403 Forbidden` and the build fails. This page
tells you whether your own policy did it, which policy, and what to do next.

## Is it policy, or is it authentication?

Check the response header:

```bash
curl -sS -o /dev/null -D - -u user:<your token> \
  https://repo.example.com/simple/idna/idna-3.19-py3-none-any.whl
```

```
HTTP/1.1 403 Forbidden
X-Dependably-Block-Reason: release_age
```

`X-Dependably-Block-Reason` is present **only** when a policy gate refused the
request. A `403` without it is not a policy decision — it is an authentication
or authorization failure, and the remedy is a token, not a setting. See
[Access tokens](../web-ui/tokens.md).

The header names the gate and nothing else. Your configured thresholds, and the
advisory IDs behind them, stay out of the response — an error body travels
further than the request did, into CI logs, screenshots, and support tickets.

## What each reason means

| Reason | What happened | What to do |
| ------ | ------------- | ---------- |
| `release_age` | The version is newer than your organization's cooldown window. | Wait — the hold expires on its own. Or pin an older version. |
| `manual` | An operator blocked this version by hand. | Ask why; an Admin or Owner can unblock it from **Packages → the version → Manual block**. |
| `deprecated` | Upstream marked the version deprecated or yanked. | Move to a supported version. |
| `revoked` | Upstream withdrew the version entirely. | Move off it. It is not coming back. |
| `malicious` | An OSV `MAL-` advisory names this version. | Do not bypass. Treat any machine that already installed it as suspect. |
| `kev` | A CISA Known Exploited Vulnerability affects it. | Upgrade. This is being exploited in the wild. |
| `epss` | Its exploit-likelihood score exceeds your organization's tolerance. | Upgrade, or raise the tolerance deliberately. |
| `vuln_score` | Its CVSS score exceeds your organization's tolerance. | Upgrade, or raise the tolerance deliberately. |
| `provenance` | Signature or attestation verification did not produce a verified result. | Check the trust anchors under **Settings → Trust Anchors**. |
| `install_script` | The package ships install or lifecycle scripts, which your organization blocks. | Add it to the install-script allowlist if it is known-good. |
| `license` | Its license is outside your organization's allowlist. | Use a differently-licensed package, or amend the policy. |

The gates themselves, and who can change them, are described in
[Settings](../admin/settings.md).

## Why the version was listed at all

Usually it should not have been: a listing surface filters against the same
gates the download uses, so a version the index advertises is one the download
will serve. Two cases are genuine exceptions rather than bugs, and both come
down to what a listing can know:

- **A version nobody has fetched yet.** Only the gates decidable from upstream
  metadata apply — release age, where the upstream publishes a timestamp, and
  deprecation, where it publishes a marker. The vulnerability, provenance,
  install-script, and license gates need the artefact itself, so they run on the
  first fetch instead. A build can therefore meet one of those reasons on a
  coordinate the index listed.
- **Alpine `apk`.** Its index is upstream bytes that the client itself
  signature-verifies, so rewriting the index would invalidate that signature.
  `apk` is gated at download only.

Meeting a *different* reason on a version the index advertised is worth
reporting to your operator — it means a listing surface and its download path
disagree.

## Finding it after the fact

Every refusal writes an entry to the [Audit log](../web-ui/audit.md). Filter by
the `blocked` event type to see every refusal with its package, actor, and
source address.

An automatic block also opens a [Quarantine](../web-ui/quarantine.md) review
entry, so a refusal you disagree with has somewhere to be approved rather than
needing the policy turned off. Release-age holds age out of that queue on their
own.

## Making a hold less surprising

If developers hit `release_age` often, the cooldown is doing its job but
arriving too late to be useful. Two things help more than lowering it:

- **Pin your dependencies.** A pinned build resolves to a version that is
  already past the window.
- **Watch the quarantine queue** rather than waiting for a failed build to
  surface the hold.
