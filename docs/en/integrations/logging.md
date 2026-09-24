---
description: "Choose between ECS JSON and text log output, read the JSON fields and levels, and ship Dependably logs to CloudWatch or an OTLP collector."
order: 2
---

# Log output

Dependably writes structured logs to stdout. Every event is one object on one
line, ready for Elastic Stack, AWS CloudWatch Logs, Datadog, Grafana Loki, or
any other line-oriented log aggregator. Nothing needs to be enabled. The only
choice is the format.

> **There is no in-app log viewer.** Logs are write-only from the application's
> side; retrieval and search belong to whatever aggregator your deployment
> already runs. What Dependably does keep and serve in-app is the
> [Audit log](../web-ui/audit.md), which is a record of organization events, not
> of application diagnostics.

## Choose a format

Set the `LOG_FORMAT` environment variable on the container, the same way as the
settings in [Configuration](../admin/configuration.md):

| Value | Use it for |
| ----- | ---------- |
| `json` (default) | Elastic Common Schema (ECS) JSON, one object per line, for log-ingestion pipelines. |
| `text` | Human-readable console output, for interactive `docker logs` tailing. |

Text format looks like this, with exception stack traces on the lines
immediately following:

```
[2026-06-15 12:00:00.000 INF] Dependably.Infrastructure.FirstBootService: First boot detected — initializing instance.
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
| `labels` | varies | Remaining properties with string values. Sensitive values are already redacted to `[REDACTED]` before the formatter sees them. |
| `metadata` | varies | Remaining properties with non-string values, such as numbers. |

The formatter also adds standard ECS objects such as `host` and `process`.

One event, formatted here for readability and trimmed to the fields above. Real
output is a single line:

```json
{
  "@timestamp": "2026-06-15T12:00:00.000+00:00",
  "log.level": "Warning",
  "message": "Checksum mismatch fetching hex \"jason\" \"1.4.1\".",
  "ecs.version": "9.0.0",
  "log": { "logger": "Dependably.Api.HexController" },
  "labels": { "Name": "jason", "Version": "1.4.1" }
}
```

## What each level means

| Level | Used for |
| ----- | -------- |
| `Verbose` | Fine-grained diagnostics. |
| `Debug` | Operational ticks, such as a stats refresh pass skipped because another instance holds the lock. |
| `Information` | Normal operational events, such as first boot. |
| `Warning` | Recoverable anomalies: upstream timeouts, checksum mismatches. |
| `Error` | Failed requests and exceptions caught at the boundary. |
| `Fatal` | Unrecoverable startup failures. |

The minimum level is `Information`, so `Verbose` and `Debug` events are not written
unless you lower it, for example with `Serilog__MinimumLevel__Default=Debug`.
Framework logs from `Microsoft` and `System` start at `Warning`.

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
addition to stdout, which is always on. The records carry `service.name`
(`OTEL_SERVICE_NAME`, default `dependably`) and `deployment.environment`
(`DEPLOYMENT_ENVIRONMENT`, default `unknown`). Air-gapped deployments leave the
endpoint unset and consume stdout only.

Metrics have their own path: see the
[Grafana dashboard](grafana/index.md) guide.
