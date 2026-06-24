# PyPI (pip, uv)

Point your Python tooling at Dependably to install private packages, proxy
public ones, and publish your own. This guide covers both **pip** and **uv**.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Python tools authenticate with **HTTP Basic**: the token
goes in the password field and the username is ignored, so any username works
(the examples use `user`). Your package index URL is:

```
https://repo.example.com/simple/
```

## Configure

Use pip's own command — it writes the index URL into pip's config for you, so
there are no files to edit by hand:

```bash
pip config set --user global.index-url https://user:<your token>@repo.example.com/simple/
```

For **uv**, point it at the same index URL. uv reads the credentials straight
from the URL:

```bash
uv add --default-index https://user:<your token>@repo.example.com/simple/ requests
```

> **Plain HTTP:** if your instance is served over `http://`, also run
> `pip config set --user global.trusted-host repo.example.com` (pip) or pass
> `--allow-insecure-host repo.example.com` (uv). Prefer HTTPS where you can.

## Verify

```bash
pip config list           # should show your Dependably index-url
pip install requests      # or: uv add requests
```

Your first install records an entry on the **Activity** page in the web UI —
check there to confirm packages are flowing through Dependably.

## Publishing

Build your distribution, then upload with twine. The upload endpoint is
`/pypi/legacy/`:

```bash
twine upload \
  --repository-url https://repo.example.com/pypi/legacy/ \
  -u user -p <your token> \
  dist/*
```

Publishing requires a token with the `publish:pypi` capability.

## Revert

```bash
pip config unset --user global.index-url
```

uv took the index per-command (`--default-index`), so there is nothing
persistent to undo unless you exported it as `UV_DEFAULT_INDEX` — in which case
unset that too.
