# Users & tokens

This page covers managing the people and machine credentials in your
organization. The capabilities named below (`tenant:configure`, `tenant:admin`,
`tokens:manage_own`) are explained in [Access control](rbac.md).

## Managing members & roles

List the members of your organization with `GET /api/v1/users` (requires
`tenant:configure`, so ordinary members cannot enumerate the roster).

A member's role is one of `member`, `admin`, `owner`, or `auditor`. Change it
with `PATCH /api/v1/users/{userId}/role`. Role changes use a **two-tier gate**:

- **Entry** — you need `tenant:configure` to reach the endpoint at all. Admins
  can manage `member` and `admin` rows.
- **Owners** — touching an existing **owner**, or **granting** the owner role,
  additionally requires `tenant:admin`. Admins cannot promote someone to owner;
  only an owner can.

Remove a member with `DELETE /api/v1/users/{userId}` (same two-tier gate).

> **Last-owner invariant.** An organization must always keep at least one owner.
> Demoting or removing the **last** remaining owner is rejected with 409
> Conflict — promote a second owner first.

## Inviting users

Invite someone by email:

```
POST /api/v1/invites
{ "email": "newdev@example.com", "role": "member" }
```

Requires `tenant:configure`. `role` is optional and defaults to `member`;
inviting at the **owner** role additionally requires `tenant:admin`. Each
organization has a cap on outstanding pending invites — cancel unused ones
(`DELETE /api/v1/invites/{id}`) if you hit it.

When SMTP is configured the invite is emailed automatically. If SMTP is
unconfigured or delivery fails, the API response returns the invite link
(`https://repo.example.com/join?token=…`) so you can deliver it
yourself. The raw token is never written to logs. The invitee follows the
`/join` link to validate the invite and set their password.

## Personal tokens vs service tokens

Both are registry credentials. The raw token string is shown **once**, at
creation time — it is stored only as a SHA-256 hash and cannot be retrieved
again. A token's capabilities are a **narrowing**: it can only carry
capabilities the creator already holds. Set an `expiresAt` to bound its
lifetime and an optional `description` (up to 200 characters). The organization
enforces a maximum number of active tokens (personal and service tokens share
this cap); revoke unused tokens before creating new ones.

### Personal tokens

Use a personal token for your own day-to-day CLI access (`npm install`,
`npm publish`, …). Manage them at `GET / POST / DELETE /api/v1/tokens`, all of
which require `tokens:manage_own` (a capability ordinary members have):

```
POST /api/v1/tokens
{ "capabilities": ["read:packages", "publish:npm"],
  "expiresAt": "2026-12-31T00:00:00Z",
  "description": "laptop CLI" }
```

You may always revoke your own tokens; owners and admins (holders of
`tenant:configure`) may revoke any. `npm whoami` against a personal token
reports the owner's email.

### Service tokens

Use a service token for CI pipelines and automation that should **not** be tied
to a person — it survives the originating user leaving the organization. Manage
them at `GET / POST / DELETE /api/v1/service-tokens`, which require
`tenant:configure`. A service token has a required `name` plus the same
`capabilities` / `expiresAt` / `description` fields:

```
POST /api/v1/service-tokens
{ "name": "ci-publisher",
  "capabilities": ["read:packages", "publish:npm"],
  "expiresAt": "2026-12-31T00:00:00Z" }
```

`npm whoami` against a service token reports `service:<name>` (for example
`service:ci-publisher`), giving pipelines a stable identifier to echo into logs.

### Scoping guidance

Grant the narrowest capability set the job needs — `read:packages` for a
read-only consumer, plus `publish:npm` only where a pipeline publishes. Always
set an expiry on automation tokens and rotate them on a schedule. Because the
raw value is shown only once, store it in your CI secret manager immediately.

## Password & account administration

Any signed-in user can rotate their own password with
`POST /api/v1/users/me/password` (current password required; the new one must
pass the password policy). A successful change invalidates the user's other
sessions and revokes their API tokens.
