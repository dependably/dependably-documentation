# Dependably — Documentation

End-user and administrator documentation for
[Dependably](https://github.com/dependably), the self-hosted private package
registry.

The content lives under [`docs/`](docs/), organized one subtree per language.
English is the only language today; more will be added as siblings.

```
.claude/skills/docs/               ← the docs skill: how a page is grounded and screenshotted
scripts/screenshots.mjs            ← retakes every web-UI screenshot from a live instance
docs/
└── en/
    ├── index.md                     ← product landing page (start here)
    ├── getting-started.md           ← the inputs every guide needs
    ├── package-managers/            ← developer tooling
    │   ├── npm.md
    │   ├── pypi.md
    │   ├── nuget.md
    │   ├── maven.md
    │   ├── cargo.md
    │   ├── go.md
    │   ├── terraform.md
    │   ├── hex.md
    │   └── blocked-packages.md        ← a 403 from a package manager
    ├── containers-and-system/       ← containers & system packages
    │   ├── docker.md
    │   └── rpm.md
    ├── web-ui/                      ← the built-in web console
    │   ├── index.md
    │   ├── dashboard.md
    │   ├── packages.md
    │   ├── projects.md
    │   ├── lookup.md
    │   ├── vulnerabilities.md
    │   ├── risk.md
    │   ├── license-policy.md
    │   ├── tokens.md
    │   ├── setup.md
    │   ├── profile.md
    │   ├── quarantine.md
    │   ├── audit.md
    │   └── images/                  ← screenshots embedded in the pages above
    ├── admin/                       ← operators & organization admins
    │   ├── index.md
    │   ├── configuration.md
    │   ├── rbac.md
    │   ├── users-and-tokens.md
    │   ├── settings.md
    │   ├── authentication.md
    │   └── upstreams.md
    └── integrations/                ← monitoring & third-party integrations
        ├── index.md
        ├── logging.md                ← structured log output & shipping
        └── grafana/                 ← one folder per integration
            ├── index.md             ← Grafana dashboard guide
            ├── dashboards/          ← downloadable dashboard JSON
            └── images/              ← dashboard screenshot
```

## Conventions

- One topic per file; keep pages short and task-focused.
- Developer guides follow a shared template: intro + prerequisites, the registry
  URL, **Configure**, **Verify**, **Publishing**, **Revert**.
- Examples use `repo.example.com` as the base URL. Registry URLs are built
  directly onto the host (`<base>/npm/`, `<base>/simple/`, …).
- Tokens are never shown literally — guides use placeholders and let each tool
  store the token in its own credential store.
- Every claim is grounded in the `dependably-community` source and every
  screenshot is a fresh capture from a running instance — see
  [`.claude/skills/docs/SKILL.md`](.claude/skills/docs/SKILL.md) for the rules and
  `scripts/screenshots.mjs` for the capture.

## Screenshots

```bash
DEPENDABLY_URL=http://demo.localhost:8080 DEPENDABLY_EMAIL=… DEPENDABLY_PASSWORD=… node scripts/screenshots.mjs
```

Sign in as the role the pages are written for (a member for `web-ui/`). The
script loads Playwright from a sibling `dependably-community/web` checkout and
writes 1920 × 936 PNGs into `docs/en/web-ui/images/`.
