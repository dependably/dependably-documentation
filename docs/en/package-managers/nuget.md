---
description: "Configure dotnet and NuGet to restore packages through a private Dependably feed, proxy nuget.org, and push your own packages."
order: 3
---

# NuGet (.NET)

Point `dotnet` at Dependably to restore private packages, proxy public ones, and
publish your own.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Your NuGet v3 service index is:

```
https://repo.example.com/nuget/v3/index.json
```

## Configure

Use `dotnet`'s own commands — they manage your `NuGet.config` for you, so there
are no files to edit by hand. NuGet authenticates with HTTP Basic: any username
works (the token is the password), so use `user`.

```bash
dotnet nuget add source https://repo.example.com/nuget/v3/index.json \
  --name dependably \
  --username user \
  --password <your token> \
  --store-password-in-clear-text
```

To keep restores from falling through to public nuget.org, remove the default
source:

```bash
dotnet nuget remove source nuget.org
```

> **Plain HTTP:** if your instance is served over `http://`, append
> `--allow-insecure-connections` to the `add source` command.

## Verify

```bash
dotnet nuget list source              # "dependably" should be enabled
dotnet new console -n smoke && cd smoke
dotnet add package Newtonsoft.Json
```

A successful restore confirms the source, credentials, and service index are all
wired up. Your first restore records an entry on the **Activity** page in the web
UI — check there to confirm packages are flowing through Dependably.

## Publishing

`dotnet` reads the publish endpoint from the service index, so you push against
the same `index.json`. The `--api-key` flag sends your token as the API key:

```bash
dotnet nuget push MyPackage.1.0.0.nupkg \
  --source https://repo.example.com/nuget/v3/index.json \
  --api-key <your token>
```

Symbol packages (`.snupkg`) push the same way. Publishing requires a token
with a push scope (**push only** or **push & pull**) — see
[Access tokens](../web-ui/tokens.md).

### Unlisting a version

Deleting a version **unlists** (soft-deletes) it — the package data is retained,
but the version stops appearing in restore metadata:

```bash
dotnet nuget delete MyPackage 1.0.0 \
  --source https://repo.example.com/nuget/v3/index.json \
  --api-key <your token>
```

Unlisting needs removal permission that the pre-defined token scopes do not
include. An Admin or Owner can instead delete the version in the web UI (open
the package's version list and select **Delete**) — note that deleting removes
the version entirely rather than unlisting it.

## Revert

To stop using Dependably as a source:

```bash
dotnet nuget remove source dependably
```
