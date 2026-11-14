# Climbout

**Live flight tracker: pick any flight, watch it on a map with instruments, weather radar, airport reports and time remaining.**

Live at **https://american2day.com/climbout/**

Climbout is a single-screen web page, styled like a cockpit display, that follows one aircraft at a time using free, public
ADS-B data. Type a flight number such as `DL2289`, `UA 123` or `BA15`, an ICAO callsign (`DAL2289`), a tail number
(`N812DN`, `G-EUPT`) or a 6-character ICAO hex code. You can also pick a flight from the list of aircraft in the air near you.
It works on desktops, tablets and phones (portrait and landscape).

## Features

- **One search box** that works out what you typed. IATA flight numbers are converted to ICAO callsigns using a built-in
  table of about 150 airlines (`DL2289` → `DAL2289`, `BA0015` → `BAW15`). A manual override (Auto / Callsign / Tail / Hex)
  is next to the box.
- **Browse live flights** within 50, 100 or 200 NM of an airport, or of your location if you choose to share it. Click a row
  to track that flight.
- **Recent flights**: the last 8 flights you tracked appear as quick-switch chips (stored only in your browser).
- **Route discovery**: origin and destination come from the adsb.lol route database. They are checked against the aircraft's
  position, and multi-stop flight numbers are matched to the leg being flown. If the route is missing or wrong, set
  **From / To** yourself (ICAO or IATA). Your setting is remembered for that flight on your device and added to the link.
- **Map**: street map (OpenStreetMap tiles) with US NEXRAD radar and NWS storm-warning overlays. There is also a
  **low-data map** that works anywhere in the world with no map tiles. It fits itself to the route and aircraft and draws
  coastlines and a labelled grid.
- **Instruments**: altitude tape with the autopilot-selected altitude, ground speed or true airspeed gauge (estimated from
  wind when the aircraft does not send it), Mach, heading, vertical speed and signal age.
- **Trip**: progress, distance remaining, time remaining, ETA (in your own time zone) and top-of-descent hint.
- **Weather**: model temperature and wind at the aircraft's altitude and on the ground (Open-Meteo), plus current airport
  reports (METAR) for the departure and arrival airports.
- **Profile and log**: altitude and speed chart, plus a list of flight events (climb, cruise, descent) built from the
  positions recorded while the flight is being watched.
- **Data panel**: squawk (emergency codes highlighted), registration, ICAO hex, aircraft type, selected altitude, heading and
  QNH, position accuracy, and receiver statistics.

## How it works

```
browser (index.html + app.js + style.css + land.js)
   │  same-origin JSON only
   ▼
api.php  ──►  api.adsb.lol                 live aircraft, flights near a point, routes
         ──►  vrs-standing-data.adsb.lol   route database (fallback)
         ──►  aviationweather.gov          airport details, METAR
browser  ──►  api.open-meteo.com           weather model (direct, no key)
         ──►  tile.openstreetmap.org, mesonet.agron.iastate.edu   map tiles, radar, warnings
```

`api.php` is a small read-only gateway. It validates every input, talks only to the fixed upstream hosts written in the
file, trims responses down to the fields the page uses, caches everything in a private temp folder, and enforces a
site-wide budget of upstream calls per minute. While anyone is watching a flight, it also records that flight's track so
the profile chart and trail can show the earlier part of the flight.

There is no build step, database, framework or API key. The low-data map's coastlines (`land.js`) and the IATA→ICAO airport
table (`data/iata-icao.json`) are generated once by the scripts in `tools/` and committed.

## Requirements and deployment

- PHP 8.0+ with the `curl` extension (it falls back to PHP streams if curl is missing) and a writable temp directory.
- Any web server that runs PHP (Apache with mod_php or PHP-FPM, nginx + PHP-FPM, shared hosting...).

**Deploy:** upload the files to any folder on a PHP host. That's it. The page loads `./api.php` relative to itself, so
it works at a domain root or in a subfolder. Files under `tools/` and the `*.md` files are not needed at runtime.

The cache lives in `sys_get_temp_dir()/climbout-cache`. To keep it somewhere else, set the `SITE_PRIVATE` environment
variable (for example `SetEnv SITE_PRIVATE /var/lib/climbout` in Apache) to a writable folder **outside** the web root.

Check the gateway with `api.php?health=1` (expect `"remote_http_status":200`).

On every release, bump the `?v=` version stamp on `style.css`, `land.js` and `app.js` in `index.html`, so browsers and
CDNs pick up the new files.

**Search engines:** Climbout is a public tool and does not block indexing. To keep a copy out of search results, add
`<meta name="robots" content="noindex">` to the `<head>` of `index.html`.

## URL parameters

