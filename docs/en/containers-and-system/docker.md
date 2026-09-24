---
description: "Configure docker and podman to pull and push OCI container images through Dependably's registry, which implements the OCI Distribution Spec."
order: 1
---

# Docker / OCI images

Dependably implements the OCI Distribution Spec (`/v2/`), so `docker` (and
`podman`) work against it unchanged for pulling and pushing images.

You will need your instance **host** and a **token**. Create a token in the web
UI (see [Getting started](../getting-started.md)). The Docker protocol owns the
URL: every client talks to `/v2/` at the registry root, so image references are
`<host>/<image>:<tag>`:

```text
repo.example.com/myimage:tag
```

The examples below use `repo.example.com`; substitute your own host.

## Configure

Log in once to the registry host. Docker keeps the credentials in its own
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

If your instance is served over plain HTTP, Docker also needs the host listed
under `insecure-registries` in its daemon configuration before it will log in or
pull.

## Verify

Pull a small image through Dependably by prefixing it with your host:

```bash
docker pull repo.example.com/library/hello-world:latest
docker run --rm repo.example.com/library/hello-world:latest
```

The first pull of an image is fetched from upstream, checked against its
digest, and cached; later pulls of the same digest are served locally. Each pull
is recorded as a **Download** event on the **Activity** tab of the
[Audit](../web-ui/audit.md) page, which admins, owners, and auditors can open.

New organizations are seeded with upstream registries for Microsoft Container
Registry (`mcr.microsoft.com`, for `dotnet/` and `playwright` images) and Docker
Hub (everything else), so pulls of public images work without further setup.
See [Upstreams](../admin/upstreams.md) to add or change them.

## Publishing

Pushing requires a token with a push scope (**push only** or **push & pull**).
Only admins and owners hold the publish permission, so the token must be
theirs or a service token; see [Access tokens](../web-ui/tokens.md) and
[Access control](../admin/rbac.md). Tag your image with the registry host and
repository, then push:

```bash
docker tag myimage:1.0 repo.example.com/myimage:1.0
docker push repo.example.com/myimage:1.0
```

Each layer blob and the manifest are checked against their SHA-256 digest on
upload, and a mismatch is rejected. Pushed images are recorded as **Push**
events on the same **Activity** tab.

## Revert

Remove stored credentials for the host:

```bash
docker logout repo.example.com
```

Removing a pushed image is an admin or owner action in the web UI: open the
image's version list, open the version's **Actions** menu, and select
**Delete**. Deleting through the registry API (for example `skopeo delete`)
needs a token with the `yank:oci` capability, which none of the token scopes
offered in the web UI include. Deleting a single blob over `/v2/` is not
supported; layers that no image references any more are reclaimed
automatically.
