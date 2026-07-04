# Authentication

Dependably gives your team two ways to sign in: **forms login** (email and
password, with optional multi-factor authentication) and **SAML 2.0 single
sign-on**. With SAML 2.0 you connect your own identity provider — Okta,
Microsoft Entra ID (Azure AD), OneLogin, or any SAML-compliant IdP — and manage
access centrally, with role assignment driven straight from your existing
groups.

## Login methods

### Forms login (email + password)

Users sign in at your base URL with their email and password. Login is
rate-limited. Forms login is enabled by default; the **Sign-in methods**
section of **Settings → Authentication** lets you switch it off once SSO is
verified (see *Set up single sign-on*).

### Multi-factor authentication (TOTP)

Any user can enroll a time-based one-time-password authenticator from their
**Profile** page — scan the QR code (or enter the manual key), confirm with a
6-digit code, and **10 recovery codes** are issued (shown once — store them
safely). See [Your profile & account](../web-ui/profile.md) for the
walkthrough.

With MFA enabled, sign-in asks for a current TOTP code **or** a recovery code
as the second step.

- **Recovery codes** can be regenerated from the Profile page.
- **Trusted devices** — at second-factor time the user may choose to remember
  the device, which skips the code next time on that device. Disabling MFA
  revokes all trusted devices.

To require MFA for everyone in your organization, turn on **Require MFA
enrollment** in [Settings](settings.md).

## Set up single sign-on

Connecting your identity provider is a short, guided flow in **Settings →
Authentication** — most teams finish it in a few minutes:

1. **Hand your IdP the two service-provider URLs** Dependably shows you: the
   sign-in (ACS) URL `https://repo.example.com/saml/acs` and the metadata URL
   `https://repo.example.com/saml/metadata`. Many IdPs accept the metadata URL
   and configure themselves.
2. **Upload your IdP's metadata XML.** Dependably reads the entity ID, sign-in
   URL, and signing certificate from it automatically — nothing to copy by hand.
3. **Test the connection.** Dependably runs a round-trip against your IdP and
   shows you the result. No session is created, so you can confirm everything
   works before going live.
4. **Turn SSO on.** Once the test passes, enable it — your team signs in through
   your IdP from then on.

Role assignment works out of the box: new users land on the default role, and
you can map IdP groups to Dependably roles whenever you're ready (see
[Role mapping](#role-mapping)). Once SSO is verified you can optionally switch
off password login so everyone goes through your IdP — Dependably keeps password
login available until a successful SSO test confirms you won't be locked out.

### Advanced SAML settings

The guided flow fills everything in from the uploaded metadata. The **Advanced
SAML settings** section on the same tab is only needed if your IdP deviates
from the defaults (which work for Okta, Azure AD, and Google Workspace):

| Setting | Purpose |
| ------- | ------- |
| **Login button label** | Label shown on the SSO sign-in button (for example, *Sign in with Acme SSO*). |
| **NameID format** | NameID format your IdP asserts (default: email address). |
| **Email attribute (override)** | Attribute to read the user's email from; blank uses the NameID. |
| **SP entity ID override** | Blank uses the host-derived default (`https://repo.example.com/saml/metadata`). |
| **Signing certificate override** | Paste a PEM or DER certificate to pin the IdP signing key out-of-band; when set, it is the sole trust anchor. |

## Role mapping

When a user signs in via SAML, Dependably maps the IdP's role or group claim to
a Dependably [role](rbac.md). The **Role mapping** section of **Settings →
Authentication** holds the mapping table (IdP value → role), the **role claim
attribute** to read values from (blank uses a built-in list of common
role/group claim types — Azure AD, Okta, and generic `Role` / `groups`), and
the **default role** assigned when nothing matches.

**How a role is chosen:** each IdP value is looked up in the mapping table.
When several match, the highest-ranked role wins (Owner > Admin > Auditor >
Member). If nothing matches, the user gets the default role.

**Guardrails (always enforced):**

- **Owner is never assignable via SSO** — it is above the IdP ceiling in all
  cases.
- **Admin requires opt-in** — by default the IdP can assign at most Member;
  raising the ceiling to Admin is an explicit opt-in.
- **Unknown roles are stripped** — any mapping to a role Dependably does not
  recognize is ignored.
- These ceilings apply to first-time provisioning, linking an existing account,
  and role re-sync on every login. The last remaining owner is never demoted,
  and blocked assignments are recorded in the audit log.
