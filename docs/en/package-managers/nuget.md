# NuGet (.NET)

Point `dotnet` / `nuget` at your Dependably organization.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use
`https://default.repo.example.com/nuget/v3/index.json` instead — the path is
always just `/nuget/v3/index.json`.

NuGet authenticates with **HTTP Basic**: username `user` (any username works —
only the token matters), password your token. Your NuGet v3 service index is:

```
https://repo.example.com/nuget/v3/index.json
```

## Configure

### Per-project

Create `NuGet.config` in the solution root (the directory with your `.sln`).
The `dotnet` and `nuget` CLIs walk up the directory tree to find it.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="dependably"
         value="https://repo.example.com/nuget/v3/index.json" />
  </packageSources>
  <packageSourceCredentials>
    <dependably>
      <add key="Username" value="user" />
      <!-- Reads the env var at restore time -->
      <add key="ClearTextPassword" value="%DEPENDABLY_TOKEN%" />
    </dependably>
  </packageSourceCredentials>
</configuration>
```

`<clear />` removes the public nuget.org source so restores come only from
Dependably. The token is referenced via `%DEPENDABLY_TOKEN%`, so this file is
safe to commit. Each developer sets the variable before restoring:

```bash
export DEPENDABLY_TOKEN=<your token>
```

Add `*.user` and any `.env` file you use to `.gitignore`.

> **Plain HTTP:** modern `dotnet` refuses HTTP feeds. Add
> `allowInsecureConnections="true"` to the source element:
>
> ```xml
> <add key="dependably"
>      value="http://repo.example.com/nuget/v3/index.json"
>      allowInsecureConnections="true" />
> ```

### Global (per-machine)

Make Dependably available to every .NET project on your machine. The `dotnet`
CLI can edit the user-level config safely:

```bash
dotnet nuget add source https://repo.example.com/nuget/v3/index.json \
  --name dependably \
  --username user \
  --password <your token> \
  --store-password-in-clear-text
```

For HTTP-only instances, append `--allow-insecure-connections`.

To stop restores from falling through to public nuget.org, remove the default
source:

```bash
dotnet nuget remove source nuget.org
```

This edits the user-level config:

- **Linux / macOS:** `~/.config/NuGet/NuGet.Config`
- **Windows:** `%APPDATA%\NuGet\NuGet.Config`

Keep its permissions tight:

```bash
chmod 600 ~/.config/NuGet/NuGet.Config
```

## Verify

```bash
dotnet nuget list source              # "dependably" should be enabled
dotnet new console -n smoke && cd smoke
dotnet add package Newtonsoft.Json
```

A successful restore confirms the source, credentials, and service index are
all wired up. The first restore of a package records an entry on the
**Activity** page in the web UI.

## Publishing

`dotnet` reads the publish endpoint from the service index, so you push against
the same `index.json`:

```bash
dotnet nuget push MyPackage.1.0.0.nupkg \
  --source https://repo.example.com/nuget/v3/index.json \
  --api-key <your token>
```

Symbol packages (`.snupkg`) push the same way. Publishing requires a token with
the `publish:nuget` capability.

### Unlisting a version

Removing a version **unlists** (soft-deletes) it — the package data is retained,
but the version stops appearing in restore metadata:

```bash
dotnet nuget delete MyPackage 1.0.0 \
  --source https://repo.example.com/nuget/v3/index.json \
  --api-key <your token>
```

This requires a token with the `yank:nuget` capability.

## Revert

```bash
dotnet nuget remove source dependably
```
