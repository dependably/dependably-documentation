---
order: 1
---

# Configuration

This page is for **operators** who deploy and run a Dependably instance.

Dependably is built to be simple to run: start the container, tell it the URL
it will be reached at, and manage everything else from the admin UI. There are
no config files to maintain. The few deploy-time choices below are set as
environment variables on the container.

## Deploy

Run the Dependably container on your own infrastructure. The one setting every
deployment should have is the public base URL, the address your developers
and the web UI will use:

```
BASE_URL=https://repo.example.com
```

The host in the base URL is the only non-loopback hostname the instance
answers to, and an `https://` base URL makes session cookies Secure. Point it at
your real hostname and use HTTPS in production. Everything else has a working
default and starts immediately.

On **first boot**, Dependably creates your organization and an owner account,
and prints the owner's email and password to the container logs (a generated
temporary password unless you set one). Sign in with those; you are required to
change the password on first login, and you are ready to administer the
instance.

## Environment reference

All variables are optional. An empty environment gives a working local
instance.

### Instance & first boot

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `BASE_URL` | unset (the bundled `docker-compose.yml` sets `http://localhost:8080`) | Public URL of the instance. Its host becomes the allowed `Host` header; when unset or `localhost`, only loopback hostnames are accepted. Its scheme is used for the links Dependably generates, and an `https://` base URL makes session cookies Secure. It also sets the allowed CORS origin for the management API. |
| `DEFAULT_ORG_SLUG` | `default` | Slug of the organization created on first boot. |
| `FIRST_BOOT_ADMIN_EMAIL` | `admin@dependably.local` | Email of the owner account created on first boot. |
| `FIRST_BOOT_ADMIN_PASSWORD` | generated | Password for that account. When unset, a random password is generated. The email and password are printed to the logs either way, and rotation is forced on first login. |
| `AIR_GAPPED` | `false` | `true` (or `1`) runs the instance air-gapped: fetching from upstream registries is disabled and vulnerability scanning uses the local mirror only. |
| `DEPENDABLY_MASTER_KEY` | unset | Master key that envelope-encrypts stored secrets at rest. Must be base64 that decodes to exactly 32 bytes (AES-256), or a path to a file containing such a value; see the note below. |

> **Generating the master key.** The value is base64 that must decode to
> exactly 32 bytes (AES-256). Anything else fails startup with
> `DEPENDABLY_MASTER_KEY is not valid base64.` or
> `DEPENDABLY_MASTER_KEY must decode to exactly 32 bytes (AES-256); got N.`
> Generate a valid key with:
>
> ```
> openssl rand -base64 32
> ```
>
> Instead of setting the key inline, you can point the variable at a file path
> whose contents are the base64 key. Treat the key as a key-encryption key: set
> it once and store it in a secret manager. Changing or losing it makes
> already-encrypted secrets undecryptable, and the instance refuses to start
> when encrypted secrets exist but no key is set.

Without a master key, Dependably refuses to store upstream credentials, webhook
signing secrets, the SMTP relay password, and the Hex and SBOM signing keys, and
it keeps its own session-signing and MFA secrets unencrypted (logging a warning
at startup). Set the key before you configure any of those.

### Invite email

Invite email goes through the SMTP relay configured in the app, not through
environment variables. In a single-organization deployment, an Owner or Admin
opens **Settings**, then **Instance settings**, then **Instance email (SMTP)**;
in a multi-organization deployment the system administrator configures it. The
legacy `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`,
`SMTP_FROM`, and `SMTP_STARTTLS` variables are ignored; if any is set, a warning
at startup says so.

Until a relay is configured, the UI shows each invite link for you to deliver
yourself (see [Users & tokens](users-and-tokens.md)).

### Storage

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `STORAGE_BACKEND` | `local` | Where package artefacts are stored: `local`, `s3`, or `azure`. |
| `LOCAL_STORAGE_PATH` | `/data/blobs` | Directory for the `local` backend. Mount a volume here. |
| `S3_BUCKET`, `S3_REGION` | unset | Required for the `s3` backend. |
| `S3_ENDPOINT` | unset | Point the `s3` backend at an S3-compatible service (R2, MinIO, B2, Wasabi). |
| `S3_FORCE_PATH_STYLE` | `false` | Set `true` for services that require path-style addressing (R2, MinIO). |
| `AZURE_CONNECTION_STRING`, `AZURE_CONTAINER` | unset | Required for the `azure` backend. |

### Security, retention, and logging

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `REQUIRE_MFA` | unset | `true` (or `1`) requires MFA enrolment in every organization and locks the per-organization **Require MFA enrolment** setting on. |
| `TRUSTED_DEVICE_TTL_DAYS` | `30` | How many days a device remembered at the MFA step skips the second factor. |
| `ACTIVITY_RETENTION_DAYS` | `90` | Default activity-log retention for organizations that leave **Activity retention days** blank (see [Settings](settings.md#storage)). |
| `AUDIT_LOG_RETENTION_DAYS` | `365` | Audit-log entries older than this are deleted. |
| `LOG_FORMAT` | `json` | `text` switches container logs from structured JSON to plain text; see [Logging](../integrations/logging.md). |
| `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME` | unset, `dependably` | Export logs, metrics, and traces to an OpenTelemetry collector, under that service name; see [Logging](../integrations/logging.md). |

The `SIEM_*` variables that push audit events to a SIEM, and the ones that tune
the SIEM pull feed, are listed on the
[SIEM integration](../integrations/siem/index.md) page.

### Behind a reverse proxy

Set `TRUSTED_PROXIES` to the IPs or CIDRs of your reverse proxy, comma
separated, when a TLS-terminating proxy fronts the instance, so client IPs and
the HTTPS scheme are seen correctly. When it is unset, `X-Forwarded-*` headers
are ignored (fail-closed). A `/0` range or a malformed entry stops startup.

## Manage the instance in the app

Once it is running, all administration happens in the web UI, with no server
access required:

- [Access control (RBAC)](rbac.md): roles and what each can do.
- [Users & tokens](users-and-tokens.md): invite members, issue personal and
  service tokens.
- [Settings](settings.md): anonymous pull, retention, upload limits, and the
  supply-chain security gates applied to proxied packages.
- [Authentication](authentication.md): forms login, MFA, and SAML 2.0
  single sign-on.
- [Upstreams](upstreams.md): the public registries Dependably proxies.

## Verify

```bash
curl https://repo.example.com/health      # 200 when the process is up
curl https://repo.example.com/ready       # 200 when required dependencies are up
```

`/ready` answers 503 while a required dependency is down or the instance is
shutting down.

Then open the base URL in a browser and sign in as the owner created on first
boot.
