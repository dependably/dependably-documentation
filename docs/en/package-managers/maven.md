# Maven (Maven & Gradle)

Point Maven or Gradle at Dependably to install private artifacts, proxy public
ones, and publish your own.

You will need your **token** — create one in the web UI; see
[Getting started](../getting-started.md). The examples use `repo.example.com`;
substitute your own. Maven and Gradle authenticate with **HTTP Basic**: the
username `user` (any value works — it is ignored) and your token as the
password. Your repository URL is:

```
https://repo.example.com/maven/
```

Locally published artifacts always take priority over upstream, so an internal
package can never be silently replaced by a public one of the same coordinates.

## Configure

Maven and Gradle are configured through files — there is no CLI config command.
The blocks below are the minimum you need. The token lives in a user-level file
outside your project (so it is never committed); put it there directly.

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

### Gradle

In `build.gradle`:

```groovy
repositories {
    maven {
        url = uri("https://repo.example.com/maven/")
        credentials {
            username = "user"
            password = "<your token>"
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

The first download for a coordinate appears on the **Activity** page in the web
UI.

## Publishing

Publishing requires a token with the `publish:maven` capability.

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

For Gradle, apply the `maven-publish` plugin with a repository pointed at the
same URL, then `./gradlew publish`.

Dependably validates every uploaded checksum (`.sha1`, `.md5`) against the bytes
it received and rejects a mismatch. Versions ending in `-SNAPSHOT` are mutable —
each deploy stores a new timestamped build and a request for the plain
`-SNAPSHOT` filename always resolves to the latest. For release versions, whether
re-publishing the same version overwrites the existing one is governed by your
organization's same-version push policy (`versionOverwritePolicy`, `block` by
default); see [Settings](../admin/settings.md).

## Revert

Remove the `dependably` repository (and any `<mirror>` or
`distributionManagement` / `maven-publish` block) from your `pom.xml` /
`build.gradle`, and delete the matching `<server>` entry from `settings.xml`.
