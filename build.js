#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   Yamanote.fun — static build
   Assembles the deployable site into ./dist and pre-renders one HTML shell per
   station × direction so social crawlers (Twitterbot, facebookexternalhit,
   Slackbot, …) — which don't run JS — get per-station OG/Twitter metadata when
   a shared link like https://www.yamanote.fun/jy13-inner is unfurled.

   What it does:
     1. Copies the whole site into ./dist (everything a browser loads).
     2. Reads the station list straight from js/stations.js (single source of
        truth — no duplicated data here).
     3. For each of the 30 stations × 2 directions, writes
        dist/{code}-{direction}/index.html — a byte-for-byte copy of the main
        index.html with only the title + description + OG/Twitter meta swapped,
        so a real browser still boots the identical app once JS takes over.
     4. Writes dist/_redirects: the 60 explicit shell rules first (Netlify
        matches top-down + static files win over rewrites), then the SPA
        catch-all for anything else.

   FOLLOW-UP (separate task): per-station share-card images. og:image is stubbed
   here with the existing icon-512 for every station. Real per-station cards
   want an image step — pre-rendered at build time via headless browser/canvas
   to dist/og/{code}-{direction}.png, or a Cloudflare Worker rendering on
   request — then point og:image / twitter:image at /og/{code}-{direction}.png.
   ─────────────────────────────────────────────────────────────────────────── */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const SITE_ORIGIN = "https://www.yamanote.fun";
// Stub share image until per-station cards exist (see FOLLOW-UP above).
const OG_IMAGE_STUB = SITE_ORIGIN + "/icons/icon-512-0.3.png";

// Paths never copied into dist (build tooling, VCS, editor cruft). The root
// _redirects is intentionally excluded — we emit the full dist/_redirects.
const EXCLUDE = new Set([
  ".git", "node_modules", "dist", ".claude",
  "build.js", "package.json", "package-lock.json",
  "netlify.toml", ".gitignore", ".DS_Store", "_redirects",
]);

// Romaji station name → URL slug. MUST stay in sync with slugify() in
// js/app.js so the path the running app writes (replaceState) matches the
// pre-rendered shell emitted here. Strips macrons (Tōkyō → tokyo), lowercases,
// collapses non-alphanumerics to single hyphens (Nishi-Nippori → nishi-nippori).
function slugify(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loadStations() {
  const code = fs.readFileSync(path.join(ROOT, "js", "stations.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const stations = sandbox.window.YAMANOTE_STATIONS;
  if (!Array.isArray(stations) || !stations.length) {
    throw new Error("Could not read YAMANOTE_STATIONS from js/stations.js");
  }
  return stations;
}

function copySite() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  // Copy each top-level entry individually — cpSync refuses to copy a directory
  // into its own subdirectory, so we can't copy ROOT → ROOT/dist wholesale.
  for (const name of fs.readdirSync(ROOT)) {
    if (EXCLUDE.has(name)) continue;
    fs.cpSync(path.join(ROOT, name), path.join(DIST, name), { recursive: true });
  }
}

// Replace the content of a single tag, leaving everything else byte-identical.
function setMeta(html, pattern, value) {
  if (!pattern.test(html)) {
    throw new Error("Meta pattern not found in index.html: " + pattern);
  }
  return html.replace(pattern, (_m, pre, _old, post) => pre + value + post);
}

function shellFor(html, station, dir) {
  const code = "JY" + station.jy;                 // e.g. "JY14"
  const slug = slugify(station.name);             // e.g. "mejiro"
  const lc = code.toLowerCase() + "-" + slug + "-" + dir;   // "jy14-mejiro-inner"
  const title = station.name + " — Yamanote.fun";
  const desc =
    "Listening to " + station.name + " on the Yamanote Line loop — " +
    "melodies, chimes, announcements, and ambience.";
  const url = SITE_ORIGIN + "/" + lc;

  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, "<title>" + title + "</title>");
  out = setMeta(out, /(<meta name="description" content=")([\s\S]*?)(")/, desc);
  out = setMeta(out, /(<link rel="canonical" href=")([\s\S]*?)(")/, url);
  out = setMeta(out, /(<meta property="og:title" content=")([\s\S]*?)(")/, title);
  out = setMeta(out, /(<meta property="og:description" content=")([\s\S]*?)(")/, desc);
  out = setMeta(out, /(<meta property="og:url" content=")([\s\S]*?)(")/, url);
  out = setMeta(out, /(<meta property="og:image" content=")([\s\S]*?)(")/, OG_IMAGE_STUB);
  out = setMeta(out, /(<meta name="twitter:title" content=")([\s\S]*?)(")/, title);
  out = setMeta(out, /(<meta name="twitter:description" content=")([\s\S]*?)(")/, desc);
  out = setMeta(out, /(<meta name="twitter:image" content=")([\s\S]*?)(")/, OG_IMAGE_STUB);
  return { lc, html: out };
}

function build() {
  const stations = loadStations();
  copySite();

  const baseHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const directions = ["inner", "outer"];
  const redirectRules = [];

  let count = 0;
  for (const station of stations) {
    for (const dir of directions) {
      const { lc, html } = shellFor(baseHtml, station, dir);
      const dir3 = path.join(DIST, lc);
      fs.mkdirSync(dir3, { recursive: true });
      fs.writeFileSync(path.join(dir3, "index.html"), html);
      // Explicit rule first so it's matched before the catch-all (Netlify reads
      // _redirects top-down; static files already win over rewrites, but listing
      // them keeps the intent explicit and robust).
      redirectRules.push("/" + lc + "    /" + lc + "/index.html    200");
      count++;
    }
  }

  const redirects =
    "# Pre-rendered per-station OG shells (generated by build.js).\n" +
    "# These 60 explicit rules precede the SPA catch-all so crawlers and direct\n" +
    "# loads of /{code}-{direction} get the station-specific shell.\n\n" +
    redirectRules.join("\n") +
    "\n\n# SPA catch-all: any other path boots the client-side router.\n" +
    "/*    /index.html    200\n";
  fs.writeFileSync(path.join(DIST, "_redirects"), redirects);

  console.log(
    "Built dist/ — " + stations.length + " stations × " + directions.length +
    " directions = " + count + " shells, plus _redirects."
  );
}

build();
