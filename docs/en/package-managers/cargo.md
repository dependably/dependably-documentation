---
description: "Configure Cargo to use a private Dependably sparse registry for Rust crates: proxy crates.io, install private crates, and publish your own."
order: 5
---

# Cargo

Point Cargo (Rust) at your Dependably instance. Dependably exposes a sparse
registry index, which Cargo reads without extra protocol configuration.

You will need your instance's base URL and a token. Create a token in the web
UI (see [Getting started](../getting-started.md)). The examples below use
`repo.example.com`; substitute your own. Your Cargo registry index is:

```
sparse+https://repo.example.com/cargo/
```

The `sparse+` prefix tells Cargo to use the sparse-index protocol. Keep the
trailing slash. Cargo reads `https://repo.example.com/cargo/config.json` to
discover the download and publish endpoints automatically.

## Configure

Cargo has no command to define a registry, so add this block to your global
`~/.cargo/config.toml` (on Windows, `%USERPROFILE%\.cargo\config.toml`). It holds
no secret:

```toml
[registries.dependably]
index = "sparse+https://repo.example.com/cargo/"

[source.crates-io]
replace-with = "dependably"

[source.dependably]
registry = "sparse+https://repo.example.com/cargo/"
```

The `[source]` entries route every crates.io dependency through Dependably.
Without them, Cargo only uses Dependably for dependencies that name it. On an
instance served over plain `http://`, the **Setup** page in the web UI adds
`protocol = "sparse"` to the `[registries.dependably]` block.

Then log in. Cargo prompts for the token and saves it in
`~/.cargo/credentials.toml`, outside any project:

```bash
cargo login --registry dependably
# paste <your token> when prompted
```

In CI, set the token in the `CARGO_REGISTRIES_DEPENDABLY_TOKEN` environment
variable instead.

To name the registry on a dependency, for example a crate your organization
published, add `registry = "dependably"` in your `Cargo.toml`:

```toml
[dependencies]
my-internal-crate = { version = "1.0", registry = "dependably" }
```

A project can commit its own `.cargo/config.toml` with the same blocks so
everyone who clones the repo resolves it the same way.

## Verify

```bash
cargo search --registry dependably serde   # search the registry
cargo build                                 # resolve and fetch dependencies
```

`cargo build` resolves your `[dependencies]` against the sparse index and
downloads the crates through Dependably.

One registry URL covers the crates your organization published and a
pull-through cache of the upstream your operator configured (crates.io by
default). A crate your organization has not fetched before comes from the
upstream on first use, is checked against the index checksum, cached, and
served; later builds hit the cache. Once your organization publishes a crate
name, Dependably serves that name only from your organization's own versions
and does not fetch it from the upstream.

`cargo search` covers the crates your organization published and the upstream
crates it has already cached. Whether reading needs a token at all depends on
the organization: with **Anonymous pull** enabled, index and download requests
work without one; with it disabled, an unauthenticated request is answered
`401` with a `WWW-Authenticate: Bearer realm="cargo"` challenge.

> **Tokens are organization-scoped.** A token created in one organization is
> treated as absent by another one's endpoints. It does not partially
> authenticate: the **Anonymous pull** setting decides whether a read succeeds,
> and publishing, yanking and `cargo owner` answer `401`.

## Publishing

Publish a crate to your instance:

```bash
cargo publish --registry dependably
```

Publishing requires a token with a push scope (**push only** or
**push & pull**), which only an Admin or Owner can create. See
[Access tokens](../web-ui/tokens.md). The published version appears in the
sparse index immediately. Publishing a version that already exists is refused
with `409` unless your organization has turned on **Allow version overwrite**.
To take a bad version out of resolution without breaking existing lockfiles,
see [Yanking](#yanking) below.

**Access is managed centrally.** Your Dependably
[roles and tokens](../admin/users-and-tokens.md) decide who can publish. There
are no per-crate owner lists to maintain. `cargo owner --list` reports your
organization's members and needs a token even when anonymous pull is on. `cargo owner --add` and
`--remove` return `501 Not Implemented`, because ownership lives in
Dependably's roles, not on the crate.

## Yanking

Hide a version from dependency resolution while leaving it downloadable by
exact coordinate, so existing lockfiles keep resolving. These are the same
semantics crates.io has:

```bash
cargo yank --registry dependably --version 1.2.3 my-crate
cargo yank --registry dependably --version 1.2.3 --undo my-crate
```

> **Yanking needs a capability the token presets do not grant.** The
> presets on the **Access tokens** page (**pull only**, **push only**,
> **push & pull**) cover reading and publishing only. A token that may yank
> needs `yank:cargo` (or `yank:*`). An Admin or Owner creates it through the
> management API (`POST /api/v1/tokens`) rather than the token screen.

## Revert

Stop publishing or resolving against Dependably:

```bash
cargo logout --registry dependably
```

Then remove the `[registries.dependably]`, `[source.crates-io]` and
`[source.dependably]` blocks from `~/.cargo/config.toml`, and drop the
`registry = "dependably"` keys from each `Cargo.toml`.
