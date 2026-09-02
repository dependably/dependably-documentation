# Package managers

Point your developer package managers at Dependably and they work exactly as
before — they just pull, and publish, through your registry instead of the
public one. Each guide covers configuring the client, verifying it, publishing,
and reverting.

First time here? [**Getting started**](../getting-started.md) gathers the base
URL and token every guide needs.

## Guides

| Tool | Use it for | Guide |
| ---- | ---------- | ----- |
| **npm** / yarn / pnpm | JavaScript & Node.js packages | [npm](npm.md) |
| **pip** / uv | Python packages (PyPI) | [PyPI](pypi.md) |
| **dotnet** | C# / .NET packages (NuGet) | [NuGet](nuget.md) |
| **Maven** / Gradle | Java & JVM artefacts | [Maven](maven.md) |
| **cargo** | Rust crates | [Cargo](cargo.md) |
| **go** | Go modules | [Go](go.md) |
| **terraform** | Terraform providers | [Terraform](terraform.md) |
| **mix** / rebar3 | Elixir & Erlang packages (Hex) | [Hex](hex.md) |

For container images and Linux system packages, see
[Containers & system](../containers-and-system/index.md).

Getting a `403 Forbidden` on an install? See
[Blocked packages](blocked-packages.md) to tell a policy refusal from an
authentication failure.
