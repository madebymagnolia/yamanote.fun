/* ───────────────────────────────────────────────────────────
   Yamanote Line player — role-based layout engine
   The current station BLOCK (JY box + name) is centred in the band
   between the loop toggle and the play controls. The previous name
   is centred in the space above the block; the next name in the
   space below it. Only previous · current · next are visible — every
   other station is faded out. Each station animates to the position
   for its role (offset from current); the loop wraps via modular
   offset, so no copies or re-centring are needed.
   ─────────────────────────────────────────────────────────── */
(function () {
  const S = window.YAMANOTE_STATIONS;
  const N = S.length;                 // 30
  const DUR_MS = 620;                 // keep in sync with --dur

  const BOX         = 64;    // JY number box size
  const GAP         = 16;    // box ↔ name gap
  const NAME        = 36;    // active name line height
  const SCRUB_BELOW = 44;    // space below name centre reserved for the scrub bar
  const BLOCK = BOX + GAP + NAME + SCRUB_BELOW;   // total active-station block

  const DESKTOP_BP    = 640;    // keep in sync with the CSS @media breakpoint
  const DESKTOP_SCALE = 1.25;   // keep in sync with the CSS `.ribbon { scale: ... }`

  const ribbon   = document.getElementById("ribbon");
  const stage    = document.getElementById("stage");
  const playBtn  = document.getElementById("play");
  const innerBtn = document.getElementById("inner");
  const outerBtn = document.getElementById("outer");

  // Per-station scrub containers (built inside each .station div by build()).
  // scrubChip / scrubTrack / scrubHead / scrubSegments are transient refs
  // that always point to the *active* station's scrub elements.
  const itemScrubs    = [];
  let   scrubChip      = null;
  let   scrubHoverChip = null;   // grey chip shown above a hovered inactive segment
  let   scrubTimeCur   = null;
  let   scrubTimeTotal = null;
  let   scrubTrack     = null;
  let   scrubHead      = null;
  let   scrubSegments  = [];
  let   scrubBuiltFor  = null;   // "outer:0" — guard against redundant rebuilds
  let   scrubRafId     = null;

  let currentIndex = 30;              // open on Tokyo (JY01 → array index 01)
  let direction = +1;                 // outer loop ascends; inner loop descends
  let playing = false;
  let spineOffset = 0;                // accumulated dotted-line scroll

  // computed in measure()
  let nameCenter = 0, prevCenter = 0, nextCenter = 0;
  let upGap = 0, downGap = 0;
  let dotPeriod = 10, lineStep = 120;

  /* ── scrub bar ──────────────────────────────────────────────────────────
     Layout: [current-time] [track ≤204px] [total-time], centred per station.
     The active section and all past sections are fully green; the thin
     playhead line shows the exact position within the active section.
     A chip label floats above the track, centred on the active segment.
     ─────────────────────────────────────────────────────────────────────── */
  function currentSections() {
    const st = S[normIdx(currentIndex)];
    return (st.sections && st.sections[loopKey()]) || null;
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var m = Math.floor(s / 60);
    return m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function buildScrubBar() {
    const key = loopKey() + ":" + normIdx(currentIndex);
    if (scrubBuiltFor === key) return;
    scrubBuiltFor = key;

    const idx       = normIdx(currentIndex);
    const container = itemScrubs[idx];
    if (!container) return;

    container.innerHTML = "";
    scrubChip      = null;
    scrubHoverChip = null;
    scrubTimeCur   = null;
    scrubTimeTotal = null;
    scrubTrack     = null;
    scrubHead      = null;
    scrubSegments  = [];

    const sections = currentSections();
    if (!sections || sections.length === 0) return;

    // Flex row: [current-time] [track] [total-time], centred in the station.
    var row = document.createElement("div");
    row.className = "scrub-row";
    container.appendChild(row);

    scrubTimeCur = document.createElement("span");
    scrubTimeCur.className = "scrub-time scrub-time-cur";
    scrubTimeCur.textContent = "0:00";
    row.appendChild(scrubTimeCur);

    scrubTrack = document.createElement("div");
    scrubTrack.className = "scrub-track";
    row.appendChild(scrubTrack);

    // Chip label — absolutely positioned inside the track, floats above it.
    scrubChip = document.createElement("div");
    scrubChip.className = "scrub-chip";
    scrubChip.textContent = sections[0].label;
    scrubTrack.appendChild(scrubChip);

    // Grey twin shown above whichever inactive segment is being hovered; the
    // green active chip hides while it's up, and returns on mouse-out.
    scrubHoverChip = document.createElement("div");
    scrubHoverChip.className = "scrub-chip scrub-chip--hover is-hidden";
    scrubTrack.appendChild(scrubHoverChip);

    // Head lives inside the track; segments are inserted before it.
    scrubHead = document.createElement("div");
    scrubHead.className = "scrub-head";
    scrubTrack.appendChild(scrubHead);

    sections.forEach(function (sec, i) {
      const segStart = i > 0 ? sections[i - 1].end : 0;
      const segDur   = sec.end - segStart;
      var seg  = document.createElement("div");
      seg.className  = "scrub-segment";
      if (i === 0)                   seg.classList.add("scrub-segment--first");
      if (i === sections.length - 1) seg.classList.add("scrub-segment--last");
      seg.style.flexGrow = segDur;
      var fill = document.createElement("div");
      fill.className = "scrub-fill";
      seg.appendChild(fill);
      // Click a segment to jump to its start. segStart is captured per
      // iteration (const above), so each segment seeks to its own boundary.
      seg.addEventListener("click", function () {
        if (!current) return;
        if (seg.classList.contains("scrub-segment--active")) return;  // already here
        try { current.currentTime = segStart; } catch (e) {}
        updateScrubBar();   // reflect the jump immediately, even while paused
        hideHoverChip();    // this segment is now active — swap grey chip for green at once
      });
      scrubTrack.insertBefore(seg, scrubHead);
      scrubSegments.push(seg);
    });

    // Chip swap is handled at the track level (not per segment) so moving the
    // cursor horizontally across the gaps never flickers back to the active
    // chip: the grey chip only reverts on a true vertical exit (track
    // mouseleave) or when the cursor reaches the active segment.
    scrubTrack.addEventListener("mousemove", function (e) {
      const seg = e.target.closest && e.target.closest(".scrub-segment");
      if (!seg) return;
      if (seg.classList.contains("scrub-segment--active")) { hideHoverChip(); return; }
      const i = scrubSegments.indexOf(seg);
      const secs = currentSections();
      if (i < 0 || !secs || !secs[i]) return;
      showHoverChip(i, secs[i].label);
    });
    scrubTrack.addEventListener("mouseleave", hideHoverChip);

    scrubTimeTotal = document.createElement("span");
    scrubTimeTotal.className = "scrub-time scrub-time-total";
    scrubTimeTotal.textContent = "0:00";
    row.appendChild(scrubTimeTotal);

    // Position the head/chip now. updateScrubBar() is measurement-free (it
    // computes positions with calc(), never reading layout — see there), so
    // this is just style writes: no forced reflow, and the chip starts in the
    // right place instead of flashing at the track's left edge for a frame.
    updateScrubBar();
  }

  // Track-relative `left` for the centre of section i, using the same gap-aware
  // calc() the active chip uses (see updateScrubBar's posCalc). Pure calc() is
  // scale-independent — unlike getBoundingClientRect, which returns scaled px on
  // the 125%-zoomed desktop ribbon and would push the chip off-centre.
  function sectionCenterCalc(i) {
    const sections = currentSections();
    if (!sections || !sections[i]) return "0px";
    const sumDur   = sections[sections.length - 1].end || 1;
    const totalGap = (sections.length - 1) * SCRUB_GAP;
    const segStart = i > 0 ? sections[i - 1].end : 0;
    const tv       = (segStart + sections[i].end) / 2;
    const frac     = Math.min(1, Math.max(0, tv / sumDur));
    return "calc(" + frac + " * (100% - " + totalGap + "px) + " + (i * SCRUB_GAP) + "px)";
  }

  // Grey hover chip: centre it over section i and hide the active chip.
  function showHoverChip(i, label) {
    if (!scrubHoverChip) return;
    scrubHoverChip.style.left = sectionCenterCalc(i);
    scrubHoverChip.textContent = label;
    scrubHoverChip.classList.remove("is-hidden");
    if (scrubChip) scrubChip.classList.add("is-hidden");
  }
  function hideHoverChip() {
    if (scrubHoverChip) scrubHoverChip.classList.add("is-hidden");
    if (scrubChip) scrubChip.classList.remove("is-hidden");
  }

  // Keep in sync with the `gap` on .scrub-track in styles.css.
  const SCRUB_GAP = 4;

  // Lay out the head and chip with pure arithmetic + calc(), never
  // getBoundingClientRect(). Reading layout here used to force a synchronous
  // reflow of the whole scaled ribbon — once per navigation while paused (which
  // hitched the slide) and once PER FRAME while playing. The track is a flex
  // row whose segments have flex-grow = their duration, so each segment's width
  // is exactly proportional to its duration: a point at time `tv` sits at
  // fraction tv/sumDur of the segment area (track width minus the fixed
  // inter-segment gaps), plus the whole gaps that precede it. Emitting that as a
  // calc() lets the browser resolve the pixels at its normal layout time, so a
  // style write here never forces a reflow from JS.
  function updateScrubBar() {
    if (!scrubHead || !scrubSegments.length || !scrubTrack) return;
    const sections = currentSections();
    if (!sections) return;

    const t   = (current && isFinite(current.currentTime)) ? current.currentTime : 0;
    const tot = (current && isFinite(current.duration))    ? current.duration
                                                           : sections[sections.length - 1].end;

    if (scrubTimeCur)   scrubTimeCur.textContent   = fmtTime(t);
    if (scrubTimeTotal) scrubTimeTotal.textContent = fmtTime(tot);

    // Find which section is active.
    var si = sections.length - 1;
    for (var i = 0; i < sections.length; i++) {
      if (t < sections[i].end) { si = i; break; }
    }

    const segStart = si > 0 ? sections[si - 1].end : 0;
    const segEnd   = sections[si].end;
    const segDur   = segEnd - segStart;
    const progress = segDur > 0 ? Math.min(1, Math.max(0, (t - segStart) / segDur)) : 0;

    // Only the active section is lit; past and future stay dim. The active
    // segment is also flagged so it can't be clicked/hovered (you're already
    // there — seeking to its own start would be a no-op).
    scrubSegments.forEach(function (seg, i) {
      seg.querySelector(".scrub-fill").style.width = (i === si) ? "100%" : "0%";
      seg.classList.toggle("scrub-segment--active", i === si);
    });

    const sumDur   = sections[sections.length - 1].end || 1;
    const gapsPx   = si * SCRUB_GAP;                         // whole gaps before segment si
    const totalGap = (sections.length - 1) * SCRUB_GAP;      // all inter-segment gaps

    // CSS `left` within the track for a given time, gap-aware, no measuring.
    const posCalc = function (tv) {
      var frac = Math.min(1, Math.max(0, tv / sumDur));
      return "calc(" + frac + " * (100% - " + totalGap + "px) + " + gapsPx + "px)";
    };

    scrubHead.style.left = posCalc(segStart + progress * segDur);

    if (scrubChip) {
      scrubChip.style.left = posCalc((segStart + segEnd) / 2);
      scrubChip.textContent = sections[si].label;
    }
  }

  function startScrubRaf() {
    if (scrubRafId) return;
    function tick() {
      updateScrubBar();
      scrubRafId = playing ? requestAnimationFrame(tick) : null;
    }
    scrubRafId = requestAnimationFrame(tick);
  }

  function stopScrubRaf() {
    if (scrubRafId) { cancelAnimationFrame(scrubRafId); scrubRafId = null; }
    updateScrubBar();   // snapshot position at the moment of pause
  }

  /* build the station elements (one copy — looping is modular) ------------- */
  const items = [];
  const names = [];   // per-station name elements, for the EN/JP language toggle
  let spine;
  function build() {
    ribbon.innerHTML = "";

    spine = document.createElement("div");
    spine.className = "spine";
    ribbon.appendChild(spine);

    for (let i = 0; i < N; i++) {
      const st = S[i];
      const el = document.createElement("div");
      el.className = "station";

      const eraser = document.createElement("div");
      eraser.className = "eraser";

      const badge = document.createElement("div");
      badge.className = "badge";
      badge.innerHTML =
        '<div class="inner"><span class="jy">JY</span>' +
        '<span class="num">' + st.jy + '</span></div>';

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = st.name;
      name.addEventListener("click", () => jumpTo(i));

      const scrub = document.createElement("div");
      scrub.className = "scrub";

      el.appendChild(eraser);
      el.appendChild(badge);
      el.appendChild(name);
      el.appendChild(scrub);
      ribbon.appendChild(el);
      items[i]      = el;
      names[i]      = name;
      itemScrubs[i] = scrub;
    }
  }

  /* layout maths ----------------------------------------------------------- */
  function measure() {
    const toggleEl = document.querySelector(".toggle");
    const ctrlEl   = document.querySelector(".controls");
    // Use layout geometry (offsetTop/offsetHeight), NOT getBoundingClientRect:
    // during boot the toggle and controls are parked off-screen by CSS
    // transforms, and rect-based measurement would read those transformed
    // positions — placing prev/next behind the chrome. offset* ignores
    // transforms, so the band is always measured against the resting layout.
    const T = toggleEl.offsetTop + toggleEl.offsetHeight;  // band top (below toggle)
    const C = ctrlEl.offsetTop;                            // band bottom (above controls)
    const mid = (T + C) / 2;
    dotPeriod = 10;

    // Desktop zooms .ribbon by DESKTOP_SCALE, anchored at `mid` (--ribbon-mid
    // in CSS) — so the active block renders BLOCK*S tall, centred on mid.
    // nameCenter needs no adjustment: it's expressed proportionally to mid,
    // so it scales correctly along with everything else automatically.
    // prevCenter/nextCenter are different: they're meant to sit exactly
    // midway between the (fixed, unscaled) chrome and the block's RENDERED
    // edge. Solving translateY(local) so that, after the ribbon's scale,
    // the rendered position lands exactly there gives the S-corrected
    // formula below (reduces to the original unscaled formula at S = 1).
    const S = window.innerWidth >= DESKTOP_BP ? DESKTOP_SCALE : 1;

    // Role-based spacing: the current block (JY box + name) is centred in the
    // band. The previous name is centred in the space above the block (between
    // the toggle and the box); the next name is centred in the space below it
    // (between the current name and the controls).
    nameCenter = mid + BLOCK / 2 - NAME / 2 - SCRUB_BELOW;  // name sits above the scrub
    prevCenter = mid + (T - mid) / (2 * S) - BLOCK / 4;     // centred above the rendered block
    nextCenter = mid + (C - mid) / (2 * S) + BLOCK / 4;     // centred below the rendered block
    upGap   = nameCenter - prevCenter;
    downGap = nextCenter - nameCenter;

    // the dotted line scrolls by the average name travel so it moves with them
    lineStep = Math.max(dotPeriod,
               Math.round(((upGap + downGap) / 2) / dotPeriod) * dotPeriod);

    document.documentElement.style.setProperty("--badge", BOX + "px");
    document.documentElement.style.setProperty("--dot", dotPeriod + "px");
    // anchor point for the desktop ribbon zoom — keeps the active station
    // pinned at the same screen position regardless of scale (see CSS).
    document.documentElement.style.setProperty("--ribbon-mid", mid + "px");

    if (spine) {
      spine.style.top = "-3500px";
      spine.style.height = (stage.clientHeight + 7000) + "px";
    }
  }

  // signed nearest offset of station i from the current one (handles the loop)
  function offsetOf(i) {
    let m = ((i - currentIndex) % N + N) % N;       // 0 … N-1
    if (m > N / 2) m -= N;                           // → −N/2 … N/2
    return m;
  }

  function targetY(k) {
    if (k === 0) return nameCenter;
    return k < 0 ? nameCenter + k * upGap : nameCenter + k * downGap;
  }

  function layout(animate) {
    if (!animate) ribbon.classList.add("no-anim");
    for (let i = 0; i < N; i++) {
      const k = offsetOf(i);
      const el = items[i];
      const visible = Math.abs(k) <= 1;
      el.style.transform = "translateY(" + targetY(k) + "px)";
      el.style.opacity = visible ? "1" : "0";
      el.classList.toggle("active", k === 0);
      el.classList.toggle("far", !visible);
    }
    if (!animate) {
      void ribbon.offsetHeight;
      ribbon.classList.remove("no-anim");
    }
  }

  /* navigation ------------------------------------------------------------- */
  // No lock: presses are never dropped. CSS transitions are interruptible, so
  // tapping five times quickly re-targets the layout five stations along and
  // the names ease straight to the final position — it feels instant.
  function step(delta) {
    if (delta === 0) return;
    currentIndex = ((currentIndex + delta) % N + N) % N;
    layout(true);
    // Build the new station's scrub bar (chip + segments) right now, in the
    // same tick as the .active class flip — not inside the deferred
    // syncAudio(). Otherwise the bar's content only appears ~2 frames after
    // its fade-in already started, which reads as a late "pop" right in the
    // middle of the slide. This is pure DOM work (no audio engine calls), so
    // it's cheap and safe to do immediately. syncAudio() still calls it too,
    // harmlessly — the scrubBuiltFor guard skips the redundant rebuild.
    buildScrubBar();

    // scroll the dotted line so the dots visibly travel with the names. The
    // offset accumulates across rapid presses; lineStep is a whole number of
    // dots, so the eventual reset to 0 is invisible on the uniform line. We
    // only reset once motion has settled (debounced after the last press).
    const dir = delta > 0 ? 1 : -1;
    spineOffset += -dir * lineStep;
    spine.style.transform = "translateY(" + spineOffset + "px)";

    window.clearTimeout(step._t);
    step._t = window.setTimeout(() => {
      spine.classList.add("no-anim");
      spineOffset = 0;
      spine.style.transform = "translateY(0)";
      void spine.offsetHeight;
      spine.classList.remove("no-anim");
    }, DUR_MS + 60);
  }

  function jumpTo(i) {
    step(offsetOf(i));
    syncAudioNav(true);
  }

  /* ───────────────────────────────────────────────────────────────────────
     audio transport — the outer-loop playlist behaves like a repeating
     Spotify playlist. The "playlist" is the set of stations that have an
     audio file, walked in the current loop direction (outer ascends, inner
     descends). With every station scored it degrades to a plain ±1 step.
       · next ............ skip to the next station that has audio, play it
       · prev (>3s in) ... restart the current track
       · prev (≤3s in) ... skip to the previous station that has audio
       · track ends ...... auto-advance to the next track (loops forever)
     currentIndex is the single source of truth; audio always reflects it.
     ─────────────────────────────────────────────────────────────────────── */
  const PREV_RESTART_S = 3;

  const normIdx = (i) => ((i % N) + N) % N;
  // Each station can carry a track per loop: audio: { inner, outer }. The
  // active playlist follows the current loop direction, so the same station
  // plays a different recording on the inner vs. outer loop.
  const loopKey = () => (direction === +1 ? "outer" : "inner");

  // Pick the audio container this browser can actually decode, once, at start.
  // Opus-in-Ogg is smaller and plays fine in Chrome/Firefox, but Safari (both
  // desktop and iOS) has NEVER supported the Ogg container — it needs AAC in an
  // MP4 wrapper (.m4a). Both encodings live in R2 under the same base name, so
  // stations.js stores the extension-less URL and we append the right one here.
  // canPlayType() returns "probably"/"maybe" (truthy) when supported, "" if not.
  const AUDIO_EXT =
    new Audio().canPlayType('audio/ogg; codecs="opus"') ? ".opus" : ".m4a";

  // Does this engine require <audio>.play() to be called synchronously inside
  // the user-gesture handler? Safari/WebKit (desktop + every iOS browser, which
  // are all WebKit under the hood) do — defer it and playback silently fails.
  // Chrome/Firefox grant "sticky" activation after any click, so they allow a
  // play() a few frames later. syncAudio() uses this to keep the ribbon slide
  // smooth on the lenient engines (see there).
  const isWebKit =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (/Safari/.test(navigator.userAgent) &&
      !/Chrome|Chromium|Android|Edg|OPR/.test(navigator.userAgent));

  const srcFor  = (i) => {
    const a = S[normIdx(i)].audio;
    const base = a && a[loopKey()];
    return base ? base + AUDIO_EXT : null;
  };
  const cacheKey = (i) => loopKey() + ":" + normIdx(i);

  // ── single shared audio element ────────────────────────────────────────
  // This used to keep a pool of several pre-loaded <audio> elements (one per
  // nearby station) so the next track was always instantly ready to go.
  // On iOS Safari that's fragile in a way that doesn't show up consistently:
  // WebKit caps how many media elements it keeps decode-ready, and handing
  // "audible" status from one element to another forces it to tear down and
  // reassign the underlying audio session — a known source of intermittent
  // silent-playback failures that has nothing to do with elapsed time, which
  // is why the symptom felt random rather than threshold-based.
  // A single shared element removes that whole class of bug: there is only
  // ever one <audio>, one decoder, one audio session for the app's life.
  // Changing track is just src + load() + play() on that same element, the
  // same handoff a normal "single now-playing track" page would do.
  const audioEl = new Audio();
  audioEl.preload = "auto";
  audioEl.addEventListener("ended", () => {
    // A station played all the way through — let the PWA install module know
    // (it waits for this before offering to install). Fire before advancing.
    window.dispatchEvent(new CustomEvent("stationComplete"));
    transportNext();
  });
  audioEl.addEventListener("timeupdate",     updatePositionState);
  // Until the new src's metadata loads, the scrub bar's total-duration
  // timestamp briefly reads the previous track's duration (buildScrubBar()
  // now runs immediately in step(), ahead of the deferred src swap). This
  // self-corrects the instant the real duration is known, paused or not.
  audioEl.addEventListener("loadedmetadata", () => { updatePositionState(); updateScrubBar(); });

  let current      = null;   // audioEl once a track is armed for this station, else null
  let currentKey   = null;   // cacheKey of whatever src audioEl currently holds
  let navAudioTimer = null;  // debounces the deferred audio switch during navigation

  // Network-only warm-up for the likely-next tracks. No second <audio>
  // element is created — that was the source of the decode contention — so
  // this just gets the bytes into the HTTP cache ahead of time, making the
  // eventual src swap on syncAudio() start fast without competing for a
  // decoder slot.
  const prefetched = new Set();
  function prefetch(src) {
    if (!src || prefetched.has(src)) return;
    prefetched.add(src);
    fetch(src, { mode: "no-cors" }).catch(() => {});
  }

  // Warm the tracks the user is most likely to reach next: the next and prev
  // stations on this loop, and this station's counterpart on the other loop.
  function preloadNeighbors() {
    const nx = scanAudio(direction);
    const pv = scanAudio(-direction);
    if (nx) prefetch(srcFor(currentIndex + direction * nx.dist));
    if (pv) prefetch(srcFor(currentIndex - direction * pv.dist));
    const other = (direction === +1 ? "inner" : "outer");
    const a = S[normIdx(currentIndex)].audio;
    // a[other] is the extension-LESS base URL from stations.js — it must go
    // through the same AUDIO_EXT append as srcFor(), or it 404s on the worker
    // (R2 only has JY..-Inner.opus / .m4a, never the bare key).
    if (a && a[other]) prefetch(a[other] + AUDIO_EXT);
  }

  // Scan from the current station in `dir` for the nearest station that has a
  // track on the ACTIVE loop.
  function scanAudio(dir) {
    for (let s = 1; s <= N; s++) {
      const i = normIdx(currentIndex + dir * s);
      if (srcFor(i)) return { dist: s };
    }
    return null;
  }

  // iOS can still reject (or silently no-op) a play() call right after a
  // load()/src change, especially mid-gesture. Retry once, reloading first,
  // so a transient failure self-heals instead of leaving the track silent.
  function playCurrent() {
    if (!current) return;
    current.play().catch(() => {
      if (!current) return;
      const t = current.currentTime;
      current.load();
      current.currentTime = t;
      current.play().catch(() => {});
    });
  }

  // Make the current station's track the audible one. `restart` rewinds it to
  // the top. Plays only when the user intends playback, so a paused deck just
  // arms the track silently. Only touches src when the station (or loop)
  // actually changed, so resuming after a pause never re-fetches.
  //
  // IMPORTANT: always call this synchronously, in the same tick as the user
  // gesture (click/touch) that triggered navigation — never deferred via
  // setTimeout/requestAnimationFrame. Safari only treats a play() call as
  // gesture-authorized if it's still within that synchronous call stack;
  // once it's pushed to a later task or animation frame, Safari silently
  // rejects it and the track never starts. (A previous version deferred this
  // via a double rAF to dodge an unrelated layout-thrashing bug in
  // buildScrubBar() — that bug is now fixed at its actual source, so the
  // defer was both unnecessary and broke Safari. Don't reintroduce it.)

  // Switch the shared <audio> to the current station's track and, if the deck
  // is playing, start it. This is the expensive part on live: assigning .src
  // kicks off a ~1 MB download + decode, and preloadNeighbors() fires more
  // full-file fetches — exactly the media I/O that's absent on localhost (where
  // every audio request 403s at the worker's referer gate), which is why the
  // ribbon slide stutters on live but not local. syncAudioNav() keeps this off
  // the animation; syncAudio() runs it immediately for non-animated actions.
  function applyAudio(restart) {
    const src = srcFor(currentIndex);
    const key = cacheKey(currentIndex);

    if (!src) {
      audioEl.pause();
      current = null;
      currentKey = null;
      updateMediaSession();
      return;
    }

    if (key !== currentKey) {
      audioEl.pause();
      audioEl.src = src;   // assigning .src already triggers the load algorithm
      currentKey = key;
    }
    if (restart) audioEl.currentTime = 0;

    current = audioEl;
    if (playing) { playCurrent(); startScrubRaf(); }
    updateMediaSession();
    preloadNeighbors();
  }

  // Immediate audio sync — for play/pause, loop toggle, and boot. There's no
  // ribbon slide running for these, so the media work can't stutter anything,
  // and the user expects an instant response (and Safari needs play() in the
  // gesture). Always builds the scrub bar first (visual, must track the station).
  function syncAudio(restart) {
    buildScrubBar();
    applyAudio(restart);
  }

  // Navigation audio sync — keeps the ribbon slide completely free of media
  // work. The slide is a 620 ms CSS transition; running the track's load/decode
  // (and neighbour prefetch) during it is what makes live janky where local is
  // smooth. On Chrome/Firefox we defer the whole switch until the slide has
  // settled, debounced so a flurry of swipes/clicks only loads the FINAL track
  // (and the previous station keeps playing meanwhile, switching as the new one
  // arrives). Sticky activation lets the deferred play() proceed. Safari/WebKit
  // only honour play() inside the synchronous gesture call stack and animate
  // smoothly with the immediate switch, so there we run it now.
  function syncAudioNav(restart) {
    buildScrubBar();   // visual — immediate, in lock-step with the slide
    if (isWebKit) {
      applyAudio(restart);
    } else {
      clearTimeout(navAudioTimer);
      navAudioTimer = setTimeout(function () { applyAudio(restart); }, DUR_MS);
    }
  }

  /* ───────────────────────────────────────────────────────────────────────
     Media Session — surface the current track on the iOS lock screen /
     Control Center (and Android / desktop) so the hardware + lock-screen
     transport controls drive the player. Metadata reflects currentIndex:
       · title ... "<current> → <next>" in the active loop direction
       · artist .. "Yamanote Line"
       · artwork . the JY station-number sign (js/artwork.js)
     ─────────────────────────────────────────────────────────────────────── */
  const hasMediaSession = "mediaSession" in navigator;
  // iOS renders the lock-screen ±skip (seek) buttons instead of prev/next track
  // icons whenever a track duration is reported via setPositionState — it treats
  // the audio as long-form scrubbable content. Suppressing position state on iOS
  // makes Safari fall back to the music-player layout with real prev/next icons.
  const isIOS = /iP(hone|ad|od)/.test(navigator.platform) ||
    (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1) ||
    /iPhone|iPad|iPod/.test(navigator.userAgent);

  // The literal next stop on the line in the current loop direction (outer
  // ascends JY, inner descends), wrapping around the loop.
  function nextStopIndex() { return normIdx(currentIndex + direction); }

  function updateMediaSession() {
    if (!hasMediaSession) return;
    const cur  = S[normIdx(currentIndex)];
    const next = S[nextStopIndex()];
    const art  = cur.artwork;

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  cur.name + " → " + next.name,
      artist: "Yamanote Line",
      album:  "Yamanote Line",
      artwork: art ? [
        { src: art, sizes: "512x512", type: "image/png" }
      ] : []
    });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    updatePositionState();
  }

  function updatePositionState() {
    if (!hasMediaSession || isIOS || !navigator.mediaSession.setPositionState) return;
    if (!current || !isFinite(current.duration) || current.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: current.duration,
        playbackRate: current.playbackRate || 1,
        position: Math.min(current.currentTime, current.duration)
      });
    } catch (e) { /* ignore out-of-range during transitions */ }
  }

  function setupMediaSession() {
    if (!hasMediaSession) return;
    const ms = navigator.mediaSession;
    const set = (action, handler) => {
      try { ms.setActionHandler(action, handler); } catch (e) { /* unsupported */ }
    };
    set("play",  () => { if (!playing) togglePlay(); });
    set("pause", () => { if (playing)  togglePlay(); });
    set("previoustrack", () => transportPrev());
    set("nexttrack",     () => transportNext());
    set("seekto", (d) => {
      if (current && d && typeof d.seekTime === "number") {
        current.currentTime = d.seekTime;
        updatePositionState();
        updateScrubBar();
      }
    });
  }

  // Move the ribbon by `delta` stations, then resync audio from the start.
  function gotoTrack(delta) {
    step(delta);
    syncAudioNav(true);
  }

  function transportNext() {
    const r = scanAudio(direction);
    if (r) gotoTrack(direction * r.dist);
  }

  function transportPrev() {
    // Past the restart threshold, "previous" rewinds the current track.
    if (current && srcFor(currentIndex) && current.currentTime > PREV_RESTART_S) {
      current.currentTime = 0;
      if (playing) playCurrent();
      return;
    }
    const r = scanAudio(-direction);
    if (r) gotoTrack(-direction * r.dist);
  }

  /* loop direction --------------------------------------------------------- */
  function setLoop(isInner) {
    const changed = direction !== (isInner ? -1 : +1);
    direction = isInner ? -1 : +1;
    innerBtn.classList.toggle("on", isInner);
    outerBtn.classList.toggle("on", !isInner);
    // Switching loops swaps to the other playlist's (preloaded) recording for
    // this station and starts it from the top. syncAudio only calls play()
    // when `playing` is set, so a playing deck autostarts the new track while a
    // paused deck just arms it silently — matching the current transport state.
    if (changed) syncAudio(true);
  }

  /* play / pause ----------------------------------------------------------- */
  function togglePlay() {
    playing = !playing;
    playBtn.classList.toggle("playing", playing);
    if (playing) {
      syncAudio(false);              // resume current track (or start it)
      startScrubRaf();
    } else {
      if (current) current.pause();
      stopScrubRaf();
    }
    if (hasMediaSession) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }

  /* wire up ---------------------------------------------------------------- */
  document.getElementById("prev").addEventListener("click", transportPrev);
  document.getElementById("next").addEventListener("click", transportNext);
  playBtn.addEventListener("click", togglePlay);
  innerBtn.addEventListener("click", () => setLoop(true));
  outerBtn.addEventListener("click", () => setLoop(false));

  /* ── colour theme toggle ────────────────────────────────────────────────
     The theme attribute is set on <html> by the inline boot script before
     paint; here we just flip it, persist the choice, and keep the iOS status
     bar (theme-color meta) and the button's label in sync. */
  const themeBtn = document.getElementById("theme");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function applyTheme(theme) {
    const changing = currentTheme() !== theme;
    document.documentElement.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f2f1ed" : "#191917");
    if (themeBtn) {
      themeBtn.setAttribute("aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
    // The dotted spine is painted with a CSS gradient, whose colour can't be
    // transitioned — so on a theme flip it would SNAP to the new colour while
    // every bg surface (page, station erasers, badge inners) cross-fades over
    // --theme-dur, briefly exposing each eraser's rectangular edge where the
    // snapped dots meet the still-fading background. To keep the whole switch
    // seamless we hide the spine instantly, let its gradient swap under cover,
    // then fade it back in over the same --theme-dur so dots and bg move as one.
    if (changing && spine) {
      spine.classList.add("no-anim");   // kill transitions for the instant hide
      spine.style.opacity = "0";
      void spine.offsetHeight;          // commit opacity:0 before re-enabling
      spine.classList.remove("no-anim");
      spine.style.opacity = "1";        // fades 0→1 over --theme-dur (CSS)
    }
    try { localStorage.setItem("yamanote-theme", theme); } catch (e) {}
  }
  applyTheme(currentTheme());   // sync label/meta with the booted attribute
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      applyTheme(currentTheme() === "light" ? "dark" : "light");
    });
  }

  /* ── station-name language (EN romaji ⇄ JP kanji) ───────────────────────
     Toggled from the info modal; persisted like the theme. Swaps each ribbon
     name between st.name (romaji) and st.kanji. The melodies table keeps
     romaji for legibility. */
  const langSeg = document.getElementById("lang-seg");
  function currentLang() {
    try { return localStorage.getItem("yamanote-lang") === "ja" ? "ja" : "en"; }
    catch (e) { return "en"; }
  }
  function applyLang(lang) {
    for (let i = 0; i < N; i++) {
      if (names[i]) names[i].textContent = lang === "ja" ? S[i].kanji : S[i].name;
    }
    // Flag the kanji state so the stylesheet can switch the ribbon names to
    // Zen Maru Gothic (and weight it per theme: medium dark, bold light).
    document.documentElement.setAttribute("data-namelang", lang);
    if (langSeg) {
      langSeg.querySelectorAll("[data-lang]").forEach((b) =>
        b.classList.toggle("on", b.getAttribute("data-lang") === lang));
    }
    try { localStorage.setItem("yamanote-lang", lang); } catch (e) {}
  }
  if (langSeg) {
    // Clicking anywhere on the control flips EN ⇄ JP, so tapping the active
    // option switches too (rather than only the inactive one responding).
    langSeg.querySelectorAll("[data-lang]").forEach((b) =>
      b.addEventListener("click", () => applyLang(currentLang() === "ja" ? "en" : "ja")));
  }

  /* ── offline playback ─────────────────────────────────────────────────────
     Downloads every station's audio (current AUDIO_EXT) into a dedicated
     Cache Storage bucket, kept separate from the app-shell cache so it
     survives shell updates — sw.js exempts it from the activate-time cleanup.
     OFFLINE_CACHE must match the constant of the same name in sw.js.
     sw.js then serves a downloaded file straight from that cache at its
     normal URL — including hand-sliced Range responses for seeking — so
     nothing in the playback path above (applyAudio, srcFor, …) has to know
     whether a track is offline; it just stops touching the network. */
  const OFFLINE_CACHE = "yamanote-audio-v1";
  const hasCacheApi = "caches" in window;

  function offlineUrls() {
    const urls = new Set();
    S.forEach((st) => {
      const a = st.audio;
      if (!a) return;
      if (a.inner) urls.add(a.inner + AUDIO_EXT);
      if (a.outer) urls.add(a.outer + AUDIO_EXT);
    });
    return Array.from(urls);
  }
  // Measured total of every opus/m4a track combined — opus and m4a land
  // within a few % of each other in practice, so one figure covers both.
  const OFFLINE_SIZE_MB = 68.7;

  const offlineBtn = document.getElementById("offline-btn");
  const offlineSub = document.getElementById("offline-sub");
  let offlineState = "idle";    // idle | progress | done | unsupported
  let offlineCancelled = false;

  function setOfflineUI(state, detail) {
    offlineState = state;
    if (!offlineBtn || !offlineSub) return;
    offlineBtn.classList.toggle("m-pill--ghost", state === "done");
    if (state === "idle") {
      offlineBtn.textContent = "Download";
      offlineBtn.disabled = false;
      offlineSub.textContent = "Save all tracks on this device (" + OFFLINE_SIZE_MB + " MB)";
    } else if (state === "progress") {
      offlineBtn.textContent = "Cancel";
      offlineBtn.disabled = false;
      offlineSub.textContent = "Downloading… " + detail;
    } else if (state === "done") {
      offlineBtn.textContent = "Remove";
      offlineBtn.disabled = false;
      offlineSub.textContent = "Saved on this device — plays without using data";
    } else if (state === "unsupported") {
      offlineBtn.textContent = "Unavailable";
      offlineBtn.disabled = true;
      offlineSub.textContent = "Offline playback isn't supported in this browser";
    }
  }

  async function offlineHaveCount() {
    const cache = await caches.open(OFFLINE_CACHE);
    return (await cache.keys()).length;
  }

  async function refreshOfflineUI() {
    if (!hasCacheApi) { setOfflineUI("unsupported"); return; }
    const have = await offlineHaveCount();
    setOfflineUI(have >= offlineUrls().length ? "done" : "idle");
  }

  // Limited concurrency so this doesn't open 60 simultaneous connections.
  async function downloadOfflineAudio() {
    const urls = offlineUrls();
    const cache = await caches.open(OFFLINE_CACHE);
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    offlineCancelled = false;
    let done = 0;
    let idx = 0;
    async function worker() {
      while (idx < urls.length) {
        if (offlineCancelled) return;
        const url = urls[idx++];
        try {
          if (!(await cache.match(url))) {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) await cache.put(url, res);
          }
        } catch (e) {}
        done++;
        if (!offlineCancelled) setOfflineUI("progress", done + " / " + urls.length);
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (!offlineCancelled) refreshOfflineUI();
  }

  if (offlineBtn) {
    offlineBtn.addEventListener("click", () => {
      if (offlineState === "idle") {
        setOfflineUI("progress", "0 / " + offlineUrls().length);
        downloadOfflineAudio();
      } else if (offlineState === "progress") {
        offlineCancelled = true;
        refreshOfflineUI();
      } else if (offlineState === "done") {
        caches.delete(OFFLINE_CACHE).then(refreshOfflineUI);
      }
    });
    refreshOfflineUI();
  }

  /* ── melodies table (built once, into the info modal) ────────────────────
     One row per station: romaji name · inner melody · outer melody. Melody
     names live in stations.js (melody.inner / .outer); blanks render as "—".
     A name shared by more than one track is tinted green. Rows past the
     fifth stay hidden until "Show all" expands the table. */
  function buildMelodyTable() {
    const tbody = document.getElementById("melody-rows");
    if (!tbody || tbody.childElementCount) return;   // build only once

    const counts = {};
    S.forEach((st) => {
      const m = st.melody || {};
      [m.inner, m.outer].forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });

    S.forEach((st, i) => {
      const tr = document.createElement("tr");
      if (i >= 5) tr.className = "m-extra";
      const m = st.melody || {};
      const stn = document.createElement("td");
      stn.className = "m-stn";
      stn.textContent = st.name;
      tr.appendChild(stn);
      [m.outer, m.inner].forEach((v) => {
        const td = document.createElement("td");
        td.className = "m-mel" + (v && counts[v] > 1 ? " shared" : "");
        td.textContent = v || "—";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  const melodyToggle = document.getElementById("melody-toggle");
  if (melodyToggle) {
    melodyToggle.addEventListener("click", () => {
      const tbl = document.getElementById("melody-table");
      const open = tbl.classList.toggle("expanded");
      melodyToggle.classList.toggle("open", open);
      melodyToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.getElementById("melody-toggle-txt").textContent =
        open ? "Show fewer" : "Show all 30 stations";
    });
  }

  /* ── about / info modal ─────────────────────────────────────────────────
     Opens a dialog over the player. Backdrop + ✕ + Esc close it; focus moves
     into the card on open and returns to the info button on close, with a
     light Tab trap so keyboard focus stays inside while it is open. */
  const infoBtn   = document.getElementById("info");
  const infoModal = document.getElementById("info-modal");
  let modalOpen = false;
  let lastFocus = null;

  function focusables() {
    return Array.from(infoModal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el) => el.offsetParent !== null);
  }
  function openModal() {
    if (modalOpen) return;
    modalOpen = true;
    lastFocus = document.activeElement;
    infoModal.hidden = false;
    // next frame so the .open transition (backdrop fade + card rise) animates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => infoModal.classList.add("open"));
    });
    const f = infoModal.querySelector(".modal-close");
    if (f) f.focus();
  }
  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    infoModal.classList.remove("open");
    const done = () => {
      infoModal.hidden = true;
      infoModal.removeEventListener("transitionend", done);
    };
    infoModal.addEventListener("transitionend", done);
    window.setTimeout(done, 420);   // fallback if transitionend is missed
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (infoBtn && infoModal) {
    infoBtn.addEventListener("click", openModal);
    infoModal.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", closeModal));
    infoModal.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOpen) { e.preventDefault(); closeModal(); return; }
    if (modalOpen) return;   // don't drive the transport while the dialog is up
    if (e.key === "ArrowRight") { e.preventDefault(); transportNext(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); transportPrev(); }
    else if (e.key === " ") { e.preventDefault(); togglePlay(); }
  });

  // swipe to scrub — the ribbon tracks the finger 1:1, and the moment the drag
  // passes AUTO_PX the switch fires automatically (no need to lift). Because
  // the dotted spine and every station live inside #ribbon, translating the
  // ribbon previews the move with everything moving together; when it commits
  // we ease the offset back to 0 and hand off into the normal step() animation.
  const FOLLOW_MAX = 104;   // hard cap on how far the ribbon follows the finger
  const FOLLOW_LIN = 64;    // 1:1 zone before resistance kicks in
  const AUTO_PX    = 48;    // drag past this auto-fires the switch mid-gesture
  const COMMIT_V   = 0.55;  // …or a flick faster than this (px/ms) on release

  let touchY = null, lastY = 0, lastT = 0, vel = 0, dragging = false, committed = false;

  // 1:1 near zero, easing toward FOLLOW_MAX so the ribbon never runs away
  function follow(dy) {
    const s = dy < 0 ? -1 : 1, a = Math.abs(dy);
    if (a <= FOLLOW_LIN) return dy;
    const over = a - FOLLOW_LIN, span = FOLLOW_MAX - FOLLOW_LIN;
    return s * (FOLLOW_LIN + span * (1 - Math.exp(-over / span)));
  }

  // Ease the ribbon offset back to 0 and fire the step — the shared hand-off
  // used both mid-drag (auto) and on release.
  function commitStep(dir) {
    ribbon.classList.remove("dragging");    // re-arm the transform transition
    ribbon.style.transform = "translateY(0)";   // hand off into the step anim
    step(dir); syncAudioNav(true);
  }

  stage.addEventListener("touchstart", (e) => {
    touchY = lastY = e.touches[0].clientY;
    lastT = e.timeStamp; vel = 0; dragging = true; committed = false;
    ribbon.classList.add("dragging");      // track the finger with no easing
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (!dragging || committed) return;
    // The body is pinned (position:fixed) so the page can't actually scroll,
    // but iOS Safari still flashes its scrollbar indicator on a vertical
    // touch-drag unless the gesture is explicitly consumed. This listener is
    // non-passive precisely so we can preventDefault and stop that flash.
    if (e.cancelable) e.preventDefault();
    const y = e.touches[0].clientY;
    const dt = e.timeStamp - lastT;
    if (dt > 0) vel = (y - lastY) / dt;     // instantaneous velocity (px/ms)
    lastY = y; lastT = e.timeStamp;
    const dy = y - touchY;
    // Auto-fire the switch the instant the drag crosses the threshold — the
    // gesture is then locked until the finger lifts, so one swipe = one step.
    if (Math.abs(dy) >= AUTO_PX) {
      committed = true;
      commitStep(dy < 0 ? +1 : -1);         // swipe up → next, down → prev
      return;
    }
    ribbon.style.transform = "translateY(" + follow(dy) + "px)";
  }, { passive: false });

  function endDrag(endY) {
    if (!dragging) return;
    dragging = false;
    const dy = endY - touchY;
    touchY = null;
    if (committed) { committed = false; return; }   // already switched mid-drag
    ribbon.classList.remove("dragging");    // re-arm the transform transition
    ribbon.style.transform = "translateY(0)";   // spring back / hand off
    // Lifted before the threshold: a quick flick still commits.
    if (Math.abs(vel) > COMMIT_V) { step(dy < 0 ? +1 : -1); syncAudioNav(true); }
  }

  stage.addEventListener("touchend", (e) => endDrag(e.changedTouches[0].clientY), { passive: true });
  stage.addEventListener("touchcancel", () => {
    if (!dragging) return;
    dragging = false; committed = false; touchY = null;
    ribbon.classList.remove("dragging");
    ribbon.style.transform = "translateY(0)";
  }, { passive: true });

  let rt;
  window.addEventListener("resize", () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(() => { measure(); layout(false); }, 120);
  });

  // Re-measure once iOS settles the new viewport after an orientation change.
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => { measure(); layout(false); }, 250);
  });

  /* boot ------------------------------------------------------------------- */
  // Reveal once: drops the .booting class so the ribbon fades in while the
  // toggle slides down from above and the controls slide up from below — all
  // together. We wait for the final (post-font) layout to be painted hidden,
  // then flip on the next frame so the entrance transition actually fires.
  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Add .intro to corner controls BEFORE dropping .booting so the
        // transition spec switches to var(--intro-dur) at the same moment the
        // translateY offset is cleared — giving them the same slide-up entrance
        // as prev/next. The class is removed once the animation has settled so
        // normal 0.18s press-response returns.
        const cornerCtrls = document.querySelectorAll('.corner-ctrl');
        cornerCtrls.forEach(el => el.classList.add('intro'));
        document.body.classList.remove("booting");
        window.setTimeout(() => {
          cornerCtrls.forEach(el => el.classList.remove('intro'));
        }, 1100);   // intro-dur (0.9s) + comfortable buffer
      });
    });
  }

  build();
  applyLang(currentLang());   // restore saved EN/JP station-name choice
  buildMelodyTable();         // populate the info modal's melodies table
  measure();
  layout(false);
  setLoop(false);
  setupMediaSession();
  syncAudio(false);   // arm the opening track + preload neighbours (no autoplay)

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); layout(false); reveal(); });
  }
  // Fallback: never leave the UI parked off-screen if fonts stall.
  window.setTimeout(reveal, 1500);
})();
