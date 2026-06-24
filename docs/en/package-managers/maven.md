# Maven (Maven & Gradle)

Point Maven or Gradle at your Dependably organization.

You will need your **base URL** and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com`; substitute your own. On a multi-tenant instance your
organization is a subdomain, so use `https://default.repo.example.com/maven/`
instead — the path is always just `/maven/`.

Maven and Gradle authenticate with **HTTP Basic**: username `user` (any value
works — it is ignored), password your token. Your repository URL is:

```
https://repo.example.com/maven/
```

Locally published artifacts always take priority over upstream, so an internal
package can never be silently replaced by a public one of the same coordinates.

## Configure

### Maven

Maven keeps credentials separate from the project: reference the repository in
the project `pom.xml`, but put the token in your user `settings.xml`.

In `pom.xml`:

```xml
<repositories>
  <repository>
    <id>dependably</id>
    <url>https://repo.example.com/maven/</url>
  </repository>
</repositories>
```

In `~/.m2/settings.xml` (the `<id>` must match the one in `pom.xml`):

```xml
<settings>
  <servers>
    <server>
      <id>dependably</id>
      <username>user</username>
      <password>${env.DEPENDABLY_TOKEN}</password>
    </server>
  </servers>
</settings>
```

```bash
export DEPENDABLY_TOKEN=<your token>
```

The `pom.xml` is safe to commit; the token stays in `settings.xml`, outside the
project. To route every dependency through Dependably, add a catch-all
`<mirror>` in `settings.xml` (it reuses the `<server>` credentials because the
`<id>` matches):

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

In `build.gradle`, read credentials from a property or environment variable —
never a literal token:

```groovy
repositories {
    maven {
        url = uri("https://repo.example.com/maven/")
        credentials {
            username = "user"
            password = System.getenv("DEPENDABLY_TOKEN")
        }
    }
}
```

Alternatively keep the token in `~/.gradle/gradle.properties` (in your home
directory, not the project) and read it with `findProperty`:

```properties
dependablyToken=<your token>
```

```bash
chmod 600 ~/.gradle/gradle.properties
```

> **Plain HTTP:** if your instance is served over `http://`, Gradle rejects the
> repository unless you add `allowInsecureProtocol = true` inside the
> `maven { }` block. Maven 3.8.1+ blocks HTTP repositories via the default
> `maven-default-http-blocker` mirror — remove or shadow it in `settings.xml`
> if you hit a "blocked mirror" error. Prefer HTTPS where you can.

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
`-SNAPSHOT` filename always resolves to the latest. Release versions are
immutable.

## Revert

Remove the `dependably` repository (and any `<mirror>` or
`distributionManagement` / `maven-publish` block) from your `pom.xml` /
`build.gradle`, and delete the matching `<server>` entry from `settings.xml`.
