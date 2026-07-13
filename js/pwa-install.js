/* ───────────────────────────────────────────────────────────
   Yamanote.fun — PWA install prompt
   A self-contained module: call init() once on load. It decides
   which (if any) install affordance to show based on platform,
   injects all overlay markup + styles into the DOM, and never
   nags once the user has dismissed (localStorage flag).

   Five scenarios, see README/spec:
     1. Android / Chromium  → beforeinstallprompt, custom bottom sheet
     2. iOS Safari          → instructional bottom sheet + arrow
     3. iOS in-app browser  → top sheet, shown immediately
     4. Already installed   → nothing
     5. Desktop (no bip)    → nothing

   All colours come from the CSS custom properties in styles.css, so
   the overlay re-themes for free in light mode. No hardcoded colours.
   ─────────────────────────────────────────────────────────── */

const DISMISS_KEY = "installPromptDismissed";
const ICON_SRC = "icons/icon-192-0.3.png";   // existing PWA manifest icon

// ── environment detection ──────────────────────────────────────────
const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua);
const isInStandaloneMode =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;
const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
const isInAppBrowser =
  /reddit|instagram|fbav|twitter|fban/i.test(ua) ||
  (isIOS && !isSafari && !isInStandaloneMode);

// The boot script in index.html also stamps html.standalone for older iOS.
const isInstalled =
  isInStandaloneMode ||
  document.documentElement.classList.contains("standalone");

let deferredPrompt = null;   // stashed beforeinstallprompt event
let shown = false;           // only ever surface one sheet per visit

function isDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === "true"; }
  catch (e) { return false; }
}
function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, "true"); } catch (e) {}
}

// Inline SVG share glyph mirroring Safari's toolbar icon (a square with an
// upward arrow lifting out of it). Drawn with currentColor so it inherits the
// surrounding text colour.
const SHARE_ICON = `<svg class="pwa-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 14V3"/><path d="m8 7 4-4 4 4"/><path d="M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8"/></svg>`;

// ── styles ──────────────────────────────────────────────────────────
// Injected once. Everything references the app's tokens; the only literal
// colour is the scrim, which the spec pins to rgba(0,0,0,0.6).
const CSS = `
.pwa-scrim {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.3s var(--ease);
}
.pwa-scrim.pwa-open { opacity: 1; }

.pwa-sheet {
  position: fixed; left: 0; right: 0; z-index: 9001;
  width: 100%; max-width: 480px; margin: 0 auto;
  background: var(--panel);
  color: var(--fg);
  border: 1px solid var(--panel-edge);
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: transform var(--dur) var(--ease);
  box-shadow: 0 -10px 50px rgba(0, 0, 0, 0.45);
}
.pwa-sheet--bottom {
  bottom: 0;
  border-top: 1px solid var(--panel-edge);
  border-radius: 22px 22px 0 0;
  padding: 24px 22px calc(env(safe-area-inset-bottom, 0px) + 24px);
  transform: translateY(100%);
}
.pwa-sheet--top {
  top: 0;
  border-bottom: 1px solid var(--panel-edge);
  border-radius: 0 0 22px 22px;
  padding: calc(env(safe-area-inset-top, 0px) + 22px) 22px 24px;
  transform: translateY(-100%);
}
.pwa-sheet.pwa-open { transform: translateY(0); }

.pwa-head { display: flex; align-items: center; gap: 14px; }
.pwa-app-icon {
  width: 52px; height: 52px; border-radius: 13px; flex-shrink: 0;
  border: 1px solid var(--panel-edge);
}
.pwa-title {
  font-size: 19px; font-weight: 700; letter-spacing: -0.01em;
  margin: 0; color: var(--fg);
}
.pwa-sub {
  font-size: 14px; line-height: 1.45; color: var(--dim);
  margin: 12px 0 0;
}

.pwa-steps { list-style: none; margin: 18px 0 0; padding: 0; }
.pwa-step {
  display: flex; align-items: flex-start; gap: 12px;
  font-size: 14.5px; line-height: 1.45; color: var(--fg);
  padding: 14px 0;
}
.pwa-step + .pwa-step { border-top: 1px solid var(--spine); }
.pwa-num {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
  background: var(--green); color: var(--bg);
  font-size: 13px; font-weight: 700;
  display: grid; place-items: center;
}
.pwa-share, .pwa-dots {
  display: inline-block; vertical-align: -3px; margin: 0 2px;
}
.pwa-share { width: 16px; height: 16px; }
.pwa-dots { font-weight: 700; letter-spacing: 1px; }

.pwa-btns { display: flex; gap: 10px; margin-top: 22px; }
.pwa-btn {
  flex: 1; font-family: inherit; font-size: 15px; font-weight: 700;
  letter-spacing: -0.01em; border: none; border-radius: 13px;
  padding: 15px 16px; cursor: pointer;
  box-shadow: var(--ctrl-inset);
}
.pwa-btn--primary { background: var(--green); color: var(--bg); }
.pwa-btn--primary:active { filter: brightness(0.94); }
.pwa-btn--dismiss {
  background: var(--ctrl-bg); color: var(--fg);
  border: 1px solid var(--panel-edge);
  -webkit-backdrop-filter: var(--ctrl-blur); backdrop-filter: var(--ctrl-blur);
}
.pwa-btn--dismiss:active { background: var(--ctrl-bg-active); }
`;

