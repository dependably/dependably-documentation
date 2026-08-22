# Integrations

Connect Dependably to the tools you already run alongside it. Dependably exposes
operational data in standard formats, so your existing monitoring and dashboard
stack can watch the registry the same way it watches everything else.

## Pages

| Page | Covers |
| ---- | ------ |
| [Grafana dashboard](grafana/index.md) | A ready-made Grafana dashboard for a single Dependably instance, plus how to expose metrics to Prometheus |
| [Log output](logging.md) | The structured-log formats Dependably writes to stdout, and how to ship them to CloudWatch or an OTLP collector |

Dependably publishes metrics in Prometheus exposition format at `/metrics`. Any
Prometheus-compatible scraper can read them, and any Grafana instance with a
Prometheus data source can chart them — see the [Grafana dashboard](grafana/index.md)
guide to get started.
