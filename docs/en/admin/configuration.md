# Configuration

This page is for **operators** who deploy and run a Dependably instance.

Dependably is built to be simple to run: start the container, tell it the URL
it will be reached at, and manage everything else from the admin UI. There are
no config files to maintain — the few deploy-time choices below are set as
environment variables on the container.

## Deploy

Run the Dependably container on your own infrastructure. The one setting every
deployment should have is the **public base URL** — the address your developers
and the web UI will use:

```
BASE_URL=https://repo.example.com
```

The base URL fixes the instance's hostname (used for secure cookies, allowed
hosts, and the links the UI generates). Point it at your real hostname and use
HTTPS in production. Everything else has a working default and starts
immediately.

On **first boot**, Dependably creates your organization and an owner account,
and prints the owner's email and a generated temporary password to the
container logs. Sign in with those; you are required to change the password on
first login, and you are ready to administer the instance.

## Environment reference

All variables are optional — an empty environment gives a working local
instance.

### Instance & first boot

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `BASE_URL` | `http://localhost:8080` | Public URL of the instance. Drives generated links, allowed hosts, and secure cookies (an `https://` base URL makes session cookies Secure). |
| `DEFAULT_ORG_SLUG` | `default` | Slug of the organization created on first boot. |
| `FIRST_BOOT_ADMIN_EMAIL` | `admin@dependably.local` | Email of the owner account created on first boot. |
| `FIRST_BOOT_ADMIN_PASSWORD` | generated | Password for that account. When unset, a random password is generated and printed to the logs. Either way, rotation is forced on first login. |
| `AIR_GAPPED` | `false` | `true` runs the instance air-gapped: fetching from upstream registries is disabled and vulnerability scanning uses the local mirror only. |
| `DEPENDABLY_MASTER_KEY` | unset | Master key that envelope-encrypts stored secrets (upstream credentials, webhook signing secrets) at rest. Must be **base64 that decodes to exactly 32 bytes** (AES-256), or a path to a file containing such a value — see the note below. Without it, webhook signing secrets cannot be stored. |

> **Generating the master key.** The value is base64 that must decode to
> exactly 32 bytes (AES-256). A hex string or any other length fails startup
> with `DEPENDABLY_MASTER_KEY must decode to exactly 32 bytes`. Generate a valid
> key with:
>
> ```
> openssl rand -base64 32
> ```
>
> Instead of setting the key inline, you can point the variable at a file path
> whose contents are the base64 key. Treat the key as a key-encryption key: set
> it once and store it in a secret manager. Changing or losing it makes
> already-encrypted secrets undecryptable.

### Invite email (SMTP)

When `SMTP_HOST` is unset, invite emails are disabled and the UI shows each
invite link for you to deliver yourself (see
[Users & tokens](users-and-tokens.md)).

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `SMTP_HOST` | unset | SMTP server to send invite emails through. |
| `SMTP_PORT` | `587` | SMTP port. |
| `SMTP_FROM` | — | Envelope From address (for example `invites@example.com`). Required when `SMTP_HOST` is set. |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | unset | Credentials, if your server requires them. |
| `SMTP_STARTTLS` | `true` | Set `false` to disable STARTTLS. |

### Storage

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `STORAGE_BACKEND` | `local` | Where package artefacts are stored: `local`, `s3`, or `azure`. |
| `LOCAL_STORAGE_PATH` | `/data/blobs` | Directory for the `local` backend — mount a volume here. |
| `S3_BUCKET`, `S3_REGION` | — | Required for the `s3` backend. |
| `S3_ENDPOINT` | unset | Point the `s3` backend at an S3-compatible service (R2, MinIO, B2, Wasabi). |
| `S3_FORCE_PATH_STYLE` | `false` | Set `true` for services that require path-style addressing (R2, MinIO). |
| `AZURE_CONNECTION_STRING`, `AZURE_CONTAINER` | — | Required for the `azure` backend. |

### Behind a reverse proxy

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `TRUSTED_PROXIES` | unset | IPs/CIDRs of your reverse proxy. When unset, `X-Forwarded-*` headers are ignored (fail-closed). Set this when a TLS-terminating proxy fronts the instance so client IPs and the HTTPS scheme are seen correctly. |

## Manage the instance in the app

Once it is running, all administration happens in the web UI — no server
access required:

- **[Access control (RBAC)](rbac.md)** — roles and what each can do.
- **[Users & tokens](users-and-tokens.md)** — invite members, issue personal and
  service tokens.
- **[Settings](settings.md)** — anonymous pull, retention, upload limits, and the
  supply-chain security gates applied to proxied packages.
- **[Authentication](authentication.md)** — forms login, MFA, and SAML 2.0
  single sign-on.
- **[Upstreams](upstreams.md)** — the public registries Dependably proxies.

## Verify

```bash
curl https://repo.example.com/health      # 200 when the process is up
curl https://repo.example.com/ready       # 200 when the instance is ready to serve
```

Then open the base URL in a browser and sign in as the owner created on first
boot.
