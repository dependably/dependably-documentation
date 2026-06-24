# Getting started

Before you configure any tool, gather the two things every guide in this site
asks for: your **base URL** and a **token**.

## 1. Base URL

The address of your Dependably instance, for example:

```
https://repo.example.com
```

On a local network the IP and port also work:

```
http://192.168.1.50:8080
```

Registry URLs are always built straight onto that base — `<base>/npm/`,
`<base>/simple/`, and so on. Each ecosystem guide uses `repo.example.com` in its
examples; substitute your own host.

## 2. Token

Every guide authenticates with a token that you create in the web UI — no files
to edit and nothing to set up on the server:

- **Tokens** — a personal token tied to your account. Best for your own machine.
- **Settings → Service tokens** — a long-lived token not tied to a person. Best
  for CI and shared automation.

Each tool then stores the token in its own credential store when you log in or
configure it; the guides show the exact command. You never need to paste a token
into a file you commit.

> **Keep tokens secret.** A token is a credential — store it in your tool's
> credential store or CI secret manager, and never commit it. See
> [Access tokens](web-ui/tokens.md) for creating, rotating, and revoking them.

## 3. Verify you can reach the instance

Open the base URL in a browser, or check the health endpoint:

```bash
curl https://repo.example.com/health      # 200 OK when the instance is running
```

Once that succeeds, head to the guide for your tool:

- [npm](package-managers/npm.md)
- [PyPI](package-managers/pypi.md)
- [NuGet](package-managers/nuget.md)
- [Maven](package-managers/maven.md)
- [Cargo](package-managers/cargo.md)
- [Go](package-managers/go.md)
- [Docker](containers-and-system/docker.md)
- [RPM](containers-and-system/rpm.md)

> **Served over plain HTTP?** If your base URL starts with `http://` rather than
> `https://`, most package managers refuse it until you allow it explicitly. Each
> guide shows the one line its tool needs; if your instance uses HTTPS you can
> ignore those notes.
