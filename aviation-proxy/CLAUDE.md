# aviation-proxy — the CORS shim the Aviation Briefing card runs on

> **Reading protocol:** the parent [CLAUDE.md](../CLAUDE.md) routes here and is authoritative for the widget itself — read its **"The Aviation Briefing card + its CORS proxy"** section before changing anything here. This file is authoritative inside this folder.

## Active to-do

*Live state, not a log (workspace convention — root CLAUDE.md, "status report" protocol): add items as work opens them, **delete** them when done. Numbered in priority order.*

1. **Week-one watch (deployed 2026-08-18).** Nothing to do unless the widget starts showing "⚠ Couldn't load …". If it does, check `/health` first, then `npx wrangler tail aviation-proxy`. The known flake is upstream 502s at Cloudflare's egress (see conventions) — one retry already absorbs the ones seen so far; if they get worse, raise the retry count or lengthen the cache.

## What this is

A ~120-line Cloudflare Worker that does one thing: put an `Access-Control-Allow-Origin` header on `aviationweather.gov` responses so a browser can read them.

**Live:** `https://aviation-proxy.brianfliesballoons.workers.dev`
**Account:** Brian's Cloudflare account (free tier).
**Routes:** `/taf?ids=` · `/airsigmet` · `/gairmet` · `/pirep?id=&distance=` · `/tfr` · `/tfrdetail?id=` · `/health`

Two upstreams now: `aviationweather.gov` (the first four) and `tfr.faa.gov` (the TFR pair) — **both** ship without CORS. A route may declare its own `url()`, and `/tfrdetail` also declares a `parse()`.

### Why it has to exist

`aviationweather.gov` sends **no CORS header at all** (verified on GET *and* the OPTIONS preflight, 2026-08-18). The balloon weather widget's entire Aviation Briefing card — TAFs, SIGMETs, AIRMETs, PIREPs — was therefore blocked in every browser from the day it shipped, and rendered "No TAFs available" / "No active SIGMETs in your area" instead of an error. A dead feed that reads as clear skies is the worst failure mode a flight tool has, which is why this is worth a Worker.

`api.weather.gov` carries TAFs and SIGMETs as raw text products *with* CORS, so a proxy-free fix existed for those two — but AIRMETs are only available as structured G-AIRMETs from `aviationweather.gov`, and Brian wanted the AIRMETs. Hence the Worker, which also keeps the richer JSON (hazard, severity, polygons, valid times) for all four sections.

## The files

| File | What it is |
|---|---|
| `src/worker.js` | primary copy — the whole proxy |
| `wrangler.toml` | deploy config; `workers_dev = true` |

## Operations

- **Deploy:** `cd aviation-proxy && npx wrangler deploy` — ⚠ wrangler is **not** installed globally on this Mac; `npx` is required (`wrangler: command not found` otherwise).
- **Logs:** `npx wrangler tail aviation-proxy`
- **Health:** `curl https://aviation-proxy.brianfliesballoons.workers.dev/health` → `{"ok":true,"v":"…"}`
- **Bump `VERSION`** in `src/worker.js` when changing behaviour — it surfaces at `/health` and is the fastest way to confirm which build is actually serving (a deploy that *looks* successful can still be serving the old isolate for a few seconds).

## Conventions specific to this project

- **Never make this a general proxy.** Only the four declared upstream paths are reachable, and only each route's declared query params are forwarded (rebuilt from an allowlist, never passed through wholesale, and charset-validated). This is what stops it being used to launder arbitrary traffic through Brian's account. Adding a route means adding it to `ROUTES` deliberately.
- **Keep the retry.** `aviationweather.gov` intermittently returns 502 to Cloudflare's egress IPs while the identical URL succeeds from a residential connection — reproduced consistently on `/pirep` at first deploy. One retry cleared it. This is an upstream quirk, not a bug here.
- **Keep the 120 s cache.** It's a government host and the widget fans out on every page load.
- **204 is normalised to `[]`.** "Valid request, nothing active" must reach the caller as an empty list, never as an error — the widget distinguishes *no advisories* from *couldn't load*, and that distinction is the whole safety point.
- **`/tfrdetail` parses upstream XML down to JSON in the Worker, on purpose.** The FAA detail document is ~26 KB of XNOTAM XML; we return ~1.8 KB carrying just the polygon vertices, vertical limits and radius. The caller is a phone on cellular fetching a dozen of these, so doing the parse at the edge is a ~15× saving on the link that matters. Regex, not a parser — Workers have no DOMParser and the tags are flat.
- **`/tfr` and `/tfrdetail` take no `format` param** — that's an aviationweather.gov convention. Routes with their own `url()` skip it.
- **Deploy artifacts stay out of iCloud sync noise** — if a `.wrangler/` cache dir appears, it's disposable.

## Delegation notes

- Small enough to hold in context; no fetch-delegation needed.
- ⚠ Any change here must be **verified in a real browser**, not just with curl. Server-side requests have no same-origin policy — that blind spot is precisely what hid the original bug for months.
