// Programada cada 5 min. Mantiene UN solo mensaje en Discord (lo edita) y avisa de la Matriacuda.
// Guarda el id del mensaje en Netlify Blobs; si Blobs no está disponible, usa DISCORD_MESSAGE_ID o memoria.
//
// Variables de entorno (Netlify → Project configuration → Environment variables):
//   DISCORD_WEBHOOK_URL  (obligatoria)  URL del webhook del canal
//   EVENTS_REGION        (opcional)     north-america (por defecto) | europe | south-america | asia | oceania
//   REMIND_EVENTS        (opcional)     lista separada por comas, por defecto "Matriarch"
//   REMIND_MINUTES       (opcional)     minutos de anticipación del aviso, por defecto 30
//   DISCORD_MENTION      (opcional)     p. ej. "@here" o "<@&ID_DEL_ROL>" para el aviso
//   DISCORD_MESSAGE_ID   (opcional)     solo como respaldo si Blobs no funciona

import { getStore } from "@netlify/blobs";

export const config = { schedule: "*/5 * * * *" };

const SRC = "https://metaforge.app/api/arc-raiders/events-schedule";
const ES = {
  "Matriarch": "Matriacuda", "Harvester": "Cosechadora", "Night Raid": "Incursión nocturna",
  "Electromagnetic Storm": "Tormenta electromagnética", "Cold Snap": "Ola de frío", "Hidden Bunker": "Búnker oculto",
  "Locked Gate": "Puerta bloqueada", "Close Scrutiny": "Vigilancia estrecha", "Prospecting Probes": "Sondas de prospección",
  "Lush Blooms": "Floración exuberante", "Uncovered Caches": "Alijos descubiertos", "Husk Graveyard": "Cementerio de cascarones",
  "Launch Tower Loot": "Botín de la torre de lanzamiento", "Hurricane": "Huracán", "Bird City": "Ciudad de pájaros", "Beachcombing": "Rebusca en la playa",
};
const REGION_ES = { "europe": "Europa", "north-america": "Norteamérica", "south-america": "Sudamérica", "asia": "Asia", "oceania": "Oceanía" };
const es = (n) => ES[n] || n;
const ts = (ms, f) => `<t:${Math.floor(ms / 1000)}:${f}>`;

let memo = {}; // respaldo en memoria mientras la instancia siga viva

async function loadState() {
  try { const v = await getStore("arc-bot").get("state", { type: "json" }); return { ok: true, state: v || {} }; }
  catch (e) { return { ok: false, state: { ...memo } }; }
}
async function saveState(state) {
  memo = { ...state };
  try { await getStore("arc-bot").setJSON("state", state); return true; } catch (e) { return false; }
}

export default async () => {
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return new Response("DISCORD_WEBHOOK_URL no configurada; nada que hacer.");

  const region = process.env.EVENTS_REGION || "north-america";
  const remindList = (process.env.REMIND_EVENTS || "Matriarch").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const remindMin = Number(process.env.REMIND_MINUTES || 30);
  const mention = (process.env.DISCORD_MENTION || "").trim();

  const r = await fetch(`${SRC}?region=${region}`, {
    headers: { accept: "application/json", "user-agent": "arc-mesas/1.0 (kyra-arc-mesas.netlify.app)" },
  });
  if (!r.ok) return new Response("upstream " + r.status);
  const j = await r.json();
  const now = Date.now();
  const evs = (j.data || [])
    .map((e) => ({ name: e.name, map: e.map, start: e.startTime, end: e.endTime }))
    .sort((a, b) => a.start - b.start);

  const active = evs.filter((e) => e.start <= now && e.end > now);
  const upcoming = evs.filter((e) => e.start > now).slice(0, 10);
  const hot = (e) => remindList.includes(e.name.toLowerCase());

  let content = `**Eventos ARC · ${REGION_ES[region] || region}** — actualizado ${ts(now, "R")}\n\n`;
  content += `**Activos ahora**${active.length ? ` (hasta ${ts(active[0].end, "t")})` : ""}\n`;
  content += active.length ? active.map((e) => `${hot(e) ? "🔥 " : "• "}**${es(e.name)}** — ${e.map}`).join("\n") : "• (ninguno)";
  content += `\n\n**Próximos**\n`;
  content += upcoming.length ? upcoming.map((e) => `${hot(e) ? "🔥 " : "• "}${ts(e.start, "t")} (${ts(e.start, "R")}) — **${es(e.name)}** · ${e.map}`).join("\n") : "• (sin datos)";
  content += `\n\n-# Fuente: MetaForge · kyra-arc-mesas.netlify.app`;
  if (content.length > 1950) content = content.slice(0, 1940) + "…";

  const post = (url, method, payload) =>
    fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });

  const { ok: blobsOk, state } = await loadState();
  let msgId = state.messageId || process.env.DISCORD_MESSAGE_ID || "";

  // 1) Mensaje vivo: editar si existe; crear solo si no hay ninguno
  if (msgId) {
    const p = await post(`${hook}/messages/${msgId}`, "PATCH", { content, allowed_mentions: { parse: [] } });
    if (p.status === 404) msgId = "";
  }
  if (!msgId) {
    const c = await post(`${hook}?wait=true`, "POST", { content, allowed_mentions: { parse: [] } });
    const m = await c.json().catch(() => null);
    if (m && m.id) {
      msgId = m.id;
      state.messageId = msgId;
      const saved = await saveState(state);
      if (!saved && !process.env.DISCORD_MESSAGE_ID) {
        await post(`${hook}/messages/${msgId}`, "PATCH", {
          content: content + `\n\n-# ⚙️ Guarda en Netlify la variable DISCORD_MESSAGE_ID = ${msgId} para que este mensaje se actualice solo.`,
          allowed_mentions: { parse: [] },
        });
      }
    }
  }

  // 2) Avisos: ventana de 5 min + registro del último aviso para no repetir
  const lo = (remindMin - 5) * 60000, hi = remindMin * 60000;
  const soon = evs.filter((e) => hot(e) && e.start - now > lo && e.start - now <= hi);
  let sent = 0;
  for (const e of soon) {
    const key = `${e.name}|${e.map}|${e.start}`;
    if (state.lastReminder === key) continue;
    await post(hook, "POST", {
      content: `${mention} 🔥 ¡**${es(e.name)}**! abre en ${remindMin} min en **${e.map}** (${REGION_ES[region] || region}) · ${ts(e.start, "t")} (${ts(e.start, "R")})`.trim(),
      allowed_mentions: { parse: ["roles", "everyone"] },
    });
    state.lastReminder = key; sent++;
    await saveState(state);
  }

  return new Response(`ok · blobs ${blobsOk ? "sí" : "no"} · msg ${msgId || "-"} · activos ${active.length} · avisos ${sent}`);
};
