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

## Publishing

Publish a crate to your instance:

```bash
cargo publish --registry dependably
```

Publishing requires a token with the `publish:cargo` capability. The published
version appears in the sparse index immediately; re-publishing an existing
version is rejected. Yank a bad version with `cargo yank --registry dependably
--version <x.y.z>` (and `--undo` to reverse it), which needs the `yank:cargo`
capability.

**Access is managed centrally.** Who can publish is governed by your Dependably
[roles and tokens](../admin/users-and-tokens.md), so there are no per-crate owner
lists to maintain — change access once, in one place, instead of crate by crate.
`cargo owner --list` reports your members. (Because access lives in Dependably
rather than on the crate, Cargo's `cargo owner --add` / `--remove` return
`501 Not Implemented`.)

## Revert

Stop publishing or resolving against Dependably:

```bash
cargo logout --registry dependably
```

Then remove the `[registries.dependably]` block from `~/.cargo/config.toml`, and
drop the `registry = "dependably"` keys from each `Cargo.toml`.
