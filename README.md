# Dependably — Documentation

End-user documentation for [Dependably](https://github.com/dependably), the
self-hosted private package registry.

The content lives under [`docs/`](docs/), organized one subtree per language.
English is the only language today; more will be added as siblings.

```
docs/
└── en/
    ├── index.md                     ← product landing page (start here)
    ├── getting-started.md           ← the three inputs every guide needs
    ├── package-managers/            ← developer tooling
    │   ├── npm.md
    │   ├── pypi.md
    │   ├── nuget.md
    │   └── maven.md
    └── containers-and-system/       ← containers & system packages
        ├── docker.md
        └── rpm.md
```

## Conventions

- One topic per file; keep pages short and task-focused.
- Examples use `repo.example.com` as the base URL and `default` as the org
  slug. Readers substitute their own.
- Tokens are never shown literally — guides use placeholders or environment
  variables.
