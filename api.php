<?php
declare(strict_types=1);
/**
 * Climbout flight data gateway.
 *
 * A small, read-only JSON proxy in front of free public data services, so the browser never
 * talks to them directly and every upstream request is cached and rate limited here.
 * Upstream hosts are fixed in this file; user input is only ever used as a validated
 * path segment or query value, never as a URL.
 *
 *   ?id=DAL2289&mode=callsign|reg|hex   live aircraft (adsb.lol, ODbL 1.0)
 *   ?near=LAT,LON&r=NM                  airborne flights near a point (adsb.lol)
 *   ?route=CALLSIGN&lat=..&lon=..       route lookup (adsb.lol routeset / VRS standing data)
 *   ?airport=ID[,ID...]                 airport details (NWS Aviation Weather Center)
 *   ?metar=ICAO[,ICAO...]               airport weather reports (NWS Aviation Weather Center)
 *   ?health=1                           gateway diagnostics
 */

// A PHP warning must never become an HTML prefix in an API JSON response.
@ini_set('display_errors', '0');
@ini_set('html_errors', '0');
@ini_set('log_errors', '1');
error_reporting(E_ALL);
ob_start();
register_shutdown_function(function () {
    $error = error_get_last();
    if (!$error || !in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) return;
    while (ob_get_level() > 0) @ob_end_clean();
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode(['ok' => false, 'error' => 'PHP_RUNTIME_FAILURE',
        'message' => 'The flight gateway hit a PHP runtime error. Check the server PHP error log.',
        'server_time' => time()]);
});

const USER_AGENT = 'Climbout/1.0 (+https://github.com/wsimon98/Climbout)';
const ADSB = 'https://api.adsb.lol';
const VRS = 'https://vrs-standing-data.adsb.lol';
const AWC = 'https://aviationweather.gov';
// Upstream calls allowed per minute for the whole site (protects the free community services).
const UPSTREAM_BUDGET = 90;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

function output(array $data, int $http = 200): void {
    while (ob_get_level() > 1) @ob_end_clean();
    http_response_code($http);
    $data['server_time'] = time();
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail(string $message, int $http = 400): void { output(['ok' => false, 'message' => $message], $http); }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    fail('GET only', 405);
}
foreach ($_GET as $k => $v) {
    if (!is_string($v) || strlen($v) > 64) fail('Invalid request');
}

// Private cache folder outside the web root (SITE_PRIVATE env, else the system temp dir).
$private = (string)($_SERVER['SITE_PRIVATE'] ?? getenv('SITE_PRIVATE') ?: '');
$root = $private !== '' && @is_dir($private) && @is_writable($private) ? rtrim($private, '/') : sys_get_temp_dir();
$folder = $root . '/climbout-cache';
if (!@is_dir($folder) && !@mkdir($folder, 0700, true) && !@is_dir($folder)) {
    fail('Private cache storage unavailable', 503);
}
define('CACHE', $folder);
// Now and then, delete cache files nobody has refreshed for 8 days (the longest cache lifetime is 7 days).
if (random_int(1, 500) === 1) pruneCache(8 * 86400);

// ---------------------------------------------------------------- dispatch
if (isset($_GET['health'])) health();
if (isset($_GET['near'])) near((string)$_GET['near'], (string)($_GET['r'] ?? '100'));
if (isset($_GET['route'])) route((string)$_GET['route'], (string)($_GET['lat'] ?? ''), (string)($_GET['lon'] ?? ''));
if (isset($_GET['airport'])) airports((string)$_GET['airport']);
if (isset($_GET['metar'])) metar((string)$_GET['metar']);
if (isset($_GET['id'])) aircraft((string)$_GET['id'], (string)($_GET['mode'] ?? 'callsign'));
fail('Missing parameter: use id, near, route, airport, metar or health');

// ---------------------------------------------------------------- endpoints
function health(): void {
    $c = cacheGet('health', 60);
    if ($c !== null) output($c + ['cached' => true]);
    $probe = upstream(ADSB . '/v2/hex/000000');
    $answer = ['ok' => true, 'status' => 'diagnostic', 'php_version' => PHP_VERSION,
        'curl_available' => function_exists('curl_init'),
        'cache_writable' => @is_writable(CACHE),
        'remote_http_status' => $probe['status'],
        'remote_json_valid' => is_array($probe['data']),
        'message' => 'PHP gateway is running; look at remote_http_status for upstream availability.'];
    cachePut('health', $answer);
    output($answer);
}

