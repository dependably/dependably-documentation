# npm

Point npm (and yarn / pnpm, which read the same `.npmrc`) at your Dependably
organization.

You will need your **base URL**, **org slug**, and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com` and the org `default`; substitute your own.

Your npm registry URL is:

```
https://repo.example.com/o/default/npm/
```

---

## Per-project

Create `.npmrc` in the repository root, next to `package.json`:

```ini
registry=https://repo.example.com/o/default/npm/
//repo.example.com/o/default/npm/:_authToken=${NPM_TOKEN}
# Uncomment if your instance is served over plain HTTP:
# strict-ssl=false
```

The token is read from the environment, so this file is safe to commit. Each
developer sets the variable in their shell before installing:

```bash
export NPM_TOKEN=<your token>
```

If you load `NPM_TOKEN` from a `.env` file, add `.env` to `.gitignore`.

---

## Global (per-machine)

Point every project on your machine at Dependably by default.

- **Linux / macOS:** `~/.npmrc`
- **Windows:** `%USERPROFILE%\.npmrc`

```ini
registry=https://repo.example.com/o/default/npm/
//repo.example.com/o/default/npm/:_authToken=<your token>
# Uncomment if your instance is served over plain HTTP:
# strict-ssl=false
```

This file is not in source control, so the literal token goes here directly.
Keep its permissions tight:

```bash
chmod 600 ~/.npmrc
```

---

## Verify

```bash
npm config get registry   # should print your Dependably URL
npm ping                  # reachable? (no token needed)
npm whoami                # prints your email, or service:<name> for a service token
npm install is-odd        # a public package, proxied through Dependably
```

Run `npm ping` first to confirm the URL and TLS are right, then `npm whoami` to
confirm your token authenticates. If `npm ping` succeeds but `npm whoami`
returns `ENEEDAUTH`, the `_authToken` line is missing or malformed.

Your first install records a `first_fetch` entry on the **Activity** page in the
web UI — check there to confirm packages are flowing through Dependably.

---

## Publishing

```bash
npm publish --registry https://repo.example.com/o/default/npm/
```

---

## Revert

```bash
npm config delete registry --location=user
npm config delete //repo.example.com/o/default/npm/:_authToken --location=user
```

Or delete the `.npmrc` file.
