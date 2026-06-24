# PyPI (pip, uv)

Point your Python tooling at Dependably. This guide covers both **pip** and
**uv**.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use `https://default.repo.example.com/simple/`
instead — the path is always just `/simple/`.

Python tools authenticate with **HTTP Basic**: the token goes in the password
field and the username is ignored, so any username works (the examples use
`user`). Your package index URL is:

```
https://repo.example.com/simple/
```

## Configure

### Per-project

For pip, create `pip.conf` next to your `pyproject.toml` or `requirements.txt`:

```ini
[global]
index-url = https://user:${DEPENDABLY_TOKEN}@repo.example.com/simple/
# Uncomment if your instance is served over plain HTTP:
# trusted-host = repo.example.com
```

Run pip pointed at that file so it does not pick up your global config:

```bash
export DEPENDABLY_TOKEN=<your token>
PIP_CONFIG_FILE=./pip.conf pip install requests
```

For uv, add the index to `pyproject.toml` and supply credentials from the
environment (uv reads them per index name):

```toml
[[tool.uv.index]]
name = "dependably"
url = "https://repo.example.com/simple/"
default = true
```

```bash
export UV_INDEX_DEPENDABLY_USERNAME=user
export UV_INDEX_DEPENDABLY_PASSWORD=<your token>
```

The `pip.conf` above is safe to commit only because it references
`${DEPENDABLY_TOKEN}` rather than the literal value. If your tooling writes
credentials to a local file (`.pypirc`, `.env`), add it to `.gitignore`.

### Global (per-machine)

Make Dependably the default index for every Python tool on your machine. Choose
the pip config path for your OS:

- **Linux / macOS:** `~/.config/pip/pip.conf`
- **Windows:** `%APPDATA%\pip\pip.ini`

```ini
[global]
index-url = https://user:<your token>@repo.example.com/simple/
# Uncomment if your instance is served over plain HTTP:
# trusted-host = repo.example.com
```

This file is not in source control, so the literal token goes here directly.
Keep its permissions tight:

```bash
chmod 600 ~/.config/pip/pip.conf
```

uv keeps its own config independent of pip. For a global default, set the
`UV_INDEX_DEPENDABLY_*` variables in your shell profile (`~/.bashrc`,
`~/.zshrc`).

> **Plain HTTP:** add `trusted-host` (pip, shown above) or pass
> `--allow-insecure-host repo.example.com` (uv). TLS-strict is the default;
> override it deliberately.

## Verify

```bash
pip config list           # should show your Dependably index-url
pip install requests      # or: uv add requests
```

The first install records an entry on the **Activity** page in the web UI.

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

Or remove the config file.
