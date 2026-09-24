---
order: 2
---

# Access control (RBAC)

Dependably's permission model is built from pre-defined roles and token scopes,
so there is nothing to design or maintain yourself. Every member of an
organization has exactly one role, which determines everything they may do.
Every access token carries one pre-defined scope, and a token never grants more
than the role of the person who created it; see
[Users & tokens](users-and-tokens.md) for the scopes and how to create tokens.

## Roles

| Role | What it allows |
| ---- | -------------- |
| **Member** | Read-only consumer: browse, search, install, and download packages; manage their own access tokens. |
| **Admin** | Day-to-day administrator: everything a Member can, plus publish, import, and yank packages in every ecosystem, upload SBOM, VEX, and SARIF documents, manage package claims, manage members and invitations, change organization settings, and read the audit log. |
| **Owner** | Everything an Admin can, plus managing Owners: promoting someone to Owner, or changing or removing an existing Owner, is reserved to Owners. An organization always keeps at least one Owner. |
| **Auditor** | Compliance role: read the audit log on the **Audit** page and manage their own access tokens, with no other permissions and no package access. |

Assign and change roles on the **Users** page (see
[Users & tokens](users-and-tokens.md)). With SAML single sign-on, roles can
also be mapped automatically from your identity provider; see
[Authentication](authentication.md).

## How it is enforced

Every action checks the caller's permissions on the server:

- Signed in to the web UI, you act with your **role**.
- Authenticating with a token (from a package manager or CI), you act with the
  token's **scope**, which is at most what its creator's role allowed at
  creation time.

The same rules apply to everyone and every token; there are no per-user
exceptions to configure.