function metar(string $raw): void {
    $ids = strtoupper(trim($raw));
    if (!preg_match('/^[A-Z][A-Z0-9]{3}(,[A-Z][A-Z0-9]{3}){0,3}$/D', $ids)) fail('Invalid airport list (1-4 ICAO codes)');
    $key = 'metar-' . $ids;
    $hit = cacheGet($key, 300);
    if ($hit !== null) output(['ok' => true, 'metar' => $hit['data'], 'fetched_at' => $hit['at']]);
    $lock = lockFor($key);
    $hit = cacheGet($key, 300);
    if ($hit !== null) output(['ok' => true, 'metar' => $hit['data'], 'fetched_at' => $hit['at']]);
    $r = upstream(AWC . '/api/data/metar?format=json&ids=' . $ids);
    if ($r['status'] === 204) $r = ['status' => 200, 'data' => []];
    if ($r['status'] === 200 && is_array($r['data'])) {
        $list = array_values(array_filter($r['data'], 'is_array'));
        cachePut($key, ['at' => time(), 'data' => $list]);
        output(['ok' => true, 'metar' => $list, 'fetched_at' => time()]);
    }
    $old = cacheGet($key, 86400);
    if ($old !== null) output(['ok' => true, 'metar' => $old['data'], 'fetched_at' => $old['at'], 'stale' => true]);
    fail('Airport reports unavailable (HTTP ' . (int)$r['status'] . ')', 502);
}

function airports(string $raw): void {
    $list = array_values(array_unique(array_filter(array_map('trim', explode(',', strtoupper($raw))), 'strlen')));
    if (count($list) < 1 || count($list) > 4) fail('Use 1-4 airport codes');
    foreach ($list as $q) {
        if (!preg_match('/^([A-Z]{3}|[A-Z][A-Z0-9]{3})$/D', $q)) fail('Invalid airport code: use ICAO (KDTW) or IATA (DTW)');
    }
    // missing = the upstream answered and has no such airport; unavailable = the lookup failed or ran out
    // of time (not cached, so a retry can succeed). One request spends at most ~15 s on upstream calls.
    $out = []; $missing = []; $unavailable = [];
    $deadline = microtime(true) + 15;
    foreach ($list as $q) {
        $ap = airportLookup($q, $deadline);
        if ($ap === false) $unavailable[] = $q; elseif ($ap === null) $missing[] = $q; else $out[] = $ap;
    }
    output(['ok' => true, 'airports' => $out, 'missing' => $missing, 'unavailable' => $unavailable]);
}

function near(string $raw, string $rRaw): void {
    if (!preg_match('/^(-?\d{1,2}(?:\.\d{1,6})?),(-?\d{1,3}(?:\.\d{1,6})?)$/D', trim($raw), $m)) fail('Invalid position: use near=LAT,LON');
    $lat = (float)$m[1]; $lon = (float)$m[2];
    if (abs($lat) > 90 || abs($lon) > 180) fail('Position out of range');
    if (!preg_match('/^\d{1,3}$/D', $rRaw)) fail('Invalid radius');
    $r = max(10, min(250, (int)$rRaw));
    // Round the point (about 6 km) before it leaves this server: better cache hits and
    // the viewer's exact location is never sent upstream.
    $lat = round($lat, 1); $lon = round($lon, 1);
    $key = sprintf('near-%.1f,%.1f-%d', $lat, $lon, $r);
    $hit = cacheGet($key, 15);
    if ($hit === null) {
        $lock = lockFor($key);
        $hit = cacheGet($key, 15);
        if ($hit === null) {
            $res = upstream(sprintf('%s/v2/point/%.1f/%.1f/%d', ADSB, $lat, $lon, $r), null, 4000000, 8);
            if ($res['status'] === 200 && is_array($res['data']['ac'] ?? null)) {
                $hit = ['at' => time(), 'list' => slimNear($res['data']['ac'], $lat, $lon)];
                cachePut($key, $hit);
            } else {
                $old = cacheGet($key, 120);
                if ($old !== null) output(['ok' => true, 'stale' => true, 'center' => [$lat, $lon], 'r' => $r, 'fetched_at' => $old['at'], 'flights' => $old['list']]);
                fail($res['status'] === 429 ? 'Flight feed busy, try again in a moment' : 'Flight feed unavailable (HTTP ' . (int)$res['status'] . ')', 502);
            }
        }
    }
    output(['ok' => true, 'center' => [$lat, $lon], 'r' => $r, 'fetched_at' => $hit['at'], 'flights' => $hit['list']]);
}

