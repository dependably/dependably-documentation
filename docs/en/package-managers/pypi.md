# PyPI (pip, uv)

Point your Python tooling at your Dependably organization. This guide covers
raw **pip** and **uv**.

You will need your **base URL**, **org slug**, and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com` and the org `default`; substitute your own.

Python tools authenticate with **HTTP Basic**: username `user`, password your
token. Your package index URL is:

```
https://repo.example.com/o/default/simple/
```

---

## Per-project

### pip

Create `pip.conf` next to your `pyproject.toml` or `requirements.txt`:

```ini
[global]
index-url = https://user:${DEPENDABLY_TOKEN}@repo.example.com/o/default/simple/
# Uncomment if your instance is served over plain HTTP:
# trusted-host = repo.example.com
```

Run pip pointed at the local file so it does not pick up your global config:

```bash
export DEPENDABLY_TOKEN=<your token>
PIP_CONFIG_FILE=./pip.conf pip install requests
```

### uv

Add the index to `pyproject.toml`:

```toml
[[tool.uv.index]]
name = "dependably"
url = "https://repo.example.com/o/default/simple/"
default = true
```

Provide credentials via environment variables (uv reads them per index name):

```bash
export UV_INDEX_DEPENDABLY_USERNAME=user
export UV_INDEX_DEPENDABLY_PASSWORD=<your token>
```

> **Plain HTTP:** add `trusted-host` (pip, shown above) or
> `--allow-insecure-host repo.example.com` (uv). TLS-strict is the default;
> override it deliberately.

If your tooling writes credentials to a local file (`.pypirc`, `.env`), add
it to `.gitignore`. The `pip.conf` above is safe to commit only because it
references `${DEPENDABLY_TOKEN}` rather than the literal value.

---

## Global (per-machine)

Make Dependably the default index for every Python tool on your machine.

Choose the pip config path for your OS:

- **Linux / macOS:** `~/.config/pip/pip.conf` (newer pip) or `~/.pip/pip.conf`
- **Windows:** `%APPDATA%\pip\pip.ini`

```ini
[global]
index-url = https://user:<your token>@repo.example.com/o/default/simple/
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

---

## Verify

```bash
pip config list           # should show your Dependably index-url
pip install requests      # or: uv add requests
```

The first install records a `first_fetch` entry on the **Activity** page in the
web UI.

---

## Publishing

Build your distribution, then upload with twine:

```bash
twine upload \
  --repository-url https://repo.example.com/o/default/pypi/legacy/ \
  -u user -p <your token> \
  dist/*
```

---

## Revert

```bash
pip config unset --user global.index-url
```

Or remove the config file.
