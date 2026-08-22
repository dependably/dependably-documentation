# Licence policy

The **Licences** page shows your organization's licence policy: which SPDX
licences are explicitly allowed or blocked, and whether the policy is being
enforced.

Dependably records the SPDX licence of every package it caches, so this
information is always available even when enforcement is off.

![The Licence policy page showing the Enforcement indicator set to OFF and empty Allowed and Blocked licence lists.](images/license-policy.png)

## Enforcement

The **Enforcement** indicator at the top shows one of three modes:

- **Off** — licences are recorded but never affect a pull. The allow and block
  lists below show what *would* happen under enforcement, so you can preview a
  policy before committing to it.
- **Warn** — the policy is evaluated and violations are flagged, but pulls are
  still served.
- **Block** — the policy is enforced: a pull of a non-allowed or blocked licence
  is refused.

## Allowed and blocked licences

Two lists make up the policy:

- **Allowed licences** — an allow list. When populated, only these licences pass.
- **Blocked licences** — a block list of licences to refuse.

Either list may be empty. An empty allow list and empty block list mean no
licence restriction.

## Who can change it

Every member can view this page. Changing the enforcement mode or editing the
lists is an administrative action — these edits are recorded in the
[Audit log](audit.md) (as *Licence policy mode changed* and the allow/block list
events). See [Access control (RBAC)](../admin/rbac.md) for who holds that
permission.
