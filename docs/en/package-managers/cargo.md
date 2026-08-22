# Cargo

Point Cargo (Rust) at your Dependably instance. Dependably exposes a **sparse**
registry index, so it works with stable Cargo (1.70 and newer) with no extra
protocol configuration.

You will need your instance's base URL and a token — create a token in the web
UI (see [Getting started](../getting-started.md)). The examples below use
`repo.example.com`; substitute your own. Your Cargo registry index is:

```
sparse+https://repo.example.com/cargo/
```

The `sparse+` prefix tells Cargo to use the sparse-index protocol. Keep the
trailing slash. Cargo reads `https://repo.example.com/cargo/config.json` to
discover the download and publish endpoints automatically.

## Configure

Cargo has no command to define a registry, so add this one block to your global
`~/.cargo/config.toml` (on Windows, `%USERPROFILE%\.cargo\config.toml`). It holds
no secret:

```toml
[registries.dependably]
index = "sparse+https://repo.example.com/cargo/"
```

Then log in. Cargo prompts for the token and stores it in its own credential
store — no environment variable, no secret in a file:

```bash
cargo login --registry dependably
# paste <your token> when prompted
```

To pull a dependency from Dependably, reference the registry by name in your
`Cargo.toml`:

```toml
[dependencies]
my-internal-crate = { version = "1.0", registry = "dependably" }
```

A project can commit its own `.cargo/config.toml` with the same
`[registries.dependably]` block so everyone who clones the repo resolves it the
same way.

## Verify

```bash
cargo search --registry dependably serde   # search the registry
cargo build                                 # resolve and fetch dependencies
```

`cargo build` resolves your `[dependencies]` against the sparse index and
downloads any `registry = "dependably"` crates. Your first download records an
entry on the **Activity** page in the web UI.

One registry URL covers both sides: crates your organization published and a
pull-through cache of the upstream your operator configured (crates.io by
default). Cargo does not know or care which side a crate came from. A crate the
organization has not seen before is fetched from the upstream on first use,
verified, cached, and served; later builds hit the cache. If your organization
publishes a name and version that also exists upstream, **the local version
wins** — the sparse index shadows the upstream line and the download serves your
bytes.

`cargo search` covers both sides too. Whether reading needs a token at all
depends on the organization: with **anonymous pull** enabled, index and download
requests work without one; with it disabled, an unauthenticated request is
answered `401` with a `WWW-Authenticate: Bearer realm="cargo"` challenge.

> **Tokens are organization-scoped.** A token minted in one organization is
> treated as absent by another one's endpoints — it does not partially
> authenticate, so the anonymous-pull rule governs and you get a `401` rather
> than another organization's data.

## Publishing

Publish a crate to your instance:

```bash
cargo publish --registry dependably
```

Publishing requires a token with a push scope (**push only** or
**push & pull**) — see [Access tokens](../web-ui/tokens.md). The published
version appears in the sparse index immediately; re-publishing an existing
version is rejected. Removing a bad version outright is an Admin or Owner
action done in the web UI (open the package's version list and select
**Delete**); to hide a version without breaking existing lockfiles, see
[Yanking](#yanking) below.

**Access is managed centrally.** Who can publish is governed by your Dependably
[roles and tokens](../admin/users-and-tokens.md), so there are no per-crate owner
lists to maintain — change access once, in one place, instead of crate by crate.
`cargo owner --list` reports your members. (Because access lives in Dependably
rather than on the crate, Cargo's `cargo owner --add` / `--remove` return
`501 Not Implemented`.)

## Yanking

Hide a version from dependency resolution while leaving it downloadable by
exact coordinate, so existing lockfiles keep resolving — the same semantics
crates.io has:

```bash
cargo yank --registry dependably --version 1.2.3 my-crate
cargo yank --registry dependably --version 1.2.3 --undo my-crate
```

> **Yanking needs a capability the token presets do not grant.** The three
> presets in the web UI (**pull**, **push**, **push & pull**) cover reading and
> publishing only. A token that may yank needs `yank:cargo` (or `yank:*`), which
> is minted through the management API rather than the token screen — see the
> API docs at `/api/v1/docs/` on your instance.

## Revert

Stop publishing or resolving against Dependably:

```bash
cargo logout --registry dependably
```

Then remove the `[registries.dependably]` block from `~/.cargo/config.toml`, and
drop the `registry = "dependably"` keys from each `Cargo.toml`.
