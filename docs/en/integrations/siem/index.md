---
description: "Pull Dependably's audit and policy-refusal events into a SIEM, or push them by webhook or syslog, and build a collector that does not lose data."
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
   **Overwrite** if replacing a previous import. Then restart the manager: an imported
   ruleset does not take effect until analysisd restarts, and `GET /rules` and
   `/logtest` each report the rules as active before that restart actually happens,
   so neither is a reliable check. Confirm with a real search instead, on
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

![The Dependably Registry dashboard in Wazuh. Metric tiles show Audit events 1,690, Authorization denials 62, Security config changes 12, Failed logins 42, and Poller errors 24. Below them are a populated Authorization denials log table, an Events by action bar chart led by login.success, a Logins success-vs-failure histogram with a visible spike, and a Feed health table listing real poller error stages and counts.](images/wazuh-dependably-registry.png)

The rules do not read the Dependably feed directly. They match JSON records your
collector writes, with its fields under a `dependably` object:

- `instance` names the Dependably instance. The parent rule matches any record
  that carries it.
- `record_type` is `audit` for an event from the auth feed, `activity` for one
  from the activity feed, and `poller_error` for a failure the collector reports
  about itself.
- `action` is the event's action, and `live` is `true` for an event collected as
  it happened or `false` for backfilled history (see
  [Mark backfilled events](#mark-backfilled-events-so-they-cannot-fake-a-burst)).
- Individual rules also read `actor_id`, `purl`, `stage`, `message`, and detail
  fields flattened to `detail_<key>`, such as `detail_reason` and `detail_key`.

Nothing in the rules or dashboard is homelab-specific; they key off those
collector fields and `rule.groups`, not a hostname or an agent name. The rule id
space is `100100-100199`; renumber before importing if you already use part of
that range.

## The pull feeds

`/api/v1/siem/events/auth` reads the `audit_log` plane: authentication, credential and
capability refusals, MFA lifecycle, SAML identity changes, and other security and
configuration events. Filter it with a repeatable `action=` parameter.

`/api/v1/siem/events/activity` reads the `activity` plane: policy refusals (`blocked_*`,
every block-gate arm) and, when the instance sets `SIEM_ACTIVITY_DOWNLOAD_EVENTS=true`,
`download`. Filter it with a repeatable `event=` parameter: `blocked` for the whole
refusal family (the default), a specific `blocked_<gate>`, or `download`. Any other
value is a `400`, and so is `download` while that variable is off.

Block-gate refusals are written only to the activity plane, so the auth feed never
carries them. Poll each feed.

Each feed takes `since` and `until` as ISO 8601 timestamps. `since` defaults to 24 hours
ago. A `since` older than `SIEM_MAX_LOOKBACK_DAYS` (default 90) is moved forward to that
limit.
`limit` sets the page size, from 1 to 500 (default 100), and `next_cursor` in each
response pages through the rest of the window.

The `Accept` header picks the output format:

| `Accept` | Output |
| --- | --- |
| `application/json` (default) | A JSON envelope with `items` and `next_cursor`. The auth feed adds `latest_event_at`, `matched` and `matched_capped`; the activity feed adds `since`, `until` and `lag_seconds`. |
| `application/x-ndjson` | One event per line, then a trailer object. The auth feed's trailer carries `next_cursor` only, and only when there is another page. The activity feed writes a trailer on every page, with `since`, `until`, `lag_seconds` and `next_cursor`. |
| `application/x-cef` | One CEF record per line. A `# next_cursor=` comment line follows when there is another page, and the activity feed's last page adds `# window_until=`. |

## Authentication and tenant scope

The SIEM endpoints accept a Bearer token carrying the `read:audit` capability, or a
signed-in session whose role grants it (admin, owner or auditor).

A token is pinned to its own organization. The `?org=` parameter is ignored for
token callers (not rejected, ignored), so a token can neither read another tenant's
events nor use the endpoint to discover whether an organization slug exists. A
tenant user's session is pinned the same way.

Only a platform administrator's signed-in session (capability `platform:*`) reads
across tenants. On the auth feed it can omit `?org=` to read every tenant, or name one.
On the activity feed it must name one organization per poll: that query is scoped by a
non-nullable organization id, so "every tenant at once" is not expressible, and
omitting `?org=` is a `400` rather than an unscoped read.

Mint a dedicated token for your collector with `read:audit` and nothing else.

## Setup

A working pull collector takes the steps below. None of them needs an instance
restart.

### 1. Mint a collector token

As an admin or owner, open the [Tokens](../../web-ui/tokens.md) page and create a token
with the **audit** scope, which grants `read:audit` and nothing else. The token is
pinned to the organization that mints it; on a multi-tenant instance, mint one per
tenant you want to watch.

### 2. Check the feed answers

```bash
curl -sS -H "Authorization: Bearer $DEPENDABLY_AUDIT_TOKEN" \
  "https://repo.example.com/api/v1/siem/events/auth?limit=5"
```

A `200` carrying an `items` array is the whole server-side configuration. A `401`
means the token was missing or did not resolve; a `403` means it resolved but lacks
`read:audit`.

### 3. Poll the feeds

```text
GET /api/v1/siem/events/auth?since=<iso8601>&until=<iso8601>&limit=500
GET /api/v1/siem/events/activity?since=<iso8601>&until=<iso8601>&limit=500
```

Poll on whatever interval your SOC's detection latency allows; a minute is typical.
Everything that makes the difference between a collector that works and one that
loses events quietly is in [Building a collector that does not lose data](#building-a-collector-that-does-not-lose-data).
Read that before you ship it.

## The events worth alerting on

On the auth feed, every action below can be requested by exact name through `action=`,
and all of them except `tenant.setting.change` are in the set a collector receives when
it sends no `action=` at all. See
[Ask for the actions you want, explicitly](#ask-for-the-actions-you-want-explicitly) for the
filter's matching rule and where to get the full list. The `blocked_*` refusals are on the
activity feed and are selected with `event=` instead.

### Refusals: a credential or caller was told no

| Action | Fires when | Feed |
| --- | --- | --- |
| `auth.token.rejected` | a credential was presented and did not resolve. Reasons: `invalid`, `tenant_mismatch`. Counted per window | auth |
| `auth.capability.denied` | a resolved credential lacked the capability for the operation; carries `required` and `granted`. Counted per window | auth |
| `oci.scope_denied` | an OCI request was refused on the token's capabilities; names the token as the actor, with what the route required and what the token grants. Written at most once per token and route every 10 minutes | auth |
| `ratelimit.rejected` | a request was refused by a rate limiter. Counted per window | auth |
| `metrics.scrape_denied` | a `/metrics` scrape came from an address that is not allowed | auth |
| `blocked_*` | a pull refused by policy: licence, KEV, malicious, provenance, release age and the rest | **activity** |
| `login.failure`, `lockout.triggered` | failed sign-in, lockout | auth |

"Counted per window" means the row is aggregated; see
[Aggregated events and what the count means](#aggregated-events-and-what-the-count-means).

`auth.token.rejected` with `reason=tenant_mismatch` is the cross-tenant credential probe: a valid
token from one organization presented against another. The row under the target organization is
deliberately actor-less, because naming the presenting credential there would leak one tenant's
token identity into another tenant's audit trail.

### Identity and credential lifecycle

`mfa.*` (enrolment, disabling, recovery codes regenerated or used, trusted devices added or
used) is a real dotted family: one `action=mfa` filter selects all of it.

The SAML role and config-change actions look like they should be families too, but the family
filter matches only on the dot. `auth.saml.role_assigned` and `saml.config_updated` split on an
underscore, not a dot, so naming `auth.saml.role` or `saml.config` selects nothing. The nearest
dotted families, `auth.saml` and `saml`, are wider: `auth.saml` also brings SAML logins and user
provisioning. To get exactly the role and config changes, name each one:
`auth.saml.role_assigned`, `auth.saml.role_changed`, `auth.saml.role_change_refused`,
`auth.saml.role_mapping_blocked`, `saml.config_updated`, `saml.config_deleted`.

The same goes for `user.password_changed` and `user.email_changed`, which sit in the wider
`user` family, and for the flat names, which have no family at all: `token_created`,
`token_revoked`, `service_token_created`, `service_token_revoked`, `member_role_changed`,
`member_removed`, `invite_accept_blocked`, `allowlist_blocked`.

### Configuration

`tenant.setting.change` carries the setting `key` with its `prior_value` and `new_value`. It
records changes to `version_overwrite_policy`, `air_gapped`, `require_mfa` and
`rpm_upstream_mode`. Treat a change to an enforcement control such as the overwrite policy or
the MFA requirement differently from a cosmetic one; weakening a control is the canonical
post-account-takeover step. It is not in the no-filter set, so name it in `action=`.

Other enforcement settings are recorded under their own actions, such as
`license_policy_mode_changed` and `saml.config_updated`. The full list is on
`/api/v1/siem/actions`.

### Reading `partition`

Aggregated rows carry a `partition` identifying who was refused. It uses several namespaces and you
must branch on the prefix rather than parse it as an address: `ip:` or a bare address,
`user:<subject>`, `token:<reference>`, `proto:<address>`, and `<address>:<policy>`. Note `token:`
means different things on different actions: a truncated token id on `auth.*`, a hash prefix of the
presented credential on `ratelimit.*`. A partition of `overflow` marks a folded row (see
[Aggregated events](#aggregated-events-and-what-the-count-means)).

## Building a collector that does not lose data

Each property below corresponds to a way a naive collector silently fails.

### Advance the watermark only after a fully successful read

Poll `[watermark, upper bound]`, follow `next_cursor` to exhaustion, and only then move
the watermark to that run's upper bound. If any page fails, leave it alone and re-read
the window next time. The cost is duplicates, which you can absorb; the alternative
is a silent hole nobody ever notices.

On the auth feed, send an explicit `until` and advance to it. Without one, `until`
is the moment the server handled the request, which the response does not report.

On the activity feed, advance to the `until` the response returns, not the one you
sent. The feed never serves past `now` minus `SIEM_ACTIVITY_LAG_SECONDS` (default 30),
because activity rows are timestamped before they are written, so the served window
can end earlier than you asked. It returns `until` only on the last page; on a page
with a `next_cursor` it is `null`, because older rows in the window are still behind
the cursor.

### De-duplicate on event id

The window includes its start and its end, so re-supplying the previous upper bound as the
next lower bound can return one event twice. Keep a small ring of recently emitted
ids.

### Ask for the actions you want, explicitly

`GET /api/v1/siem/actions` publishes the whole declared vocabulary for the auth feed:
every action name with a `security_relevant` flag, the ones the no-filter feed serves
(`default_actions`), the dotted families the vocabulary implies (`family_prefixes`), and
the limits on how many values one request may carry.

The repeatable `action` filter matches the action of exactly that name, plus every
action in its dotted family. `action=checksum_failure` selects that one action;
`action=auth` selects all of `auth.*`. A trailing separator is optional and ignored,
so `action=login.` and `action=login` are the same filter. An unrecognized value is
not an error; it matches nothing, so a collector written against a newer instance
keeps working against an older one.

Name the actions you want rather than inheriting the default. The default set is the
security vocabulary as of the release you are running, and it widens on upgrade, which
means new event types start arriving without anyone deciding they should. Pinning the
set your detections understand is the safer subscription and also the cheaper query:
naming a declared action is free, naming a family or an undeclared name is not. Diff
your pinned list against `/api/v1/siem/actions` when you upgrade, so a family added in
a release is a decision rather than a surprise.

That endpoint publishes the limits too. `max_action_filters` bounds the total values in
one request. `max_family_filters` bounds how many of them may be dotted families or names
this release does not declare. You will meet the family limit first: it is a single
budget shared between the families you name deliberately and any values the instance
does not recognize. A request over either limit is a `400` that names it.

### Treat your own failure as an event

A dead collector and a quiet registry look identical from the SIEM. Emit a record
when a poll fails, and alert on it. On the auth feed, use `latest_event_at` in the JSON
envelope. It reports the most recent event visible to you *regardless of your action
filter*, which is what distinguishes "my filter matches nothing" from "nothing happened"
from "the writer is broken".

### Mark backfilled events so they cannot fake a burst

Most SIEMs correlate on ingest time, not on the event's own timestamp. Replaying
history therefore lands months of scattered events in one second and manufactures
correlations that never happened. A first run that backfills 24 hours can trip a
brute-force rule on traffic that did not occur. Stamp each record with whether it was
fresh when collected, and exclude backfilled records from any time-window rule.

## Aggregated events and what the count means

Some events are emitted on paths a caller can trigger at will: a rejected credential, a
capability denial, a rate-limit refusal. Writing one audit row per occurrence would let anyone
inflate your audit table and your SIEM bill, so `auth.token.rejected`, `auth.capability.denied`
and `ratelimit.rejected` are coalesced: one row per one-minute window carrying a `count`, rather
than one row per event.

Your detections must account for what follows from that.

**Counts are per process.** Dependably coalesces in memory, so a deployment running several
replicas behind a load balancer emits one row per replica per window, each carrying only what
that replica saw. Alert on the total across replicas, never on a single row's count. On a
multi-replica deployment a single row always reads low, by a factor of roughly the replica
count.

Sum rows sharing the same organization, partition, reason and `window_start`. That works because
the window label is derived from the instant the event was recorded, floored to a fixed wall-clock
minute, not from when a process started or last flushed. Every replica therefore labels the
same event identically, and the sum is the real total.

A burst spanning a minute boundary is reported as two windows rather than one. That
is correct, not a rounding artefact, but a threshold rule of the form "N in
one window" will see two smaller windows instead of one large one. Threshold
over a rolling range rather than over a single window label.

**Resolution degrades under a spray, the total does not.** The accumulator is bounded. A caller
generating a very large number of distinct keys (many source addresses, say) will first cause
new keys to fold into an overflow bucket, and then into a saturation bucket. Those rows carry
`overflow` as their partition, and a saturation row carries `overflow` as its reason too. You
lose the ability to say *which* partition each denial came from; you do not lose the fact that
they happened, or how many there were.

If you are a tenant rather than the operator, the last-resort saturation rows are
written without an organization, so they land in the operator plane and a tenant-scoped collector
does not receive them. Under a spray heavy enough to reach saturation, a tenant feed sees the
counted overflow rows but not the final fold. Alert on the total and treat the
appearance of folded rows as itself a signal: something is generating keys faster than the
instance will track them individually.

The payload carries `window_start`, `window_end` and a `replica` identifier (the host name
of the process that counted) so you can group and sum correctly.

**Retention.** Audit `detail` and `source_ip` are scrubbed after `AUDIT_LOG_PII_DAYS` (90 by
default), and the row itself is deleted after `AUDIT_LOG_RETENTION_DAYS` (365 by default). The
count, window and partition live in `detail`, so they do not survive the first horizon. The
event's action and ecosystem do. If you need the detail long-term, your SIEM's own retention is
what preserves it, not Dependably's.

## Push, for lower latency or a syslog-native SIEM

Everything above is pull: you poll the feeds. Dependably can also push, opening an
outbound connection of its own to a collector you run, for lower latency or for a SIEM whose
native input is a webhook or a syslog listener rather than a REST API to poll. Set
`SIEM_WEBHOOK_URL` or `SIEM_SYSLOG_HOST` and restart the instance; push runs in addition to
pull, never instead of it, since pull is what backfills and survives a collector outage.

| Variable | Default | Effect |
| --- | --- | --- |
| `SIEM_WEBHOOK_URL` | unset | HTTPS endpoint Dependably POSTs one NDJSON line per event to. A plaintext URL is refused at startup; set `SIEM_WEBHOOK_ALLOW_INSECURE=true` to allow one anyway. |
| `SIEM_WEBHOOK_BEARER` | unset | Bearer token sent with each POST, if your collector needs one. |
| `SIEM_WEBHOOK_ALLOW_PRIVATE` | `true` | Set `false` to require a public collector address instead of an RFC 1918 one. Loopback, link-local and cloud-metadata addresses are refused either way. |
| `SIEM_SYSLOG_HOST` | unset | Syslog receiver hostname. Activates the syslog forwarder; ignored if `SIEM_WEBHOOK_URL` is also set. |
| `SIEM_SYSLOG_PORT` | `514` | Syslog receiver port. |
| `SIEM_SYSLOG_PROTO` | `tls` | `udp`, `tcp`, or `tls`. `udp` and `tcp` send events in cleartext and log a startup warning naming the exposure. |
| `SIEM_SYSLOG_FORMAT` | `cef` | `cef` (ArcSight Common Event Format) or `rfc5424`. |
| `SIEM_QUEUE_CAPACITY` | `1024` | Outbound queue depth. A full queue drops the new event, with a metric, rather than blocking the request that generated it. |

Only one forwarder runs at a time. Setting `SIEM_WEBHOOK_URL` and `SIEM_SYSLOG_HOST`
together activates the webhook one. A delivery that fails is retried after 1, 5 and 30 seconds, then
dropped.

Push carries less than pull. It has no `source_ip`, no `ecosystem` or `purl`, and its action
names are not the ones documented above for the same event: a hosted publish is `push` on the
pull feed and `package.publish` on push. Do not try to join pull and push records by action
name. Treat push as a latency add-on and pull as the feed a SOC actually alerts on.

## Known limits

Be explicit with your SOC about these rather than letting them discover them.

- `source_ip` is only as good as your proxy configuration, on Dependably's side and on
  the proxy's. Each has to be right on its own, and neither shows up as an error on the
  feed. When `TRUSTED_PROXIES` is unset, Dependably discards forwarded headers by design
  and records the immediate peer, which behind a reverse proxy or container bridge is the
  same address for every request; set it to your proxy's address (see
  [Behind a reverse proxy](../../admin/configuration.md#behind-a-reverse-proxy)). Separately,
  your reverse proxy has to actually be configured to *send* `X-Forwarded-For` in the first
  place. A proxy that isn't (some GUI-managed reverse-proxy tools default to not forwarding
  it) leaves nothing for `TRUSTED_PROXIES` to act on, and the symptom is identical either way:
  every event shows the proxy's own address. Confirm a fresh event's `source_ip` after
  changing either setting; do not assume the fix landed from the config change alone.
  Once the proxy and `TRUSTED_PROXIES` are correct, per-source brute-force correlation,
  geo-IP enrichment and IP blocklisting all become usable.
- Failed logins carry no actor. A `login.failure` row records neither the account
  attempted nor an email. You can count a burst; you cannot attribute it.
- The feed names actors by identifier, not by name. On the auth feed, `orgSlug` is
  served beside `orgId`, so an alert reads as a tenant rather than a 32-hex id, but
  actors are not resolved: `actorEmail` is deliberately always null, because a
  denormalized email would be personal data sitting outside the erasure and retention
  sweeps. The activity feed carries `orgId` only; you named the organization when you
  asked. Enrich actor identifiers on the SIEM side if your analysts need names.
- The feed is a personal-data egress point: forwarded events carry actor identifiers
  and payloads. If your collector or SIEM sits in another jurisdiction, that is a
  cross-border transfer to account for under your own compliance regime.
