---
order: 2
---

# SIEM and SOC integration

Dependably exposes security telemetry that a SIEM can consume, so the registry is
watched the same way the rest of your estate is. This page covers what is emitted,
which transport carries which events, and how to build a collector that does not
silently lose data.

The examples below were run against Wazuh; the mechanics generalize to Splunk,
Elastic, Sentinel or anything that reads newline-delimited JSON.

## Reference implementation for Wazuh

If Wazuh is your SIEM, you do not have to write rules or a dashboard from scratch.

[**Download the rules**](rules/dependably_rules.xml) (`dependably_rules.xml`) and
[**download the dashboard**](dashboards/dependably-dashboard.ndjson)
(`dependably-dashboard.ndjson`), then:

1. Import the rules: open Server management, then Rules, then Import files, and tick
   **Overwrite** if replacing a previous import. **Restart the manager**: an imported
   ruleset does not take effect until analysisd restarts, and both `GET /rules` and
   `/logtest` report the rules as active before that restart actually happens, so
   neither is a reliable check. Confirm with a real search instead, on
   `wazuh-alerts-*`, filtering `rule.groups:dependably`.
2. Import the dashboard: open Dashboards Management, then Saved objects, then Import.
   The importer assigns new object ids on every import, so re-importing after an
   update creates a duplicate rather than replacing the original. Delete the old one.
3. Refresh the index pattern's field list once. Open Index patterns, select
   `wazuh-alerts-*`, and click the refresh icon, so panels that read poller-specific
   fields (like the feed health table) can find them. This is a one-time step; it does
   not need repeating on subsequent imports.

You need a working collector before either import produces anything. See Setup
below first.

![The Dependably Registry dashboard in Wazuh. Four metric tiles show Audit events 1,690, Authorization denials 62, Security config changes 12, Failed logins 42, and Poller errors 24. Below them are a populated Authorization denials log table, an Events by action bar chart led by login.success, a Logins success-vs-failure histogram with a visible spike, and a Feed health table listing real poller error stages and counts.](images/wazuh-dependably-registry.png)

Nothing in the rules or dashboard is homelab-specific; both key off the feed's
own fields (`dependably.instance`, `rule.groups`), not a hostname or an agent
name. The rule id space is `100100-100199`; renumber before importing if you
already use part of that range.

## The pull feeds

`/api/v1/siem/events/auth` reads the `audit_log` plane: authentication, credential and capability
refusals, MFA lifecycle, SAML identity changes, security-setting changes.

`/api/v1/siem/events/activity` reads the `activity` plane: policy denials (`blocked_*`, every
block-gate arm) and, behind an opt-in flag, `download`. Poll both.

## Authentication and tenant scope

Both SIEM endpoints accept either a JWT session or a Bearer token carrying the
`read:audit` capability.

A token is pinned to its own organization. The `?org=` parameter is ignored for
token callers (not rejected, ignored), so a token can neither read another tenant's
events nor use the endpoint to discover whether an organization slug exists.

A platform administrator (capability `platform:*`) can read across tenants on the auth
feed. On the activity feed it must name one organization per poll: that query is scoped
by a non-nullable organization id, so "every tenant at once" is not expressible, and
omitting `?org=` is a 400 rather than an unscoped read.

Mint a dedicated token for your collector with `read:audit` and nothing else.

## Setup

Three steps to a working pull collector. None of them needs an instance restart.

### 1. Mint a collector token

On the [Access tokens](../../web-ui/tokens.md) page, create a token with capability
**`read:audit`** and nothing else. The token is pinned to the organization that mints
it; on a multi-tenant instance, mint one per tenant you want to watch.

### 2. Check the feed answers

```bash
curl -sS -H "Authorization: Bearer $DEPENDABLY_AUDIT_TOKEN" \
  "https://repo.example.com/api/v1/siem/events/auth?limit=5"
```

A `200` carrying an `items` array is the whole server-side configuration. A `401`
means the token is wrong or lacks `read:audit`; a `403` means it is not permitted on
this instance.

### 3. Poll both feeds

```text
GET /api/v1/siem/events/auth?since=<iso8601>&until=<iso8601>&limit=500
GET /api/v1/siem/events/activity?since=<iso8601>&until=<iso8601>&limit=500
```

