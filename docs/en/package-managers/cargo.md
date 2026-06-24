# Cargo

Point Cargo (Rust) at your Dependably organization. Dependably exposes a
**sparse** registry index, so it works with stable Cargo (1.70 and newer) with
no extra protocol configuration.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use
`sparse+https://default.repo.example.com/cargo/` instead — the path is always
just `/cargo/`.

Your Cargo registry index is:

```
sparse+https://repo.example.com/cargo/
```

The `sparse+` prefix tells Cargo to use the sparse-index protocol. Keep the
trailing slash. Cargo reads `https://repo.example.com/cargo/config.json` to
discover the download and publish endpoints automatically.

## Configure

Cargo authenticates with a **token** sent in the `Authorization` header.
Register it once with `cargo login`, or supply it through the
`CARGO_REGISTRIES_DEPENDABLY_TOKEN` environment variable.

### Global (`~/.cargo/config.toml`)

Define the registry once for every project on your machine. On Windows the file
is `%USERPROFILE%\.cargo\config.toml`.

```toml
[registries.dependably]
index = "sparse+https://repo.example.com/cargo/"
```

Then log in (Cargo stores the token in `~/.cargo/credentials.toml`):

```bash
cargo login --registry dependably
# paste your token when prompted
```

Or skip `cargo login` entirely and provide the token through the environment —
Cargo reads `CARGO_REGISTRIES_<NAME>_TOKEN`, uppercased:

```bash
export CARGO_REGISTRIES_DEPENDABLY_TOKEN=<your token>
```

The environment variable keeps the token out of any file. Use it for CI and
shared automation.

### Per-project (`Cargo.toml`)

To pull a dependency from Dependably, reference the registry by name in the
project's `Cargo.toml`:

```toml
[dependencies]
my-internal-crate = { version = "1.0", registry = "dependably" }
```

The `[registries.dependably]` block must exist on each machine (in
`~/.cargo/config.toml`), or be committed to the project's own
`.cargo/config.toml` so everyone who clones the repo resolves it the same way:

```toml
# .cargo/config.toml committed at the repo root
[registries.dependably]
index = "sparse+https://repo.example.com/cargo/"
```

This file holds no secret — the token still comes from `cargo login` or the
`CARGO_REGISTRIES_DEPENDABLY_TOKEN` environment variable, so it is safe to
commit.

## Verify

```bash
cargo search --registry dependably serde   # search the registry
cargo build                                 # resolve and fetch dependencies
```

`cargo build` resolves your `[dependencies]` against the sparse index and
downloads any `registry = "dependably"` crates. Your first download records an
entry on the **Activity** page in the web UI.

## Publishing

Publish a crate to your org:

```bash
cargo publish --registry dependably
```

Publishing requires a token with the `publish:cargo` capability. The published
version appears in the sparse index immediately; re-publishing an existing
version is rejected. Yank a bad version with `cargo yank --registry dependably
--version <x.y.z>` (and `--undo` to reverse it), which needs the `yank:cargo`
capability.

**Owner management is not available.** `cargo owner --add` and
`cargo owner --remove` return **501 Not Implemented**: who can publish is
governed by your Dependably **organization membership**, not per-crate owners.
Manage access through the registry's [user-management](../admin/users-and-tokens.md)
tools instead. (`cargo owner --list` works and reports your org's members.)

## Revert

Stop publishing or resolving against Dependably:

```bash
cargo logout --registry dependably
unset CARGO_REGISTRIES_DEPENDABLY_TOKEN
```

Then remove the `[registries.dependably]` block from `~/.cargo/config.toml`
(and from any committed `.cargo/config.toml`), and drop the
`registry = "dependably"` keys from each `Cargo.toml`.
