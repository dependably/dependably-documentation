# Configuration

This page is for **operators** who deploy and run a Dependably instance.
Dependably is configured through environment variables, layered over an
`appsettings.json`; both `Section:Key` and `Section__Key` spellings refer to the
same setting. Nearly everything has a working default, and most
network-dependent features stay dormant until you give them an endpoint.

The single variable you almost always set is `BASE_URL` — its host becomes the
apex hostname and drives Host-header filtering. For multi-tenant you also set
`DEPLOYMENT_MODE=multi`; for more than one replica you add
`DEPENDABLY_DEPLOYMENT_MODE=ha` with `REDIS_CONNECTION_STRING`.

Examples use the placeholder host `repo.example.com`. Never commit real secrets —
pass them through your orchestrator's secret store.

## Deployment modes

`DEPLOYMENT_MODE` selects how an incoming request is mapped to an organization:

- **`single`** (default) — the bare host serves one organization. Registry URLs
  are `https://repo.example.com/npm/`, `.../simple/`, and so on.
- **`multi`** — each organization is a subdomain of the apex host
  (`https://acme.repo.example.com/npm/`). Requires a non-localhost `BASE_URL`.
- **`bound`** — every request is pinned to `BOUND_TENANT_SLUG` regardless of
  host (a single-tenant intercept mode for edge-proxy deployments).

Tenancy is always resolved from the **host**, never from a path segment — there
is no `/o/{org}/` prefix in any registry URL.

## High availability

A single instance runs standalone. For more than one replica, set
`DEPENDABLY_DEPLOYMENT_MODE=ha` and provide `REDIS_CONNECTION_STRING`. Redis
backs distributed locking, the login / invite / token-create rate-limit state,
and ASP.NET Core Data Protection key sharing. Startup fails if `ha` is set
without a connection string.

## Storage

`STORAGE_BACKEND` is `local` (default), `s3`, or `azure`. Blobs live in two
tiers — a durable **registry** tier for published artifacts (never auto-evicted)
and an eviction-friendly **cache** tier for proxied artifacts. Any storage
variable also accepts `_CACHE` / `_REGISTRY` suffixes to override one tier.

The proxy-fetch path stages bytes to `PROXY_STAGING_PATH` before hashing; point
it at a disk-backed volume, not tmpfs.

## Upload limits & quotas

`MAX_UPLOAD_BYTES` caps upload size instance-wide; per-ecosystem overrides exist
(`MAX_UPLOAD_BYTES_NPM`, `_PYPI`, `_NUGET`, …). An organization can set tighter
limits in its [settings](settings.md). A per-organization aggregate **storage
quota** is set through the system API (see *Tenant lifecycle* below), not an
environment variable.

## Air-gapped operation

`AIR_GAPPED=true` declares the instance air-gapped: it skips every outbound call
and disables all background jobs. Pair it with `OSV_MODE=local` (plus
`OSV_LOCAL_PATH`) to keep vulnerability scanning working from a sideloaded
database. To disable individual jobs without fully air-gapping, list them in
`DISABLE_BACKGROUND_JOBS`.

## Garbage collection schedules

Retention and cleanup run as scheduled background jobs. Defaults are sensible;
override only if needed.

## Environment variable reference