A platform-admin token must add `&org=<slug>` to the second. See
[Authentication and tenant scope](#authentication-and-tenant-scope) above.

Poll on whatever interval your SOC's detection latency allows; a minute is typical.
Everything that makes the difference between a collector that works and one that
loses events quietly is in [Building a collector that does not lose data](#building-a-collector-that-does-not-lose-data).
Read that before you ship it.

### Optional: add push for lower latency

Set `SIEM_WEBHOOK_URL` or `SIEM_SYSLOG_HOST` and restart. This is *in addition to*
polling, never instead of it.

## The events worth alerting on

Every action below is requestable by exact name via a repeatable `action=` parameter. See
[Ask for the actions you want, explicitly](#ask-for-the-actions-you-want-explicitly) for the
filter's matching rule and where to get the full list.

### Refusals: a credential or caller was told no

| Action | Fires when | Feed |
| --- | --- | --- |
| `auth.token.rejected` | a credential was presented and did not resolve. Reasons: `invalid`, `tenant_mismatch` | auth |
| `auth.capability.denied` | a resolved credential lacked the capability for the operation; carries required vs granted | auth |
| `oci.scope_denied` | the OCI plane's own, richer form of the same | auth |
| `ratelimit.rejected` | a request was refused by a rate limiter; aggregated with a count | auth |
| `metrics.scrape_denied` | an unauthorized `/metrics` scrape | auth |
| `blocked_*` | a pull refused by policy: licence, KEV, malicious, provenance, release age and the rest | **activity** |
| `login.failure`, `lockout.*` | failed sign-in, lockout | auth |

`auth.token.rejected` with `reason=tenant_mismatch` is the cross-tenant credential probe: a valid
token from one organization presented against another. The row under the target organization is
deliberately **actor-less**, because naming the presenting credential there would leak one tenant's
token identity into another tenant's audit trail.

### Identity and credential lifecycle

`mfa.*` (enrolled, disabled, recovery-code used, trusted device added) is a real dotted family:
one `action=mfa` filter selects all of it. The SAML role and config-change actions look like they
should be families too, but the family filter matches only on the dot: `auth.saml.role_assigned`
and `saml.config_updated` split on an underscore, not a dot, so naming `auth.saml.role` or
`saml.config` selects nothing. They join `user.password_changed`, `user.email_changed`, and the
flat-named `token_created`, `token_revoked`, `service_token_created`, `service_token_revoked`,
`member_role_changed`, `member_removed`, `invite_accept_blocked`, `allowlist_blocked` on the list
of actions with no dotted family to inherit through. Name each one individually:
`auth.saml.role_assigned`, `auth.saml.role_changed`, `auth.saml.role_change_refused`,
`auth.saml.role_mapping_blocked`, `saml.config_updated`, `saml.config_deleted`.

### Configuration

`tenant.setting.change` carries the setting key with its before and after values. Treat a change to
an enforcement control (policy mode, signature verification, overwrite policy, MFA or SSO
requirements) differently from a cosmetic one; that is the canonical post-account-takeover step.

### Reading `partition`

Aggregated rows carry a `partition` identifying who was refused. It uses several namespaces and you
must branch on the prefix rather than parse it as an address: `ip:` or a bare address,
`user:<subject>`, `token:<reference>`, `proto:<address>`, and `<address>:<policy>`. Note `token:`
means different things on different actions: a truncated token id on `auth.*`, a hash prefix of the
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

`GET /api/v1/siem/actions` publishes the whole declared vocabulary: every action name,
which of them the no-filter feed serves (`default_actions`), the dotted families the
vocabulary implies (`family_prefixes`), and the two limits on how many values one
request may carry.

The repeatable `action` filter matches the action of exactly that name, plus every
action in its dotted family. `action=checksum_failure` selects that one action;
`action=auth` selects all of `auth.*`. A trailing separator is optional and ignored,
so `action=login.` and `action=login` are the same filter. An unrecognized value is
not an error; it matches nothing, so a collector written against a newer instance
keeps working against an older one.

Name the actions you want rather than inheriting the default. The default set is the
security vocabulary as of the release you are running, and it widens on upgrade, which
means new event types start arriving without anyone deciding they should. Pinning the
set your detections understand is both the safer subscription and the cheaper query:
naming a declared action is free, naming a family or an undeclared name is not. Diff
your pinned list against `/api/v1/siem/actions` when you upgrade, so a family added in
a release is a decision rather than a surprise.

Two limits apply, both published by that endpoint. One, `max_action_filters`, bounds
the total values in one request. The other, `max_family_filters`, bounds how many of
them may be dotted families or names this release does not declare. You will meet
this one first: it is a single budget shared between the families you name
deliberately and any values the instance does not recognize.

### Treat your own failure as an event

A dead collector and a quiet registry look identical from the SIEM. Emit a record
when a poll fails, and alert on it. Use `latest_event_at` in the response envelope.
It reports the most recent event visible to you *regardless of your action filter*,
which is what distinguishes "my filter matches nothing" from "nothing happened" from
"the writer is broken".

### Mark backfilled events so they cannot fake a burst

Most SIEMs correlate on **ingest** time, not on the event's own timestamp. Replaying
history therefore lands months of scattered events in one second and manufactures
correlations that never happened. A first run that backfills 24 hours can trip a
brute-force rule on traffic that did not occur. Stamp each record with whether it was
fresh when collected, and exclude backfilled records from any time-window rule.

## Aggregated events and what the count means

Some events are emitted on paths a caller can trigger at will: a rejected credential, a
rate-limit refusal. Writing one audit row per occurrence would let anyone inflate your audit
table and your SIEM bill, so these are **coalesced**: one row per window carrying a `count`,
rather than one row per event.

Two consequences your detections must account for.

**Counts are per process.** Dependably coalesces in memory, so a deployment running several
replicas behind a load balancer emits one row per replica per window, each carrying only what
that replica saw. Alert on the total across replicas, never on a single row's count. On a
multi-replica deployment a single row always reads low, by a factor of roughly the replica
count.

Sum rows sharing the same organization, partition, reason and `window_start`. That works because
the window label is derived from the instant the event was recorded, floored to a fixed wall-clock
interval, not from when a process started or last flushed. Every replica therefore labels the
same event identically, and the sum is the real total.

One consequence worth knowing: a burst spanning a boundary is reported as two windows rather than
one. That is correct rather than a rounding artefact, but a threshold rule of the form "N in one
window" will see two smaller windows instead of one large one. Threshold over a rolling range
rather than over a single window label.

**Resolution degrades under a spray, the total does not.** The accumulator is bounded. A caller
generating a very large number of distinct keys (many source addresses, say) will first cause
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
default). The count, window and partition live in `detail`, so they do not survive that horizon.
The event's action and ecosystem do. If you need the detail long-term, your SIEM's own
retention is what preserves it, not Dependably's.

## Known limits

Be explicit with your SOC about these rather than letting them discover them.

- `source_ip` is only as good as your proxy configuration, and that has two independent halves:
  both have to be right, and each fails silently on its own. When `TRUSTED_PROXIES` is unset,
  Dependably discards forwarded headers by design and records the immediate peer, which behind a
  reverse proxy or container bridge is the same address for every request; set it to your proxy's
  address. Separately, your reverse proxy has to actually be configured to *send*
  `X-Forwarded-For` in the first place. A proxy that isn't (some GUI-managed reverse-proxy
  tools default to not forwarding it) leaves nothing for `TRUSTED_PROXIES` to act on, and the
  symptom is identical either way: every event shows the proxy's own address. Confirm a fresh
  event's `source_ip` after changing either setting; do not assume the fix landed from the config
  change alone. Once both are correct, per-source brute-force correlation, geo-IP enrichment and
  IP blocklisting all become usable.
- Failed logins carry no actor. A `login.failure` row records neither the account
  attempted nor an email. You can count a burst; you cannot attribute it.
- The feed names actors by identifier, not by name. `orgSlug` is served beside `orgId`,
  so an alert reads as a tenant rather than a 32-hex id, but actors are not resolved:
  `actorEmail` is deliberately always null for user actors, because a denormalized
  email would be personal data sitting outside the erasure and retention sweeps.
  Enrich actor identifiers on the SIEM side if your analysts need names.
- The feed is a personal-data egress point: forwarded events carry actor identifiers
  and payloads. If your collector or SIEM sits in another jurisdiction, that is a
  cross-border transfer to account for under your own compliance regime.
