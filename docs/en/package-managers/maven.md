---
description: "Configure Maven and Gradle to resolve artefacts through a private Dependably repository, proxy Maven Central, and publish your own."
order: 4
---

# Maven (Maven & Gradle)

Point Maven or Gradle at Dependably to install private artefacts, proxy public
ones, and publish your own.

You will need your **token**. Create one in the web UI; see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Maven and Gradle authenticate with **HTTP Basic**: the
username `user` (any value works, since it is ignored) and your token as the
password. Your repository URL is:

```
https://repo.example.com/maven/
```

Locally published artefacts always take priority over upstream, so an internal
package can never be silently replaced by a public one of the same coordinates.

## Configure

Maven and Gradle have no CLI config command, so they are configured through
files. The blocks below are the minimum you need. The token lives in a
user-level file outside your project, so it is never committed.

### Maven

Reference the repository in the project `pom.xml`:

```xml
<repositories>
  <repository>
    <id>dependably</id>
    <url>https://repo.example.com/maven/</url>
  </repository>
</repositories>
```

Put the token in your user `~/.m2/settings.xml` (the `<id>` must match the one
in `pom.xml`):

```xml
<settings>
  <servers>
    <server>
      <id>dependably</id>
      <username>user</username>
      <password><your token></password>
    </server>
  </servers>
</settings>
```

To route every dependency through Dependably, add a catch-all `<mirror>` to
`settings.xml`. It reuses the `<server>` credentials because the `<id>` matches:

```xml
<mirrors>
  <mirror>
    <id>dependably</id>
    <url>https://repo.example.com/maven/</url>
    <mirrorOf>*</mirrorOf>
  </mirror>
</mirrors>
```

> **Plain HTTP:** Maven 3.8.1 and later block plain-HTTP repositories. Serve
> Dependably over HTTPS, or add a `<mirror>` for it that declares
> `<blocked>false</blocked>`.

### Gradle

Put the token in your user `~/.gradle/gradle.properties`:

```properties
dependablyToken=<your token>
```

Then reference the repository in `build.gradle`. The build reads the token from
that property, or from the `DEPENDABLY_TOKEN` environment variable in CI:

```groovy
repositories {
    maven {
        url = uri("https://repo.example.com/maven/")
        credentials {
            username = "user"
            password = findProperty("dependablyToken") ?: System.getenv("DEPENDABLY_TOKEN")
        }
    }
}
```

## Verify

Build a project that has at least one dependency, then force a re-resolve to
confirm fresh downloads go through Dependably:

```bash
mvn dependency:resolve     # or: ./gradlew dependencies
mvn -U dependency:resolve  # or: ./gradlew --refresh-dependencies build
```

The first download of each file is recorded as a **First fetch** event on the
**Activity** tab of the **Audit** page, which admins, owners and auditors can
open. See [Audit log](../web-ui/audit.md).

## Publishing

Publishing requires a token with a push scope (**push only** or
**push & pull**). See [Access tokens](../web-ui/tokens.md).

For Maven, add a `distributionManagement` block to `pom.xml` pointed at the same
URL, reusing the `<server>` credentials from `settings.xml`, then `mvn deploy`:

```xml
<distributionManagement>
  <repository>
    <id>dependably</id>
    <url>https://repo.example.com/maven/</url>
  </repository>
  <snapshotRepository>
    <id>dependably</id>
    <url>https://repo.example.com/maven/</url>
  </snapshotRepository>
</distributionManagement>
```

For Gradle, apply the `maven-publish` plugin and add a publishing repository
with the same URL and credentials, then run `./gradlew publish`:

```groovy
publishing {
    repositories {
        maven {
            url = uri("https://repo.example.com/maven/")
            credentials {
                username = "user"
                password = findProperty("dependablyToken") ?: System.getenv("DEPENDABLY_TOKEN")
            }
        }
    }
}
```

Dependably validates each uploaded checksum file (`.sha1`, `.md5`, `.sha256`)
against the bytes it received and rejects a mismatch. Versions ending in
`-SNAPSHOT` are mutable: each deploy stores a new timestamped build, and the
metadata Dependably serves for that version points Maven and Gradle at the
latest one.

Maven publishes do not apply your organization's **Version overwrite policy**
(see [Settings](../admin/settings.md#gates)). Deploying a file that already
exists under a release version replaces it.

## Revert

Remove the `dependably` repository, and any `<mirror>`,
`distributionManagement` or `publishing` block, from your `pom.xml` or
`build.gradle`. Then delete the matching `<server>` entry from `settings.xml`
and the `dependablyToken` line from `gradle.properties`.