The authoritative list is the "Environment variables" table in the application's
`CONTRIBUTING.md`. The most important variables, grouped:

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| **Deployment** | | |
| `BASE_URL` | `http://localhost:8080` | Public base URL; its host is the apex hostname and drives `AllowedHosts`. |
| `DEPLOYMENT_MODE` | `single` | `single`, `multi`, or `bound`. |
| `BOUND_TENANT_SLUG` | — | Required when `DEPLOYMENT_MODE=bound`. |
| `DEFAULT_ORG_SLUG` | `default` | Slug of the organization created on first boot. |
| `RESERVED_SUBDOMAINS` | — | Extra comma-separated slugs reserved from tenant claims. |
| **High availability** | | |
| `DEPENDABLY_DEPLOYMENT_MODE` | `standalone` | Set `ha` to require Redis and enable distributed locking. |
| `REDIS_CONNECTION_STRING` | — | Required when mode is `ha`. |
| `REDIS_SSL` / `REDIS_PASSWORD` / `REDIS_DATABASE` / `REDIS_KEY_PREFIX` | `false` / — / `0` / `dependably:` | Redis connection tuning. |
| **Storage** | | |
| `STORAGE_BACKEND` | `local` | `local`, `s3`, or `azure`. Accepts `_CACHE` / `_REGISTRY` variants. |
| `LOCAL_STORAGE_PATH` | `/data/blobs` | Root directory for local blob storage. |
| `S3_BUCKET` / `S3_REGION` | — | Required when `STORAGE_BACKEND=s3`. |
| `AZURE_CONNECTION_STRING` / `AZURE_CONTAINER` | — | Required when `STORAGE_BACKEND=azure`. |
| `PROXY_STAGING_PATH` | OS temp dir | Disk-backed staging dir for proxy fetches. |
| **Upload limits** | | |
| `MAX_UPLOAD_BYTES` | unlimited | Instance-wide upload size limit (bytes). |
| `MAX_UPLOAD_BYTES_NPM` / `_PYPI` / `_NUGET` | — | Per-ecosystem upload size limits. |
| **Air-gap / jobs** | | |
| `AIR_GAPPED` | `false` | Skip all outbound calls; disable all background jobs. |
| `DISABLE_BACKGROUND_JOBS` | — | Comma-separated job names to disable selectively. |
| `OSV_MODE` / `OSV_LOCAL_PATH` | online / — | Set `local` to query a sideloaded OSV database. |
| **MFA** | | |
| `REQUIRE_MFA` | — | Set `true` to enforce TOTP enrollment instance-wide (composes with the per-org setting). |
| **GC / retention (5-field cron)** | | |
| `GC_SCHEDULE` | `0 3 * * *` | Retention GC pass (version limits, proxy eviction, activity pruning). |
| `AUDIT_EVENT_RETENTION_DAYS` | `365` | Delete audit-event rows older than this many days. |
| `CACHE_EVICT_SCHEDULE` | `0 * * * *` | Cache-eviction pass; a no-op unless a `CACHE_MAX_*` threshold is set. |
| `CACHE_MAX_AGE_DAYS` / `CACHE_MAX_SIZE_BYTES` / `CACHE_MAX_ARTIFACTS` | no limit | Cache-eviction thresholds. |
| `TENANT_HARD_DELETE_GRACE_DAYS` | `30` | Days a soft-deleted organization is restorable. |
| `ORPHAN_RECONCILE_GRACE_MINUTES` | `30` | Skip recently-modified blobs (protects in-flight publishes). |

Two keys are deprecated and ignored with a startup warning — do not use them:
`Maven:MetadataTtl` and `APEX_HOST` (the apex is now derived from `BASE_URL`).

## Tenant lifecycle (multi-tenant operators)

On a `multi` deployment, tenant management lives in the system control plane
(requires the `system_admin` role on the apex host):

- **Create** — `POST /api/v1/system/tenants` with `{ "slug": …, "ownerEmail": … }`.
  Returns the generated owner password **once** (the owner must change it on
  first login).
- **Suspend / activate** — `PATCH /api/v1/system/tenants/{slug}/status`. A
  suspended organization rejects writes; data is preserved.
- **Storage quota** — `PATCH /api/v1/system/tenants/{slug}/storage-quota` with
  `{ "quotaBytes": … }` (or `null` for unlimited).
- **Soft-delete / restore** — `DELETE /api/v1/system/tenants/{slug}` then
  `PATCH .../{slug}/restore` within the grace window before permanent removal.
- **Dashboard** — `GET /api/v1/system/dashboard` for an operator overview.

On `single` / `bound` deployments the owner-scoped `InstanceController`
(`/api/v1/instance/settings`, `/background-jobs`) exposes the relevant subset;
the tenant-CRUD routes return 404.
