# Docker / OCI images — Beta

> **Beta.** Docker / OCI container image support is functional but the protocol
> surface and configuration may still change.

Dependably implements the OCI Distribution Spec (`/v2/`), so `docker` (and
`podman`) work against it unchanged for both pulling and pushing images.

You will need your instance **host** and a **token** — create a token in the web
UI (see [Getting started](../getting-started.md)). The Docker protocol owns the
URL: every client talks to `/v2/` at the registry root, so image references are
simply `repo.example.com/<image>:<tag>`, where the host is your registry:

```text
repo.example.com/myimage:tag
```

The examples below use `repo.example.com`; substitute your own host.

## Configure

Log in once to the registry host. Docker stores the credentials in its own
credential store and reuses them automatically. The username can be anything
(use `user`); the password is your token:

```bash
docker login repo.example.com -u user
# paste <your token> when prompted for a password
```

To keep the token out of your shell history, pipe it from stdin:

```bash
echo "<your token>" | docker login repo.example.com -u user --password-stdin
```

`podman login repo.example.com` works the same way.

## Verify

Pull a small image through Dependably by prefixing it with your host:

```bash
docker pull repo.example.com/library/hello-world:latest
docker run --rm repo.example.com/library/hello-world:latest
```

The first pull of an image is fetched from upstream, verified by digest, and
cached; later pulls of the same digest are served locally. Pulls appear as
`download` activity on the **Activity** page in the web UI.

New instances are seeded with two upstream registries: Microsoft Container
Registry (`mcr.microsoft.com`, for `dotnet/` and `playwright` images) and Docker
Hub (everything else). Pulls proxy through these automatically — see
[Upstreams](../admin/upstreams.md) to add or change them.

## Publishing

Pushing requires a token with the `publish:oci` capability. Tag your image with
the registry host and repository, then push:

```bash
docker tag myimage:1.0 repo.example.com/myimage:1.0
docker push repo.example.com/myimage:1.0
```

Each layer blob and the manifest are verified by SHA-256 digest on upload; a
mismatch is rejected. Pushed images appear as `push` activity on the
**Activity** page.

## Revert

Remove stored credentials for the host:

```bash
docker logout repo.example.com
```

To remove a pushed tag or manifest, delete it with a token that has the
`yank:oci` capability (for example via `skopeo delete`, or the management UI).
Blob deletion over the `/v2/` API is not supported — unreferenced blobs are
reclaimed by garbage collection.
