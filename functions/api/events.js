// Calendario de eventos (proxy de MetaForge, que no permite CORS). Cloudflare Pages Function.
import { fetchSchedule, REGIONS } from "../../shared/events.js";

export async function onRequest({ request }) {
  const region = new URL(request.url).searchParams.get("region") || "north-america";
  if (!REGIONS.includes(region)) return json({ error: "Región inválida" }, 400, false);

  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const evs = await fetchSchedule(region);
    const now = Date.now();
    const res = json({ region, fetchedAt: now, events: evs.filter((e) => e.end > now - 3600000) }, 200, true);
    await cache.put(key, res.clone());
    return res;
  } catch (err) {
    return json({ error: "No se pudo obtener el calendario", detail: String(err.message || err) }, 502, false);
  }
}

function json(body, status = 200, cacheable = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": cacheable ? "public, max-age=60, s-maxage=120" : "no-store",
    },
  });
}
