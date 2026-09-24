---
description: "Configure dnf and yum to install RPM packages from a Dependably repository that caches upstream packages and serves your own uploads."
order: 2
---

# RPM (dnf/yum)

Dependably serves a standard `dnf`/`yum` repository: it caches upstream packages
on first fetch, checks each one against the SHA-256 checksum in the upstream
repository metadata before storing it, and can host your own `.rpm` builds.

Create a token in the web UI (see [Getting started](../getting-started.md))
and use it where the examples below show `<your token>`. Your repository base
URL is:

```
https://repo.example.com/rpm/
```

## Configure

`dnf`/`yum` reads its repositories from `.repo` files in `/etc/yum.repos.d/`.
Create `/etc/yum.repos.d/dependably.repo`:

```ini
[dependably]
name=dependably
baseurl=https://repo.example.com/rpm/
enabled=1
gpgcheck=0
username=user
password=<your token>
```

`dnf` authenticates with HTTP Basic: the token is the password and the
username can be anything (`user` is conventional), set with the `username` and
`password` keys. This is the file the web UI's **Setup** page generates, and it
ships with `gpgcheck=0`. Turn signature checking on once an admin has added an
RPM signing key under **Settings**, then **Signatures**. Because this file
holds the literal token, keep its permissions tight:

```bash
sudo chmod 600 /etc/yum.repos.d/dependably.repo
```

If an admin has turned on **Anonymous pull** in **Settings**, you can drop the
`username` and `password` lines and read without a token.

## Verify

```bash
sudo dnf clean all
sudo dnf makecache
sudo dnf repolist                 # "dependably" should be listed
sudo dnf --disablerepo='*' --enablerepo='dependably' install <package>
```

Each package download is recorded as a **Download** event on the **Activity**
tab of the [Audit](../web-ui/audit.md) page, which admins, owners, and auditors
can open.

## Publishing

Upload an `.rpm` with an HTTP PUT (HTTP Basic; the token is the password):

```bash
curl --user user:<your token> \
  --upload-file mypackage-1.0.0-1.x86_64.rpm \
  https://repo.example.com/rpm/upload
```

Uploading requires a token with a push scope (**push only** or
**push & pull**). Only admins and owners hold the publish permission, so the
token must be theirs or a service token; see
[Access tokens](../web-ui/tokens.md). A single upload is capped at 500 MiB,
or lower if an admin has set an upload limit under **Settings**, then
**Storage**.

If your organization has an RPM upstream configured, uploads are refused with
`409 Conflict` while **Hosted publishing** is set to passthrough. An admin can
switch it to **Merged (allow hosted publish)** under **Settings**, then
**Proxy**, so the repository serves your packages alongside upstream ones.

## Revert

```bash
sudo rm /etc/yum.repos.d/dependably.repo
sudo dnf clean all
```
