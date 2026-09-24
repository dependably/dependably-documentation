---
description: "The Audit page of the Dependably web console: search, filter, and export your organization's activity and configuration events."
order: 12
---

# Audit log

The **Audit** page is a searchable, exportable record of what happened in your
organization: fetches, pushes, blocks, sign-ins, and configuration changes.

> This page is for the **Admin**, **Owner**, and **Auditor** roles. It appears
> under **Admin** in their sidebar (an Auditor's **Admin** section holds only
> **Audit**). A member's sidebar does not list it, and a member who opens its
> address is returned to the Overview. See
> [Access control (RBAC)](../admin/rbac.md).

## Activity and Configuration

The **Activity** tab holds package and access events:

- first fetches, pushes, imports, downloads, vulnerability scans, and deletes
- manual blocks and unblocks, and every download a policy gate refused (the
  gates are set in [Settings](../admin/settings.md))
- sign-ins that succeed, fail, or lock the account, and sign-ins that skipped
  the second factor on a remembered device or used a recovery code

The **Configuration** tab holds administrative changes:

- organization, retention, and proxy settings
- failed sign-ins, lockouts, and password and language changes
- two-factor enrolment, removal, recovery-code regeneration, and remembered
  devices
- SAML configuration and logins
- token and service-token lifecycle
- member role changes, removals, and invites
- allow-list, block-list, and licence-policy edits, and package claims
- security events such as a blocked SSRF attempt or an upstream checksum
  mismatch

A push also appears here, under **Packages**, as well as on **Activity**.

## Find an event

On the **Activity** tab, search by PURL, event, actor, or detail. Narrow the
list with the event-type filter (**Blocked (all)** covers every refused
download) and the time window: **All time** or the last 24 hours, 7, 30, or 90
days. The window starts at **Last 30 days**.

On the **Configuration** tab, search by action, actor, PURL, or detail, and
filter to one action, picked from a list grouped under headings such as
**Authentication** and **Licence policy**.

When a search finds nothing in the most recent events, the page says so: older
events were not searched. Narrow by event type or action to reach further back,
or export to CSV.

Events are sorted by **Time**, newest first. The **Activity** table shows
**Time**, **Event**, **PURL**, **Detail**, and **Actor**; the **Configuration**
table shows **Time**, **Action**, **Ecosystem**, **PURL**, **Actor**, and
**Detail**.

## Export

Select **Export CSV** to download every event that matches the tab's current
search and filters, up to 50,000 rows, rather than just the page on screen. The
file also carries the source IP address of each event.
