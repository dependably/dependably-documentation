---
order: 2
---

# Log output

Dependably writes structured logs to stdout. Every event is one object on one
line, ready for Elastic Stack, AWS CloudWatch Logs, Datadog, Grafana Loki, or
any other line-oriented log aggregator. Nothing needs to be enabled — the only
choice is the format.

> **There is no in-app log viewer.** Logs are write-only from the application's
> side; retrieval and search belong to whatever aggregator your deployment
> already runs. What Dependably does keep and serve in-app is the
> [Audit log](../web-ui/audit.md), which is a record of organization events, not
> of application diagnostics.

## Choose a format

Set `LOG_FORMAT` (see [Configuration](../admin/configuration.md)):

| Value | Use it for |
| ----- | ---------- |
| `json` (default) | Elastic Common Schema (ECS) JSON, one object per line — log-ingestion pipelines. |
| `text` | Human-readable console output — interactive `docker logs` tailing. |

Text format looks like this, with exception stack traces on the lines
immediately following:

```
[2026-06-15 12:00:00.000 INF] Dependably.Api.NuGetController: Package pushed: my-pkg 1.0.0
```

## The JSON fields

With `LOG_FORMAT=json`, each event conforms to the
[Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/index.html):

| Field | Always present | Description |
| ----- | -------------- | ----------- |
| `@timestamp` | yes | Event timestamp, ISO-8601 with offset. |
| `log.level` | yes | `Verbose`, `Debug`, `Information`, `Warning`, `Error`, or `Fatal`. |
| `message` | yes | The rendered message. |
| `ecs.version` | yes | ECS schema version. |
| `log.logger` | when set | Full type name of the logger. |
| `trace.id`, `span.id` | when set | Trace and span IDs from the current activity. |
| `labels` | varies | Every remaining property. Sensitive values are already redacted to `[REDACTED]` before the formatter sees them. |

One event, formatted here for readability — real output is a single line:

```json
{
  "@timestamp": "2026-06-15T12:00:00.000+00:00",
  "log.level": "Information",
  "message": "Package pushed: my-pkg 1.0.0",
  "ecs.version": "9.0.0",
  "log": { "logger": "Dependably.Api.NuGetController" },
  "labels": { "OrgId": "default", "Ecosystem": "nuget", "PackageName": "my-pkg", "Version": "1.0.0" }
}
```

## What each level means

| Level | Used for |
| ----- | -------- |
| `Verbose` | Fine-grained diagnostics. Off in production by default. |
| `Debug` | Periodic heartbeats and operational ticks — a cleanup pass starting, a stats refresh finishing. |
| `Information` | Normal operational events: pushes, proxy hits, first boot. |
| `Warning` | Recoverable anomalies: upstream timeouts, checksum mismatches, skipped schema migrations. |
| `Error` | Failed requests and exceptions caught at the boundary. |
| `Fatal` | Unrecoverable startup failures. |

## Ship them to CloudWatch

1. Run the container with the `awslogs` log driver (or Firelens/FluentBit)
   pointed at a CloudWatch log group.
2. Leave `LOG_FORMAT` at its `json` default.
3. Query the ECS fields directly in CloudWatch Logs Insights:

```
fields `@timestamp`, `log.level`, message, `log.logger`
| filter `log.level` = "Error"
| sort `@timestamp` desc
```

## Ship them over OTLP

Set `OTEL_EXPORTER_OTLP_ENDPOINT` and logs are forwarded to that collector in
addition to the always-on stdout sink — stdout never stops. Air-gapped
deployments leave the variable unset and consume stdout only.

Metrics have their own path: see the
[Grafana dashboard](grafana/index.md) guide.
