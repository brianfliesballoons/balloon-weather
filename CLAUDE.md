# Balloon Weather Widget

**Author:** Brian
**Project type:** Single-file web application

---

## Active to-do

*Live state, not a log (workspace convention — see root CLAUDE.md's "status report" protocol): add items as work opens them, delete when done, update after every meaningful unit of work. Numbered in priority order — Brian references items by number.*

1. **v4.21.0 Forecast Accuracy Log — BUILT + BROWSER-VERIFIED 2026-09-17, NOT YET PUSHED.** Brian's ask (somebody else's idea, relayed): *"adding the option in the balloon weather widget for weather accuracy… keeping track of how the forecast was looking vs how it went… options to say it was accurate, or it was not, maybe even sub categories of windy, gusty, fog… eventual calendar comparison of the forecast vs historical forecast accuracy trends."* Three layers — his call + tags, measured forecast-vs-observed error, and lead-time drift. **SHIPPED + LIVE 2026-09-17** at https://brianfliesballoons.github.io/balloon-weather/ (Brian: *"Looks great. Push to main"*); `preview/` retired in the same commit and now 404s. Credit for the idea: **Caleb**, relayed by Brian. ✅ **v4.21.1 — the gap is CLOSED, and closing it caught a real bug.** See "Verifying without the Chrome extension" below. What to watch once it has real entries: (a) whether the **8 tag categories** are the right cut or he wants different ones; (b) whether the **nudge's 3-day lookback** is the right recall horizon against the **7-day obs expiry** (they disagree by 4 days on purpose — see the section below); (c) whether the nearest reporting station is close enough to his launch sites for the measured error to mean anything, or whether it needs a station picker; (d) whether the calendar wants to be longer than 56 days once a season accumulates. Full detail: **"The Forecast Accuracy Log"** section below.
2. **v4.20.0 TFR map + SIGMET/AIRMET decode — SHIPPED + LIVE 2026-08-22.** Brian: *"I would really like to see a map of TFRs embedded in the widget"* and *"please decode the Sigmets, airmets, and pireps"*. **We draw the TFR map ourselves** (see the TFR-map section below) since the FAA's cannot be embedded, and SIGMETs/AIRMETs now decode to plain English like the TAFs. Watch: (a) does the plan view read well on his phone at the default ring scale; (b) whether he wants SIGMET/AIRMET areas on the same map — deliberately left off because their polygons are regional and would blow the scale out to uselessness; (c) whether the label-nudging holds up when several TFRs cluster.
3. **v4.19.0/.1 Native TFR list with real distances — SHIPPED + LIVE 2026-08-18.** Brian: *"JSON export with info details alongside for location sounds best."* The TFR section now lists actual nearby restrictions nearest-first (type · NOTAM · distance · altitude band · radius · FAA description) instead of a link. **The v4.18.1 embedded map card was REMOVED in v4.19.1** — see below; it could never have shown a map. Watch: (a) `TFR_RADIUS_NM` 250 nm — wider than the SIGMET 150 because TFRs matter further out, tune once he's seen a few; (b) whether the nationwide roll-up hides anything he wants; (c) refresh cost — a busy state means up to 30 small detail fetches, batched 6 at a time.
4. **v4.18.1 TAF cellular fix + TFR map embed — SHIPPED + LIVE 2026-08-18.** Brian's phone showed *"Couldn't load TAFs — (Fetch is aborted)"* while SIGMETs/AIRMETs loaded. **Not a proxy fault** (measured proxy latency 1-2s for 1-8 stations) — it's the **same failure the station fetches hit in v4.16.3**: a page load fires ~20 requests at once and on a weak cellular link the slowest die to their own timeout; TAFs are the biggest aviation response so they lose first. Fixed with `fetchAv()` — one retry on a fresh timeout for all four feeds (30s for TAF, 25s others), never wasting the retry on a 4xx — plus `avErr()` so an abort reads "timed out — slow connection?" instead of iOS's cryptic "Fetch is aborted". **Watch: if it recurs on his phone, the next lever is staggering the aviation fetches behind the station fan-out rather than firing all ~20 at once.** Also added the **TFR Map card** (collapsed, lazy-loaded) — see the TFR section below for its real limitations and the better alternative.
5. **v4.18.0 Plain-English TAF/PIREP decode — SHIPPED + LIVE 2026-08-18.** Every TAF now renders its forecast periods in readable English above the raw code, and PIREPs decode from their structured fields. **Brian's rule for this feature: "literal translation is better. We will assess the data."** — decode the codes and STOP. No verdicts, no limit-flagging, no "marginal for your window"; the widget states facts, the pilot judges. (An earlier draft flagged periods against `gngLimits`; he explicitly redirected away from that — don't reintroduce it.) Raw text stays under every decode so it can be checked. Watch: whether the period list gets long on a busy multi-`FM` TAF, and whether he wants `TEMPO`/`PROB` overlays visually distinguished more strongly than the current label.
6. **v4.17.0 Aviation Briefing rescue — SHIPPED + PUSHED LIVE 2026-08-18. Brian eyeballs it on the phone.** The card's four sections (TAF/SIGMET/AIRMET/PIREP) had **never worked in a browser** since the day it shipped — Brian: "I have never seen any TAFs" + a thunderstorm SIGMET ~a week earlier never showed. Six stacked bugs, all fixed and **verified live in Chrome** (not by simulation). What to watch now: (a) does the **Regional/AIRMET** list stay useful or get noisy at a location with more activity — `GA_RELEVANT` ranking and the 6-item cap are the tuning knobs; (b) the **150 nm** `RADIUS_NM` — arbitrary, tune once he sees a real nearby SIGMET; (c) whether the **freezing-level roll-up** ("+ N freezing-level contours nearby") is the right call or he wants them listed; (d) proxy health — if `aviation-proxy` ever goes down the card now says so loudly rather than showing a false all-clear, which is the point. Full detail: **"The Aviation Briefing card + its CORS proxy"** section below.
7. **v4.16.0 Smoke & Air Quality — SHIPPED 2026-08-04, first-smoke-event watch.** Built after two smoke cancellations in a row (2026-08-03/04, BC + Eastern WA fires): the old widget had zero smoke awareness — model visibility stayed legal and nothing surfaced the AFD's smoke talk. New: 🔥 Smoke & Air Quality card (US AQI + PM2.5/PM10 at the selected hour, next-24h AQI strip, active NWS point alerts with smoke-tinted highlighting), Open-Meteo Air Quality API (keyless, hourly forecast days out — plugs into the time picker/historical mode like the wind data), 8th Go/No-Go check "Air Quality (Smoke)" with customizable Max AQI limit (default 100; active smoke alert bumps a passing check to caution and stands in when AQ data is absent), AQI votes in `windowVerdict` + AQI row in the 5-Day window tables, AFD keyword category `ka` (smoke/smoky/haze/hazy/wildfire/air quality/red flag), METAR FU/HZ present-weather flags in Reported Cloud Layers, Ask Claude briefing carries AQI + alerts. All modular/location-agnostic. Verified by live-API simulation against the actual Enumclaw smoke event: old read FLYABLE (2 mph, 10.6 mi), new read NO-GO (AQI 154 + 3 Air Quality Alerts). **v4.16.1 (same day, Brian's feedback):** card compacted per the density rule (single-line hero, tighter alert/strip spacing) + **EPA scale bar legend** — six colored band segments (Good→Hazardous) with the selected hour marked ▼, the pilot's Max-AQI limit as a │ tick, boundary numbers, and a "24h peak N @ time" key line (`aqPos()` maps AQI→% on the equal-segment scale). Remaining: Brian eyeballs the card on the phone; sanity-check the maxAqi=100 default against how he actually makes the smoke call.
8. **v4.14.0 Reality Check layer — SHIPPED 2026-08-03, watch first real-world mornings.** Built after the Enumclaw 2026-08-03 drainage morning (model forecast fast low winds; Rainier drainage kept <1000 ft calm — Eliav's call). Brian's direction: modular protocols that work anywhere, obs over model, NO hardcoded per-site rules. Verify on the next few dawn flights that the MATCH/MODEL OVER verdict, mixing-height regime line, and HRRR-vs-HRDPS agreement read sensibly; tune thresholds (obs-vs-model 4 mph, shallow-mix 800 ft, agree/split 5/10 mph) if they mis-fire. Browser extension wasn't connected at ship time, so the UI was verified by live-API simulation of every code path (all passed) — a quick visual check of the new 🛰 Reality Check card on Brian's phone is the remaining smoke test.

*Also live: v4.13.0 (low-level shear in Go/No-Go + verdicts; Ask Claude briefing + AFD). Possible future upgrades: inline AI chat via a Cloudflare Worker proxy (discussed 2026-08-02); retrospective model-vs-ENCW1 skill scoring; UW WRF 1.33 km if data access ever opens (graphics-only today — contacts at UW Atmospheric Sciences).*

---

## What This Is

A specialized aviation weather briefing dashboard built for balloon and paraglider pilots. Provides real-time, multi-source weather data tailored to lighter-than-air and free-flight aviation.

**Version:** 4.21.2 (live at https://brianfliesballoons.github.io/balloon-weather/)

🚀 **BUG FIXES SHIP STRAIGHT TO LIVE — Brian, 2026-09-29.** *"If I give you a bug go ahead and push the fix… I only need you to wait on my approval if it's like a new feature because we want it to look right in the UI."* Once the fix is tested, push it to main (no preview, no waiting). He checks the live page; if it needs more work that's no worse, because it was already broken. **New features still go to `preview/` and wait for his go.** First case: v4.21.2 (below).

**v4.21.2 (2026-09-29) — header chips wrap.** With five chips (LIVE · Ask Claude · Log · Log book · ↻), `.tp{overflow:hidden}` clipped ↻ Refresh off a phone screen. The chips now sit in one `.tp-acts` group that wraps to a second row; the title gives way first (`flex-shrink:100`). ⚠ Never a fractional `flex-shrink` on that group: when the factors sum below 1, CSS shrinks only that fraction and it overflows anyway. Measured at 390/320/260 px, unpinned and pinned: nothing clipped. The header is ~30 px taller on a phone; shorter phone labels are the lever if one row is wanted back.

⚠ **Browser-verify anything that touches an API.** This project's habit of verifying by "live-API simulation" (server-side curl/node) is what let the Aviation Briefing card ship dead and stay dead: server-side has **no same-origin policy**, so the simulation passed while every real browser load failed. A live-API simulation is not a substitute for loading the page in Chrome. See v4.17.0 below.

**Slow-connection resilience (v4.16.3, 2026-08-06):** Brian's 3 AM field report — "No micro wind data" + only 3 of 11 winds-aloft stations — was NOT an API outage (all stations returned 200/64 KB/1-2 s when tested minutes later): the 8 s `fetchT` default was killing most of the 12 parallel ~64 KB station fetches on a weak WiFi/cellular link, and the home station was among the dead. Fixes: **(a)** station fetches (`fetchOM`) get a 20 s timeout; **(b)** after the first pass, failed stations are retried ONCE (never on 429 — retries would burn quota); **(c)** every degraded state is now VISIBLE: Micro Winds names the dead home station + likely cause, Winds Aloft shows "N of M stations didn't load", and when Surface silently falls back to a neighbor station's data it now says so (`window._homeFellBack` banner — the silent substitution previously looked like working home data). Both messages distinguish slow-connection from 429-quota (reset 5 PM Pacific).

**Card order (Brian, 2026-08-04 — winds right under surface):** Surface Conditions → Micro Winds + Winds Aloft pair → Smoke & Air Quality → Reality Check → Hourly → AFD → Wind Map → Aviation Briefing → **TFR Map** → Radar → 5-Day → Go/No-Go → **Forecast Accuracy** (last: it's the only retrospective card).

**Sub-project:** [`aviation-proxy/`](aviation-proxy/CLAUDE.md) 📘 — the Cloudflare Worker the Aviation Briefing card depends on. Its own CLAUDE.md is authoritative for deploy/ops.

**Primary copy:** `opus 4.7/balloon-weather-ACTIVE.html` — the working file. Publish by copying it to `opus 4.6/balloon-weather/index.html` (the git repo GitHub Pages serves), then commit + push. Full workflow: `opus 4.6/CLAUDE.md`.

---

## The Aviation Briefing card + its CORS proxy (v4.17.0, 2026-08-18)

**Read this before touching anything in `rAvBriefing`, the `fetch*` aviation functions, or `aviation-proxy/`.**

### Why the card was dead for its entire life

`aviationweather.gov` sends **no `Access-Control-Allow-Origin` header at all** — verified on both GET and the OPTIONS preflight. Browsers therefore blocked every TAF/SIGMET/AIRMET/PIREP fetch before any data arrived; the `catch` swallowed it and the card printed its own empty states. **It read as clear skies while being a dead feed** — the worst failure mode a flight tool has. By contrast `api.weather.gov` and Open-Meteo both send `*`, which is exactly why every other card worked.

**Why it survived testing:** every prior API change here was "verified by live-API simulation" — server-side curl/node, where there is no same-origin policy. The simulation passes while the browser fails. **That's now a standing rule: browser-verify anything touching an API.**

### The six bugs (five were independently fatal)

| # | Bug | Effect |
|---|---|---|
| 1 | No CORS on `aviationweather.gov` | all four sections blocked in-browser |
| 2 | `coords` read as a scalar lon/lat pair | it's a **polygon** of `{lat,lon}` (strings in G-AIRMET, numbers in SIGMET) → `haverNm` got objects → `NaN` → `NaN<=150` dropped **every** advisory |
| 3 | `airsigmetType` vs upstream's `airSigmetType` | case-sensitive → permanently `undefined` → nothing ever classified as a SIGMET |
| 4 | AIRMETs sought in the SIGMET feed | `/airsigmet` returns SIGMETs only; G-AIRMETs live at `/gairmet` with a **different schema** → AIRMETs were structurally impossible |
| 5 | PIREPs sent `lat`/`lon`/`dist` | upstream demands `id=<ICAO>&distance=` → **HTTP 400** every time |
| 6 | Epoch **seconds** passed to `fT()` | `new Date(bareNumber)` reads **milliseconds** → every validity rendered as January 1970 ("Valid 8:24 AM — 8:26 AM"). Invisible until the card returned data at all |

### The proxy

`aviation-proxy/` in this project → **`https://aviation-proxy.brianfliesballoons.workers.dev`** (Cloudflare Worker, free tier, on Brian's account). Routes: `/taf`, `/airsigmet`, `/gairmet`, `/pirep`, plus `/health`.

- **Deliberately not an open proxy** — only those four upstream paths and each one's declared params are forwarded; anything else is rejected before a subrequest. Don't "simplify" that away.
- **One retry, by necessity:** aviationweather.gov intermittently 502s at Cloudflare's egress while the identical URL succeeds from a residential IP. The first deploy showed this consistently on `/pirep`; the retry cleared it.
- 120 s cache, so a page load doesn't hammer a government host.
- Deploy: `cd aviation-proxy && npx wrangler deploy` (wrangler isn't installed globally — use `npx`). Tail: `npx wrangler tail aviation-proxy`.
- ⚠ **Never point the widget's fetchers back at `aviationweather.gov` directly.** That's the original bug.

### The plain-English decode (v4.18.0)

`decodeTaf()` / `decodePirep()` / `decodeWxTok()`, rendered into `.taf-dec` above each raw block.

- **Literal only** — Brian's explicit instruction. Decode the code and stop; he assesses the data. Do not add verdicts, Go/No-Go colouring, or `gngLimits` comparisons to this output.
- **Deterministic, never a model.** TAF and PIREP are strict published formats; a paraphrased weather code on a flight tool is not acceptable. Same reasoning as the AFD watchdog's regional line.
- **The raw text always stays visible** beneath the decode, so any decode bug is checkable at a glance rather than silently trusted.
- TAF structure: base periods (the initial group, plus each `FM`, each running until the next one starts) and `TEMPO`/`BECMG`/`PROB` **overlays** that carry their own windows. Handles `1 1/2SM`-style split visibility tokens (pre-joined before parsing), `CB`/`TCU` suffixes, `VV` vertical visibility, `WS` low-level shear, `CAVOK`, `NSW`, `AMD`/`COR`.
- `decodeWxTok` handles descriptor-only groups — `VCSH` is "showers in the vicinity", which an earlier version returned as an empty string.
- **PIREPs decode the structured fields, not `rawOb`.** Units verified against `rawOb` 2026-08-18: `fltLvl` is **hundreds of feet**, cloud `base`/`top` are **already feet**, `visib` is statute miles, and `top: 0` means *not reported* — not sea level.
- ⚠ **`toMs()` owns the epoch-seconds-vs-milliseconds rule** for the whole aviation path (`fTav`, `fRange`, and the TAF period anchor). Both bugs this project has hit here were unit confusion: bare numbers under 1e11 are **seconds**. Browser testing caught the decoder anchoring every period to January 1970 and printing random weekdays.

### TFRs (v4.19.0 native list; v4.18.1 map embed as fallback)

**The list is the primary path now.** Two steps, by necessity:

1. `/tfr` → the FAA's active-TFR list (~120 records). **It carries NO coordinates** — only `state` / `type` / `description` / `notam_id` — so it cannot be distance-filtered directly. Cut to `C.state` plus nationwide (`state:"USA"`) entries.
2. `/tfrdetail?id=6_6067` → that TFR's XNOTAM detail, which **does** carry the polygon (`geoLat`/`geoLong` vertices) plus vertical limits and radius. **The proxy parses the ~26 KB XML down to ~1.8 KB of JSON** — a 15× cut that matters because the caller is a phone on cellular. Distance then reuses `polyDistNm`, so a TFR overhead reads "overhead" rather than "0 nm".

`C.state` is captured **free** from the NWS `points` response the location pipeline already fetches (`relativeLocation.properties.state`) and persisted with the saved location — no extra request.

**Judgement calls that are load-bearing — don't "tidy" these:**
- **`TFR_DETAIL_CAP` = 30 is deliberately ABOVE the busiest state's real count** (CA ran 24 on 2026-08-18), not tuned for appearance. The list can't be distance-sorted before the detail fetch, so a low cap **silently skips close TFRs**. Proven: raising it from 12 surfaced a **Disneyland TFR at 39 nm — the nearest one — that had been hidden**. If this ever needs lowering, sort by something better first, don't just truncate.
- **Details go out in batches of `TFR_BATCH` (6), not one burst.** A burst is exactly what killed TAFs on 5G in v4.18.1.
- **A failed detail fetch KEEPS its TFR** (distance unknown) rather than dropping it. Same principle as the rest of this card: never hide an advisory because a request failed.
- **Standing nationwide security TFRs roll up to one line.** They outnumbered genuinely-near ones 10 to 6; same treatment as freezing-level contours in the AIRMET section.
- An upper limit of `0` means **not stated**, not ground level — renders "unspecified".

### The TFR map — we draw it (v4.20.0)

`rTfrMap()` → `#tfrMapB`. An **inline SVG plan view centred on the pilot**: range rings, cardinal cross, each nearby TFR drawn from its real polygon (the coordinates `/tfrdetail` already returns), coloured by type, labelled with its NOTAM number.

**Why hand-drawn rather than a map library:** the FAA's map can't be embedded (next section), and the project rule is no build tools, no frameworks, no dependencies. We already hold the polygons, so the only honest options were "draw it" or "don't have it". It adds **zero** network calls — it reuses what the TFR list fetched — which matters given the cellular failures this card has already had.

**Details that are load-bearing:**
- **Minimum marker size.** A 3 nm TFR at a 125 nm scale is ~4 px across — accurate and invisible. Anything whose on-screen box is under 11 px also gets a dot. **A TFR must never be undrawable just because the view is zoomed out.**
- **Labels nudge off each other.** Three border TFRs (Coyote Wells / Calexico) sit almost on top of one another and rendered as one illegible smear before.
- **Ring step adapts** (10/25/50/100 nm) to the furthest plotted TFR, and the label says which.
- Only TFRs with a resolved polygon are plotted; anything nearby that couldn't be plotted gets an explicit count line rather than vanishing — same principle as the rest of the card.
- **SIGMET and AIRMET areas are deliberately NOT on this map.** Their polygons are regional (multi-state); including them would force the scale out until the TFRs became specks. If that's ever wanted it needs its own zoom control, not a bigger `span`.

### Advisory decoding (v4.18.0 TAF/PIREP · v4.20.0 SIGMET/AIRMET)

All four types now decode to plain English above their raw text, all deterministic, all **literal** per Brian's standing rule.

- **SIGMET** (`decodeSigmet`): structured fields (hazard, altitudes, movement) plus the few phrases that exist *only* in the bulletin — hail size, gust strength, and `TOPS ABV` vs `TOPS TO` (which flips a ceiling into a floor). The numeric `severity` was dropped from the badge: it read "SIGMET · 5" and is always 5.
- **AIRMET** (`decodeDueTo`): `CIG BLW 010 VIS BLW 3SM BR` → "ceilings below 1,000 ft, visibility below 3 SM, in mist"; `MTNS OBSC BY CLDS BR` → "mountains obscured by cloud and mist". **Unrecognised text passes through verbatim** — never silently dropped.
- **PIREP / TAF**: see the v4.18.0 section above.

### Why there is no embedded TFR map (settled 2026-08-18 — don't retry it)

v4.18.1 added an iframe of `tfr.faa.gov`; v4.19.1 **removed it**. Brian's phone showed it rendering the FAA's *list* page, cut off and unreadable.

**It can never work, and the reason is structural:** the FAA app declares exactly four SPA routes — `/`, `/detail/:id?`, `/export/:id?`, `/notam_actual/:id?`. **There is no map route.** "Open TFR Map" toggles a component in place, so no URL an iframe can point at will ever land on the map. Deep links are dead too: `/tfr3/detail/6_5474` **404s** server-side (no SPA fallback configured) and the hash form `#/detail/...` is rewritten back to `?page=list`.

Add to that: a ~25 s SPA boot, a government-use consent modal, and a desktop-width layout in a 420 px frame. The native list (above) does the job properly with real distances, so the embed was deleted rather than left looking broken in a flight tool. **The `View FAA TFR Map ↗` link stays** in the TFR section — in a real tab the page is usable and the map button works.

### Contracts the renderer depends on

- **All four feeds go through `fetchAv()`**, which retries once on a fresh timeout. Do not collapse it back to a bare `fetchT` — the aviation responses are the biggest the page requests and they lose the race on a weak cellular link (Brian's phone, 2026-08-18). Same lesson as `fetchOM` in v4.16.3.
- **Every aviation fetcher returns `{ok, data, err}`** — never a bare empty list. `rAvBriefing` unwraps them and calls `abFail()` when `ok` is false. **Do not add `.catch(()=>[])` at the call site**; swallowing a failure into an empty list is precisely what made a dead feed look like clear skies. A fetch that failed must never be able to render as "no advisories."
- `polyDistNm()` does point-in-polygon first (returns 0 = *overhead*), else nearest-vertex distance; `parseFloat` both fields because the two feeds disagree on string vs number.
- `fTav()` accepts ISO strings, epoch seconds and epoch millis; `fRange()` adds the weekday when a validity crosses a day (a 24 h TAF otherwise reads "11:00 AM — 11:00 AM").
- G-AIRMET `base`/`top` are **hundreds of feet** ("340" = 34,000 ft). `FZLVL` records are a blanket contour product (12 of 25 on a quiet day), so they're rolled into a one-line summary instead of flooding the list; `GA_RELEVANT` ranks the rest low-level-first.

---

## The Forecast Accuracy Log (v4.21.0, 2026-09-17)

**Read this before touching `rWxLog`, any `wxl*` function, or the `bw_wxlog` schema.**

The widget's first retrospective feature: until now nothing in it ever found out whether it was right. Renderer `rWxLog()` → `#wxlB`; log modal `#wxlOv`; the unlogged-window nudge `#wxlNudge`; entry point `openWxLog()` from the 📋 Log button in the Forecast Window header (beside Ask Claude) and from the card header.

### Three layers, and why it isn't just the pilot's opinion

| Layer | Source | Answers |
|---|---|---|
| **His call** | the modal — ACCURATE / OFF, direction, 8 tags, flew/scrubbed | the things no station reports: fog in one field, drainage, how it *felt* |
| **Measured error** | nearest NWS station obs, ±30 min around the target hour | how wrong the model actually was, in mph, whether or not he tags anything |
| **Lead-time drift** | Open-Meteo **previous-runs API** | what the *same valid hour* looked like 1/2/3 days out |

Storing only layer 1 would have produced a log of impressions. Storing only layer 2 would miss every error a station can't see. They are fetched and stored independently, and an entry can hold one without the other.

### Load-bearing decisions — don't "tidy" these

- **⚠ The NWS observation archive reaches back about SEVEN DAYS.** Measured 2026-09-17 at KF70, not assumed: `?start=&end=` returned obs at 1/3/5/7 days back and **zero** at 9 and 14. So an unverified window's measured error is **gone forever** after ~a week. Hence `WXL_OBS_DAYS=7`, the `obsGone` flag (so a dead lookup isn't retried on every press), the amber expiry warning in the card, and the per-entry "obs expires in Nd" line. **Drift is NOT affected** — previous-runs reaches ~92 days — which is exactly why the two fetches are separate.
- **⚠ The previous-runs variables return all-null on `best_match`.** They need an explicitly pinned model; `gfs_seamless` is used because it carries `previous_day1` through `previous_day3` (HRRR only has `day1` — its horizon). This pin is safe **only** because it's a one-hour lookup on a separate host; the main fetch must stay `best_match` for the reasons in Working Notes.
- **Scrub bias is the whole ballgame.** If only flown mornings get entries, the record can only ever conclude the model is conservative, because the days it over-forecast wind are precisely the ones that never get logged. That is why `flew` is stored **separately** from the accuracy call, why the nudge exists at all, and why the empty state says so in as many words. If the nudge is ever made less insistent, this is what's being traded away.
- **The nudge looks back 3 days; obs expire at 7.** Deliberate disagreement: past ~3 days his recall of a specific morning isn't worth much, but the *observation* is still fetchable, so anything logged late still gets layers 2 and 3. Don't "fix" the mismatch by aligning them.
- **Every timestamp is a location-local naive ISO string** (the same strings `hourly.time` holds), and `utc_offset_seconds` is stored **with each entry**. All conversion goes through `wxlUtcMs()` — never `new Date(naiveString)`, which silently reads the *browser's* zone. Same class of bug as the sunrise/sunset gotcha in Ask Claude, and it would corrupt every obs lookup rather than just displaying a wrong time.
- **A dead-calm observation has no direction.** The vector mean of zero-speed components is `atan2(0,0)` = 0 = a confident "N" for a wind that had none. Below a 0.5 mph resultant, `dir` is null. Found in browser testing on a genuinely calm morning — the first verification run recorded `0°` before the fix.
- **Gusts take the window PEAK, speed takes the mean.** A mean gust is meaningless to a balloon. Speed is meaned because 5-minute mesonet reporting makes any single ob noisy.
- **`fcSrc` says where the graded forecast came from** — `'live'` (captured off the screen he was actually looking at) or `'d1'` (reconstructed from the run standing a day ahead, for an hour already outside the loaded window). The lead-time table counts **only `'live'`** in its "Nearest run" lane, so a reconstructed forecast can never masquerade as a short-lead one.
- **A future target is never scored.** `wxlVerifyOne` returns early until the hour has passed by 20 minutes — an unflown window must stay pending, not be graded against nothing.
- **No network call on page load.** The card renders from localStorage in `DOMContentLoaded` before any fetch, and only touches the network when a window is logged or "Check outcomes" is pressed. Verification runs **sequentially with a 250 ms gap**, never as a burst — the same lesson that killed the TAF fetches on cellular (v4.18.1).
- **The trends state facts, never verdicts** — "median +4 mph, model over on 7 of 11" and never "the forecast is unreliable here." Brian's standing rule for the decode work applies with equal force to this card: the widget states, the pilot judges.

### Storage and portability

`bw_wxlog` — `{v, entries[], skips[]}`. Each entry holds `target`/`off`/`tz`, `loc`, the pilot's `call`/`dir`/`tags`/`flew`/`note`, the `fc` snapshot + `fcSrc`, `obs`, `drift`, and the computed `err`. **localStorage is per-device AND per-origin**, so his phone's log and a laptop's log are separate piles — Export/Import JSON is how a log moves, and **import MERGES rather than replaces** (newer `ts` wins), because importing on a second device must never wipe what's already there. Brian chose localStorage over a Cloudflare Worker + KV on 2026-09-17; the schema was designed so that move is a migration, not a rewrite, if he ever wants real cross-device sync.

### The preview path (2026-09-17)

Brian asked to see it somewhere other than the live dashboard before it shipped. **GitHub Pages serves only `main` for this repo, so a preview branch would produce no URL at all** — the preview is therefore an isolated `preview/index.html` on `main`, and `index.html` is left byte-identical. Confirmed after the push: the live page still has zero hits for `wxlB`.

- **The build self-labels.** A violet `PREVIEW BUILD` banner renders only when `location.pathname` contains `/preview/`, so the file that gets reviewed is byte-identical to the one that ships, and a test build can never be mistaken for the live dashboard in the field. Keep that conditional if the preview pattern is reused.
- **⚠ `/preview/` and `/` are the SAME ORIGIN**, so they share localStorage: saved location, Go/No-Go limits, custom stations, font scale and the accuracy log are common to both. That's mostly a feature — the preview shows real settings, and windows logged in it survive the ship — but it also means **a future preview that changes an existing key's schema would corrupt the live widget's state.** v4.21.0 only adds `bw_wxlog` and touches no existing key, which is what made this safe.
- **Publishing deletes the preview** in the same commit, so there's never a stale second copy of a flight tool on the site.

### ⚠ Fetch drift by DATE RANGE, never `past_days` (v4.21.1)

`past_days` is capped at **92**. `wxlDrift` used it, so for any window older than that the
response simply did not contain the target hour — `indexOf` missed and the function returned
`null`. **No error, no empty state: the lead-time section just wasn't there**, for exactly the
old flights the past-window logger exists to record. It now asks `start_date`/`end_date` over
a ±1 day window, which reaches as far back as the archive goes and can't drop the target hour
when the API's flattened offset shifts it across midnight.

### Verifying without the Chrome extension

The extension went unresponsive mid-session, so the pass was run in **headless Chrome against
the deployed build** — a real browser engine with a real same-origin policy and real network,
which is the reason the browser-verify rule exists. Recipe, worth reusing:

1. `curl` the deployed `index.html` down.
2. Append **only** a test harness before `</body>` — the app code under test stays byte-identical.
3. Serve it from a tiny Python server that also accepts `POST /r` and writes the body to a file.
4. The harness `await fetch('/r',{method:'POST',body:results})` when done.
5. `chrome --headless=new --disable-gpu --no-sandbox --user-data-dir=<tmp> <url>`, then poll for the file.

⚠ **`--dump-dom` is useless here** — it returns at the load event, long before async tests
finish — and **`--virtual-time-budget` hangs** when real network requests are in flight. The
POST-callback is what makes it reliable.

**Result 2026-09-17: 13 pass / 1 fail, then 14 / 0 after the fix.** The failure was the
`past_days` bug above, which no amount of unit testing would have surfaced — it needed a real
request. Covered: Mar 2 resolves PST (-28800), Aug 28 PDT, Nov 2 PST, instants round-trip to
the right wall clock and UTC, the archived forecast and NWS observation both fetch
cross-origin, and drift resolves across the DST boundary (d1 4.2 / d2 3.9 / d3 3.4 mph).

### Verified in the browser, not by simulation

Per the standing rule at the top of this file. Run 2026-09-17 against a local server in Chrome: a real entry logged through the actual UI captured the live snapshot, fetched **KF70** (French Valley, 0 nm — his home field) for the observation, pulled real drift (d1 2.1 / d2 2.0 / d3 1.5 mph), and computed the error. Also exercised: the d1 fallback for an hour outside the forecast window, a future target staying pending, the obs-expiry warning at 5.5 days, export, import-merge (4 → 5 entries with the existing one updated), and no horizontal overflow at 390 px card width.


---

## Tech Stack

- **Pure vanilla HTML/CSS/JavaScript** — entire app is a single `.html` file
- **No build tools, no frameworks, no dependencies**
- **API integrations:**
  - Open-Meteo GFS (detailed forecasting at multiple altitudes)
  - NOAA/NWS (Area Forecast Discussions, METAR stations)
  - Aviation Weather API (TAFs, SIGMETs, AIRMETs, PIREPs)
  - Sunrise-Sunset API
  - Geocoding (Open-Meteo + Zippopotam)
  - Windy embedded maps
- **Storage:** localStorage for user location, custom limits, custom stations, font scale, and the forecast accuracy log (`bw_wxlog`)
- **Fonts:** DM Sans, JetBrains Mono, Instrument Serif (Google Fonts)

---

## Key Features

- **Surface conditions** — temp, dew point, fog risk, wind, cloud base (LCL), METARs
- **Winds aloft** — multi-altitude vectors (1000–18,000 ft AGL) from 10+ nearby stations, with temperature at every level; temps warmer than the level below flag orange with ▲ to make inversion layers visible at a glance (v4.8.0)
- **Micro winds** — high-resolution 0–2000 ft AGL profile in 100 ft increments
- **Wind shear detection** — auto-flags moderate/strong shear with severity classification
- **Go/No-Go scorecard** — automated flight decision tool with customizable limits; **since v4.13.0 includes a 7th check, Low-Level Shear** (`lowLevelShear(h,i)`: max speed excess of the 0–2000 ft AGL band over the 10 m surface wind + max direction departure where the aloft wind is ≥8 mph, graded against `gngLimits.maxShear` — which existed since the limits were built but was never wired to anything until 2026-08-02). Same check votes in the dawn/dusk `windowVerdict` and shows as a Shear row in the 5-Day window tables. Why: a calm decoupled surface under a 13–14 mph low-level jet (Enumclaw, 2026-08-02) graded FLYABLE because every verdict was surface-only — the micro profile showed the jet but had no vote
- **Reality Check card (v4.14.0, 2026-08-03)** — the modular "topography without hardcoded local rules" layer, built after the Enumclaw Rainier-drainage morning (model forecast fast winds below 1000 ft; actual surface was calm — katabatic outflow + nocturnal decoupling, both subgrid even for HRRR 3 km). Location-agnostic protocol: try every source for the current coordinates, use what responds. Components: **(a) Live obs vs model** — nearest wind-reporting NWS mesonet stations (RAWS/CWOP/METAR/pass sensors via `api.weather.gov/points/{}/stations` + `/observations/latest`, keyless, ALL networks not just K-airports; fresh <2 h only) with a MATCH / MODEL OVER / MODEL UNDER verdict vs the model surface wind; an elevated station (≥800 ft above field, e.g. FTAW1) checks whether the model *verifies aloft* while the valley is calm = shallow-layer effect, not a bad forecast. **(b) Timing diagnosis** — nearest station's last ~12 h of obs lag-scanned (±3 h) against the model surface series; a big MAE improvement at a nonzero lag = "pattern running ahead of/behind the forecast clock" (timing error ≠ magnitude error). **(c) Mixed layer** — NWS forecaster grid (`C.gridUrl`, RLE-expanded per series; mixingHeight m→ft AGL, transportWind km/h→mph): mixing height <800 ft = decoupled-surface regime flag (the drainage signal, from data not lore). **(d) Model agreement** — GEM HRDPS 2.5 km (Env. Canada, `/v1/gem` `gem_hrdps_continental`, covers Canada + northern US, winds aloft incl. gph; auto-absent elsewhere with a note) vs the HRRR-based home data at Sfc/500/1000/1500/2000 ft AGL: AGREE / DIFFER / SPLIT — independent-model spread displayed as real uncertainty. **(e) NBM cross-check** (`ncep_nbm_conus`, calibrated 2.5 km blend) at the selected hour + an NBM Wind row in the 5-Day window tables. **(f) HRRR 15-minute surface wind** strip (target ±1 h; `ncep_hrrr_conus` `minutely_15` — NOT the `_15min` model variant, it returns less data). Go/No-Go gains two automated checks: Live Obs Wind (obs beat model; graded against the same limits, live mode only) and Model Agreement. Ask Claude briefing carries all these signals with "trust the observations" instruction. Renderer `rReality()` → `#rlB`.
- **Terrain-true wind profile (v4.14.0 fix)** — `interpAt()` now builds per-hour profile points from `geopotential_height_*hPa` (fetched all along, previously ignored) instead of the hardcoded sea-level `C.levels.msl` table, drops levels resolving below ground (1000 hPa is ~117 ft UNDERGROUND at Enumclaw's 745 ft field — its "wind" was below-terrain extrapolation feeding the bottom of the micro profile), and anchors the lowest band on the model's real 10 m + 80 m winds (`wind_speed_80m` added to the fetch; 80 m is a native HRRR level). Per-station ground elevation rides on `hourly._elev` so comparison stations filter against their own terrain. `C.levels.msl` values remain only as fallback when gph is null.
- **Smoke & Air Quality card (v4.16.0, 2026-08-04)** — built after two smoke cancellations the widget read right past. Renderer `rAlertsAq()` → `#aqB`, placed between Surface Conditions and Reality Check. Components: **(a)** Open-Meteo Air Quality API (`air-quality-api.open-meteo.com`, keyless CAMS-based, separate endpoint/quota-cheap) — hourly PM2.5/PM10/US AQI, forecast 5 days + historical mode, mirroring `omUrl` date logic; lookup helper `aqAt(iso)` (exact local-ISO `indexOf` match, same pattern as the NBM row). **(b)** NWS active point alerts (`api.weather.gov/alerts/active?point=`) — Air Quality Alerts, Dense Smoke Advisories, Red Flag Warnings, Wind Advisories etc.; `alertIsSmoke()` regex tints smoke/fire/AQ events with the `--ka` smoke color. **(c)** 8th Go/No-Go check "Air Quality (Smoke)" graded against `gngLimits.maxAqi` (default 100; go ≤max, caution ≤1.5×, nogo above; an active smoke alert bumps go→caution, and substitutes as a caution check where AQ data is missing). AQI also votes in `windowVerdict` and renders as a conditional AQI row in the 5-Day tables + surface stat + hourly-detail tile. **(d)** AFD keyword category `ka` (smoke, smoky, haze, hazy, wildfire, air quality, red flag — 'smoke' also catches forecasters' "Smokey"). **(e)** METAR `FU`/`HZ` present-weather flags in Reported Cloud Layers. **(f)** Ask Claude briefing: AQI-at-target line, active-alerts line, max-AQI in the limits, smoke in the assessment instructions. **(g)** EPA scale bar legend (v4.16.1): six equal colored band segments with ▼ selected-hour marker, │ pilot-limit tick, boundary numbers, and a 24h-peak key line — `aqPos()` maps a value to its % position. Card badge links to AirNow Fire & Smoke map centered on the location. AQI color/label helpers `aqiC`/`aqiLbl` follow EPA bands (purple ≥201).
- **Dawn/dusk window analysis** — FLYABLE/MARGINAL/NO-GO verdicts
- **Aviation briefing** — TAFs, SIGMETs, AIRMETs, PIREPs
- **NWS Area Forecast Discussion** — keyword-highlighted AFD with category extraction
- **Embed mode (v4.9.x, 2026-07-30, built for the Flight Maps app integration)** — `?embed=1&lat=..&lon=..&name=..`: hides title chrome (slim Location/Settings/Refresh bar), host GPS coords run the full selectLocation pipeline (skips re-discovery if within ~0.05° of saved location), Location button stays functional. Developer handoff doc: `BALLOON-WEATHER-BUILD.md` in this folder (written for Alito — data sources, embed recipe, Open-Meteo licensing note). Flight Maps embeds the live Pages URL, so pushes auto-update the app. ⚠ **Brian, 2026-09-27: the widget is not part of Flight Maps.** Don't describe it as a Flight Maps feature.
- **Time picker** — live mode or historical/forecast with day/hour selection; **sticky at the top of the page (v4.9.0)** — lives in its own `.tpwrap` wrapper OUTSIDE the `.dash` grid (a sticky grid item only pins within its own row), auto-compacts when pinned (`.stuck` via IntersectionObserver on `#tpSentinel`; selected time mirrors into `#tpSelMini` in the header) so winds aloft etc. can be watched while stepping through hours
- **Radar** — full-width animated precipitation radar card (v4.9.0), Windy embed with `overlay=radar` (free, no API key; same lazy-load `setEmbed()` pattern as the Wind Map). Context: MyRadar (the app Brian uses) has no public API — Windy's radar embed is the substitute
- **Ask Claude button (v4.10.0, 2026-08-02; AFD added v4.11.0 same day)** — in the Forecast Window header: packages the selected flight time's raw numbers (surface hourly ±2h, winds-aloft + micro-wind profiles at −2h/target/+2h, pilot limits, sunrise/sunset) **plus the nearest NWS office's Area Forecast Discussion** (auto-resolved by the location pipeline via `C.nwsOffice`; SYNOPSIS/KEY MESSAGES/UPDATE/DISCUSSION/NEAR TERM/SHORT TERM/AVIATION sections extracted from `window._tpAfd`, budgeted so the whole prompt stays ≤~12k chars raw) into a markdown briefing and opens `claude.ai/new?q=<prompt>` prefilled. **v4.12.0 also embeds the widget's pre-computed read** — Go/No-Go scorecard (via the shared `computeGng(h,i)`, single source of truth with the card), shear flags from `detectShear` over both profiles, and AFD cliff notes (keyword hits + flagged sentences, mirroring rAFD) — so free-tier/smaller models (Haiku/Sonnet) get anchored signals instead of having to derive everything from raw tables; the template tells Claude to anchor on them, then verify against the raw data. Zero API cost, no keys in the page — users analyze on their own Claude account (free tier works). Home-station data only; ~9 KB encoded verified end-to-end into the claude.ai composer 2026-08-02 (HFO AFD while location was Hawaiian Beaches). Builder: `buildClaudeBriefing()` / `askClaude()`. Gotcha found building it: Open-Meteo `daily.sunrise/sunset` are location-local naive ISO strings — format the raw string, never `new Date()`+re-format (shifts when browser TZ ≠ location TZ).
- **Forecast Accuracy Log (v4.21.0, 2026-09-17)** — the first retrospective card: the pilot's own ACCURATE/OFF call with direction and 8 category tags, the measured forecast-vs-observed error from the nearest NWS station, and lead-time drift from Open-Meteo's previous-runs API, rolled into a 56-day calendar heatmap, tag tallies, a measured-error table and an error-by-lead-time table. Logs from the 📋 Log button or a nudge for windows that passed unlogged. localStorage (`bw_wxlog`) with JSON export/import. Full detail and the constraints that shaped it: **"The Forecast Accuracy Log"** section above.
- **Settings panel** — adjustable text size (Compact / Normal / Large / Larger / X-Large) and user-managed custom reporting stations
- **Custom reporting stations** — pilots can add ICAO IDs (e.g. KLAX) that are merged into surface comparison, winds aloft, and the aviation briefing

---

## Working Notes

- Default location: French Valley, CA (33.57N, 117.13W)
- `CFG_VER` (currently 2) manages station discovery logic — incrementing forces users to rediscover nearby stations
- Gust alert threshold defaults to 10 mph
- Responsive design with breakpoints at 900px and 500px
- **Mobile winds layout (2026-07-28; reworked to a swipe band 2026-08-01, v4.9.2):** micro + winds aloft stay side by side on ≤900px — Brian compares the two profiles at a glance; don't re-stack them. Since v4.9.2 the pair is **one wide horizontally-swipeable band**: `.winds-pair{overflow-x:auto}` is the scroller, the winds-aloft card grows to its full multi-station width (`flex:0 0 auto`), station columns compact to 118px (~4 per portrait screenful), and the sticky forecast window floats above the swipe (Brian's ask: "see a bunch of the winds aloft side by side"). Since v4.9.3 the **altitude labels are a frozen left column** (`.vf-alt{position:sticky;left:0}` with opaque card bg; shear-row alts get a gradient-blended bg) — pinned on mobile against the band and on desktop against `.vf-scroll`. **Since v4.9.4 (2026-08-02) the band is HORIZONTAL-ONLY: no `max-height`, no vertical overflow — the page owns all vertical scrolling.** Why: the v4.9.3 `max-height:78vh` clamp made the band a nested vertical scroller that filled nearly the whole phone screen, so downward swipes got trapped scrolling inside it before the page could move (Brian: "hard to scroll past that part"). Cost accepted with the fix: the station header / card titles no longer pin natively during vertical scroll (that pinning only worked because the band was the vertical scroller — sticky can't escape to the page scroll while `.winds-pair` is a scroll container for the swipe). **Repaid in v4.15.4 (2026-08-03): `#vfGhost2` — a one-line strip of station codes rendered by `rProfile` INSIDE `.winds-main` (`position:absolute`, `.winds-main{position:relative}`), so horizontal column alignment during swipes is intrinsic (it lives in the card's coordinate space); `vfGhostSync()` (window scroll/resize listeners) only toggles visibility and sets `top=(tpWrapBottom−cardTop)/fontScale`. Mobile-only ≤900px; desktop pins natively inside `.vf-scroll`. Two earlier failed designs, don't repeat: v4.15.2/.3 used a body-level `position:fixed` clone — it drifted out of column alignment during swipes and, at large font scales, `body{zoom}` makes getBoundingClientRect return VISUAL px while CSS px render zoom×, so every fixed placement needed ÷fontScale (still true for the vertical offset). `left:4px` on the ghost = mobile `.winds-main .body` padding-left, keeping ghost columns exactly over the real ones.** The `.ct` card title still pins horizontally (`sticky;left:10px`, opaque card bg). `.vf-scroll` stays `overflow:visible` ≤900px so the frozen altitude labels reach the band's horizontal scroller. Do NOT re-add a vertical clamp to `.winds-pair`. **Two load-bearing gotchas, both commented in the CSS:** (1) `.winds-pair{align-items:flex-start}` — default stretch + `.cd`'s `overflow:clip` silently cuts off the lower altitudes with no way to scroll; (2) mobile `.winds-main{overflow:clip}` — the base `overflow:hidden` makes the card a scroll container that captures the stickies before they reach the band. Shear-band readouts render in **every** station column so the band is self-labeling at any swipe position (also fixes desktop, where the single left label used to scroll away). Desktop >900px unchanged: winds-main flex:1 with internal horizontal station scroll.
- ⚠ **Grid auto-min trap (fixed in v4.9.1, 2026-08-01):** `.dash`'s tracks must stay `minmax(0,1fr)`, never bare `1fr`. With `1fr`, the track's automatic minimum equals the widest card's intrinsic width — and `.cd{overflow:clip}` does NOT zero that minimum (clip isn't a scroll container, unlike hidden/auto) — so the wide station/hourly strips blew every card out to ~1700px, disabled every internal `overflow-x:auto` scroller (content fit, nothing to scroll), and made the whole page pan horizontally on the phone, carrying the sticky forecast window off-screen. With `minmax(0,1fr)` the cards stay viewport-width, the station tables scroll inside their own cards, and the picker stays pinned. Symptom to recognize if it regresses: page scrolls sideways as a whole + winds-aloft stations pan with it.
- ⚠ **CSS cascade trap:** the big `@media(max-width:900px)` block sits near the TOP of the stylesheet, so any mobile override of a class whose base rule is defined LATER in the file silently loses (equal specificity, source order wins — the old "mobile bigger fonts" overrides for `.vf-alt`/`.mvf-*` in that block are dead for this reason). Put new mobile overrides in a media block AFTER the base rules they override.
- **Density rule (Brian, 2026-08-03, v4.15.0): compact through SPACING, never font size.** Brian runs a large font scale (body `zoom:var(--fs-scale)`) and wants everything readable AND dense — so when tightening layout, cut paddings/margins/row-heights/gaps and shorten labels, but leave font sizes alone (winds-aloft rows went 60/65px → 46/48px, micro 28/32 → 24/26, Go/No-Go rows 10px → 6px pad, card body 16/18 → 12/14, etc.). Table pattern: ID/short label first + data columns immediately after + long names in a trailing dim Name column (v4.14.1, obs table) — never long names inline in the first column.
- **`models=best_match` IS HRRR here — verified 2026-08-03 by differential testing** (best_match matched `ncep_hrrr_conus` 24/24 hours at Enumclaw for surface AND pressure-level winds, same grid point, through ~h48–60, then a blended seam into GFS; numerically identical to `gfs_seamless`). Do NOT "upgrade" the main fetch by pinning `ncep_hrrr_conus`: HRRR's horizon would null out days 3–5 and break the 5-Day cards, and best_match degrades gracefully outside CONUS (Hawaii). Caveat: best_match's 70/30 hPa levels and its >48 h tail are silently GFS.
- **Open-Meteo free tier is non-commercial — Brian's ruling 2026-08-03:** the widget is weather-forecast R&D, secondary to the resources he actually flies on; if it ever goes commercial he'll pay for the API tier. Revisit if the widget becomes an operational dependency.
- All API failures handled gracefully — non-critical data failing won't break the app
- **Transient wrong-station data after a location switch (observed 2026-08-02, pre-existing):** when a page load hits the CFG_VER station-rediscovery path, the initial `refreshAll` can run with the previous/default station list, leaving `_tpHomeData` holding another location's response (response's own `latitude`/`longitude` fields reveal it) until the rediscovery refetch or a manual Refresh. Self-heals; don't chase "impossible" numbers before checking `_tpHomeData.latitude` against `C.lat`.
- **Open-Meteo free-tier quota (learned 2026-07-29, the "Enumclaw outage"):** the daily limit (~10k weighted calls) is shared per public IP across all devices; the 12-station fan-out at full weight every 5 min from a left-open tab exhausts it → HTTP 429 "try again tomorrow" (resets midnight UTC = 5 PM PT). Fix shipped (Brian's call, 2026-07-29): **auto-refresh REMOVED entirely — one fetch on page load, then the manual Refresh button is the only API trigger. Do not re-add auto-refresh.** Also kept: non-home stations cached 15 min in live mode (manual Refresh = force-fresh, historical/forecast bypass) and a dedicated 429 error message.
