# Maven (Maven & Gradle)

Point Maven or Gradle at your Dependably organization.

You will need your **base URL**, **org slug**, and a **token** — see
[Getting started](../getting-started.md). The examples below use
`repo.example.com` and the org `default`; substitute your own.

Maven authenticates with **HTTP Basic**: username `user`, password your token.
Your repository URL is:

```
https://repo.example.com/o/default/maven/
```

Locally published artifacts always take priority over upstream, so an internal
package can never be silently replaced by a public one of the same name.

---

## Per-project

### Maven

Maven keeps credentials separate from the project. Reference the repository in
the project `pom.xml`, but put the token in your user `settings.xml`.

In `pom.xml`:

```xml
<repositories>
  <repository>
    <id>dependably</id>
    <url>https://repo.example.com/o/default/maven/</url>
  </repository>
</repositories>
```

In `~/.m2/settings.xml` (the `<id>` must match):

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
project.

### Gradle

In `build.gradle`:

```groovy
repositories {
    maven {
        url = uri("https://repo.example.com/o/default/maven/")
        credentials {
            username = "user"
            password = System.getenv("DEPENDABLY_TOKEN")
        }
    }
}
```

Keep the token out of `build.gradle` — read it from the environment (shown
above) or from `~/.gradle/gradle.properties`.

---

## Global (per-machine)

To make Dependably the default for every build, configure it once in your user
files rather than per project.

- **Maven:** define the repository inside a `<profile>` in `~/.m2/settings.xml`
  and activate it by default, alongside the `<server>` credentials shown above.
- **Gradle:** put the repository in an init script at
  `~/.gradle/init.gradle`, with the token in `~/.gradle/gradle.properties`.

In both cases the token lives in a file in your home directory, not in source
control. Keep its permissions tight:

```bash
chmod 600 ~/.m2/settings.xml
```

---

## Verify

Build a project that has at least one dependency:

```bash
mvn dependency:resolve     # or: ./gradlew dependencies
```

The first download records a `first_fetch` entry on the **Activity** page in
the web UI.

> **Plain HTTP:** Maven and Gradle both accept `http://` repository URLs
> without an extra flag. Note that Maven 3.8.1+ blocks HTTP repos via a
> default `maven-default-http-blocker` mirror — remove or shadow it in
> `~/.m2/settings.xml` if you hit a "blocked mirror" error. Prefer HTTPS
> where you can.

---

## Publishing

Configure a `distributionManagement` repository (Maven) or the
`maven-publish` plugin (Gradle) pointed at the same URL, then run `mvn deploy`
or `./gradlew publish`. Publishing requires a token with publish permission.

---

## Revert

Remove the `dependably` repository block from your `pom.xml` / `build.gradle`
(or the user-level files) and the matching `<server>` entry from
`settings.xml`.
