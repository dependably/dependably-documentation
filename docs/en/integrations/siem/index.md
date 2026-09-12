---
order: 2
---

# SIEM and SOC integration

Dependably exposes security telemetry that a SIEM can consume, so the registry is
watched the same way the rest of your estate is. This page covers what is emitted,
which transport carries which events, and how to build a collector that does not
silently lose data.

It is written from a working reference implementation against Wazuh; the mechanics
generalize to Splunk, Elastic, Sentinel or anything that can read newline-delimited
JSON.

## Two transports, three feeds, and they carry different data

Getting this wrong is the most common way to wire up the wrong thing, because the two transports
read different tables — they are not the same events at different fidelity.

| | Pull | Push (`SIEM_WEBHOOK_URL` / `SIEM_SYSLOG_HOST`) |
| --- | --- | --- |
| Source | `audit_log` and `activity` | `audit_event` |
| Endpoints | `/api/v1/siem/events/auth`, `/api/v1/siem/events/activity` | n/a |
| Latency | collector-polled | near real time |
| Backfills history | yes, to `SIEM_MAX_LOOKBACK_DAYS` | no |
| Carries `source_ip` | yes | **no** |
| Survives collector downtime | yes — the caller re-reads its own window | no — the queue is bounded and drops on overflow |
| Needs an instance restart to enable | no | yes |

**Push drops more than the transport table suggests.** It forwards each typed event's `payload`,
but `outcome`, `source_ip`, `user_agent` and `request_id` are *columns* on the typed event rather
than payload fields, and none of them are mapped. So the push path carries neither the source
address nor the explicit accepted/rejected/error verdict.

**If you are choosing one, choose pull.** It is durable across collector outages, it backfills, and
it carries the source address most detections need. Use push in addition only when you need
sub-minute latency, and know that exceeding `SIEM_QUEUE_CAPACITY` drops audit events permanently.

### The two pull feeds

`/api/v1/siem/events/auth` reads the `audit_log` plane: authentication, credential and capability
refusals, MFA lifecycle, SAML identity changes, security-setting changes.

`/api/v1/siem/events/activity` reads the `activity` plane: policy denials (`blocked_*` — every
block-gate arm) and, behind an opt-in flag, `download`. Poll both.

## Authentication and tenant scope

Both SIEM endpoints accept either a JWT session or a Bearer token carrying the
`read:audit` capability.

A **token is pinned to its own organization**. The `?org=` parameter is ignored for
token callers — not rejected, ignored — so a token can neither read another tenant's
events nor use the endpoint to discover whether an organization slug exists.

A platform administrator (capability `platform:*`) can read across tenants on the auth
feed. On the activity feed it must name one organization per poll: that query is scoped
by a non-nullable organization id, so "every tenant at once" is not expressible, and
omitting `?org=` is a 400 rather than an unscoped read.

Mint a dedicated token for your collector with `read:audit` and nothing else.

## What to collect, and what to leave alone

A SIEM is not an archive. Dependably writes a great deal that belongs in its own
audit trail and should never reach a SOC queue. The dividing line that works:

**Forward** refusals and failures, integrity breaks, and identity or credential
lifecycle changes. A SOC analyst can act on these without asking you whether they
were legitimate.

**Leave behind** authorized operators doing authorized things through the product's
intended workflow — even when those things lower security posture. An analyst cannot
triage them, because only the registry owner knows whether they were justified, so
every alert routes straight back to you.

Two worked examples, both of which look tempting and are not:

- **`package.replace`** — an artifact republished with different bytes. This reads
  like tamper, but in a private registry the publishers are your own developers, and
  whether a replace is permitted is the organization's `version_overwrite_policy`
  setting, which the event does not carry. No rule can separate a policy violation
  from ordinary churn, so the alert is unactionable by construction.
- **`package.override.set`** — an operator allowing a package past a policy block.
  The event records the package and the new value but **not the blocked reason**, so
  a SOC cannot tell a waived licence mismatch from a waived known-malicious package.
  Those need opposite responses. It belongs in the quarantine review workflow.

There is a second reason to be strict. The SIEM endpoint is a personal-data egress
point: forwarded events carry actor identifiers and payloads, and if your collector
sits in another jurisdiction that is a Chapter V transfer. Events nobody acts on are
unnecessary egress as well as noise.

## The events worth alerting on

Names are prefix-filterable on the auth feed via repeatable `action=` parameters. The filter
matches a **prefix ending in a dot**, so an action without a dot in its name cannot be requested by
any value — several credential-lifecycle events are currently unreachable for that reason, noted
below.

### Refusals — a credential or caller was told no

| Action | Fires when | Feed |
| --- | --- | --- |
| `auth.token.rejected` | a credential was presented and did not resolve. Reasons: `invalid`, `tenant_mismatch` | auth |
| `auth.capability.denied` | a resolved credential lacked the capability for the operation; carries required vs granted | auth |
| `oci.scope_denied` | the OCI plane's own, richer form of the same | auth |
| `ratelimit.rejected` | a request was refused by a rate limiter; aggregated with a count | auth |
| `metrics.scrape_denied` | an unauthorized `/metrics` scrape | auth |
| `blocked_*` | a pull refused by policy — licence, KEV, malicious, provenance, release age and the rest | **activity** |
| `login.failure`, `lockout.*` | failed sign-in, lockout | auth |

`auth.token.rejected` with `reason=tenant_mismatch` is the cross-tenant credential probe: a valid
token from one organization presented against another. The row under the target organization is
deliberately **actor-less**, because naming the presenting credential there would leak one tenant's
token identity into another tenant's audit trail.

### Identity and credential lifecycle

