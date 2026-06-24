# Go

Point the Go toolchain at Dependably so `go get` and `go mod download` resolve
and download modules through Dependably's module proxy cache.

You will need your **base URL** — see [Getting started](../getting-started.md).
The examples below use `repo.example.com`; substitute your own.

Dependably implements the standard Go module proxy (GOPROXY) protocol under the
`/go` path. Set `GOPROXY` to:

```
https://repo.example.com/go,direct
```

The trailing `,direct` lets the toolchain fall back to fetching directly from a
module's source when Dependably has no cached copy. Drop it
(`https://repo.example.com/go`) to force all fetches through Dependably.

## Configure

Use Go's own `go env -w` command, which persists the setting in Go's
environment file — no shell profile or hand-edited config required:

```bash
go env -w GOPROXY=https://repo.example.com/go,direct
```

Dependably also proxies the Go checksum database, so the default checksum
verification keeps working untouched — leave `GOSUMDB` at its default
(`sum.golang.org`). You do **not** need to disable sum verification for a normal
deployment.

> **Air-gapped instances** with upstream proxying turned off cannot reach the
> checksum database. In that case, mark your private/internal modules so the
> toolchain skips the public checksum DB for them:
>
> ```bash
> go env -w GOPRIVATE=example.com/internal,corp.example.com
> ```

## Verify

```bash
go env GOPROXY            # should print your Dependably URL
go mod download          # resolve and cache this module's dependencies
GOPROXY=https://repo.example.com/go,direct go get example.com/some/module
```

The first download of a module records an entry on the **Activity** page in the
web UI — check there to confirm modules are flowing through Dependably.

## Publishing

Go modules are published the Go-native way — by tagging a release in the
module's source repository (a VCS tag like `v1.2.3`). The first time anyone
requests that version, Dependably discovers it, fetches it, verifies it, and
caches it automatically, so your internal modules flow through the same proxy as
everything else. Tag the release in source and Dependably handles the rest.

## Revert

Unset the values with Go's own command to return to its defaults:

```bash
go env -u GOPROXY
go env -u GOPRIVATE
```
