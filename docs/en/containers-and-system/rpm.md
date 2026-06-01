# RPM (dnf / yum) — Beta

> **Beta.** Repository serving and upload work, but behaviour and configuration
> may change.

Install RPM packages through your Dependably organization. Dependably serves a
standard `dnf` / `yum` repository, caching packages on first fetch and
verifying them before storage.

You will need your **base URL**, **org slug**, and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com` and the org `default`; substitute your own.

Your repository base URL is:

```
https://repo.example.com/o/default/rpm/
```

---

## Configure the repository

RPM configuration is machine-level by design — `dnf` repositories live in
`/etc/yum.repos.d/` and apply to the whole system. Create
`/etc/yum.repos.d/dependably.repo`:

```ini
[dependably]
name=Dependably
baseurl=https://user:<your token>@repo.example.com/o/default/rpm/
enabled=1
gpgcheck=1
gpgkey=https://repo.example.com/o/default/rpm/repodata/RPM-GPG-KEY
```

`dnf` authenticates with **HTTP Basic**: the username `user` and your token are
embedded in `baseurl`. Because this file holds the literal token, keep its
permissions tight:

```bash
sudo chmod 600 /etc/yum.repos.d/dependably.repo
```

> **Plain HTTP:** if your instance is served over `http://`, add `sslverify=0`
> to the `[dependably]` block. Prefer HTTPS where you can.

> **GPG signing:** `gpgkey` points at the upstream signing key Dependably
> serves. If your repository is unsigned, set `gpgcheck=0` and omit the
> `gpgkey` line.

---

## Verify

```bash
sudo dnf clean all
sudo dnf repolist                 # "dependably" should be listed
sudo dnf --disablerepo='*' --enablerepo='dependably' install <package>
```

The first install of each package records a `first_fetch` entry on the
**Activity** page in the web UI.

---

## Publishing

Upload an `.rpm` to your org with an HTTP PUT (HTTP Basic auth, username
`user`):

```bash
curl --user user:<your token> \
  --upload-file mypackage-1.0.0-1.x86_64.rpm \
  https://repo.example.com/o/default/rpm/upload
```

Uploading requires a token with publish permission. (On an instance running in
upstream-proxy mode, uploads are refused so they cannot shadow upstream
packages.)

---

## Revert

```bash
sudo rm /etc/yum.repos.d/dependably.repo
sudo dnf clean all
```
