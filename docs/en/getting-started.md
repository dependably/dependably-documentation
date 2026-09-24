---
description: "The two inputs every Dependably guide needs: the base URL of your instance and an access token created in the web UI."
---

# Getting started

Before you configure any tool, gather the two things every guide in this site
asks for: your **base URL** and a **token**.

## Base URL

The address of your Dependably instance, for example:

```
https://repo.example.com
```

On a local network the IP and port also work:

```
http://192.168.1.50:8080
```

Each registry URL is built straight onto that base: `<base>/npm/`,
`<base>/simple/`, and so on. Docker is the exception and uses the host alone.
Each ecosystem guide uses `repo.example.com` in its examples; substitute your
own host.

## Token

Every guide authenticates with a token that you create in the web UI; nothing
needs setting up on the server:

| Where | Token type | Best for | Created by |
| ----- | ---------- | -------- | ---------- |
| **Setup** wizard | Personal, generated with ready-made configuration for your package manager | First-time setup | You |
| **Tokens** | Personal, tied to your account | Your own machine | You |
| **Settings**, then **Service tokens** | Not tied to a person | CI and shared automation | An admin or owner |

Each guide shows where its tool keeps the token, usually its own credential
store or a user-level config file. You never need to paste a token into a file
you commit.

> **Keep tokens secret.** A token is a credential. Store it in your tool's
> credential store or your CI secret manager, and never commit it. See
> [Access tokens](web-ui/tokens.md) for creating, rotating, and revoking them.

## Verify you can reach the instance

Open the base URL in a browser, or check the health endpoint:

```bash
curl https://repo.example.com/health      # {"status":"ok"} when the instance is running
```

Once that succeeds, head to the guide for your tool:

- [npm](package-managers/npm.md)
- [PyPI](package-managers/pypi.md)
- [NuGet](package-managers/nuget.md)
- [Maven](package-managers/maven.md)
- [Cargo](package-managers/cargo.md)
- [Go](package-managers/go.md)
- [Terraform](package-managers/terraform.md)
- [Hex](package-managers/hex.md)
- [Docker](containers-and-system/docker.md)
- [RPM](containers-and-system/rpm.md)

> **Served over plain HTTP?** If your base URL starts with `http://` rather than
> `https://`, some package managers refuse it until you allow it explicitly, and
> the guides for those tools show the setting. Over HTTP the token travels in
> clear text, so use it only on a trusted network. If your instance uses HTTPS
> you can ignore those notes.
