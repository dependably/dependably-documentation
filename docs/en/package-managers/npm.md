# npm

Point npm (and yarn / pnpm, which read the same config) at Dependably to install
private packages, proxy public ones, and publish your own.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Your npm registry URL is:

```
https://repo.example.com/npm/
```

## Configure

Use npm's own commands — they store everything in npm's config for you, so there
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
npm config delete registry
npm config delete //repo.example.com/npm/:_authToken
```
