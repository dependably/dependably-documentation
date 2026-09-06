---
name: docs
description: Write or refresh a Dependably documentation page so that every sentence and every screenshot is true of the product as it ships today. Use for any change under docs/ — a new page, a rewrite, a screenshot refresh, or an audit for drift. Grounds each claim in the dependably-community source and each screenshot in a live instance; nothing is written from memory.
---

# Dependably docs: true of the product, or not written

Every page under `docs/` is a promise to a reader who will act on it. The only
acceptable failure is a missing sentence; a wrong one costs a support ticket and
the reader's trust. This skill exists to make "only what is based in truth" the
default path, not a review afterthought.

The general craft (audience, templates, answerability gate) is the global
`documentation` skill — load it first. This file adds the Dependably-specific
mechanics: where truth comes from, how screenshots are taken, and the gates a
page must pass.

## Sources of truth, in order

| Claim about | Verify against | Never against |
| ----------- | -------------- | ------------- |
| A UI label, button, column, message | `web/src/locales/en.json` in the source repo, quoted verbatim | memory, an old screenshot, the current doc page |
| What a page shows, in what order, to which role | The page's `.svelte` under `web/src/pages/` and `web/src/lib/`, plus `web/src/lib/routes.js` (`ADMIN_ONLY_PAGES`) and `Sidebar.svelte` | the previous doc page |
| A number, window, threshold, default, enum, limit | The backend controller / service / `Schema.sql` that produces it | approximation, rounding, "about" |
| Who may do something | `[RequireCapability]` on the endpoint and the role → capability map in `src/Dependably.Core/Security/` | the RBAC doc page |
| A route, URL form, file name, command | The controller route, `OrgController.GetSetup`, or `lib/installCommand.js` | a sibling doc page |
| What the screen looks like | A screenshot taken **today** from a running instance built from current `main` | an image already in `images/` |

The source repo is the sibling checkout `../dependably-community`. Confirm it is
on `main` and current (`git -C ../dependably-community log -1 --format='%h %ci'`)
before grounding against it, and record that commit in your working notes.

**The existing doc page is a hypothesis, not evidence.** Re-derive every claim.
The most expensive errors in this repo have been claims copied forward from a
page that was once true.

## What "based in truth" rules out

- **No invented artefacts.** A page, tab, column, filter, setting, scope, event,
  endpoint, or message that you cannot point at in source does not go in the doc.
- **No numbers from memory.** Windows ("last 30 days"), thresholds, limits,
  counts of anything (recovery codes, page sizes, skills) are copied from the
  code that produces them, with the file noted in your working notes.
- **No "coming soon", "planned", "will".** Document what ships. If a page in
  the UI is a placeholder, say it is a placeholder, quoting its own text.
- **No role guesses.** "Requires elevated permissions" is not a claim; name the
  role or capability the code checks, or link the RBAC page and say nothing more.
- **No positive framing that overstates.** Lead with the capability, but never
  past what the code does.
- **No UI bug promoted to fact.** A literal `{placeholder}`, a dead string, or a
  control that fails for the role it is shown to is a product defect: report
  it to the user (and file it against the source repo), do not describe it as
  behaviour.
- **No screenshot that misrepresents.** No edited, composited, mocked, or stale
  image. If the instance has little data, the screenshot shows little data —
  seed real data through the product's own paths (pull a package, upload an
  SBOM) or accept the honest empty state. Never fabricate rows.
- **No secrets.** No real token, password, recovery code, or internal hostname
  in text or pixels. Crop or re-shoot rather than blur.

If a claim cannot be verified, leave it out and say so in the merge request,
not in the page.

## Roles: write for one reader per page

Pages under `web-ui/` are for the **member** role unless the title says
otherwise. State up front what a member sees; put admin/owner-only actions in a
clearly labelled section or on the `admin/` page, never interleaved. A member
must be able to read the page without tripping over a button they will never
see. The page for an admin-only surface (Quarantine, Users, Audit, Upload,
Settings) says in its first lines which roles can open it, per `ADMIN_ONLY_PAGES`
and the sidebar gating.

## Screenshots

- **Instance.** A running build of current `main`. The local demo
  (`http://demo.localhost:8080/`, multi-tenant, org `demo`) or another instance
  the user names. Check `/api/v1/bootstrap` and the version in the sidebar
  footer; record both in the MR description.
- **Account.** Signed in as the role the page is written for — a **member**
  for `web-ui/` pages. Never sign in yourself; the user signs in, you drive
  the signed-in session.
