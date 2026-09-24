---
description: "Review, approve, or deny package versions that a Dependably supply-chain policy gate blocked, in the Quarantine queue."
order: 11
---

# Quarantine review

The **Quarantine** queue is where versions blocked by a supply-chain policy wait
for a human decision. Open it from **Quarantine** under **Admin** in the
sidebar, or from the **Quarantine pending** card on the
[Overview](dashboard.md).

> This page is for the **Admin** and **Owner** roles. A member's sidebar does
> not list it, and a member who opens its address is returned to the Overview.
> The roles are defined in [Access control (RBAC)](../admin/rbac.md).

## What lands here

Every automatic policy block adds a pending entry to the queue, while
downloads of that version keep returning `403`. A manual block does not, because
it is already a human decision. The gates and their thresholds are set in
[Settings](../admin/settings.md#gates).

## Find an entry

- Search by package, gate, note, or reviewer.
- Filter by ecosystem, by gate (**All gates** or a single gate), and by
  decision state: **Pending**, **Approved**, **Denied**, or **All**. The queue
  opens on **Pending**.
- Sort by selecting a column header, and page through results at the bottom.
  Filters and sort are kept in the page address.

Each row shows the **Package**, the **Gate** that blocked it, the gate's
**Detail**, who decided it and how many days ago (**Decided by**), and when it
was last **Updated**. A badge beside the package counts the applications that
ship it, which are the ones a deny affects; **apps unavailable** means the
count could not be loaded, not that it is zero.

Select a row to expand the full **Policy detail**, when the entry was
**Created**, and, once decided, **Decided at**, **Decided by**, and any
**Note**.

## Approve or deny

A pending row carries **Approve** and **Deny** buttons:

- **Approve** sets the version's manual allow override. The override outranks
  every policy gate, so the version serves from then on even if a gate still
  matches.
- **Deny** records a manual block.

To change a decision, open the row's menu and choose the opposite decision, or
**Reset to pending**, which clears the override and puts the entry back in the
queue.

Every decision is written to the [Audit log](audit.md), so there is a durable
record of who allowed or blocked what, and when.