function slimNear(array $acs, float $lat, float $lon): array {
    $rows = [];
    foreach ($acs as $a) {
        if (!is_array($a)) continue;
        $cs = strtoupper(trim((string)($a['flight'] ?? '')));
        if ($cs === '' || !preg_match('/^[A-Z0-9]{2,8}$/D', $cs)) continue;
        $alt = $a['alt_baro'] ?? null;
        if ($alt === 'ground' || !is_numeric($alt) && !is_numeric($a['alt_geom'] ?? null)) continue;
        $alt = is_numeric($alt) ? (int)$alt : (int)$a['alt_geom'];
        $gs = is_numeric($a['gs'] ?? null) ? (float)$a['gs'] : null;
        if (!is_numeric($a['lat'] ?? null) || !is_numeric($a['lon'] ?? null)) continue;
        if ($gs !== null && $gs < 40) continue;
        if (is_numeric($a['seen_pos'] ?? null) && (float)$a['seen_pos'] > 60) continue;
        $airline = (bool)preg_match('/^[A-Z]{3}[0-9][0-9A-Z]{0,4}$/D', $cs) && !preg_match('/^N[0-9]/', $cs);
        $d = distKm($lat, $lon, (float)$a['lat'], (float)$a['lon']) / 1.852;
        $rows[] = [
            'callsign' => $cs,
            'type' => clean($a['t'] ?? null, '/^[A-Z0-9]{2,4}$/D'),
            'reg' => clean($a['r'] ?? null, '/^[A-Z0-9-]{2,10}$/D'),
            'hex' => clean(strtolower((string)($a['hex'] ?? '')), '/^[0-9a-f]{6}$/D'),
            'alt' => $alt,
            'gs' => $gs === null ? null : (int)round($gs),
            'lat' => round((float)$a['lat'], 3),
            'lon' => round((float)$a['lon'], 3),
            'track' => is_numeric($a['track'] ?? null) ? (int)round((float)$a['track']) : null,
            'dist' => (int)round($d),
            'airline' => $airline,
        ];
    }
    // Airline flights first, then nearest.
    usort($rows, fn($x, $y) => [$y['airline'], $x['dist']] <=> [$x['airline'], $y['dist']]);
    return array_slice($rows, 0, 200);
}

function route(string $raw, string $latRaw, string $lonRaw): void {
    $cs = strtoupper(trim($raw));
    if (!preg_match('/^[A-Z0-9]{2,8}$/D', $cs)) fail('Invalid callsign');
    $lat = null; $lon = null;
    if ($latRaw !== '' || $lonRaw !== '') {
        if (!is_numeric($latRaw) || !is_numeric($lonRaw) || abs((float)$latRaw) > 90 || abs((float)$lonRaw) > 180) fail('Invalid position');
        $lat = round((float)$latRaw, 2); $lon = round((float)$lonRaw, 2);
    }
    // Route databases only know scheduled airline callsigns (three letters + flight number).
    if (!preg_match('/^[A-Z]{3}[0-9][0-9A-Z]{0,4}$/D', $cs)) {
        output(['ok' => true, 'route' => null, 'message' => 'No route data for this kind of callsign']);
    }
    $key = 'route-' . $cs;
    $hit = cacheGet($key, 3600);
    if ($hit === null || (!$hit['airports'] && time() - (int)$hit['at'] >= 300)) {
        $lock = lockFor($key);
        $hit = cacheGet($key, 3600);
        if ($hit === null || (!$hit['airports'] && time() - (int)$hit['at'] >= 300)) {
            $hit = ['at' => time()] + fetchRoute($cs, $lat, $lon);
            cachePut($key, $hit);
        }
    }
    if (!$hit['airports']) {
        output(['ok' => true, 'route' => null, 'message' => 'Route not found in the public route database']);
    }
    $aps = $hit['airports'];
    // Multi-stop flight numbers: pick the leg the aircraft is actually flying.
    $leg = 0; $plausible = null; $offKm = null;
    if ($lat !== null && $lon !== null) {
        $best = INF;
        for ($i = 0; $i < count($aps) - 1; $i++) {
            $d = offRouteKm($lat, $lon, $aps[$i], $aps[$i + 1]);
            if ($d < $best) { $best = $d; $leg = $i; }
        }
        $len = distKm($aps[$leg]['lat'], $aps[$leg]['lon'], $aps[$leg + 1]['lat'], $aps[$leg + 1]['lon']);
        $offKm = (int)round($best);
        $plausible = $best <= max(300.0, 0.3 * $len);
    }
    output(['ok' => true, 'route' => [
        'callsign' => $cs,
        'from' => $aps[$leg], 'to' => $aps[$leg + 1],
        'stops' => array_map(fn($a) => $a['icao'], $aps),
        'leg' => $leg, 'plausible' => $plausible, 'off_route_km' => $offKm,
        'source' => $hit['source'], 'checked_at' => (int)$hit['at'],
    ]]);
}