function injectStyles() {
  if (document.getElementById("pwa-install-styles")) return;
  const style = document.createElement("style");
  style.id = "pwa-install-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ── overlay lifecycle ───────────────────────────────────────────────
// Each show* builds its sheet, appends it, then flips the .pwa-open class on
// the next frame so the CSS transition runs.
let scrimEl = null;
let sheetEl = null;

function mount(sheet) {
  injectStyles();

  scrimEl = document.createElement("div");
  scrimEl.className = "pwa-scrim";

  sheetEl = sheet;

  document.body.appendChild(scrimEl);
  document.body.appendChild(sheetEl);

  // force layout, then animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrimEl.classList.add("pwa-open");
      sheetEl.classList.add("pwa-open");
    });
  });

  shown = true;
}

function teardown() {
  const els = [scrimEl, sheetEl].filter(Boolean);
  els.forEach((el) => el.classList.remove("pwa-open"));

  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    els.forEach((el) => el.remove());
    scrimEl = sheetEl = null;
  };
  if (sheetEl) {
    sheetEl.addEventListener("transitionend", remove, { once: true });
  }
  // belt-and-braces in case the transition never fires
  setTimeout(remove, 700);
}

// Close the overlay and never show it again.
function dismiss() {
  markDismissed();
  teardown();
}

// small DOM helpers
function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
}
function steps(items) {
  const ol = el("ol", "pwa-steps");
  items.forEach((html, i) => {
    const li = el("li", "pwa-step");
    li.appendChild(el("span", "pwa-num", String(i + 1)));
    li.appendChild(el("span", null, html));
    ol.appendChild(li);
  });
  return ol;
}

// ── Scenario 1 — Android / Chromium install sheet ───────────────────
function showAndroidSheet() {
  if (shown || isDismissed() || !deferredPrompt) return;

  const sheet = el("div", "pwa-sheet pwa-sheet--bottom");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Add Yamanote.fun to your home screen");

  const head = el("div", "pwa-head");
  const icon = el("img", "pwa-app-icon");
  icon.src = ICON_SRC;
  icon.alt = "";
  head.appendChild(icon);
  head.appendChild(el("h2", "pwa-title", "Add Yamanote.fun"));
  sheet.appendChild(head);

  sheet.appendChild(el("p", "pwa-sub",
    "Keep the loop on your home screen and listen offline, anytime."));

  const btns = el("div", "pwa-btns");
  const notNow = el("button", "pwa-btn pwa-btn--dismiss", "Not now");
  notNow.type = "button";
  notNow.addEventListener("click", dismiss);

  const install = el("button", "pwa-btn pwa-btn--primary", "Install");
  install.type = "button";
  install.addEventListener("click", async () => {
    if (!deferredPrompt) { dismiss(); return; }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
    dismiss();   // accepted or not, don't ask again
  });

  btns.appendChild(notNow);
  btns.appendChild(install);
  sheet.appendChild(btns);

  mount(sheet);
}

