# Balloon Weather

An aviation weather briefing dashboard for hot air balloon pilots, in a single HTML file.
**Live:** https://brianfliesballoons.github.io/balloon-weather/

| Path | What it is |
|---|---|
| `index.html` | The whole widget: vanilla HTML/CSS/JS, no build step. GitHub Pages serves it. |
| `CLAUDE.md` | Project notes: every feature, why it's built the way it is, bugs found and the rules that came out of them. Start here. |
| `BALLOON-WEATHER-BUILD.md` | Build overview and embed guide (data sources, `?embed=1` recipe, licensing). |
| `aviation-proxy/` | Cloudflare Worker that adds CORS to aviationweather.gov for the TAF / SIGMET / AIRMET / PIREP / TFR cards. |

The working copy lives outside this repo. `CLAUDE.md` refers to it as `opus 4.7/balloon-weather-ACTIVE.html`, and it is published here as `index.html`. Paths in `CLAUDE.md` like `opus 4.6/` and `opus 4.7/` describe that working folder, not this repo.
