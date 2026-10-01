/**
 * aviation-proxy — CORS shim in front of aviationweather.gov.
 *
 * Why this exists: aviationweather.gov serves TAFs / SIGMETs / G-AIRMETs /
 * PIREPs with NO Access-Control-Allow-Origin header of any kind, so a browser
 * blocks every call before the data arrives. The balloon weather widget's whole
 * Aviation Briefing card was silently dead from the day it shipped because of
 * it (diagnosed 2026-08-18). Everything else the widget talks to — api.weather.gov,
 * Open-Meteo — sends `*` and works fine. This Worker adds the missing header.
 *
 * Deliberately NOT an open proxy: only the four upstream paths below are
 * reachable, and only the query params each one declares are forwarded. Anything
 * else is rejected before a subrequest is made, so this can't be used to launder
 * arbitrary traffic through the account.
 */

const VERSION = "4";
const UPSTREAM = "https://aviationweather.gov/api/data";

// route -> { params we forward, and where it actually goes }.
// Anything not listed here is rejected before a subrequest is made.
const ROUTES = {
  taf: { params: ["ids"] },
  airsigmet: { params: [] },
  gairmet: { params: ["type"] },
  pirep: { params: ["id", "distance", "age"] },

  // ── FAA TFRs. Different host, also missing CORS. ──
  // The full active-TFR list. No coordinates in it — only state/type/description.
  tfr: { params: [], url: () => "https://tfr.faa.gov/tfrapi/exportTfrList" },
  // One TFR's detail. The upstream is a ~26 KB XNOTAM XML document; we parse it
  // here and hand back a few hundred bytes, because the caller is a phone on
  // cellular fetching a dozen of these. id looks like "6_6067".
  tfrdetail: {
    params: ["id"],
    url: (p) => `https://tfr.faa.gov/download/detail_${p.get("id")}.xml`,
    parse: parseTfrDetail,
  },
};

// Pull the polygon vertices and vertical limits out of an XNOTAM detail doc.
// Regex rather than a parser: Workers have no DOMParser, and the two tags we
// need are flat and unambiguous. Coordinates look like "39.98346436N".
function parseTfrDetail(xml, id) {
  const dms = (s) => {
    const m = String(s).trim().match(/^([\d.]+)\s*([NSEW])$/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    if (!isFinite(v)) return null;
    return /[SW]/i.test(m[2]) ? -v : v;
  };
  const lats = [...xml.matchAll(/<geoLat>([^<]+)<\/geoLat>/g)].map((m) => dms(m[1]));
  const lons = [...xml.matchAll(/<geoLong>([^<]+)<\/geoLong>/g)].map((m) => dms(m[1]));
  const coords = [];
  for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
    if (lats[i] !== null && lons[i] !== null) coords.push({ lat: lats[i], lon: lons[i] });
  }
  const one = (tag) => {
    const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return m ? m[1].trim() : null;
  };
  return {
    id,
    coords,
    lower: one("valDistVerLower"),
    upper: one("valDistVerUpper"),
    upperCode: one("codeDistVerUpper"),
    radiusNm: one("valRadiusArc"),
    effStart: one("dateEffective"),
    effEnd: one("dateExpire"),
  };
}

// Upstream data refreshes on the order of minutes; this keeps the widget snappy
// and keeps us from hammering a government host on every page load.
const CACHE_SECONDS = 120;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      ...CORS,
      ...extra,
    },
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/+|\/+$/g, "");

    if (route === "" || route === "health") {
      return json({ ok: true, v: VERSION, routes: Object.keys(ROUTES) });
    }
    if (!Object.prototype.hasOwnProperty.call(ROUTES, route)) {
      return json({ error: "unknown route", routes: Object.keys(ROUTES) }, 404);
    }

    const spec = ROUTES[route];

    // Rebuild the query string from the allowlist — never forward it wholesale.
    const out = new URLSearchParams();
    for (const key of spec.params) {
      const v = url.searchParams.get(key);
      // Conservative charset: station lists, numbers, simple words.
      if (v && /^[A-Za-z0-9_,.\- ]{1,300}$/.test(v)) out.set(key, v);
    }

    let target;
    if (spec.url) {
      // A route with its own upstream (the FAA host). It takes no format param.
      if (spec.params.length && ![...out.keys()].length) {
        return json({ error: `missing required param for /${route}` }, 400);
      }
      target = spec.url(out);
    } else {
      out.set("format", "json");
      target = `${UPSTREAM}/${route}?${out.toString()}`;
    }

    // aviationweather.gov intermittently 502s at Cloudflare's egress (the same
    // URL is fine from a residential IP), so one retry before giving up.
    let upstream = null, lastErr = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        upstream = await fetch(target, {
          headers: {
            "User-Agent": "balloon-weather-widget (+https://brianfliesballoons.github.io/balloon-weather/)",
            "Accept": "application/json",
          },
          cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
        });
        if (upstream.ok || upstream.status === 204) break;
        lastErr = `upstream ${upstream.status}`;
      } catch (e) {
        lastErr = String(e);
        upstream = null;
      }
    }
    if (!upstream) {
      return json({ error: "upstream unreachable", detail: lastErr, v: VERSION }, 502);
    }

    // 204 = valid request, nothing active. Normalise to an empty list so the
    // caller never has to distinguish "no data" from "broken" by parsing luck.
    if (upstream.status === 204) return json([]);

    if (!upstream.ok) {
      let detail = "";
      try { detail = (await upstream.text()).slice(0, 300); } catch { /* ignore */ }
      return json({ error: "upstream error", status: upstream.status, detail, target, v: VERSION }, 502);
    }

    const text = await upstream.text();

    // Routes with a parser hand back their own compact shape (see tfrdetail —
    // a 26 KB XML becomes a few hundred bytes, which matters on cellular).
    if (spec.parse) {
      try {
        return json(spec.parse(text, out.get("id") || ""));
      } catch (e) {
        return json({ error: "parse failed", detail: String(e), v: VERSION }, 502);
      }
    }

    let data;
    try {
      data = text.trim() ? JSON.parse(text) : [];
    } catch {
      return json({ error: "upstream returned non-JSON" }, 502);
    }
    return json(data);
  },
};