// ── Scenario 2 — iOS Safari instructional sheet ─────────────────────
function showIOSSafariSheet() {
  if (shown || isDismissed()) return;

  const sheet = el("div", "pwa-sheet pwa-sheet--bottom");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Add to your home screen");

  sheet.appendChild(el("h2", "pwa-title", "Add to your home screen"));
  sheet.appendChild(el("p", "pwa-sub",
    "Install the app for offline listening, anytime you ride the loop."));

  sheet.appendChild(steps([
    `Tap the ${SHARE_ICON} Share button in the toolbar below`,
    "Scroll down and tap <b>Add to Home Screen</b>",
    "Tap <b>Add</b> to confirm",
  ]));

  const btns = el("div", "pwa-btns");
  const notNow = el("button", "pwa-btn pwa-btn--dismiss", "Not now");
  notNow.type = "button";
  notNow.addEventListener("click", dismiss);
  btns.appendChild(notNow);
  sheet.appendChild(btns);

  mount(sheet);
}

// ── Scenario 3 — iOS in-app browser ("open in Safari") ──────────────
function showInAppBrowserSheet() {
  if (shown || isDismissed()) return;

  const sheet = el("div", "pwa-sheet pwa-sheet--top");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Open in Safari to install");

  sheet.appendChild(el("h2", "pwa-title", "Open in Safari to install"));
  sheet.appendChild(el("p", "pwa-sub",
    "This browser can’t add apps to your home screen — you’ll need Safari."));

  sheet.appendChild(steps([
    `Tap <span class="pwa-dots">•••</span> in the top-right corner of this browser`,
    "Choose <b>Open in Safari</b> from the menu",
    `Tap ${SHARE_ICON} <b>Share</b>, then <b>Add to Home Screen</b>`,
  ]));

  const btns = el("div", "pwa-btns");
  const notNow = el("button", "pwa-btn pwa-btn--dismiss", "Not now");
  notNow.type = "button";
  notNow.addEventListener("click", dismiss);
  btns.appendChild(notNow);
  sheet.appendChild(btns);

  mount(sheet);
}

// ── entry point ─────────────────────────────────────────────────────
export function init() {
  // Scenario 4 — already installed: do nothing, ever.
  if (isInstalled) return;

  // Respect a previous dismissal everywhere.
  if (isDismissed()) return;

  const installParam =
    new URLSearchParams(window.location.search).get("install") === "1";

  // Scenario 3 — iOS in-app browser: show immediately, don't wait for audio.
  if (isIOS && isInAppBrowser) {
    showInAppBrowserSheet();
    return;
  }

  // Arrived from the in-app "open in Safari" hand-off: skip the audio trigger
  // and surface the Safari install sheet right away.
  if (installParam && isSafari && !isInStandaloneMode) {
    showIOSSafariSheet();
    return;
  }

  // Scenario 2 — iOS Safari: instructional sheet after a full station play.
  if (isIOS && isSafari && !isInStandaloneMode) {
    window.addEventListener("stationComplete", showIOSSafariSheet, { once: true });
  }

  // Scenario 1 — Android / Chromium: stash the prompt, surface our own UI
  // after a full station play. Scenario 5 (desktop, no event) falls through
  // here and simply never fires.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.addEventListener("stationComplete", showAndroidSheet, { once: true });
  });
}
