# Audit log

The **Audit log** is a searchable, exportable record of what happened in your
organization — every fetch, push, block, login, and configuration change.

> This page is for the **Admin** and **Owner** roles. It appears under **Admin**
> in their sidebar; a member's sidebar does not list it, and a member who opens
> its address is returned to the Overview. An **Auditor** reads the log through
> a token with the **audit** scope rather than this page — see
> [Access control (RBAC)](../admin/rbac.md).

## Two views

The page has two tabs:

- **Activity** — package- and access-level events: first fetches, pushes,
  imports, downloads, vulnerability scans, deletes, manual block / unblock,
  every kind of supply-chain policy block (the gates are defined in
  [Settings](../admin/settings.md)), and login success / failure / lockout.
- **Configuration** — administrative changes: organization, retention, and proxy
  settings; SAML configuration and logins; token and service-token lifecycle;
  member role changes, removals, and invites; allow/block-list and licence-policy
  edits; package claims; and security events such as a blocked SSRF attempt or an
  upstream checksum mismatch.

## Find an event

- **Search** by PURL, event, actor, or detail (the Configuration tab searches
  action, actor, PURL, and detail).
- **Filter** by event type with the dropdown.
- Events are sorted by **Time**, newest first.

Each row records the **time**, the **event** or **action**, the **PURL** it
concerns (where relevant), a **detail** string, and the **actor** who triggered
it.

## Export

Select **Export CSV** to download the current view for offline analysis or to
hand to a compliance process.
