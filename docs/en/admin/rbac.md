# Access control (RBAC)

Dependably's permission model is built from two pre-defined sets — there is
nothing to design or maintain yourself:

- **Roles.** Every member of an organization has exactly one of four roles,
  which determines everything they may do.
- **Token scopes.** Every access token carries one of six pre-defined scopes,
  and a token never grants more than the role of the person who created it —
  see [Users & tokens](users-and-tokens.md) for the scopes and how to create
  tokens.

## Roles

| Role | What it allows |
| ---- | -------------- |
| **Member** | Read-only consumer: browse, search, install, and download packages; manage their own access tokens. |
| **Admin** | Day-to-day administrator: everything a Member can, plus publish, import, and yank packages in every ecosystem, manage package claims, manage members and invitations, change organization settings, and read the audit log. |
| **Owner** | Everything an Admin can, plus managing Owners: promoting someone to Owner, or changing an existing Owner's role, is reserved to Owners. An organization always keeps at least one Owner. |
| **Auditor** | Compliance role: read the audit log and manage their own access tokens — nothing else, including no package access. The web console's Audit page is open to Admins and Owners only; an Auditor reads the log through a token with the **audit** scope. |

Assign and change roles on the **Users** page — see
[Users & tokens](users-and-tokens.md). With SAML single sign-on, roles can
also be mapped automatically from your identity provider — see
[Authentication](authentication.md).

## How it is enforced

Every action checks the caller's permissions on the server:

- Signed in to the web UI, you act with your **role**.
- Authenticating with a token (from a package manager or CI), you act with the
  token's **scope** — which is at most what its creator's role allowed at
  creation time.

The same rules apply to everyone and every token; there are no per-user
exceptions to configure.
