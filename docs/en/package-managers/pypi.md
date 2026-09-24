---
description: "Configure pip and uv to install Python packages through a private Dependably registry, proxy PyPI, and publish your own with twine."
order: 2
---

# PyPI (pip, uv)

Point pip or uv at Dependably to install private packages, proxy public ones,
and publish your own with twine.

You will need your **base URL** and a **token**; see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Python tools authenticate with **HTTP Basic**: the token
goes in the password field and the username is ignored, so any username works
(the examples use `user`). Your package index URL is:

```
https://repo.example.com/simple/
```

## Configure

Use pip's own command. It writes the index URL into pip's config for you, so
there are no files to edit by hand:

```bash
pip config set --user global.index-url https://user:<your token>@repo.example.com/simple/
```

For uv, declare the index in your project's `pyproject.toml`. The file holds
no secret, so you can commit it:

```toml
[[tool.uv.index]]
name = "dependably"
url = "https://repo.example.com/simple/"
default = true
```

uv reads the credentials for an index named `dependably` from the environment:

```bash
export UV_INDEX_DEPENDABLY_USERNAME=user
export UV_INDEX_DEPENDABLY_PASSWORD=<your token>
```

> **Plain HTTP:** if your instance is served over `http://`, also run
> `pip config set --user global.trusted-host repo.example.com` (pip) or pass
> `--allow-insecure-host repo.example.com` (uv). Prefer HTTPS where you can.

## Verify

```bash
pip config list           # should show your Dependably index-url
pip install requests      # or: uv add requests
```

The first download of each distribution file is recorded as a
**First fetch** event on the **Activity** tab of the **Audit** page, which
admins, owners and auditors can open. See [Audit log](../web-ui/audit.md).

## Publishing

Build your distribution, then upload with twine. The upload endpoint is
`/pypi/legacy/`:

```bash
twine upload \
  --repository-url https://repo.example.com/pypi/legacy/ \
  -u user -p <your token> \
  dist/*
```

Publishing requires a token with a push scope (**push only** or
**push & pull**). See [Access tokens](../web-ui/tokens.md).

## Revert

```bash
pip config unset --user global.index-url
```

For uv, remove the `[[tool.uv.index]]` block from `pyproject.toml` and unset
`UV_INDEX_DEPENDABLY_USERNAME` and `UV_INDEX_DEPENDABLY_PASSWORD`.
