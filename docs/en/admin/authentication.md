# Authentication

Dependably gives your team two ways to sign in: **forms login** (email and
password, with optional multi-factor authentication) and **SAML 2.0 single
sign-on**. With SAML 2.0 you connect your own identity provider — Okta,
Microsoft Entra ID (Azure AD), OneLogin, or any SAML-compliant IdP — and manage
access centrally, with role assignment driven straight from your existing
groups.

## Login methods

### Forms login (email + password)

Users sign in at `POST /api/v1/auth/login` with their email and password. Login
is rate-limited. Forms login is enabled by default, and you can switch it off
once SSO is verified (see *Set up single sign-on*).

### Multi-factor authentication (TOTP)

Any user can enroll a time-based one-time-password authenticator:

1. `POST /api/v1/mfa/setup/begin` returns an `otpauth://` URI (for QR scanning)
   and a base32 manual-entry key.
2. The user submits a code to `POST /api/v1/mfa/setup/verify`. On success MFA is
   enabled and **10 recovery codes** are issued (shown once — store them safely).

With MFA enabled, login is two steps: `POST /api/v1/auth/login` returns
`{ "mfaRequired": true }`, and the user completes the second factor at
`POST /api/v1/auth/login/totp` with a current TOTP code **or** a recovery code.

- **Recovery codes** can be regenerated with
  `POST /api/v1/mfa/recovery-codes/regenerate` after verifying a current code.
- **Trusted devices** — at second-factor time the user may choose to remember
  the device, which sets a cookie that skips the TOTP step next time. Disabling
  MFA revokes all trusted devices.

To require MFA for everyone in your organization, turn on `requireMfa` in
[Settings](settings.md).

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

### Configuration reference

The guided flow fills these in for you from the uploaded metadata. Adjust them
only if you want to fine-tune the integration:

| Field | Purpose |
| ----- | ------- |
| `enabled` | Whether SAML SSO is active for the organization. |
| `formsLoginEnabled` | Whether email/password login is still allowed (default `true`). |
| `idpEntityId` / `idpSsoUrl` / `idpSigningCert` | IdP details parsed from uploaded metadata. |
| `idpSigningCertOverride` | Admin-pinned signing certificate; when set, the sole trust anchor. |
| `spEntityId` | SP entity ID; blank derives `https://repo.example.com/saml/metadata`. |
| `nameIdFormat` | NameID format (default email address). |
| `emailAttribute` | Attribute to read the user's email from; blank uses the NameID. |
| `roleAttribute` | Attribute to read role/group values from; blank uses a built-in list. |
| `roleMapping` | JSON map of IdP value → Dependably role. |
| `defaultRole` | Role assigned when no mapping matches (default `member`). |
| `idpCanAssignAdmin` | When `true`, the IdP may assign `admin`; otherwise the ceiling is `member`. |
| `buttonLabel` | Label shown on the SSO sign-in button. |

## Role mapping

When a user signs in via SAML, Dependably maps the IdP's role or group claim to
a Dependably [role](rbac.md).

**How values are read (precedence):** if `roleAttribute` is set, read from that
attribute; otherwise use a built-in list of common role/group claim types (Azure
AD, Okta, and generic `Role` / `groups`).

**How a role is chosen:** each IdP value is looked up in `roleMapping`. When
several match, the highest-ranked role wins (`owner` > `admin` > `auditor` >
`member`). If nothing matches, the user gets `defaultRole`.

**Guardrails (always enforced):**

- **`owner` is never assignable via SSO** — it is above the IdP ceiling in all
  cases.
- **`admin` requires opt-in** — the IdP can assign `admin` only when
  `idpCanAssignAdmin` is `true`; otherwise the ceiling is `member`.
- **Unknown roles are stripped** — any mapping to a role Dependably does not
  recognize is ignored.
- These ceilings apply to first-time provisioning, linking an existing account,
  and role re-sync on every login. The last remaining owner is never demoted,
  and blocked assignments are recorded in the audit log.
