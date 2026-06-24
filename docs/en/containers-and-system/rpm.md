# RPM (dnf/yum) — Beta

> **Beta.** Repository serving, proxying, and upload work, but behaviour and
> configuration may still change.

Dependably serves a standard `dnf`/`yum` repository: it caches upstream packages
on first fetch, verifies them before storage, and can host your own `.rpm`
builds.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use `https://default.repo.example.com/rpm/`
instead — the path is always just `/rpm/`.

Your repository base URL is:

```
https://repo.example.com/rpm/
```

## Configure

RPM configuration is machine-level by design — `dnf` repositories live in
`/etc/yum.repos.d/` and apply to the whole system. Create
`/etc/yum.repos.d/dependably.repo`:

```ini
[dependably]
name=Dependably
baseurl=https://user:<your token>@repo.example.com/rpm/
enabled=1
gpgcheck=1
gpgkey=https://repo.example.com/rpm/repodata/RPM-GPG-KEY
sslverify=1
```

`dnf` authenticates with **HTTP Basic**. The token is the password; the username
can be anything (`user` is conventional), so the credentials are embedded in
`baseurl` as `user:<your token>@`. Because this file holds the literal token,
keep its permissions tight:

```bash
sudo chmod 600 /etc/yum.repos.d/dependably.repo
```

If your org allows anonymous pulls, you can drop the `user:<your token>@`
credentials from `baseurl` and read without a token.

> **GPG signing:** `gpgkey` serves the upstream signing key Dependably proxies.
> A **local-only** registry (no upstream configured) has no upstream key to
> serve — set `gpgcheck=0`, omit the `gpgkey` line, or point `gpgkey` at your
> own key.

> **Plain HTTP:** if your instance is served over `http://`, set `sslverify=0`
> in the `[dependably]` block. Prefer HTTPS where you can.

## Verify

```bash
sudo dnf clean all
sudo dnf makecache
sudo dnf repolist                 # "dependably" should be listed
sudo dnf --disablerepo='*' --enablerepo='dependably' install <package>
```

The first install of each proxied package is recorded on the **Activity** page
in the web UI.

## Publishing

Whether you can upload `.rpm` files depends on the instance's upstream mode:

- **Merged mode** (`Rpm:UpstreamMode=merged`), or **no upstream configured** —
  hosted publishing is allowed. Locally published packages are served alongside
  (and shadow) any upstream packages.
- **Passthrough mode** (`Rpm:UpstreamMode=passthrough`, the default) **with an
  upstream registry configured for your org** — uploads are refused with **409
  Conflict**, because a locally published package would silently shadow upstream
  content and break dependency resolution for `dnf` clients.

Upload an `.rpm` with an HTTP PUT (HTTP Basic; the token is the password):

```bash
curl --user user:<your token> \
  --upload-file mypackage-1.0.0-1.x86_64.rpm \
  https://repo.example.com/rpm/upload
```

Uploading requires a token with the `publish:rpm` capability. To enable hosted
publishing on a passthrough instance, an operator must switch `Rpm:UpstreamMode`
to `merged` or remove your org's RPM upstream — see
[Upstreams](../admin/upstreams.md).

## Revert

```bash
sudo rm /etc/yum.repos.d/dependably.repo
sudo dnf clean all
```
