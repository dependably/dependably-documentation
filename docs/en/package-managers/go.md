---
description: "Configure GOPROXY so go get and go mod download resolve modules through Dependably's Go module proxy cache instead of proxy.golang.org."
order: 6
---

# Go

Point the Go toolchain at Dependably so `go get` and `go mod download` resolve
and download modules through Dependably's module proxy cache.

You will need your instance's base URL and a token. See
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own.

Dependably implements the standard Go module proxy (GOPROXY) protocol under the
`/go` path. Set `GOPROXY` to:

```
https://repo.example.com/go,direct
```

The trailing `,direct` lets the toolchain fetch a module straight from its
source when Dependably answers that it does not have it. Drop it
(`https://repo.example.com/go`) to force all fetches through Dependably.

## Configure

Use Go's own `go env -w` command, which persists the setting in Go's
environment file, so no shell profile or hand-edited config is required:

```bash
go env -w GOPROXY=https://repo.example.com/go,direct
```

Then give Go your token. Go reads credentials from `~/.netrc` on every
machine that fetches modules; add this line, with your instance's host name:

```
machine repo.example.com login user password <your token>
```

The token is only optional when your organization has **Anonymous pull**
turned on. Otherwise every request without it is answered `401`. Over plain
`http://`, the credentials travel unencrypted.

Dependably also proxies the Go checksum database, so the default checksum
verification keeps working untouched. Leave `GOSUMDB` at its default
(`sum.golang.org`). You do not need to disable sum verification for a normal
deployment.

Modules in a private repository that the upstream cannot reach are not served
through Dependably. Mark them so the toolchain fetches them directly from
source and skips the public checksum database for them:

```bash
go env -w GOPRIVATE=example.com/private/*
go env -w GONOSUMDB=example.com/private/*
```

> **Air-gapped organizations** serve only modules Dependably has already
> cached, and do not proxy the checksum database either. Any module not yet
> cached returns `404`.

## Verify

```bash
go env GOPROXY            # should print your Dependably URL
go mod download          # resolve and cache this module's dependencies
GOPROXY=https://repo.example.com/go,direct go get example.com/some/module
```

The first download of a module records an entry on the **Activity** tab of the
[Audit log](../web-ui/audit.md). An Admin or Owner can check there to confirm
modules are flowing through Dependably.

## Publishing

Dependably is a caching proxy for Go modules and has no publish endpoint.
Modules are published the Go way, by tagging a release in the module's source
repository (a VCS tag like `v1.2.3`). Dependably fetches modules from the Go
upstream your operator configured (`proxy.golang.org` by default): the first
time anyone requests a version the upstream serves, Dependably caches it, and
later requests are served from the cache.

## Revert

Unset the values with Go's own command to return to its defaults:

```bash
go env -u GOPROXY
go env -u GOPRIVATE
go env -u GONOSUMDB
```

Then remove the `machine repo.example.com` line from `~/.netrc`.