function fetchRoute(string $cs, ?float $lat, ?float $lon): array {
    // 1) adsb.lol routeset (position-aware). In testing it often answers 201 with an empty body.
    $body = json_encode(['planes' => [['callsign' => $cs, 'lat' => $lat ?? 0.0, 'lng' => $lon ?? 0.0]]]);
    $r = upstream(ADSB . '/api/0/routeset', $body, 200000, 4);
    if (is_array($r['data'])) {
        $item = isset($r['data'][0]) ? $r['data'][0] : $r['data'];
        $aps = is_array($item) ? routeAirports($item, $cs) : null;
        if ($aps) return ['airports' => $aps, 'source' => 'adsb.lol routeset'];
    }
    // 2) The static route file adsb.lol publishes from the VRS standing data project.
    $r = upstream(VRS . '/routes/' . substr($cs, 0, 2) . '/' . $cs . '.json', null, 200000, 6);
    if (is_array($r['data'])) {
        $aps = routeAirports($r['data'], $cs);
        if ($aps) return ['airports' => $aps, 'source' => 'adsb.lol route database'];
    }
    return ['airports' => [], 'source' => null];
}

function routeAirports(array $item, string $cs): ?array {
    if (strtoupper((string)($item['callsign'] ?? '')) !== $cs || !is_array($item['_airports'] ?? null)) return null;
    $out = [];
    foreach ($item['_airports'] as $a) {
        if (!is_array($a) || !is_numeric($a['lat'] ?? null) || !is_numeric($a['lon'] ?? null)) return null;
        $icao = clean(strtoupper((string)($a['icao'] ?? '')), '/^[A-Z0-9]{4}$/D');
        if ($icao === null) return null;
        $out[] = [
            'icao' => $icao,
            'iata' => clean(strtoupper((string)($a['iata'] ?? '')), '/^[A-Z0-9]{3}$/D'),
            'name' => text($a['name'] ?? ''),
            'city' => text($a['location'] ?? ''),
            'country' => clean(strtoupper((string)($a['countryiso2'] ?? '')), '/^[A-Z]{2}$/D'),
            'lat' => round((float)$a['lat'], 4), 'lon' => round((float)$a['lon'], 4),
        ];
    }
    return count($out) >= 2 && count($out) <= 8 ? $out : null;
}

/** Airport details: array = found, null = no such airport, false = lookup failed or out of time. */
function airportLookup(string $q, float $deadline): array|null|false {
    $icao = $q;
    if (strlen($q) === 3) {
        static $map = null;
        if ($map === null) {
            $raw = @file_get_contents(__DIR__ . '/data/iata-icao.json');
            $map = is_string($raw) ? (json_decode($raw, true) ?: []) : [];
        }
        $icao = $map[$q] ?? ('K' . $q);   // unknown 3-letter codes: try the US ICAO form
    }
    $key = 'airport-' . $icao;
    $fresh = fn($h) => $h !== null && ($h['ap'] !== null || time() - (int)$h['at'] < 86400);
    $hit = cacheGet($key, 7 * 86400);
    if ($fresh($hit)) return $hit['ap'] ? $hit['ap'] + ['query' => $q] : null;
    $lock = lockFor($key, max(0.0, $deadline - microtime(true) - 2));
    $hit = cacheGet($key, 7 * 86400);   // another request may have filled it while we waited
    if ($fresh($hit)) return $hit['ap'] ? $hit['ap'] + ['query' => $q] : null;
    $r = microtime(true) < $deadline - 2
        ? upstream(AWC . '/api/data/airport?format=json&ids=' . $icao, null, 600000, 6, $deadline)
        : ['status' => 0, 'data' => null];
    if ($r['status'] !== 200 && $r['status'] !== 204) {
        return $hit && $hit['ap'] ? $hit['ap'] + ['query' => $q] : false; // keep old data on outages
    }
    $ap = null;
    foreach ((is_array($r['data']) ? $r['data'] : []) as $a) {
        if (!is_array($a) || strtoupper((string)($a['icaoId'] ?? '')) !== $icao) continue;
        if (!is_numeric($a['lat'] ?? null) || !is_numeric($a['lon'] ?? null)) continue;
        $name = text($a['name'] ?? '');
        $city = '';
        if (strpos($name, '/') !== false) { [$city, $name] = array_map('trim', explode('/', $name, 2)); }
        $ap = ['icao' => $icao,
            'iata' => clean(strtoupper((string)($a['iataId'] ?? '')), '/^[A-Z0-9]{3}$/D'),
            'name' => titleCase($name), 'city' => titleCase($city),
            'country' => clean(strtoupper((string)($a['country'] ?? '')), '/^[A-Z]{2}$/D'),
            'lat' => round((float)$a['lat'], 4), 'lon' => round((float)$a['lon'], 4)];
        break;
    }
    cachePut($key, ['at' => time(), 'ap' => $ap]);
    return $ap ? $ap + ['query' => $q] : null;
}