- **Viewport.** 1920 × 936 CSS pixels, English (`en`), sidebar expanded, no
  browser chrome. All existing images are this size; keep it so the pages
  render consistently.
- **Both themes.** Every page image exists twice: `<name>.png` in the light
  theme and `<name>.dark.png` in the dark theme, captured in the same pass
  from the same state. The page embeds only `<name>.png`; the docs engine
  swaps in the `.dark.png` sibling when the reader's theme is dark. When only
  one variant exists the engine shows it in both themes, so a missing twin is
  never a broken image — but a rewritten page retakes both.
- **Content.** Real data that arrived through the product (pulled packages,
  uploaded SBOMs, created tokens). The only redaction is cropping. A token
  value must never be on screen — capture the dialog before **Create**, or
  after the value has been dismissed.
- **File.** PNG under `docs/en/web-ui/images/`, kebab-case, named for the page
  (`packages-list.png`, `package-detail.png`). Replace the old file at the same
  path so links stay valid; add new names only for new pages.
- **Alt text.** One sentence describing what is on screen, written so a reader
  using a screen reader or an assistant gets the same information as the image.
- **Freshness.** Every image a page embeds is retaken in the same pass the
  page is rewritten. A rewritten page with an old screenshot is drift by
  another name.
- **How.** `scripts/screenshots.mjs` signs in with credentials from the
  environment (the user sets them; you never see or type a password), forces
  the viewport, theme, locale and sidebar state above, and writes one PNG per
  page name. Ask the user to run it, then check every image before embedding:

  ```bash
  DEPENDABLY_URL=http://demo.localhost:8080 DEPENDABLY_EMAIL=… DEPENDABLY_PASSWORD=… node scripts/screenshots.mjs
  ```

  Run it twice, once with `DEPENDABLY_THEME=dark`, so both variants come from
  the same session. Add a page to the script's `PAGES` table when a new page
  needs an image.

## Procedure for a page

1. **Ground.** For anything bigger than a one-line fix, spawn one read-only
   scout per surface (page, endpoint, feature) with the file list above and the
   existing page text; ask for a fact sheet with `file:line` citations and a
   DRIFT list of wrong claims. Do not draft before the fact sheets are back.
2. **Draft** from the fact sheets only. Follow the page skeleton of its type
   (see the global `documentation` skill) and the sibling page's voice.
   Frontmatter carries a one-sentence `description` under 155 characters,
   written for the phrase a searcher types.
3. **Screenshot** per the rules above, then write the alt text from the image.
4. **Answerability gate.** Give the rendered page alone to a fresh reader
   subagent with 5–10 realistic questions. Fix every gap it reports.
5. **Gates.** Run what CI runs, from the repo root:

   ```bash
   uvx codespell docs/ README.md
   npx -y markdownlint-cli2 "docs/**/*.md" "README.md"
   lychee --no-progress --exclude '^https?://' docs/ README.md
   ```

   (`pip install codespell` fails here — the private index needs auth; `uvx` works.)
6. **Housekeeping.** New page → add it to the tree in `README.md`, to the
   section index (`web-ui/index.md` etc.), and to the landing page's link list.
   A folder's `index.md` *is* its sidebar section: its `# Title` is the section
   label and the section row links to it, so keep that title short and give
   the page an `order` in frontmatter if the sections should not sort by title.
   Removed or renamed page → fix every inbound link (`grep -rn` the old path).
7. **MR description** names the source commit, the instance and version
   screenshots came from, and any claim deliberately left out for lack of
   evidence.

## Language

Prose is Canadian English per `../dependably-community/i18n/glossary.md`:
*licence* the noun, *license* the verb; *artefact*; *colour*; `-ize`. UI labels,
identifiers, SPDX fields, API enums, and quoted messages keep their exact
spelling from source even when it is US English.

## Fact-sheet shape (what a scout returns)

```
## <Surface>
Route: /packages (web/src/lib/routes.js:17)
Visible to: member, admin, owner (Sidebar.svelte:12)
### Elements, in on-screen order
- "Search packages…" — matches name and PURL (Packages.svelte:88; PackagesController.cs:41)
- …
### Actions and who may take them
- Download artefact — capability read:packages (VersionController.cs:120)
### States
- Empty: "No packages" (en.json packages.empty)
## DRIFT against docs/en/web-ui/packages.md
- L12 says "Filter by ecosystem (…, Cargo)" — list now ends with Hex (ecosystems.js:9)
```

The doc page gets the facts; the citations stay in the MR and the working notes.
