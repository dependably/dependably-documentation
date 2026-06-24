# Authentication

Dependably supports two ways for users to sign in to an organization: **forms
login** (email and password, with optional multi-factor authentication) and
**SAML 2.0 single sign-on**. SAML is the only SSO protocol — there is no OIDC,
OAuth, or LDAP login. Each organization configures its own identity provider
independently.

## Login methods

### Forms login (email + password)

Users sign in at `POST /api/v1/auth/login` with their email and password. Login
is rate-limited. Forms login is enabled by default for every organization and
can be turned off once SAML is fully configured (see *Disabling forms login*).

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

To enforce MFA for everyone, an operator sets `REQUIRE_MFA` instance-wide or an
admin sets `requireMfa` per organization (see [Settings](settings.md)).

## Setting up SSO (SAML 2.0)

SSO configuration lives under `api/v1/auth-config` and requires
`tenant:configure`.

**1. Register the service provider with your IdP.** Give your IdP these
service-provider URLs (host shown as `repo.example.com`):

| SP value | URL |
| -------- | --- |
| ACS (Assertion Consumer Service) | `https://repo.example.com/saml/acs` |
| SP metadata / default entity ID | `https://repo.example.com/saml/metadata` |

**2. Upload IdP metadata.** Send your IdP's metadata XML to
`POST /api/v1/auth-config/metadata`. Dependably parses it and stores the IdP
entity ID, SSO URL, and signing certificate. You may optionally pin a signing
certificate explicitly with `POST /api/v1/auth-config/signing-cert`; a pinned
override becomes the sole trust anchor.

**3. Test, then enable.** Run a test round-trip against your IdP (admin/owner
only); it records the result without creating a session. Once a test succeeds,
set `enabled: true`.

### Configuration fields

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

### Disabling forms login

Forms login stays on by default. You may disable it only when **all** of these
hold, to avoid locking the organization out of a misconfigured IdP: SAML is
enabled, IdP metadata (entity ID + signing certificate) is uploaded, and a SAML
test has succeeded within the last 10 minutes. Deleting the SAML config
(`DELETE /api/v1/auth-config`) re-enables forms login.

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
- **`system_admin` can never be assigned via SSO** — any mapping to it (or to an
  unknown role) is stripped.
- These ceilings apply to first-time provisioning, linking an existing account,
  and role re-sync on every login. The last remaining owner is never demoted,
  and blocked assignments are recorded in the audit log.
