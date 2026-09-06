---
order: 3
---

# Users & tokens

This page covers managing the people and machine credentials in your
organization, from the web UI. What each role may do is defined in
[Access control](rbac.md).

## Managing members & roles

Open **Users** in the sidebar (requires the Admin or Owner role). The
**Members** tab lists everyone in your organization with their email, role,
account type (Forms or SAML), MFA status, and join date.

A member's role is one of **Member**, **Admin**, **Owner**, or **Auditor** —
see [Access control](rbac.md) for what each allows. To change a role, select
**Change role** on the member's row, pick the new role, and **Save**. Role
changes follow a two-tier rule:

- **Admins** can manage Member, Admin, and Auditor rows.
- **Owners** — changing an existing Owner's role, or promoting someone **to**
  Owner, is reserved to Owners. Admins cannot promote someone to Owner.

Remove a member from the same row (same two-tier rule).

> **Last-owner rule.** An organization must always keep at least one Owner.
> Demoting or removing the **last** remaining Owner is rejected — promote a
> second Owner first.

## Inviting users

On the **Users** page, select **Invite user**, enter the person's email, and
choose their role. Admins can invite Members, Admins, and Auditors; inviting
at the Owner role is reserved to Owners.

The **Pending Invites** tab shows each invite's status (pending, accepted, or
expired). Each organization has a cap on outstanding pending invites — cancel
unused ones from this tab if you hit it.

When SMTP is configured the invite is emailed automatically. If SMTP is
unconfigured or delivery fails, the page shows the invite link so you can send
it yourself. The invitee follows the link to validate the invite and set their
password.

## Personal tokens vs service tokens

Both are registry credentials. The raw token value is shown **once**, at
creation time — it is stored only as a hash and cannot be retrieved again, so
store it in your credential store or CI secret manager immediately.

Every token carries one of the pre-defined scopes:

| Scope | Allows |
| ----- | ------ |
| **pull only** | Install and download packages. |
| **push only** | Publish packages. |
| **push & pull** | Both. |
| **admin** | Read and change organization settings. |
| **audit** | Read the audit log — for SIEM and logging integrations. |
| **SBOM upload** | Upload SBOM, VEX, and SARIF documents to Projects — for CI. |

A token never grants more than the role of the person who created it allows:
scopes that publish (**push only**, **push & pull**) or manage the
organization (**admin**, **audit**, **SBOM upload**) require the Admin or Owner
role.

Set an **Expires at** to bound a token's lifetime, and a description (up to
200 characters) to tell tokens apart. The organization enforces a maximum
number of active tokens (personal and service tokens share this cap); revoke
unused tokens before creating new ones.

### Personal tokens

A personal token is tied to a person's account — best for day-to-day CLI access
(`npm install`, `npm publish`, …) from their own machine. It lives and dies
with that account: removing the user from the organization (or the user
changing their password) revokes their personal tokens. Everyone manages
their own on the **Tokens** page; see [Access tokens](../web-ui/tokens.md) for
the walkthrough.

Members can revoke their own tokens; Admins and Owners can revoke any token in
the organization. `npm whoami` against a personal token reports the owner's
email.

### Service tokens

Use a service token for CI pipelines and automation that should **not** be tied
to a person — it survives the originating user leaving the organization.

Manage them in **Settings → Service tokens** (requires the Admin or Owner
role). Select **New token** and enter:

1. A **Name** (required — for example, *GitHub Actions*).
2. An optional **Description** (for example, *Build server in us-east-1*).
3. A **Scope** — any of the six scopes above.
4. An optional **Expires at**.

The table lists each service token's name, description, scope, creation and
expiry dates, and when it was last used, so you can spot and revoke stale ones.

`npm whoami` against a service token reports `service:<name>` (for example
`service:ci-publisher`), giving pipelines a stable identifier to echo into logs.

### Scoping guidance

Grant the narrowest scope the job needs — **pull only** for a read-only
consumer, **push only** where a pipeline publishes. Always set an expiry on
automation tokens and rotate them on a schedule.

## Password & account administration

Any signed-in user can change their own password from the **Profile** page
(current password required; the new one must pass the password policy). A
successful change signs out the user's other sessions and revokes their
personal tokens — service tokens are unaffected.
