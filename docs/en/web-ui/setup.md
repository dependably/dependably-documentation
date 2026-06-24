# Setup snippets

The **Setup** page gives you a ready-made configuration snippet for each
ecosystem, already filled in with your instance's host. Find your tool, select
**Copy**, and paste it into the right file — no hand-editing of URLs.

You will still need a [token](tokens.md) to drop into the snippet where it says
`<token>`.

## What each snippet sets up

The examples below use `repo.example.com`; the page shows your real host.

| Tool | File the snippet goes in | Registry URL it points at |
| ---- | ------------------------ | ------------------------- |
| **PyPI** | `pip.conf` / `pyproject.toml`, plus `~/.netrc` for auth | `https://repo.example.com/simple/` |
| **npm** | `.npmrc` | `https://repo.example.com/npm/` |
| **NuGet** | `nuget.config` | `https://repo.example.com/nuget/v3/index.json` |
| **Maven** | `~/.m2/settings.xml` (+ `pom.xml` for publishing) | `https://repo.example.com/maven/` |
| **RPM** | `/etc/yum.repos.d/dependably.repo` | `https://repo.example.com/rpm/` |
| **Docker** | `docker login` | `repo.example.com/<image>:<tag>` |
| **Go** | `GOPROXY` environment variable (+ `~/.netrc`) | `https://repo.example.com/go` |
| **Cargo** | `~/.cargo/config.toml` | `sparse+https://repo.example.com/cargo/` |

A few snippets carry a note worth reading before you paste:

- **PyPI** and **Go** authenticate through `~/.netrc`. The username is ignored —
  the token is the password.
- **NuGet** publishing uses an API key (`--api-key <token>`), not the consume
  credentials.
- **RPM** publishing is an upload: `curl -u <user>:<token> --upload-file pkg.rpm
  https://repo.example.com/rpm/upload`.

## Go deeper

These snippets are the fast path. Each tool has a full guide covering verify,
publishing, and revert steps:

[npm](../package-managers/npm.md) ·
[PyPI](../package-managers/pypi.md) ·
[NuGet](../package-managers/nuget.md) ·
[Maven](../package-managers/maven.md) ·
[Cargo](../package-managers/cargo.md) ·
[Go](../package-managers/go.md) ·
[Docker](../containers-and-system/docker.md) ·
[RPM](../containers-and-system/rpm.md)

The page also links to **More setup options** — project-level and global recipes
for npm, PyPI, and NuGet.
