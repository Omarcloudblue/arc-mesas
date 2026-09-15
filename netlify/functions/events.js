// Proxy con caché del calendario de eventos de MetaForge (no permite CORS directo).
const SRC = "https://metaforge.app/api/arc-raiders/events-schedule";
const REGIONS = new Set(["europe", "north-america", "south-america", "asia", "oceania"]);
const memo = {}; // region -> { at, body }  (vive mientras la instancia esté caliente)

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const region = q.region || "north-america";
  if (!REGIONS.has(region)) return json(400, { error: "Región inválida" }, false);

  const now = Date.now();
  const cached = memo[region];
  if (cached && now - cached.at < 120000) return json(200, cached.body, true);

  try {
    const r = await fetch(`${SRC}?region=${region}`, {
      headers: { accept: "application/json", "user-agent": "arc-mesas/1.0 (kyra-arc-mesas.netlify.app)" },
    });
    if (!r.ok) throw new Error("upstream " + r.status);
    const j = await r.json();
    const events = (j.data || [])
      .map((e) => ({ name: e.name, map: e.map, icon: e.icon, start: e.startTime, end: e.endTime }))
      .filter((e) => e.end > now - 3600000)
      .sort((a, b) => a.start - b.start);
    const body = { region, fetchedAt: now, upstreamCachedAt: j.cachedAt || null, events };
    memo[region] = { at: now, body };
    return json(200, body, true);
  } catch (err) {
    if (cached) return json(200, { ...cached.body, stale: true }, false);
    return json(502, { error: "No se pudo obtener el calendario", detail: String(err.message || err) }, false);
  }
};

function json(statusCode, body, cache) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": cache ? "public, max-age=60" : "no-store",
      "netlify-cdn-cache-control": cache ? "public, s-maxage=240, stale-while-revalidate=600" : "no-store",
    },
    body: JSON.stringify(body),
  };
}
