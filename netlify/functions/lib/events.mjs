// Calendario de eventos (MetaForge) y textos compartidos por las funciones de Discord.
const SRC = "https://metaforge.app/api/arc-raiders/events-schedule";

export const EV_ES = {
  "Matriarch": "Matriarcuda", "Harvester": "Cosechadora", "Night Raid": "Incursión nocturna",
  "Electromagnetic Storm": "Tormenta electromagnética", "Cold Snap": "Ola de frío", "Hidden Bunker": "Búnker oculto",
  "Locked Gate": "Puerta bloqueada", "Close Scrutiny": "Vigilancia estrecha", "Prospecting Probes": "Sondas de prospección",
  "Lush Blooms": "Floración exuberante", "Uncovered Caches": "Alijos descubiertos", "Husk Graveyard": "Cementerio de cascarones",
  "Launch Tower Loot": "Botín de la torre de lanzamiento", "Hurricane": "Huracán", "Bird City": "Ciudad de pájaros", "Beachcombing": "Rebusca en la playa",
};
export const MAP_ES = {
  "Dam": "Campos de batalla de la presa", "Dam Battlegrounds": "Campos de batalla de la presa", "Spaceport": "Puerto espacial",
  "The Spaceport": "Puerto espacial", "Buried City": "Ciudad enterrada", "Blue Gate": "Puerta azul", "The Blue Gate": "Puerta azul",
  "Stella Montis": "Stella Montis", "Riven Tides": "Mareas divididas",
};
export const REGION_ES = { "europe": "Europa", "north-america": "Norteamérica", "south-america": "Sudamérica", "asia": "Asia", "oceania": "Oceanía" };
export const REGIONS = Object.keys(REGION_ES);
export const es = (n) => EV_ES[n] || n;
export const mp = (m) => MAP_ES[m] || m;
export const ts = (ms, f) => `<t:${Math.floor(ms / 1000)}:${f}>`;

export async function fetchSchedule(region) {
  const r = await fetch(`${SRC}?region=${region}`, {
    headers: { accept: "application/json", "user-agent": "arc-mesas/1.0 (kyra-arc-mesas.netlify.app)" },
  });
  if (!r.ok) throw new Error("upstream " + r.status);
  const j = await r.json();
  return (j.data || [])
    .map((e) => ({ name: e.name, map: e.map, start: e.startTime, end: e.endTime }))
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

// Texto del mensaje "vivo" y de /eventos
export function eventsText(evs, region, hot, now = Date.now(), { maxGroups = 3, header = true } = {}) {
  const { active, upcoming } = splitNow(evs, now);
  const mark = (e) => (hot(e) ? "🔥 " : "• ");
  let c = header ? `**Eventos ARC · ${REGION_ES[region] || region}** — actualizado ${ts(now, "R")}\n\n` : "";
  c += `**Activos ahora**${active.length ? ` (hasta ${ts(active[0].end, "t")})` : ""}\n`;
  c += active.length ? active.map((e) => `${mark(e)}**${es(e.name)}** — ${mp(e.map)}`).join("\n") : "• (ninguno)";
  for (const g of groupByStart(upcoming, maxGroups)) {
    c += `\n\n**${ts(g.start, "t")}** (${ts(g.start, "R")})\n`;
    c += g.items.map((e) => `${mark(e)}**${es(e.name)}** — ${mp(e.map)}`).join("\n");
  }
  return c;
}

export function matriText(evs, region, now = Date.now()) {
  const isM = (e) => e.name.toLowerCase() === "matriarch";
  const { active, upcoming } = splitNow(evs, now);
  const live = active.filter(isM), next = upcoming.filter(isM);
  let c = `🔥 **${es("Matriarch")}** · ${REGION_ES[region] || region}\n`;
  if (live.length) c += live.map((e) => `**En curso** en **${mp(e.map)}** — termina ${ts(e.end, "t")} (${ts(e.end, "R")})`).join("\n") + "\n";
  if (next.length) {
    const n = next[0];
    c += `**Próxima:** ${mp(n.map)} — ${ts(n.start, "t")} (${ts(n.start, "R")})`;
    if (next.length > 1) c += `\nLuego: ` + next.slice(1, 4).map((e) => `${mp(e.map)} ${ts(e.start, "t")}`).join(" · ");
  } else if (!live.length) c += "Sin Matriacuda en el calendario por ahora.";
  return c;
}
