---
description: "Configure Mix and Rebar3 to fetch Hex packages for Elixir and Erlang through a private Dependably repository, and publish your own."
---

# Hex (Elixir and Erlang)

Point Mix or Rebar3 at your Dependably instance as a Hex **repository** and
`mix deps.get` or `rebar3 get-deps` resolves and downloads every package through
it — the ones your organization publishes and, on first use, anything from
hex.pm. Publishing, retiring and documentation uploads go to the same instance.

You will need your instance's base URL, a token (see
[Getting started](../getting-started.md)), and the organization's **repository
public key**. Every Hex registry resource is signed, and your client verifies
each one against that key, so registering the repository is the one step that
differs from the other ecosystems. The examples below use `repo.example.com`;
substitute your own. Your repository and API URLs are:

```
https://repo.example.com/hex        # repository (what Mix and Rebar3 resolve from)
https://repo.example.com/hex/api    # API (what publishing talks to)
```

> **Register the repository under the name `dependably`.** A Hex client checks
> that the repository name embedded in every signed resource matches the name
> it registered. Dependably signs under `dependably`; a repository registered
> under any other name fails that check on every fetch.

## Configure

### Mix

Fetch the public key and register the repository. The **Setup** page in the
web UI shows this recipe with your organization's key already filled in.

```bash
curl -sSf https://repo.example.com/hex/public_key -o dependably-hex.pem
mix hex.repo add dependably https://repo.example.com/hex \
  --public-key dependably-hex.pem --auth-key <your token>
mix hex.repo list
```

Then name the repository on each dependency that should come from it:

```elixir
defp deps do
  [
    {:phoenix, "~> 1.7", repo: :dependably},
    {:my_private_lib, "~> 0.3", repo: :dependably}
  ]
end
```

A dependency that names `:dependably` resolves through your instance whether it
is one your organization published or one Dependably fetches from hex.pm on
first use; the lock file records `"dependably"` as the repository.

### Rebar3

Add the repository to Rebar3's global configuration
(`~/.config/rebar3/rebar.config`), with the key's PEM text inline:

```erlang
{hex, [{repos, [
  #{name => <<"dependably">>,
    repo_url => <<"https://repo.example.com/hex">>,
    api_url => <<"https://repo.example.com/hex/api">>,
    repo_key => <<"<your token>">>,
    api_key => <<"<your token>">>,
    repo_public_key => <<"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n">>}
]}]}.
```

Rebar3 searches repositories in the order listed, before hex.pm, so an ordinary
package dependency resolves through Dependably:

```erlang
{deps, [{decimal, "2.4.1", {pkg, decimal}}]}.
```

## Verify

```bash
mix deps.get        # or: rebar3 get-deps
```

Each package downloads through Dependably; a first download of a hex.pm
package records an entry on the **Activity** page in the web UI. If Dependably
has recorded a vulnerability for a release you fetch, Mix prints the advisory
during `deps.get` — the registry index carries it.

If the repository was registered with the wrong public key, or the key was
rotated (below), every fetch fails with a signature error rather than
returning data.

## Publish

Publishing uses the API URL and a token with the `publish:hex` capability
(the **push** preset). Mix reads both from the environment:

```bash
export HEX_API_URL=https://repo.example.com/hex/api
export HEX_API_KEY=<your token>
mix hex.publish --yes
```

`mix hex.publish` publishes the package and then its documentation; use
`mix hex.publish package --yes` to skip the docs. The package's name in
`mix.exs` must match the name being published, and the version must be a
strict semantic version; a mismatch is refused before anything is stored.
Publishing an existing version again is refused unless you pass `--replace`
**and** your organization allows version overwrite.

With Rebar3, once the repository above carries `api_key`:

```bash
rebar3 hex publish --repo dependably --yes
```

## Retire a release

Retiring marks a release as advised against without removing it — a project
that already locked it keeps resolving. It needs a token with `yank:hex`:

```bash
mix hex.retire my_private_lib 0.3.1 security --message "CVE-2026-1234"
mix hex.retire my_private_lib 0.3.1 --unretire
```

Dependably also records the retirement as a deprecation, so an organization
that blocks deprecated releases stops serving it.

## Revert a release

`mix hex.publish --revert 0.3.1` deletes the release, its tarball and its
documentation. hex.pm limits this to an hour after publishing; on a private
registry your organization's own policy applies, and the deletion is audited.

## The signing key

Every organization has its own registry signing key. **Settings → Signatures**
shows the public key and its fingerprint and offers **Rotate key**. Rotation
takes effect immediately: every developer and CI runner that registered the
repository must fetch the new public key and register it again, so treat it
as a planned change. If the instance was deployed without a master key
(`DEPENDABLY_MASTER_KEY`), no signing key can be stored and the Hex repository
answers `503` — ask your administrator.

## Blocked packages

A `403` on a tarball, or a version missing from the index that hex.pm lists,
is a policy refusal, not an authentication failure — see
[Blocked packages](blocked-packages.md). Because Dependably signs the index
itself, a blocked version never appears in it, and the organization's policy is
also published as a signed Hex policy resource at
`https://repo.example.com/hex/repos/dependably/policies/dependably` for clients
that enforce dependency policies before resolving.
