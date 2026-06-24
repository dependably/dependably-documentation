# Administration

This section is for the people who **run** Dependably, not the developers who
pull and publish packages.

Setup is deliberately light: deploy the instance and set its base URL (see
[Configuration](configuration.md)), then manage everything from the web UI or
API — access, tokens, settings, authentication, and upstreams. No server access
or config files are needed for day-to-day administration.

## Pages

| Page | Covers |
| ---- | ------ |
| [Configuration](configuration.md) | Deploy the instance and set its base URL |
| [Access control (RBAC)](rbac.md) | Roles, capabilities, how permissions are enforced and narrowed |
| [Users & tokens](users-and-tokens.md) | Members, invitations, personal vs service tokens, account actions |
| [Settings](settings.md) | Org settings, retention, proxy & supply-chain security gates |
| [Authentication](authentication.md) | Forms login, MFA, SAML 2.0 single sign-on, role mapping |
| [Upstreams](upstreams.md) | Upstream registries Dependably proxies, and OCI routing |

Day-to-day review happens in the web console: work the
[Quarantine](../web-ui/quarantine.md) queue and read the
[Audit log](../web-ui/audit.md). See [The web UI](../web-ui/index.md) for the
full console tour.
