---
description: "Connect Dependably to the monitoring, logging, SIEM and AI tools you already run, using standard formats such as Prometheus metrics and ECS logs."
order: 5
---

# Integrations

Connect Dependably to the tools you already run alongside it. Dependably exposes
operational and security data in standard formats, so your existing monitoring,
logging and SIEM stack can watch the registry the same way it watches everything
else.

## Pages

| Page | Covers |
| ---- | ------ |
| [Grafana dashboard](grafana/index.md) | A ready-made Grafana dashboard for a single Dependably instance, plus how to expose metrics to Prometheus |
| [Log output](logging.md) | The structured-log formats Dependably writes to stdout, and how to ship them to CloudWatch or an OTLP collector |
| [MCP server](mcp/index.md) | The read-only `dependably-mcp` server for Claude Desktop, Claude Code, Cursor, VS Code and other MCP clients, and what each of its tools answers |
| [SIEM and SOC integration](siem/index.md) | What security telemetry Dependably emits, which transport carries which events, and how to build a collector that does not silently lose data |

Dependably publishes metrics in Prometheus exposition format at `/metrics`. Any
Prometheus-compatible scraper can read them, and any Grafana instance with a
Prometheus data source can chart them. See the [Grafana dashboard](grafana/index.md)
guide to get started.
