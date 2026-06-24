# RPM (dnf/yum) — Beta

> **Beta.** Repository serving, proxying, and upload work, but behaviour and
> configuration may still change.

Dependably serves a standard `dnf`/`yum` repository: it caches upstream packages
on first fetch, verifies them before storage, and can host your own `.rpm`
builds.

Create a token in the web UI — see [Getting started](../getting-started.md) —
and use it where the examples below show `<your token>`. Your repository base
URL is:

```
https://repo.example.com/rpm/
```

## Configure

`dnf`/`yum` reads its repositories from `.repo` files in `/etc/yum.repos.d/` —
that is the OS's own mechanism, and there's no CLI or in-app alternative. Create
`/etc/yum.repos.d/dependably.repo`:

```ini
[dependably]
name=dependably
baseurl=https://repo.example.com/rpm/
enabled=1
gpgcheck=0
username=user
password=<your token>
```

`dnf` authenticates with **HTTP Basic**: the token is the password and the
username can be anything (`user` is conventional), set with the `username` and
`password` keys. `gpgcheck=0` is the default — turn it on once you have package
signing wired up. Because this file holds the literal token, keep its
permissions tight:

```bash
sudo chmod 600 /etc/yum.repos.d/dependably.repo
```

If your instance allows anonymous pulls, you can drop the `username` and
`password` lines and read without a token.

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

Upload an `.rpm` with an HTTP PUT (HTTP Basic; the token is the password):

```bash
curl --user user:<your token> \
  --upload-file mypackage-1.0.0-1.x86_64.rpm \
  https://repo.example.com/rpm/upload
```

Uploading requires a token with the `publish:rpm` capability.

## Revert

```bash
sudo rm /etc/yum.repos.d/dependably.repo
sudo dnf clean all
```
