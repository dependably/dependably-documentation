---
description: "Connect Claude Desktop, Claude Code, Cursor, VS Code and other MCP clients to your Dependably registry with the read-only dependably-mcp server."
order: 3
---

# MCP server

`dependably-mcp` lets an AI assistant answer questions about your registry:
which packages carry a critical advisory, what version fixes it, whether a
package you are about to add clears the licence policy, and what command
installs it through Dependably. It speaks the
[Model Context Protocol](https://modelcontextprotocol.io/), so it works with
Claude Desktop, Claude Code, Cursor, Windsurf, VS Code, Zed, Codex CLI, Gemini
CLI, and anything else that runs a stdio MCP server.

Every tool is read-only. Nothing the assistant can call changes or deletes
anything in the registry, reads a file on your machine, or runs a command. The
server talks only to the instance you configure, over the token you give it,
and sends nothing anywhere else.

## Prerequisites

You need Node 22 or later on the machine that runs the assistant, unless you
use the Claude Desktop extension bundle, which runs on the Node that Claude
Desktop ships. You also need your base URL, for example
`https://repo.example.com` (see [Getting started](../../getting-started.md#base-url)),
and a personal access token with the pull only scope, created on the
[Tokens](../../web-ui/tokens.md) page. Pull only is the scope any member can
create for themselves, and it is the only scope this server needs.

## Install

Pick your client. Each one needs the same two values, the base URL and the
token, passed as the environment variables described under
[Configure](#configure). Keep the token out of files you commit; use your client's secret
prompt or credential store where it offers one.

### Claude Desktop

Install the extension bundle rather than editing JSON. Download
`dependably-<version>.mcpb` from the
[dependably-mcp releases](https://github.com/dependably/dependably-mcp/releases)
and check it against the `.sha256` file beside it. Then double-click the
bundle, or drag it onto the Extensions pane in Settings.

The install dialog asks for your Dependably URL and your token, and stores the
token in your operating system's keychain. Two optional fields cover the
request timeout and a private certificate authority bundle.

### Claude Code

```bash
claude mcp add dependably \
  --env DEPENDABLY_BASE_URL=https://repo.example.com \
  --env DEPENDABLY_TOKEN=<token> \
  -- npx -y dependably-mcp
```

`npx` fetches the package from npm on first use. To install it once instead,
run `npm install -g dependably-mcp` and use `dependably-mcp` in place of
`npx -y dependably-mcp` in every example below.

To edit the file directly instead, add the same entry to `~/.claude.json`, or
to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "dependably": {
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "<token>"
      }
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` for every project, or your project's
`.cursor/mcp.json` for one project:

```json
{
  "mcpServers": {
    "dependably": {
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "<token>"
      }
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "dependably": {
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "<token>"
      }
    }
  }
}
```

### VS Code

Edit your project's `.vscode/mcp.json`. The `inputs` entry makes VS Code
prompt for the token and keep it in its own secret storage, so the token is
never written into the file:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "dependably-token",
      "description": "Dependably personal access token",
      "password": true
    }
  ],
  "servers": {
    "dependably": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "${input:dependably-token}"
      }
    }
  }
}
```

### Zed

Open the settings file (the `zed: open settings file` command) and add:

```json
{
  "context_servers": {
    "dependably": {
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "<token>"
      }
    }
  }
}
```

### Codex CLI

Edit `~/.codex/config.toml`:

```toml
[mcp_servers.dependably]
command = "npx"
args = ["-y", "dependably-mcp"]

[mcp_servers.dependably.env]
DEPENDABLY_BASE_URL = "https://repo.example.com"
DEPENDABLY_TOKEN = "<token>"
```

### Gemini CLI

Edit `~/.gemini/settings.json`, or your project's `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "dependably": {
      "command": "npx",
      "args": ["-y", "dependably-mcp"],
      "env": {
        "DEPENDABLY_BASE_URL": "https://repo.example.com",
        "DEPENDABLY_TOKEN": "<token>"
      }
    }
  }
}
```

## Configure

The server reads its whole configuration from the environment your client
gives it. The Claude Desktop dialog fills these in for you.

| Variable | Required | Default | Purpose |
| -------- | -------- | ------- | ------- |
| `DEPENDABLY_BASE_URL` | yes | | Base URL of your instance. On a multi-tenant host, use your organization's address; tenancy comes from the host name, so no organization slug is needed. |
| `DEPENDABLY_TOKEN` | yes | | Your personal access token, sent as a bearer token. |
| `DEPENDABLY_TIMEOUT_MS` | no | `30000` | Per-request timeout, as a whole number of milliseconds from 1 to 2147483647. |
| `NODE_EXTRA_CA_CERTS` | only behind a private CA | unset | Path to a PEM file holding the certificate chain of the private or self-signed certificate authority your instance uses. |

An instance on your own network works two ways. Plain `http://` is accepted,
so a LAN instance needs no certificate. For HTTPS behind an internal
certificate authority, point `NODE_EXTRA_CA_CERTS` at the PEM bundle and Node
trusts it for this process alone. There is no switch to turn certificate
verification off, because this server carries a token that can read your whole
registry. A TLS failure names the host it could not verify and both options.

## Verify

Restart your client, then ask it to run these three tools in order. Each one
proves something the previous one did not.

1. `readiness_check` needs no token. It answers once the URL is right and the
   instance is reachable, with `status` of `ready` or `degraded` and one
   entry per subsystem.
2. `list_packages` is the first call that uses your token. A result confirms
   the token is valid and its scope covers the registry.
3. `get_license_policy` confirms the same token reaches organization policy
   as well as inventory.

Then ask a real question, such as *which of our packages have critical
vulnerabilities?* The assistant answers it with `list_vulnerabilities`.

If a call fails, the error names the cause: the URL it tried and the
connection error, a 401 for a token the instance rejects, a 403 naming the
capability the token lacks, or a 429 with the number of seconds to wait.

## Tools

Fourteen tools. Every one is read-only and works on a pull only token; the
three marked *no token* answer without one.

| Tool | What it does |
| ---- | ------------ |
| `list_packages` | Paginated inventory, with ecosystem and name filters. Pages are at most 200 items. |
| `get_package` | One package: its versions, the SPDX licence of each, and links to affecting advisories. |
| `search_packages` | Quick search across the registry by name. Queries shorter than two characters return nothing. |
| `lookup_package` | Pre-adoption check of a package that need not be in the registry: upstream metadata, OSV advisories, and the policy verdict. Ingests nothing. |
| `get_license_policy` | The enforcement mode (`off`, `warn` or `block`) plus the SPDX allowlist and blocklist. |
| `list_vulnerabilities` | The organization-wide report: every package affected by a known advisory, paginated. |
| `get_vulnerability` | Full detail for one advisory by OSV id, including remediation guidance. |
| `check_dependencies` | Scopes the report to one project's dependency list and names the version to bump each package to. Reports `clean: true` only when nothing matched and the scan was complete. |
| `get_remediation` | The fixed version for up to 200 advisories at once, chosen for the release line you have installed, without the advisory prose. |
| `list_remediation_skills` | The index of curated how-to-fix guides, one per vulnerability class. *No token.* |
| `get_remediation_skill` | The full guide for up to five skills per call, as Markdown. *No token.* |
| `readiness_check` | Readiness with per-subsystem detail. *No token.* |
| `get_install_command` | The shell command that installs a package through your instance, returned as text for you to run. |
| `get_publish_command` | The shell command that publishes an artefact through your instance, returned as text with a `<token>` placeholder. Fill it with a token that has a push scope, which needs the Admin or Owner role; the pull only token the server runs on cannot publish. |

The read tools cover every ecosystem the registry serves: npm, PyPI, NuGet,
Maven, RPM, OCI, Go, Cargo, Alpine (apk), Terraform and Hex. The two command
tools cover npm, PyPI, NuGet, Maven, RPM, OCI, Go and Cargo, the ecosystems
they know how to write a command for. Go modules are published by tagging a
release in source, so `get_publish_command` returns that guidance for Go
rather than a command.

Advisory text, upstream package metadata and remediation guides come from
public vulnerability databases, from the package's own publisher, and from
whoever operates your instance. The server passes them through as data for
the assistant to report, and says so in each tool's description.

## Example prompts

- *Which of our npm packages have a critical CVE right now, and what version
  fixes the worst one?*
- *Can we use lodash 4.17.21? Don't add it, just tell me if it clears our
  licence policy.*
- *Here's our package-lock.json. What in here has a known vulnerability, and
  what do I bump it to?*
- *What's the pip install command for requests through our registry?*
- *Is the registry up? If something is degraded, which part?*

## Revert

Remove the `dependably` entry from your client's configuration, or remove the
extension from the Extensions pane in Claude Desktop, then restart the client.
Revoke the token on the [Tokens](../../web-ui/tokens.md) page if nothing else
uses it.
