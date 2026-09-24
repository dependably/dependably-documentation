---
description: "Configure npm, yarn and pnpm to install through a private Dependably registry, proxy public packages, and publish your own with a scoped token."
order: 1
---

# npm

Point npm (and yarn / pnpm, which read the same config) at Dependably to install
private packages, proxy public ones, and publish your own.

You will need your **base URL** and a **token**; see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Your npm registry URL is:

```
https://repo.example.com/npm/
```

## Configure

Use npm's own commands. They store everything in npm's config for you, so there
are no files to edit by hand. npm sends the token as a Bearer credential:

```bash
npm config set registry https://repo.example.com/npm/
npm config set //repo.example.com/npm/:_authToken <your token>
```

> **Plain HTTP:** if your instance is served over `http://`, also run
> `npm config set strict-ssl false`. Prefer HTTPS where you can.

To point a single project (rather than your whole machine) at Dependably, run the
same commands with `--location=project`; npm scopes them to that project.

## Verify

```bash
npm config get registry   # should print your Dependably URL
npm ping                  # reachable? (never needs a token)
npm whoami                # prints your email, or service:<name> for a service token
npm install is-odd        # a public package, proxied through Dependably
```

Run `npm ping` first to confirm the URL and TLS are right, then `npm whoami` to
confirm your token authenticates. `npm ping` is always anonymous; if it succeeds
but `npm whoami` returns `ENEEDAUTH`, the token was not set. A service token
reports its identity as `service:<name>` rather than an email.

The first download of each package version is recorded as a **First fetch**
event on the **Activity** tab of the **Audit** page, which admins, owners and
auditors can open. See [Audit log](../web-ui/audit.md).

## Publishing

```bash
npm publish --registry https://repo.example.com/npm/
```

Scoped (`@scope/name`) and unscoped packages publish the same way. Publishing
requires a token with a push scope (**push only** or **push & pull**). See
[Access tokens](../web-ui/tokens.md).

The same token manages dist-tags:

```bash
npm dist-tag add <pkg>@<version> <tag>
npm dist-tag ls  <pkg>
npm dist-tag rm  <pkg> <tag>          # the 'latest' tag cannot be removed
```

### Removing a version

Removing a published version is an admin or owner action in the web UI: open
the package, open the version's **Actions** menu, and select **Delete**.
`npm unpublish` needs a removal permission that the token scopes in the web UI
do not include.

## Revert

To stop using Dependably as your registry:

```bash
npm config delete registry
npm config delete //repo.example.com/npm/:_authToken
```
