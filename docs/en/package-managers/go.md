# Go

Point the Go toolchain at your Dependably organization so `go get` and
`go mod download` resolve and download modules through Dependably's module
proxy cache.

You will need your **base URL** and — if your instance requires authenticated
pulls — a **token**. See [Getting started](../getting-started.md). The examples
below use `repo.example.com`; substitute your own. On a multi-tenant instance
your organization is a subdomain, so use
`https://default.repo.example.com/go,direct` instead — the path is always just
`/go`.

Dependably implements the standard Go module proxy (GOPROXY) protocol under the
`/go` path. Set `GOPROXY` to:

```
https://repo.example.com/go,direct
```

The trailing `,direct` lets the toolchain fall back to fetching directly from a
module's source when Dependably has no cached copy. Drop it
(`GOPROXY=https://repo.example.com/go`) to force all fetches through Dependably.

## Configure

The Go toolchain is configured with **environment variables**, not a config
file. Set them in your shell profile (or per-project via `go env -w`).

```bash
export GOPROXY=https://repo.example.com/go,direct
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
> export GOPRIVATE=example.com/internal,corp.example.com
> ```

### Private modules (authenticated pulls)

If your instance requires a token to pull (anonymous pull disabled), Go sends
credentials over HTTPS from your `~/.netrc`. Dependably accepts the token as the
**password** with any username (the literal `user` is conventional):

```text
machine repo.example.com
login user
password <your token>
```

Keep the file private:

```bash
chmod 600 ~/.netrc
```

If anonymous pull is enabled on your instance (a common default for read
access), no credentials are needed and you can skip `~/.netrc`.

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

Unset the environment variables to return to Go's defaults:

```bash
go env -u GOPROXY
unset GOPROXY GOPRIVATE
```

Or remove the `machine repo.example.com` block from `~/.netrc`.
