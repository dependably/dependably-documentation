---
description: "Configure Terraform's provider network mirror so terraform init downloads providers through Dependably instead of registry.terraform.io."
order: 7
---

# Terraform

Point Terraform at your Dependably instance and `terraform init` resolves and
downloads every provider through it, instead of reaching `registry.terraform.io`
and `releases.hashicorp.com`.

This is the ecosystem where a mirror pays off most visibly. A stack using
`hashicorp/aws` and `hashicorp/random` unpacks to roughly 665 MB of provider
binaries, and CI runners keep no `.terraform` directory between jobs, so
without a mirror every pipeline re-downloads the archives.

You will need your instance's base URL and, unless your organization allows
anonymous pull, a token. Create one in the web UI (see
[Getting started](../getting-started.md)). The examples below use
`repo.example.com`; substitute your own. Your provider mirror URL is:

```
https://repo.example.com/terraform/
```

> **HTTPS is mandatory here.** Terraform rejects an `http://` mirror URL while
> parsing its CLI configuration, before it makes any request, with
> `Cannot use "http://…" as a URL for a network provider mirror`. Unlike the
> other ecosystems, a plain-HTTP deployment cannot serve this one. Terminate
> TLS in front of Dependably first.

## Configure

Provider installation is configured in Terraform's **CLI configuration**, not
per project. There is no per-repository file to edit and no change to any
`required_providers` block.

Create `~/.terraformrc` (Linux and macOS) or `%APPDATA%\terraform.rc`
(Windows):

```hcl
provider_installation {
  network_mirror {
    url = "https://repo.example.com/terraform/"
  }
}
```

In CI, where `$HOME` may not be the runner's, point Terraform at the file
explicitly:

```bash
export TF_CLI_CONFIG_FILE=/path/to/terraformrc
terraform init
```

If your organization has anonymous pull disabled, the mirror answers `401` with
a `WWW-Authenticate: Bearer` challenge. Put the token in the URL's userinfo.
The username is ignored; only the token is checked:

```hcl
url = "https://user:<your token>@repo.example.com/terraform/"
```

## Verify

```bash
terraform init
```

Providers download through Dependably. The first download of each provider
archive is recorded as a **First fetch** event on the **Activity** tab of the
**Audit** page, which admins, owners and auditors can open. See
[Audit log](../web-ui/audit.md).

A committed `.terraform.lock.hcl` needs no change and no `-upgrade` run:
Terraform recomputes each provider's `h1:` hash from the archive it downloads
and verifies it against the lock file, and the mirrored bytes are identical to
the ones the public registry serves. A configuration with no committed lock
file gets no verification, the same exposure it already accepts when
installing directly.

Archives are cached per platform. A version document lists every platform the
upstream registry advertises, but each archive is fetched and cached on its
own first download. Running `terraform init` on Linux does not warm the macOS
arm64 archive; the next `init` on that platform is what fetches it.

## What is mirrored

Only providers are mirrored. Terraform's module registry is a separate
protocol with no network-mirror equivalent, so `terraform init` still reaches
the public registry for any `module` block sourced from a registry. Provider
archives are where the bytes are, so this still removes the large majority of
egress. A deployment that must eliminate registry traffic entirely needs to
vendor modules or source them from Git.

Only configured registry hosts are mirrored. A provider is addressed by its
own source address (`{hostname}/{namespace}/{type}`), and Dependably matches
that hostname against your organization's configured upstreams instead of
fetching from whatever host the address names. To mirror a provider from a
private registry, open **Settings**, then **Proxy**, and add that registry
under **Upstream registries** (see [Upstreams](../admin/upstreams.md)).

## Supply-chain controls

Provider fetches run the same checks as every other ecosystem. The archive's
checksum is verified against the `shasum` the registry reports for that exact
platform before it is stored. A provider is pinned to the registry host that
first served it. The policy gate runs on first fetch and on every cache hit, and
reserved namespaces never pull from upstream. See
[Settings](../admin/settings.md) for the gates themselves.

Advisory scanning and the licence gate behave differently for Terraform.

OSV publishes no Terraform provider ecosystem, so providers are never queried
and never stamped as scanned. The UI reports them as **No advisory feed**,
never as clean, so an artefact with zero advisory coverage is not mistaken for
one screened against a live feed. Every other gate still applies.

Provider archives carry no licence manifest, so recording zero licences is the
normal case here, not an unknown-licence signal, and it does not block under a
blocking licence policy.

## Troubleshooting

**`Cannot use "http://…" as a URL for a network provider mirror`**: Terraform
rejects a plain-HTTP `network_mirror.url` while parsing the CLI configuration,
before any request is made. Terminate TLS in front of Dependably.

**A provider resolves to no installable versions**: the mirror answers `404`
when the provider's hostname is not among your organization's configured
upstream registries. Terraform then reports that the provider has no available
versions, the same as if it did not exist at all, rather than a clear "this
registry is not configured" error. Open **Settings**, then **Proxy**, and add
the registry under **Upstream registries**, or check `required_providers` for a
typo in the hostname.

## Revert

Remove the `provider_installation` block from `~/.terraformrc` (or unset
`TF_CLI_CONFIG_FILE`). Terraform returns to resolving providers directly from
their source registries on the next `terraform init`.
