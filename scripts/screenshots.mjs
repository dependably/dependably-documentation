#!/usr/bin/env node
// Capture the web-UI screenshots embedded under docs/en/web-ui/images/ from a live
// Dependably instance, so every image is a real render of the product as it ships.
//
// Usage (credentials come from the environment — never from this file, an argument, or a prompt):
//
//   DEPENDABLY_URL=http://demo.localhost:8080 \
//   DEPENDABLY_EMAIL=member@example.com \
//   DEPENDABLY_PASSWORD='…' \
//   node scripts/screenshots.mjs [page …]
//
// Leave DEPENDABLY_EMAIL/PASSWORD unset and a browser window opens instead: sign in there
// yourself and the script continues once the console appears. With no page names every page
// is captured. Sign in as the role the pages are written
// for (a member for docs/en/web-ui/). Optional:
//   DEPENDABLY_WEB      path to the source repo's web/ (default ../dependably-community/web),
//                       used only to load its Playwright install.
//   DEPENDABLY_PACKAGE  ecosystem/name of the package to open for package-detail
//                       (default: the first row of the Packages list).
//   OUT_DIR             output directory (default docs/en/web-ui/images).
//   DEPENDABLY_THEME    'light' (default) or 'dark'. Dark captures are written as
//                       <page>.dark.png beside the light file; the docs engine shows the
//                       dark file when the reader's theme is dark.
//
// Every image is 1920 × 936 CSS pixels, light theme, English, sidebar expanded, at device
// scale 1 — matching the images already in the repo. The password is never printed.

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const webDir = path.resolve(repoRoot, process.env.DEPENDABLY_WEB ?? '../dependably-community/web')
const outDir = path.resolve(repoRoot, process.env.OUT_DIR ?? 'docs/en/web-ui/images')
const theme = process.env.DEPENDABLY_THEME ?? 'light'
if (theme !== 'light' && theme !== 'dark') {
  console.error(`DEPENDABLY_THEME must be 'light' or 'dark', not '${theme}'.`)
  process.exit(2)
}
const fileFor = name => path.join(outDir, theme === 'dark' ? `${name}.dark.png` : `${name}.png`)

const baseUrl = (process.env.DEPENDABLY_URL ?? '').replace(/\/$/, '')
const email = process.env.DEPENDABLY_EMAIL
const password = process.env.DEPENDABLY_PASSWORD
if (!baseUrl) {
  console.error('Set DEPENDABLY_URL in the environment.')
  process.exit(2)
}

let chromium
try {
  ;({ chromium } = createRequire(path.join(webDir, 'package.json'))('playwright'))
} catch {
  console.error(`Playwright not found under ${webDir}/node_modules — run "npm ci" there, or set DEPENDABLY_WEB.`)
  process.exit(2)
}

const VIEWPORT = { width: 1920, height: 936 }

// name → how to reach the state. `path` is navigated to after sign-in; `prepare` runs
// before the capture and receives the Playwright page.
const PAGES = {
  'login':           { path: '/login', anonymous: true },
  'overview':        { path: '/' },
  'packages-list':   { path: '/packages' },
  'package-detail':  { path: '/packages', prepare: openPackage },
  'projects':        { path: '/projects' },
  'lookup':          { path: '/lookup' },
  'vulnerabilities': { path: '/vulnerabilities' },
  'risk':            { path: '/risk' },
  'license-policy':  { path: '/license-policy' },
  'tokens':          { path: '/tokens' },
  'new-token':       { path: '/tokens', prepare: p => p.getByRole('button', { name: 'New token' }).click() },
  // The wizard remembers the last package manager chosen, so pin npm for a stable capture.
  'setup':           { path: '/setup', prepare: p => p.locator('select').filter({ has: p.locator('option[value="npm"]') }).selectOption('npm') },
  'profile':         { path: '/profile' },
}

async function openPackage(page) {
  const target = process.env.DEPENDABLY_PACKAGE
  if (target) {
    await page.goto(`${baseUrl}/package/${target}`)
  } else {
    await page.locator('table tbody tr').first().click()
  }
  await page.waitForURL(/\/package\//)
  await page.locator('table tbody tr').first().waitFor()
}

const requested = process.argv.slice(2)
const unknown = requested.filter(n => !PAGES[n])
if (unknown.length) {
  console.error(`Unknown page(s): ${unknown.join(', ')}. Known: ${Object.keys(PAGES).join(', ')}`)
  process.exit(2)
}
const names = requested.length ? requested : Object.keys(PAGES)
// Without credentials in the environment the browser opens on screen and the person at the
// keyboard signs in (and clears any forced password change or MFA step); the script waits
// for the console and then captures. Nothing but the person ever sees the password.
const manualLogin = names.some(n => !PAGES[n].anonymous) && !(email && password)

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ headless: !manualLogin })
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'en-CA' })
// The console reads these before first paint; setting them here keeps every capture in the
// same theme, locale and sidebar state regardless of what the signed-in account last chose.
await context.addInitScript((theme) => {
  localStorage.setItem('theme', theme)
  localStorage.setItem('sidebarCollapsed', '0')
  localStorage.setItem('locale', 'en')
  localStorage.setItem('httpBannerDismissed', '1')
}, theme)
const page = await context.newPage()

// The console keeps background requests going (stats refresh, search debounce), so
// Playwright's networkidle never fires reliably. Wait for the page's own heading and the
// first data render instead, then give the last paint a beat.
async function settle() {
  await page.locator('main h1').first().waitFor({ timeout: 15_000 })
  await page.locator('.skeleton, [aria-busy="true"]').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(600)
}

async function signIn() {
  await page.goto(`${baseUrl}/login`)
  if (manualLogin) {
    console.log('Sign in as the role the pages are written for in the browser window that just opened. Waiting up to 5 minutes…')
    await page.locator('nav.sidebar .nav-links').first().waitFor({ timeout: 300_000 })
    console.log('Signed in — capturing.')
    return
  }
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  try {
    await page.locator('nav.sidebar .nav-links').first().waitFor({ timeout: 15_000 })
  } catch {
    const err = await page.locator('.error, [role="alert"]').first().textContent().catch(() => null)
    console.error(`Sign-in did not reach the console${err ? `: ${err.trim()}` : ''}. ` +
      'Check the credentials, that the account is not mid password-rotation or MFA enrolment, and that the URL is the tenant host.')
    await browser.close()
    process.exit(1)
  }
}

let signedIn = false
for (const name of names) {
  const spec = PAGES[name]
  if (spec.anonymous) {
    // Capture from a fresh context so no session leaks into the anonymous screen.
    const anonCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    await anonCtx.addInitScript((theme) => { localStorage.setItem('theme', theme) }, theme)
    const anon = await anonCtx.newPage()
    await anon.goto(`${baseUrl}${spec.path}`)
    await anon.locator('#email').waitFor({ timeout: 15_000 })
    await anon.waitForTimeout(400)
    await anon.screenshot({ path: fileFor(name) })
    await anonCtx.close()
    console.log(`wrote ${path.basename(fileFor(name))}`)
    continue
  }
  if (!signedIn) { await signIn(); signedIn = true }
  await page.goto(`${baseUrl}${spec.path}`)
  await settle()
  if (spec.prepare) { await spec.prepare(page); await settle() }
  await page.screenshot({ path: fileFor(name) })
  console.log(`wrote ${path.basename(fileFor(name))}`)
}

await browser.close()
