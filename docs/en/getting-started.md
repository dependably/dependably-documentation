# Getting started

Before you configure any tool, gather three pieces of information. Every guide
in this site asks for the same three.

## 1. Base URL

The address of your Dependably instance, for example:

```
https://acme.example.com
```

or, on a local network:

```
http://192.168.1.50:8080
```


## 2. Organization slug

Dependably groups packages by organization. The slug is the short name in your
registry URLs — often `default`, or your team's name such as `acme`. You can
see it in the address bar when you are logged into the web UI.

## 3. Token

Every guide authenticates with a token. Create one in the web UI:

- **Tokens** — a personal token tied to your account. Best for your own machine.
- **Settings → Service tokens** — a long-lived token not tied to a person.
  Best for CI and shared automation.

Most tools authenticate with **HTTP Basic**: the username is the literal word
`user` and the password is your token.

> **Keep tokens secret.** Never commit a token to source control. The
> per-project recipes in each guide reference an environment variable instead
> of pasting the literal value.

---

## Project vs. global configuration

Each guide shows two ways to point a tool at Dependably:

- **Per-project** — config lives in the repository, so everyone who clones it
  uses Dependably automatically. The token is read from an environment variable
  so no secret is committed. Use this for shared projects.
- **Global (per-machine)** — config lives in your home directory and applies to
  every project on your machine. The token is stored directly in the file, so
  keep its permissions tight. Use this for your personal workstation.

---

## The plain-HTTP gotcha

Self-hosted registries are often served over plain **HTTP** on an internal
network (a URL starting with `http://`, not `https://`). Most package managers
refuse to talk to a plaintext registry by default — this is intentional, and
you override it deliberately per tool:

| Tool   | Override |
| ------ | -------- |
| npm    | `strict-ssl=false` |
| pip    | `trusted-host = <host>` |
| uv     | `--allow-insecure-host <host>` |
| NuGet  | `allowInsecureConnections="true"` (or `--allow-insecure-connections`) |
| docker | add the host to `insecure-registries` in the daemon config |
| dnf    | `sslverify=0` |

Each guide repeats the exact line you need. If your instance is served over
HTTPS, ignore this section entirely.

---

## Verify you can reach the instance

Open the base URL in a browser, or check the health endpoint:

```bash
curl https://repo.example.com/health      # 200 OK when the instance is running
```

Once that succeeds, head to the guide for your tool:

- [npm](package-managers/npm.md)
- [PyPI](package-managers/pypi.md)
- [NuGet](package-managers/nuget.md)
- [Maven](package-managers/maven.md)
- [Docker](containers-and-system/docker.md)
- [RPM](containers-and-system/rpm.md)