function aircraft(string $rawId, string $rawMode): void {
    $mode = strtolower(trim($rawMode));
    $id = strtoupper(trim($rawId));
    $patterns = ['callsign' => '/^[A-Z0-9]{2,8}$/D', 'reg' => '/^[A-Z0-9][A-Z0-9-]{1,9}$/D', 'hex' => '/^[0-9A-F]{6}$/D'];
    if (!isset($patterns[$mode])) fail('Invalid lookup mode');
    if (!preg_match($patterns[$mode], $id)) {
        fail($mode === 'hex' ? 'ICAO hex requires 6 hex characters' : 'Invalid aircraft identifier');
    }
    $key = 'ac-' . $mode . '-' . $id;
    $trackFile = CACHE . '/' . hash('sha256', $key) . '-history.json';
    $lock = lockFor($key);
    $cached = cacheGet($key, 7200);
    $now = time();
    if ($cached !== null && is_array($cached['data'] ?? null)) {
        $ttl = ($cached['data']['status'] ?? '') === 'error' ? 60 : 25;
        if ($now - (int)$cached['checked_at'] < $ttl) {
            $answer = $cached['data'];
            $answer['checked_at'] = (int)$cached['checked_at'];
            $answer['history'] = historyPoints($trackFile);
            output($answer);
        }
    }
    $result = upstream(ADSB . '/v2/' . $mode . '/' . $id);
    if ($result['status'] !== 200 || !is_array($result['data']['ac'] ?? null)) {
        $error = $result['status'] === 429 ? 'Upstream rate limit reached. Retrying after a short delay.'
            : 'ADS-B upstream unavailable (HTTP ' . (int)$result['status'] . ').';
        if (is_array($cached['data'] ?? null)) {
            $answer = $cached['data'];
            $answer['status'] = 'stale';
            $prevAt = (int)($answer['aircraft']['observed_at'] ?? 0);
            if ($prevAt <= 0 || $now - $prevAt > 7200) $answer['aircraft'] = null;
            if ($answer['aircraft'] === null) $answer['status'] = 'error';
            $answer['message'] = $error . ' Displaying last available result.';
        } else {
            $answer = ['ok' => true, 'status' => 'error', 'aircraft' => null, 'message' => $error];
        }
        cachePut($key, ['checked_at' => $now, 'data' => $answer]);
        $answer['checked_at'] = $now;
        $answer['history'] = historyPoints($trackFile);
        output($answer);
    }
    $payload = $result['data'];
    $match = null;
    foreach ($payload['ac'] as $c) {
        if (!is_array($c)) continue;
        $field = ['callsign' => 'flight', 'reg' => 'r', 'hex' => 'hex'][$mode];
        if (strtoupper(trim((string)($c[$field] ?? ''))) !== $id) continue;
        // Several aircraft can share a callsign (e.g. one parked, one flying): prefer the freshest airborne one.
        if ($match === null || rankAc($c) > rankAc($match)) $match = $c;
    }
    $aircraft = null;
    if ($match !== null) {
        $allowed = ['hex', 'flight', 'r', 't', 'lat', 'lon', 'alt_baro', 'alt_geom', 'gs', 'track',
            'baro_rate', 'geom_rate', 'true_heading', 'squawk', 'seen', 'seen_pos', 'category',
            'ias', 'tas', 'mach', 'wd', 'ws', 'oat', 'tat', 'roll', 'mag_heading', 'nav_altitude_mcp', 'nav_heading', 'nav_qnh',
            'rssi', 'messages', 'nac_p', 'nic', 'emergency'];
        $aircraft = [];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $match) && (is_string($match[$f]) && strlen($match[$f]) <= 32 || is_int($match[$f]) || is_float($match[$f]))) {
                $aircraft[$f] = $match[$f];
            }
        }
        if (isset($aircraft['flight'])) $aircraft['flight'] = trim((string)$aircraft['flight']);
        $observed = is_numeric($payload['now'] ?? null) ? (float)$payload['now'] : microtime(true);
        if ($observed > 100000000000) $observed /= 1000;   // adsb.lol "now" is in milliseconds
        $age = is_numeric($aircraft['seen_pos'] ?? null) ? max(0, (float)$aircraft['seen_pos']) : 99999;
        $aircraft['observed_at'] = (int)floor($observed - $age);
        if ($age <= 90 && is_numeric($aircraft['lat'] ?? null) && is_numeric($aircraft['lon'] ?? null)
            && abs((float)$aircraft['lat']) <= 90 && abs((float)$aircraft['lon']) <= 180) {
            $ab = $aircraft['alt_baro'] ?? null;
            $altPt = is_numeric($ab) ? (int)$ab : ($ab === 'ground' ? 0 : (is_numeric($aircraft['alt_geom'] ?? null) ? (int)$aircraft['alt_geom'] : null));
            $gsPt = is_numeric($aircraft['gs'] ?? null) ? round((float)$aircraft['gs'], 1) : null;
            recordPoint($trackFile, (float)$aircraft['lat'], (float)$aircraft['lon'], $aircraft['observed_at'], $altPt, $gsPt, (string)($aircraft['hex'] ?? ''));
        }
    }
    // Keep the most recent observed position briefly if ADS-B coverage drops.
    if ($aircraft === null && is_array($cached['data']['aircraft'] ?? null)) {
        $prev = $cached['data']['aircraft'];
        $prevAt = (int)($prev['observed_at'] ?? 0);
        if ($prevAt > 0 && $now - $prevAt <= 7200) $aircraft = $prev;
    }
    $fresh = is_array($aircraft) && ($aircraft['observed_at'] ?? 0) >= $now - 90 &&
        is_numeric($aircraft['lat'] ?? null) && is_numeric($aircraft['lon'] ?? null);
    $answer = ['ok' => true, 'status' => $aircraft === null ? 'waiting' : ($fresh ? 'live' : 'stale'), 'source' => 'adsb.lol',
        'aircraft' => $aircraft,
        'message' => $aircraft === null ? 'No matching transponder broadcasting right now' : ($fresh ? 'Tracking aircraft' : 'Last known aircraft position'),
        'checked_at' => $now];
    cachePut($key, ['checked_at' => $now, 'data' => $answer]);
    $answer['history'] = historyPoints($trackFile);
    output($answer);
}