`mfa.*` (enrolled, disabled, recovery-code used, trusted device added), `auth.saml.role*`,
`saml.config_*`, `user.password_changed`, `user.email_changed`.

**Unreachable today:** `token_created`, `token_revoked`, `service_token_*`, `member_role_changed`,
`member_removed`, `invite_accept_blocked`, `allowlist_blocked` — these have no dot in their names,
so the prefix filter cannot request them. Do not build a rule that assumes token or role-change
coverage until that is fixed.

### Configuration

`tenant.setting.change` carries the setting key with its before and after values. Treat a change to
an enforcement control — policy mode, signature verification, overwrite policy, MFA or SSO
requirements — differently from a cosmetic one; that is the canonical post-account-takeover step.

### Reading `partition`

Aggregated rows carry a `partition` identifying who was refused. It uses several namespaces and you
must **branch on the prefix rather than parse it as an address**: `ip:` or a bare address,
`user:<subject>`, `token:<reference>`, `proto:<address>`, and `<address>:<policy>`. Note `token:`
means different things on different actions — a truncated token id on `auth.*`, a hash prefix of the
presented credential on `ratelimit.*`.

## Building a collector that does not lose data

Five properties, each of which corresponds to a way a naive collector silently fails.

### Advance the watermark only after a fully successful read

Poll `[watermark, now]`, follow `next_cursor` to exhaustion, and only then move the
watermark to that run's upper bound. If any page fails, leave it alone and re-read
the window next time. The cost is duplicates, which you can absorb; the alternative
is a silent hole nobody ever notices.

### De-duplicate on event id

The window is closed on both ends, so re-supplying the previous upper bound as the
next lower bound can return one event twice. Keep a small ring of recently emitted
ids.

### Ask for the actions you want, explicitly

The `action` filter is a repeatable **prefix** match and there is no wildcard. The
documented default set does not cover everything, so a collector that relies on it
will believe it has coverage it does not have. Name the prefixes you want.

### Treat your own failure as an event

A dead collector and a quiet registry look identical from the SIEM. Emit a record
when a poll fails, and alert on it. Use `latest_event_at` in the response envelope —
it reports the most recent event visible to you *regardless of your action filter*,
which is what distinguishes "my filter matches nothing" from "nothing happened" from
"the writer is broken".

### Mark backfilled events so they cannot fake a burst

Most SIEMs correlate on **ingest** time, not on the event's own timestamp. Replaying
history therefore lands months of scattered events in one second and manufactures
correlations that never happened — a first run that backfills 24 hours can trip a
brute-force rule on traffic that did not occur. Stamp each record with whether it was
fresh when collected, and exclude backfilled records from any time-window rule.

## Aggregated events and what the count means

Some events are emitted on paths a caller can trigger at will — a rejected credential, a
rate-limit refusal. Writing one audit row per occurrence would let anyone inflate your audit
table and your SIEM bill, so these are **coalesced**: one row per window carrying a `count`,
rather than one row per event.

Two consequences your detections must account for.

**Counts are per process.** Dependably coalesces in memory, so a deployment running several
replicas behind a load balancer emits one row per replica per window, each carrying only what
that replica saw. **Alert on the total across replicas, never on a single row's count** — on a
multi-replica deployment a single row always reads low, by a factor of roughly the replica
count.

Sum rows sharing the same organization, partition, reason and `window_start`. That works because
the window label is derived from the instant the event was recorded, floored to a fixed wall-clock
interval — not from when a process started or last flushed — so every replica labels the same
event identically and the sum is the real total.

One consequence worth knowing: a burst spanning a boundary is reported as two windows rather than
one. That is correct rather than a rounding artefact, but a threshold rule of the form "N in one
window" will see two smaller windows instead of one large one. Threshold over a rolling range
rather than over a single window label.

**Resolution degrades under a spray, the total does not.** The accumulator is bounded. A caller
generating a very large number of distinct keys — many source addresses, say — will first cause
new keys to fold into an overflow bucket, and then into a saturation bucket. Those rows are
marked as folded. You lose the ability to say *which* partition each denial came from; you do
not lose the fact that they happened, or how many there were.

One caveat if you are a tenant rather than the operator: the last-resort saturation rows are
written without an organization, so they land in the operator plane and a tenant-scoped collector
does not receive them. Under a spray heavy enough to reach saturation, a tenant feed sees the
counted overflow rows but not the final fold. Alert on the total and treat the
appearance of folded rows as itself a signal: something is generating keys faster than the
instance will track them individually.

The payload carries `window_start`, `window_end` and a replica identifier so you can group and
sum correctly.

**Retention.** Audit `detail` and `source_ip` are scrubbed after `AUDIT_LOG_PII_DAYS` (90 by
default). The count, window and partition live in `detail`, so they do not survive that horizon
— the event's action and ecosystem do. If you need the detail long-term, your SIEM's own
retention is what preserves it, not Dependably's.

## Known limits

Be explicit with your SOC about these rather than letting them discover them.

- **`source_ip` is only as good as your proxy configuration.** When `TRUSTED_PROXIES`
  is unset, Dependably discards forwarded headers by design and records the immediate
  peer — which behind a reverse proxy or container bridge is the same address for
  every request. Per-source brute-force correlation, geo-IP enrichment and IP
  blocklisting all stop working. Set `TRUSTED_PROXIES` to your proxy's address.
- **Failed logins carry no actor.** A `login.failure` row records neither the account
  attempted nor an email. You can count a burst; you cannot attribute it.
- **The feed names organizations and actors by identifier, not by name.** Alerts will
  read as opaque identifiers unless you enrich them on the SIEM side.
