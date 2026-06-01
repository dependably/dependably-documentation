# Docker (OCI images) — Beta

> **Beta.** Docker / OCI support is functional for pulling images, but the
> protocol surface and configuration may change. Pushing your own images is not
> yet supported.

Pull container images through your Dependably organization. Dependably
implements the OCI Distribution Spec, so `docker` and `podman` work against it
unchanged.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own.

> **Pull-through only.** Dependably caches and serves images you pull from
> upstream registries. Pushing your own images to Dependably is not yet
> supported.

---

## How the image name maps to your org

Unlike npm or Maven, the Docker protocol owns the URL — every client talks to
`/v2/` at the registry root and cannot put an org slug in the path. Which org
serves a pull therefore depends on how your instance is deployed:

- **Single-org instance (most common):** the instance serves its one
  organization at the root. Prefix the image with the host:

  ```bash
  docker pull repo.example.com/library/ubuntu:22.04
  ```

- **Multi-org instance:** the org is the subdomain. Prefix the image with
  `<org>.<host>`:

  ```bash
  docker pull default.repo.example.com/library/ubuntu:22.04
  ```

If you are unsure which applies, ask your administrator. The rest of this guide
uses the single-org form.

---

## Authenticate

Log in once; Docker stores the credentials and reuses them. The username is
`user` and the password is your token:

```bash
docker login repo.example.com -u user
# paste your token when prompted for a password
```

To avoid the token appearing in your shell history, pipe it from stdin:

```bash
echo "<your token>" | docker login repo.example.com -u user --password-stdin
```

---

## Pull an image

Prefix any image with your registry host so Docker resolves it through
Dependably instead of Docker Hub:

```bash
docker pull repo.example.com/library/ubuntu:22.04
docker pull repo.example.com/library/nginx:latest
```

The first pull of each image is fetched from upstream, verified by digest, and
cached. Later pulls of the same digest are served locally.

To make Dependably the default for *unprefixed* image names (so `docker pull
ubuntu` is routed through it), an administrator configures it as a registry
mirror at the daemon level — that is a server-side setting, not something you
change per machine.

---

## Verify

```bash
docker pull repo.example.com/library/hello-world:latest
docker run --rm repo.example.com/library/hello-world:latest
```

The first pull records a `first_fetch` entry on the **Activity** page in the
web UI.

---

## Plain HTTP

If your instance is served over plain HTTP, Docker refuses it until you add the
host to the daemon's insecure-registries list. Edit
`/etc/docker/daemon.json` (Linux) or the equivalent in Docker Desktop settings:

```json
{
  "insecure-registries": ["repo.example.com"]
}
```

Restart the Docker daemon afterward. Prefer HTTPS wherever you can.

---

## Log out

```bash
docker logout repo.example.com
```