function rankAc(array $c): float {
    $airborne = ($c['alt_baro'] ?? null) !== 'ground' && is_numeric($c['lat'] ?? null) ? 1000.0 : 0.0;
    $age = is_numeric($c['seen_pos'] ?? null) ? (float)$c['seen_pos'] : 999.0;
    return $airborne - $age;
}

// ---------------------------------------------------------------- track history
// One contiguous recording per tracked id: a gap of 2 h or a different airframe starts a new one.
function historyPoints(string $path): array {
    $h = readJson($path);
    if (!$h || !is_array($h['points'] ?? null) || !$h['points']) return [];
    $last = end($h['points']);
    if (!is_array($last) || time() - (int)($last[2] ?? 0) > 3 * 3600) return [];
    return array_slice($h['points'], -900);
}
function recordPoint(string $path, float $lat, float $lon, int $ts, ?int $alt, $gs, string $hex): void {
    $h = readJson($path);
    $points = is_array($h['points'] ?? null) ? $h['points'] : [];
    $last = $points ? end($points) : null;
    if ($last && (($h['hex'] ?? '') !== $hex || $ts - (int)$last[2] > 7200)) { $points = []; $last = null; }
    if ($last && $ts <= (int)$last[2]) return;
    if ($last && abs($lat - (float)$last[0]) < 0.0001 && abs($lon - (float)$last[1]) < 0.0001) return;
    $points[] = [round($lat, 5), round($lon, 5), $ts, $alt, $gs];
    writeJson($path, ['hex' => $hex, 'points' => array_slice($points, -900)]);
}

