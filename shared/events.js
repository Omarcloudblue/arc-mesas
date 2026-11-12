// Calendario de eventos (MetaForge) y presentación de los mensajes de Discord.
const SRC = "https://metaforge.app/api/arc-raiders/events-schedule";
export const SITE = "https://arc-mesas.pages.dev";
// La dirección puede cambiarse sin tocar el código con la variable SITE_URL.
export const site = (env) => (env && env.SITE_URL) || SITE;

export const EV_ES = {
  "Matriarch": "Matriarcuda", "Harvester": "Cosechadora", "Night Raid": "Incursión nocturna",
  "Electromagnetic Storm": "Tormenta electromagnética", "Cold Snap": "Ola de frío", "Hidden Bunker": "Búnker oculto",
  "Locked Gate": "Puerta bloqueada", "Close Scrutiny": "Vigilancia estrecha", "Prospecting Probes": "Sondas de prospección",
  "Lush Blooms": "Floración exuberante", "Uncovered Caches": "Alijos descubiertos", "Husk Graveyard": "Cementerio de cascarones",
  "Launch Tower Loot": "Botín de la torre de lanzamiento", "Hurricane": "Huracán", "Bird City": "Ciudad de pájaros", "Beachcombing": "Rebusca en la playa",
  "ARC Frigate": "Fragata ARC", "Redirection": "Redirección",
};
export const EV_EMOJI = {
  "Matriarch": "🔥", "Harvester": "🏭", "Night Raid": "🌙", "Electromagnetic Storm": "⚡", "Cold Snap": "❄️",
  "Hidden Bunker": "🚪", "Locked Gate": "🔒", "Close Scrutiny": "👁️", "Prospecting Probes": "🛰️", "Lush Blooms": "🌿",
  "Uncovered Caches": "📦", "Husk Graveyard": "💀", "Launch Tower Loot": "🚀", "Hurricane": "🌀", "Bird City": "🐦", "Beachcombing": "🏖️",
  "ARC Frigate": "🛸", "Redirection": "🔀",
};
export const MAP_ES = {
  "Dam": "Campos de batalla de la presa", "Dam Battlegrounds": "Campos de batalla de la presa", "Spaceport": "Puerto espacial",
  "The Spaceport": "Puerto espacial", "Buried City": "Ciudad enterrada", "Blue Gate": "Puerta azul", "The Blue Gate": "Puerta azul",
  "Stella Montis": "Stella Montis", "Riven Tides": "Mareas divididas", "Pendola Pass": "Paso Pendola",
};
export const REGION_ES = { "europe": "Europa", "north-america": "Norteamérica", "south-america": "Sudamérica", "asia": "Asia", "oceania": "Oceanía" };
export const REGIONS = Object.keys(REGION_ES);
export const COLOR = { arc: 0x3A86FF, live: 0x7BD88F, hot: 0xFFB703, squad: 0xB18BFF };

export const es = (n) => EV_ES[n] || n;
export const mp = (m) => MAP_ES[m] || m;
export const emo = (n) => EV_EMOJI[n] || "•";
export const ts = (ms, f) => `<t:${Math.floor(ms / 1000)}:${f}>`;

export async function fetchSchedule(region) {
  const r = await fetch(`${SRC}?region=${region}`, {
    headers: { accept: "application/json", "user-agent": "arc-mesas/1.0 (kyra-arc-mesas.netlify.app)" },
  });
  if (!r.ok) throw new Error("upstream " + r.status);
  const j = await r.json();
  return (j.data || [])
    .map((e) => ({ name: e.name, map: e.map, icon: e.icon, start: e.startTime, end: e.endTime }))
    .sort((a, b) => a.start - b.start);
}

export function splitNow(evs, now = Date.now()) {
  return { active: evs.filter((e) => e.start <= now && e.end > now), upcoming: evs.filter((e) => e.start > now) };
}

export function groupByStart(upcoming, maxGroups = 3) {
  const groups = [];
  for (const e of upcoming) {
    let g = groups[groups.length - 1];
    if (!g || g.start !== e.start) { if (groups.length === maxGroups) break; g = { start: e.start, items: [] }; groups.push(g); }
    g.items.push(e);
  }
  return groups;
}