| Parameter | Example | Meaning |
|---|---|---|
| `id` + `mode` | `?id=DAL2289&mode=callsign` | Track by callsign, `mode=reg` (tail number) or `mode=hex` (ICAO hex) |
| `flight` | `?flight=DL2289` | Any search text; auto-detected the same way as the search box |
| `from`, `to` | `&from=KSLC&to=KDTW` | Manual route (ICAO or IATA); overrides the route database |

Choosing a flight in the page updates the address bar, so the URL can be shared or bookmarked.

### Gateway (`api.php`)

| Request | Returns |
|---|---|
| `?id=DAL2289&mode=callsign\|reg\|hex` | The matching aircraft plus the recorded track |
| `?near=LAT,LON&r=NM` | Airborne flights with a callsign near a point (radius 10–250 NM, point rounded to 0.1°) |
| `?route=CALLSIGN&lat=..&lon=..` | Origin and destination, if known |
| `?airport=ID[,ID]` | Airport name and position (1–4 ICAO or IATA codes) |
| `?metar=ICAO[,ICAO]` | Current airport reports (1–4 codes) |
| `?health=1` | Gateway diagnostics |

Cache lifetimes: aircraft 25 s, nearby flights 15 s, routes 1 h (5 min when not found), airports 7 days, METAR 5 min.

## Privacy

- No accounts, cookies, analytics or ads in the app.
- Recent flights, manual routes and display settings are kept in your browser's `localStorage` only.
- **Location is optional.** It is only requested when you press "Use my location". It is rounded to about 6 km in the
  browser, used only to list nearby flights, and not stored on the server. The server rounds the point again before it
  calls adsb.lol.
- Your browser loads map tiles, radar and weather directly from the providers below, so they see your IP address the way
  any website you visit does.
- The server keeps short-lived caches and the recorded track of watched flights in its temp folder. It keeps no logs of
  who tracked what (apart from your web server's normal access log).

## Data sources and attribution

- **Aircraft positions, nearby flights and routes:** [adsb.lol](https://www.adsb.lol/), a free community ADS-B network.
  Data licensed under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Please
  respect it: Climbout caches every request and identifies itself with a `User-Agent`.
- **Airport details and METAR:** [NOAA / NWS Aviation Weather Center](https://aviationweather.gov/) (US government data).
- **Weather model:** [Open-Meteo](https://open-meteo.com/) (free non-commercial API, data under CC BY 4.0).
- **Radar and storm warnings:** NWS / NEXRAD via the [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu/)
  (US only).
- **Street map tiles:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, with
  [CARTO](https://carto.com/attributions) as a backup. Use follows the
  [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- **Low-data map coastlines:** [Natural Earth](https://www.naturalearthdata.com/) 1:110m land (public domain).
- **IATA→ICAO airport codes:** [OurAirports](https://ourairports.com/data/) (public domain).
- **Libraries and fonts (bundled in `vendor/`):** [Leaflet](https://leafletjs.com/) 1.9.4 (BSD-2-Clause) and
  [Antonio](https://github.com/googlefonts/antonioFont) (SIL Open Font License 1.1). Their licenses are included.

## Limitations

- **Coverage:** positions come from volunteer receivers. Over oceans, remote areas and some countries there may be no
  signal for long stretches. Aircraft often stop broadcasting a usable position at the gate.
- **Estimates, not airline predictions:** time remaining and ETA are estimated from straight-line distance and current
  ground speed (with a cruise-speed assumption while climbing). Climbout has no schedule, gate or delay data.
- **Route data can be wrong or missing**, especially for charter, cargo, private, military and newly changed flights. The
  page warns when the database route doesn't match the aircraft's position. You can always set the route by hand.
- Flight-number conversion covers about 150 common airlines. For others, type the ICAO callsign (3 letters + number) shown
  on the browse list.
- Many airlines, especially in Europe and the Middle East (Ryanair, easyJet, Lufthansa, Swiss, Qatar Airways...), fly many
  flights under an alphanumeric radio callsign that differs from the flight number (for example `RYR4KM`, `SWR18P`). A
  flight-number search cannot find those: search the tail number or the callsign shown on the browse list instead.
- Radar and warning overlays cover the United States only.
- Climbout is not an airline-operated service and is not for navigation or operational use.

## Rebuilding the generated data

```sh
# coastlines for the low-data map (Natural Earth 1:110m land, public domain)
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
python3 tools/land.py ne_110m_land.geojson land.js
# IATA -> ICAO airport table (OurAirports, public domain)
curl -LO https://davidmegginson.github.io/ourairports-data/airports.csv
python3 tools/iata.py airports.csv data/iata-icao.json
```

## License

[Apache License 2.0](LICENSE). Copyright 2026 Will Simon. Bundled third-party files keep their own licenses (see `vendor/`).
Made by [Will Simon](https://github.com/wsimon98).
