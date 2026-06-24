# Access control (RBAC)

Dependably's permission model has three layers:

- **Capabilities** are the atoms — fine-grained `<domain>:<action>` permission
  strings such as `publish:npm` or `read:audit`. They are the single source of
  truth for every permission check.
- **Roles** are fixed bundles of capabilities. Four roles are *per-organization*
  (`member`, `admin`, `owner`, `auditor`); every user belongs to exactly one
  organization, so these apply within it only. One role, `system_admin`, is
  *platform-level* — the operator role used on multi-tenant deployments.
- **Tokens can be narrowed.** An API token carries an explicit subset of the
  capabilities held by the user who created it, validated at creation so a token
  can never exceed the role that minted it.

## Roles

| Role | Scope | Purpose |
| ---- | ----- | ------- |
| `member` | Organization | Read-only consumer: read package metadata, artifacts, packages, and claims; manage their own tokens. |
| `admin` | Organization | Day-to-day administrator: publish / import / yank across all ecosystems, manage claims, configure the organization, read tenant config and the audit log. |
| `owner` | Organization | Everything an admin can do **plus** `tenant:admin` — the one capability reserved to the owner (managing other owners). |
| `auditor` | Organization | Compliance role: read the audit log and manage their own tokens — nothing else (no package reads). |
| `system_admin` | Platform | Operator role. Reads platform-wide and runs the system control plane; to write an organization's data it temporarily assumes a tenant role through an audited flow. |

## Role → capabilities

**`member`**
: `read:metadata`, `read:artifact`, `read:packages`, `read:claims`,
  `tokens:manage_own`

**`admin`**
: everything `member` has, plus `publish:*`, `import:*`, `yank:*`,
  `claim:manage`, `read:tenant`, `read:audit`, `tenant:configure`

**`owner`**
: everything `admin` has, plus `tenant:admin`

**`auditor`**
: `read:audit`, `tokens:manage_own`

**`system_admin`**
: `platform:*`, plus the read capabilities (`read:metadata`, `read:artifact`,
  `read:packages`, `read:claims`, `read:audit`, `read:tenant`) and
  `tokens:manage_own`

## Capability reference

| Capability | Grants |
| ---------- | ------ |
| `read:metadata` | Read package metadata |
| `read:artifact` | Read / download artifacts (also covers OCI pull for non-OCI ecosystems) |
| `read:packages` | Read the package list |
| `read:claims` | Read claims |
| `read:audit` | Read the audit log |
| `read:tenant` | Read organization configuration |
| `publish:<eco>` | Publish to that ecosystem (`npm`, `pypi`, `nuget`, `maven`, `rpm`, `oci`, `cargo`) |
| `publish:*` | Publish to any ecosystem |
| `import:<eco>` | Import / proxy from that ecosystem (`npm`, `pypi`, `nuget`, `maven`, `rpm`, `oci`) |
| `import:*` | Import from any ecosystem |
| `pull:oci` | Pull OCI images via the proxy path |
| `yank:<eco>` | Yank (unpublish) in that ecosystem (`npm`, `pypi`, `nuget`, `maven`, `rpm`, `oci`, `cargo`) |
| `yank:*` | Yank in any ecosystem |
| `claim:manage` | Manage package / namespace claims |
| `tenant:configure` | Change organization configuration, manage users and tokens |
| `tenant:admin` | Owner-only administration — the capability that distinguishes owner from admin |
| `tokens:manage_own` | Create and manage one's own API tokens |
| `platform:*` | Operator override (`system_admin` only; cannot be requested on a token) |

A **family wildcard** satisfies its leaves: a token granted `publish:*` may
publish to npm. The `<eco>` placeholders above are the exact ecosystems
implemented — there is, for example, no `import:cargo`.

## How it is enforced

Each protected action requires a named capability. The check grants when the
caller's **effective** capabilities satisfy the requested one (with wildcard
matching). Effective capabilities come from the token's explicit capability list
when the token was narrowed, otherwise from the user's role.

## Narrowing a token

When a user mints an API token they pass a capability list. It must be
non-empty, drawn only from the requestable vocabulary (which excludes
`platform:*` and the global `*`), free of duplicates, and a subset of the
creator's own capabilities. A request for more than the creator holds is
rejected with "Requested capabilities exceed your role." See
[Users & tokens](users-and-tokens.md) for how to create them.