const line = (e) => `${emo(e.name)} **${es(e.name)}** · ${mp(e.map)}`;
const cut = (s, n = 1000) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const hhmm = (ms) => `<t:${Math.floor(ms / 1000)}:t>`;

// Tarjeta principal: activos ahora + próximas tandas.
export function embedEvents(evs, region, now = Date.now(), { groups = 3, footer = "", site: url = SITE } = {}) {
  const { active, upcoming } = splitNow(evs, now);
  const fields = [];
  fields.push({
    name: active.length ? `🟢 Activos ahora · terminan ${ts(active[0].end, "R")}` : "🟢 Activos ahora",
    value: cut(active.length ? active.map(line).join("\n") : "_ninguno_"),
  });
  for (const g of groupByStart(upcoming, groups)) {
    fields.push({ name: `🕑 ${hhmm(g.start)} · ${ts(g.start, "R")}`, value: cut(g.items.map(line).join("\n")) });
  }
  return {
    color: COLOR.arc,
    author: { name: `Eventos ARC · ${REGION_ES[region] || region}`, url },
    fields,
    footer: { text: footer || "Datos de MetaForge · Mesas del Taller de Kyra" },
    timestamp: new Date(now).toISOString(),
  };
}

// Tarjeta dedicada a la Matriarcuda (o al evento que se pida).
export function embedFocus(evs, region, target = "Matriarch", now = Date.now()) {
  const is = (e) => e.name.toLowerCase() === target.toLowerCase();
  const { active, upcoming } = splitNow(evs, now);
  const live = active.filter(is), next = upcoming.filter(is);
  const fields = [];
  if (live.length) {
    fields.push({ name: "🟢 En curso", value: live.map((e) => `**${mp(e.map)}** · termina ${hhmm(e.end)} (${ts(e.end, "R")})`).join("\n") });
  }
  if (next.length) {
    fields.push({ name: "⏭️ Próxima", value: `**${mp(next[0].map)}** · ${hhmm(next[0].start)} (${ts(next[0].start, "R")})` });
    if (next.length > 1) {
      fields.push({ name: "📅 Después", value: cut(next.slice(1, 4).map((e) => `${hhmm(e.start)} · ${mp(e.map)}`).join("\n")) });
    }
  }
  if (!fields.length) fields.push({ name: "Sin datos", value: `No aparece **${es(target)}** en el calendario ahora mismo.` });
  const icon = (live[0] || next[0] || {}).icon;
  return {
    color: live.length ? COLOR.live : COLOR.hot,
    title: `${emo(target)} ${es(target)}`,
    description: `Servidor **${REGION_ES[region] || region}**`,
    thumbnail: icon ? { url: icon } : undefined,
    fields,
    footer: { text: "Datos de MetaForge · horas en tu zona" },
    timestamp: new Date(now).toISOString(),
  };
}

// Caché corta en memoria (por isolate) para que el autocompletado responda rápido sin pegarle a MetaForge cada vez.
const _cache = new Map();
export async function fetchScheduleCached(region, ttl = 60_000) {
  const c = _cache.get(region);
  if (c && Date.now() - c.at < ttl) return c.evs;
  const evs = await fetchSchedule(region);
  _cache.set(region, { at: Date.now(), evs });
  return evs;
}

// Opciones del desplegable de /eventos: lo que trae el calendario ahora mismo (primero) más los conocidos,
// así los eventos nuevos aparecen solos aunque no tengan traducción todavía.
export function eventChoices(evs, q = "") {
  const seen = new Set(), out = [];
  const add = (n) => { if (n && !seen.has(n)) { seen.add(n); out.push(n); } };
  for (const e of evs || []) add(e.name);
  for (const n of Object.keys(EV_ES)) add(n);
  const k = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const hit = (n) => !k || n.toLowerCase().includes(k) || es(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(k);
  return out.filter(hit).slice(0, 25).map((n) => ({ name: es(n), value: n }));
}
