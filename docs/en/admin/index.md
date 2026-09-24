---
description: "Deploy and run a Dependably instance: set the base URL, manage users and organizations, configure policy, and keep the registry healthy."
order: 4
---

# Administration

This section is for the people who **run** Dependably, not the developers who
pull and publish packages.

Setup is deliberately light: deploy the instance and set its base URL (see
[Configuration](configuration.md)), then manage everything from the web UI or
API: access, tokens, settings, authentication, and upstreams. No server access
or config files are needed for day-to-day administration.

## Pages

| Page | Covers |
| ---- | ------ |
| [Configuration](configuration.md) | Deploy the instance, set its base URL, and the environment variable reference |
| [Access control (RBAC)](rbac.md) | Roles, token scopes, and how permissions are enforced |
| [Users & tokens](users-and-tokens.md) | Members, invitations, personal vs service tokens, account actions |
| [Settings](settings.md) | Organization settings: retention, proxy, supply-chain security gates, signatures, alerts, and webhooks |
| [Authentication](authentication.md) | Forms login, MFA, SAML 2.0 single sign-on, role mapping |
| [Upstreams](upstreams.md) | Upstream registries Dependably proxies, and OCI routing |

Day-to-day review happens in the web console: work the
[Quarantine](../web-ui/quarantine.md) queue and read the
[Audit log](../web-ui/audit.md). See [The web UI](../web-ui/index.md) for the
full console tour.

To monitor the instance from your own observability stack, expose metrics to
Prometheus and import the ready-made
[Grafana dashboard](../integrations/grafana/index.md).