// ---------------------------------------------------------------- helpers
function clean($v, string $re): ?string { $v = is_string($v) ? trim($v) : ''; return $v !== '' && preg_match($re, $v) ? $v : null; }
function text($v): string {
    $s = trim((string)preg_replace('/\s+/u', ' ', strip_tags(is_string($v) ? $v : '')));
    return function_exists('mb_substr') ? mb_substr($s, 0, 80) : substr($s, 0, 80);
}
function titleCase(string $s): string {
    $s = ucwords(strtolower(trim($s)), " -/(");
    return preg_replace_callback('/\b(Intl|Afb|Rgnl|Muni|Arpt)\b/', fn($m) => ['Intl' => 'Intl', 'Afb' => 'AFB', 'Rgnl' => 'Regional', 'Muni' => 'Municipal', 'Arpt' => 'Airport'][$m[1]], $s);
}
function distKm(float $la1, float $lo1, float $la2, float $lo2): float {
    $r = M_PI / 180; $x = sin(($la2 - $la1) * $r / 2) ** 2 + cos($la1 * $r) * cos($la2 * $r) * sin(($lo2 - $lo1) * $r / 2) ** 2;
    return 2 * 6371.0 * atan2(sqrt($x), sqrt(1 - $x));
}
function bearing(float $la1, float $lo1, float $la2, float $lo2): float {
    $r = M_PI / 180; $y = sin(($lo2 - $lo1) * $r) * cos($la2 * $r);
    $x = cos($la1 * $r) * sin($la2 * $r) - sin($la1 * $r) * cos($la2 * $r) * cos(($lo2 - $lo1) * $r);
    return atan2($y, $x);
}
// Distance from a point to the great-circle segment A-B (cross-track inside, endpoint distance outside).
function offRouteKm(float $lat, float $lon, array $a, array $b): float {
    $R = 6371.0;
    $d13 = distKm($a['lat'], $a['lon'], $lat, $lon) / $R;
    $d12 = distKm($a['lat'], $a['lon'], $b['lat'], $b['lon']) / $R;
    if ($d12 < 1e-6) return $d13 * $R;
    $xt = asin(max(-1, min(1, sin($d13) * sin(bearing($a['lat'], $a['lon'], $lat, $lon) - bearing($a['lat'], $a['lon'], $b['lat'], $b['lon'])))));
    $at = acos(max(-1, min(1, cos($d13) / max(1e-9, cos($xt)))));
    $ahead = cos(bearing($a['lat'], $a['lon'], $lat, $lon) - bearing($a['lat'], $a['lon'], $b['lat'], $b['lon'])) >= 0;
    if ($ahead && $at <= $d12) return abs($xt) * $R;
    return min($d13 * $R, distKm($b['lat'], $b['lon'], $lat, $lon));
}
function cachePath(string $key): string { return CACHE . '/' . hash('sha256', $key) . '.json'; }
function cacheGet(string $key, int $maxAge): ?array {
    $v = readJson(cachePath($key));
    if (!$v) return null;
    $at = (int)($v['at'] ?? $v['checked_at'] ?? 0);
    return time() - $at < $maxAge ? $v : null;
}
function cachePut(string $key, array $value): void {
    if (!isset($value['at']) && !isset($value['checked_at'])) $value['at'] = time();
    writeJson(cachePath($key), $value);
}
/** Serialise identical upstream fetches; the handle is released when the request ends. */
function lockFor(string $key, float $maxWait = 12.0) {
    $h = @fopen(CACHE . '/' . hash('sha256', $key) . '.lock', 'c');
    if ($h) {
        $t = microtime(true);
        while (!@flock($h, LOCK_EX | LOCK_NB)) {
            if (microtime(true) - $t > $maxWait) break;
            usleep(100000);
        }
    }
    return $h;
}
function readJson(string $path): ?array {
    if (!is_file($path)) return null;
    $bytes = @file_get_contents($path);
    if (!is_string($bytes)) return null;
    $obj = json_decode($bytes, true);
    return is_array($obj) ? $obj : null;
}
function writeJson(string $path, array $value): void {
    $tmp = $path . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, json_encode($value, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE)) !== false) {
        @rename($tmp, $path);
    }
}
function pruneCache(int $maxAge): void {
    $limit = time() - $maxAge;
    foreach (@scandir(CACHE) ?: [] as $name) {
        if (!preg_match('/^[0-9a-f]{64}(-history)?\.(json|lock)$|\.tmp$/D', $name)) continue;
        $mtime = @filemtime(CACHE . '/' . $name);
        if ($mtime !== false && $mtime < $limit) @unlink(CACHE . '/' . $name);
    }
}
/** Site-wide per-minute budget for upstream calls. */
function budgetOk(): bool {
    $f = @fopen(CACHE . '/upstream-budget', 'c+');
    if (!$f) return true;
    @flock($f, LOCK_EX);
    $raw = stream_get_contents($f);
    [$min, $n] = array_map('intval', explode(' ', trim((string)$raw) . ' 0 0'));
    $now = intdiv(time(), 60);
    if ($min !== $now) { $min = $now; $n = 0; }
    $ok = $n < UPSTREAM_BUDGET;
    if ($ok) $n++;
    ftruncate($f, 0); rewind($f); fwrite($f, $min . ' ' . $n);
    @flock($f, LOCK_UN); fclose($f);
    return $ok;
}
/**
 * Fetch JSON from one of the fixed upstream hosts. $post = JSON body for a POST.
 * Returns ['status' => HTTP status (0 = network error, 429 = local budget), 'data' => array|null].
 * $deadline (microtime) optionally caps the total time spent, retry included.
 */
