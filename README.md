# Dependably — Documentation

End-user and administrator documentation for
[Dependably](https://github.com/dependably), the self-hosted private package
registry.

The content lives under [`docs/`](docs/), organized one subtree per language.
English is the only language today; more will be added as siblings.

```
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
    │   └── go.md
    ├── containers-and-system/       ← containers & system packages
    │   ├── docker.md
    │   └── rpm.md
    └── admin/                       ← operators & organization admins
        ├── index.md
        ├── configuration.md
        ├── rbac.md
        ├── users-and-tokens.md
        ├── settings.md
        ├── authentication.md
        └── upstreams.md
```

## Conventions

- One topic per file; keep pages short and task-focused.
- Developer guides follow a shared template: intro + prerequisites, the registry
  URL, **Configure**, **Verify**, **Publishing**, **Revert**.
- Examples use `repo.example.com` as the base URL. Registry URLs are built
  directly onto the host (`<base>/npm/`, `<base>/simple/`, …).
- Tokens are never shown literally — guides use placeholders and let each tool
  store the token in its own credential store.
