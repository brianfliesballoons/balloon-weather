# Balloon Weather — Build Overview & Embed Guide

**For:** Flight Maps integration (Alito)
**From:** Brian Lynch
**Live app:** https://brianfliesballoons.github.io/balloon-weather/
**Repo:** https://github.com/brianfliesballoons/balloon-weather (GitHub Pages, `main` branch, `index.html`)
**Version:** 4.9.x · July 2026

---

## What it is

A single-file aviation weather briefing dashboard purpose-built for hot air balloon operations. Location-agnostic (works anywhere in the US), dark-UI, mobile-first. Design philosophy: *minimal and maximal at the same time* — everything a balloon pilot needs for a go/no-go decision and in-flight awareness, nothing else.

The whole application is **one `index.html` file (~1,700 lines)**: vanilla HTML/CSS/JavaScript. No framework, no build step, no bundler, no backend, no API keys, no accounts. The browser fetches every data source directly.

## What it shows

| Card | What's in it |
|---|---|
| **Forecast Window** | Sticky time picker — LIVE mode or any hour up to 5 days out, plus 2 days back (historical). Changing the hour re-renders every card below from already-fetched data. |
| **Surface Conditions** | Temp, dew point, spread, est. cloud base (LCL), cloud cover, visibility, precip chance, sea-level pressure, sun/twilight times, live wind compass with gusts. |
| **Hourly Forecast** | Next 24 h strip: temp, precip %, wind + gusts, direction, cloud base. |
| **Micro Winds** | 0–2,000 ft AGL profile in 100 ft increments — the pattern-level detail balloonists actually launch on. |
| **Winds Aloft** | The centerpiece. 1k–18k ft vectors for the home point **plus ~10 surrounding reporting stations** (auto-discovered per location), with temps at every level, inversion flagging (▲), and automatic wind-shear detection bars. Side-by-side with Micro Winds on mobile. |
| **Area Forecast Discussion** | The local NWS office's full AFD with keyword detection/highlighting (marine layer, gusts, thunderstorms, wind shear, etc.). |
| **Wind Map + Radar** | Windy.com embeds — wind overlay and animated precipitation radar with time scrubber. |
| **Aviation Briefing** | TAFs, SIGMETs, AIRMETs, PIREPs for the nearest METAR stations. |
| **5-Day Overview** | Dawn/dusk flight windows with FLYABLE / MARGINAL / NO-GO verdicts. |
| **Go / No-Go** | Automated decision scorecard with pilot-customizable limits (stored locally). |

## Data sources (all fetched client-side, HTTPS, no keys)

| Source | Endpoint | Used for |
|---|---|---|
| **Open-Meteo** | `api.open-meteo.com/v1/forecast` | The forecast backbone: surface variables + **16 pressure levels (1000–500 hPa) × wind/temp/dew/height** per station, `models=best_match` (auto-selects HRRR 3 km for CONUS surface, GFS/ICON/ECMWF aloft). This is the winds-aloft data that WeatherKit/MapKit does not carry. |
| **NWS API** | `api.weather.gov` | Area Forecast Discussion, METAR observations, station auto-discovery (`/points/{lat,lon}`), forecast office lookup. |
| **Aviation Weather Center** | `aviationweather.gov/api/data/*` | TAFs, SIGMETs/AIRMETs, PIREPs. |
| **Open-Meteo Geocoding + Zippopotam** | | City/ZIP search in the Location picker. |
| **Sunrise-Sunset.org** | | Twilight times. |
| **Windy.com** | `embed.windy.com` iframes | Wind map + animated radar (self-contained embeds, their own data). |

**Update/refresh model:** one fetch on page load, then the manual **Refresh** button only — no background polling (deliberate; keeps API usage tiny and predictable). Location, custom limits, custom stations, and font scale persist in `localStorage`.

## How location works

Given any lat/lon, the app self-configures: NWS forecast office (for the right AFD), ground elevation, timezone, the 4 nearest METAR stations, and ~10 comparison stations banded by distance (5–140 mi) for the winds-aloft spread. Users can add custom ICAO stations in Settings.

---

## Embedding in Flight Maps

### Recommended: point a web view at the live page

The app is a static page with zero dependencies, so embedding is one line of intent:

```
https://brianfliesballoons.github.io/balloon-weather/?embed=1&lat={LAT}&lon={LON}
```

**Embed-mode URL parameters (built for this integration):**

| Param | Effect |
|---|---|
| `embed=1` | Hides the logo/title chrome — slim toolbar with Location / Settings / Refresh only. |
| `lat`, `lon` | Feed the balloon's GPS position straight in. Runs the full auto-configure pipeline (stations, AFD office, elevation, timezone) — the pilot's winds follow the flight, zero setup. |
| `name=...` | Optional display name for the position (e.g. `name=Enumclaw`). |

The pilot can still change location manually via the Location button — host-passed GPS is the starting point, not a lock. If the passed coords are within ~3.5 mi of the last-used location it skips re-discovery and loads instantly.

**Swift options, most→least recommended:**

1. **`SFSafariViewController`** — presents the page as an in-app sheet over the map. Feels native (slide-up, Done button), zero maintenance, and keeps the weather tool cleanly *linked* rather than baked into the app (relevant to licensing, below).
2. **`WKWebView`** — full control (embed it in your own sheet/tab, no Safari UI). `localStorage` persists in the app's own web store, so pilot settings stick between launches.
3. **Native rebuild in Swift** — not recommended: duplicates ~1,700 lines of logic that then drifts out of sync. But if you ever want winds-aloft vectors rendered on the 3D map itself, the Open-Meteo pressure-level endpoint above is the same data you'd call natively — this document is your API map.

### Auto-updating: yes, automatically

The page is served from GitHub Pages off the repo's `main` branch. Every push goes live in ~60 seconds. **An embedded web view always shows the latest version — no App Store review, no app release, no code handoff.** You never touch the widget code; improvements Brian ships appear in Flight Maps immediately.

### Why not MapKit/WeatherKit natively

Apple's WeatherKit provides surface conditions and general forecasts only. It has **no pressure-level (winds aloft) data, no NWS discussion text, no TAFs/PIREPs** — the three things balloon pilots actually decide on. There is no MapKit customization that surfaces data Apple doesn't carry.

### Licensing note (the one flag)

NWS and Aviation Weather Center data are **US public domain** — no restrictions. **Open-Meteo's free tier is licensed for non-commercial use** (their commercial API plan is ~€29/mo and is byte-identical — same endpoints, same models, you just append an API key). While Flight Maps is beta/pre-revenue this is a non-issue at our volumes, and the `SFSafariViewController` link-out pattern keeps the page cleanly Brian's personal non-commercial tool. If Flight Maps commercializes seriously, budget the Open-Meteo subscription — it's a one-line URL change with zero data difference.

---

## Contact

Brian Lynch · brianfliesballoons@gmail.com · (951) 480-5640