function upstream(string $url, ?string $post = null, int $maxBytes = 600000, int $timeout = 6, ?float $deadline = null): array {
    $host = parse_url($url, PHP_URL_HOST);
    if (!in_array($host, ['api.adsb.lol', 'vrs-standing-data.adsb.lol', 'aviationweather.gov'], true)) {
        return ['status' => 0, 'data' => null];
    }
    if (!budgetOk()) return ['status' => 429, 'data' => null];
    $left = fn() => $deadline === null ? $timeout : (int)floor($deadline - microtime(true));
    $started = microtime(true);
    $r = upstreamOnce($url, $post, $maxBytes, max(1, min($timeout, $left())));
    // One retry for a dropped or hung connection (never for HTTP errors). Upstream hosts sit behind
    // several addresses and one can hang while the others answer, so a second attempt usually lands well.
    if ($r['status'] === 0 && $post === null && microtime(true) - $started < $timeout + 1 && $left() >= 2) {
        $r = upstreamOnce($url, null, $maxBytes, min($timeout, $left()));
    }
    return $r;
}
function upstreamOnce(string $url, ?string $post, int $maxBytes, int $timeout): array {
    $status = 0; $body = '';
    $headers = ['Accept: application/json'];
    if ($post !== null) $headers[] = 'Content-Type: application/json';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_USERAGENT => USER_AGENT, CURLOPT_FOLLOWLOCATION => false, CURLOPT_HTTPHEADER => $headers,
            CURLOPT_ENCODING => '', CURLOPT_MAXFILESIZE => $maxBytes];
        if (defined('CURLOPT_PROTOCOLS_STR')) $opts[CURLOPT_PROTOCOLS_STR] = 'https';
        elseif (defined('CURLOPT_PROTOCOLS')) $opts[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS;
        if ($post !== null) { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = $post; }
        curl_setopt_array($ch, $opts);
        $data = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        if (is_string($data)) $body = $data;
        unset($ch);
    } else {
        $ctx = stream_context_create(['http' => ['method' => $post === null ? 'GET' : 'POST', 'timeout' => $timeout,
            'header' => implode("\r\n", array_merge($headers, ['User-Agent: ' . USER_AGENT])) . "\r\n",
            'content' => $post ?? '', 'ignore_errors' => true, 'follow_location' => 0]]);
        $data = @file_get_contents($url, false, $ctx, 0, $maxBytes + 1);
        if (is_string($data)) $body = $data;
        foreach (($http_response_header ?? []) as $line) {
            if (preg_match('/^HTTP\/[\d.]+\s+(\d+)/', $line, $m)) $status = (int)$m[1];
        }
    }
    if ($status < 200 || $status >= 300 || $body === '' || strlen($body) > $maxBytes) return ['status' => $status, 'data' => null];
    $data = json_decode($body, true);
    return ['status' => $status, 'data' => is_array($data) ? $data : null];
}
