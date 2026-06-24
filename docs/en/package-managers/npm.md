# npm

Point npm (and yarn / pnpm, which read the same `.npmrc`) at your Dependably
organization to install private packages, proxy public ones, and publish your
own.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use `https://default.repo.example.com/npm/`
instead — the path is always just `/npm/`.

Your npm registry URL is:

```
https://repo.example.com/npm/
```

## Configure

npm sends your token as an `Authorization: Bearer` header — that is exactly what
the `_authToken` line below does. The token is matched to your organization by
the server, so a token issued for a different org is treated as no token at all.

### Per-project

Create `.npmrc` in the repository root, next to `package.json`:

```ini
registry=https://repo.example.com/npm/
//repo.example.com/npm/:_authToken=${NPM_TOKEN}
# Uncomment if your instance is served over plain HTTP:
# strict-ssl=false
```

The token is read from the environment, so this file is safe to commit. Each
developer sets the variable in their shell before installing:

```bash
export NPM_TOKEN=<your token>
```

If you load `NPM_TOKEN` from a `.env` file, add `.env` to `.gitignore`.

### Global (per-machine)

Point every project on your machine at Dependably by default.

- **Linux / macOS:** `~/.npmrc`
- **Windows:** `%USERPROFILE%\.npmrc`

```ini
registry=https://repo.example.com/npm/
//repo.example.com/npm/:_authToken=<your token>
# Uncomment if your instance is served over plain HTTP:
# strict-ssl=false
```

This file is not in source control, so the literal token goes here directly.
Keep its permissions tight:

```bash
chmod 600 ~/.npmrc
```

## Verify

```bash
npm config get registry   # should print your Dependably URL
npm ping                  # reachable? (never needs a token)
npm whoami                # prints your email, or service:<name> for a service token
npm install is-odd        # a public package, proxied through Dependably
```

Run `npm ping` first to confirm the URL and TLS are right, then `npm whoami` to
confirm your token authenticates. `npm ping` is always anonymous; if it succeeds
but `npm whoami` returns `ENEEDAUTH`, the `_authToken` line is missing or
malformed. A service token reports its identity as `service:<name>` rather than
an email — handy to echo into CI logs.

Your first install records an entry on the **Activity** page in the web UI —
check there to confirm packages are flowing through Dependably.

## Publishing

```bash
npm publish --registry https://repo.example.com/npm/
```

Both scoped (`@scope/name`) and unscoped packages are supported. Publishing
requires a token with the `publish:npm` capability.

You can also manage dist-tags with a publish-capable token:

```bash
npm dist-tag add <pkg>@<version> <tag>
npm dist-tag ls  <pkg>
npm dist-tag rm  <pkg> <tag>          # the 'latest' tag cannot be removed
```

## Revert

Remove a single published version (requires a token with the `yank:npm`
capability):

```bash
npm unpublish <pkg>@<version>
```

Whole-package unpublish (removing every version at once) is not accepted over
the npm CLI — use the web UI or management API for that.

To stop using Dependably as your registry:

```bash
npm config delete registry --location=user
npm config delete //repo.example.com/npm/:_authToken --location=user
```

Or delete the `.npmrc` file.
