---
order: 5
---

# Authentication

Dependably gives your team two ways to sign in: **forms login** (email and
password, with optional multi-factor authentication) and **SAML 2.0 single
sign-on**. With SAML 2.0 you connect your own identity provider and manage
access centrally, with role assignment driven straight from your existing
groups. Okta, Microsoft Entra ID (Azure AD), ADFS, Google Workspace, or any
SAML-compliant IdP works.

Sign-in methods and SAML are configured on the **Authentication** tab in
**Settings** (Owner or Admin).

## Login methods

### Forms login (email + password)

Users sign in at your base URL with their email and password. Login is
rate-limited. Forms login is enabled by default; the **Sign-in methods**
section of the **Authentication** tab lets you switch it off once SSO is
working (see [Set up single sign-on](#set-up-single-sign-on)).

### Multi-factor authentication (TOTP)

Any user can enrol a time-based one-time-password authenticator from their
**Profile** page: scan the QR code (or enter the manual key), confirm with a
6-digit code, and 10 recovery codes are issued. They are shown once, so store
them safely. See [Your profile & account](../web-ui/profile.md) for the
walkthrough.

With MFA enabled, sign-in asks for a current TOTP code **or** a recovery code
as the second step. At that step the user may choose **Remember this device
for 30 days**, which skips the code on that device until then. Recovery codes
can be regenerated from the Profile page, which invalidates the old ones.
Disabling MFA needs the current password and a code, and revokes all trusted
devices.

To require MFA for everyone in your organization, turn on **Require MFA
enrolment** on the **General** tab of [Settings](settings.md#general).

## Set up single sign-on

Connecting your identity provider is a guided flow in the **SAML Single
Sign-On** section of the **Authentication** tab:

1. **Register Dependably with your IdP.** Give your IdP the service-provider
   values Dependably shows: the **ACS URL**
   (`https://repo.example.com/saml/acs`), the **SP entity ID**, and the **SP
   metadata URL** (each `https://repo.example.com/saml/metadata` by default).
   Many IdPs accept the metadata URL and configure themselves.
2. **Upload IdP metadata.** Upload the metadata XML exported from your IdP.
   Dependably reads the entity ID, sign-in URL, and signing certificate from
   it, with nothing to copy by hand.
3. **Test the round-trip.** Dependably runs a SAML round-trip in a popup and
   shows the result, including every attribute your IdP asserted, which helps
   you pick the role claim for [role mapping](#role-mapping). No session is
   created, so you can confirm everything works before going live.
4. Within 10 minutes of a successful test, enable **SAML SSO** under
   **Sign-in methods**. Your team then signs in through your IdP.

Role assignment works with no mapping configured: users get the default role,
and you can map IdP groups to Dependably roles whenever you're ready (see
[Role mapping](#role-mapping)).

Once SSO works you can switch off **Forms login (email + password)** so
everyone goes through your IdP. Dependably allows that only while SAML SSO is
enabled and a SAML test has succeeded in the last 10 minutes, so a
misconfigured IdP cannot lock you out. Switching forms login off signs out
existing password sessions.

### Signing certificate override

Under **Upload IdP metadata**, **Signing certificate override** lets you paste
a PEM or DER certificate to pin the IdP signing key out-of-band. When set, it
is the sole trust anchor for SAML signature validation.

### Advanced SAML settings

The guided flow fills everything in from the uploaded metadata. The **Advanced
SAML settings** section is only needed if your IdP deviates from the defaults
(which work for Okta, Azure AD, and Google Workspace):

| Setting | Purpose |
| ------- | ------- |
| **Login button label** | Label shown on the SSO sign-in button (for example, *Sign in with Acme SSO*). |
| **Email attribute (override)** | Attribute to read the user's email from. Blank checks the common email claims, then falls back to the NameID when it is an email address. |
| **NameID format** | NameID format your IdP asserts: `emailAddress` (default), `persistent`, `transient`, or `unspecified`. |
| **SP entity ID override** | Blank uses the host-derived default (`https://repo.example.com/saml/metadata`). |

The same section holds [role mapping](#role-mapping).

## Role mapping

When a user signs in via SAML, Dependably maps the IdP's role or group claim to
a Dependably [role](rbac.md). The **Role mapping** settings in **Advanced SAML
settings** are:

- The mapping table, where each row pairs an IdP value with a role. IdP values
  match case-sensitively.
- **Role claim attribute**, the claim to read values from. Blank uses a
  built-in list of common role and group claim types (the Microsoft and
  XML-SOAP role claim URIs, then `Role`, `groups`, and `Group`).
- **Default role (no match)**, assigned when nothing matches.

**How a role is chosen:** each IdP value is looked up in the mapping table.
When several match, the highest-ranked role wins (Owner > Admin > Auditor >
Member). If nothing matches, the user gets the default role. The result is
applied at every SAML sign-in, so a role you change by hand on the **Users**
page is reset at the user's next SAML sign-in.

**Guardrails (always enforced):**

- Owner is never assignable via SSO.
- The IdP can assign Member or Auditor. Assigning Admin needs a
  per-organization opt-in that the Settings page does not offer; without it, a
  new user mapped to Admin is created as a Member, and an existing user's role
  is left unchanged.
- Unknown roles are stripped: any mapping to a role Dependably does not
  recognize is ignored.
- Dependably never links an SSO sign-in by email to an account that has a
  password, or to one whose role is above what the IdP may assign; that
  sign-in fails.
- The last remaining Owner is never demoted.
- Blocked role assignments and refused sign-ins are recorded in the audit log.
