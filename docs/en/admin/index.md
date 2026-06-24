# Administration

This section is for the people who **run** Dependably, not the developers who
pull and publish packages. It has two audiences:

- **Operators** deploy and run the instance: deployment mode, storage, high
  availability, upstreams, garbage collection. This is configured through
  environment variables and, on multi-tenant deployments, a system control
  plane. Start with [Configuration](configuration.md).
- **Organization owners and admins** manage what happens inside a single
  organization: who has access, how tokens are scoped, retention, and the
  supply-chain gates applied to proxied packages. This is configured in the web
  UI (or the API) and needs no server access.

## Pages

| Page | Audience | Covers |
| ---- | -------- | ------ |
| [Configuration](configuration.md) | Operator | Deployment modes, storage, HA, quotas, GC, env-var reference, tenant lifecycle |
| [Access control (RBAC)](rbac.md) | Owner / admin | Roles, capabilities, how permissions are enforced and narrowed |
| [Users & tokens](users-and-tokens.md) | Owner / admin | Members, invitations, personal vs service tokens, account actions |
| [Settings](settings.md) | Owner / admin | Org settings, retention, proxy & supply-chain security gates |
| [Authentication](authentication.md) | Owner / admin | Forms login, MFA, SAML 2.0 single sign-on, role mapping |
| [Upstreams & signatures](upstreams.md) | Operator + admin | Upstream registries, OCI routing, signature/provenance verification |

## How configuration is split

Two layers compose:

- **Instance level** — set by the operator through environment variables (and a
  layered `appsettings.json`). Examples: deployment mode, storage backend,
  instance-wide upload limits, MFA enforcement, signature trust anchors.
- **Organization level** — set by an owner or admin through the web UI / API.
  Examples: anonymous pull, retention, the supply-chain gates.

Where both exist (air-gap, MFA), the **stricter** signal wins: if the operator
enforces it instance-wide, the organization cannot turn it off.
