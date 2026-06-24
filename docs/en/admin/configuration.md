# Configuration

This page is for **operators** who deploy and run a Dependably instance.

Dependably is built to be simple to run: start the container, tell it the URL it
will be reached at, and manage everything else from the admin UI. There are no
config files to maintain and nothing to tune on disk.

## Deploy

Run the Dependably container on your own infrastructure. The one thing you set
at launch is the **public base URL** — the address your developers and the web
UI will use:

```
https://repo.example.com
```

The base URL fixes the instance's hostname (used for secure cookies, allowed
hosts, and the links the UI generates). Point it at your real hostname and use
HTTPS in production. Everything else has a working default and starts
immediately.

On **first boot**, Dependably creates your organization and an owner account,
and prints the owner's email and a generated temporary password to the container
logs. Sign in with those, change the password, and you are ready to administer
the instance.

## Manage the instance in the app

Once it is running, all administration happens in the web UI (or the API) — no
server access required:

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
curl https://repo.example.com/health      # 200 OK when the instance is running
```

Then open the base URL in a browser and sign in as the owner created on first
boot.
