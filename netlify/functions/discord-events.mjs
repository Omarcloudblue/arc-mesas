// Programada cada 5 min. Mantiene UN solo mensaje en Discord (lo edita), avisa de la Matriarcuda
// y registra los comandos slash cuando hay token de bot.
//
// Variables de entorno (Netlify → Project configuration → Environment variables):
//   DISCORD_WEBHOOK_URL  (obligatoria)  URL del webhook del canal
//   DISCORD_BOT_TOKEN    (opcional)     token del bot, solo para registrar los comandos
//   DISCORD_APP_ID       (opcional)     id de la aplicación (por defecto la de "Mesas ARC")
//   EVENTS_REGION        (opcional)     north-america (por defecto) | europe | south-america | asia | oceania
//   REMIND_EVENTS        (opcional)     lista separada por comas, por defecto "Matriarch"
//   REMIND_MINUTES       (opcional)     minutos de anticipación del aviso, por defecto 30
//   DISCORD_MENTION      (opcional)     p. ej. "@here" o "<@&ID_DEL_ROL>" para el aviso
//   DISCORD_MESSAGE_ID   (opcional)     respaldo si la tabla bot_state no existe

import { fetchSchedule, eventsText, es, mp, ts, REGION_ES } from "./lib/events.mjs";
import { loadState, saveState } from "./lib/state.mjs";
import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "./lib/commands.mjs";

export const config = { schedule: "*/5 * * * *" };

const post = (url, method, payload, headers = {}) =>
  fetch(url, { method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) });

async function ensureCommands(state) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || state.commandsVersion === COMMANDS_VERSION) return "";
  const appId = process.env.DISCORD_APP_ID || APP_ID_DEFAULT;
  const r = await post(`https://discord.com/api/v10/applications/${appId}/commands`, "PUT", COMMANDS, { Authorization: `Bot ${token}` });
  if (r.ok) { state.commandsVersion = COMMANDS_VERSION; await saveState(state); return " · comandos registrados"; }
  return ` · comandos: error ${r.status}`;
}

export default async () => {
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return new Response("DISCORD_WEBHOOK_URL no configurada; nada que hacer.");

  const region = process.env.EVENTS_REGION || "north-america";
  const remindList = (process.env.REMIND_EVENTS || "Matriarch").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const remindMin = Number(process.env.REMIND_MINUTES || 30);
  const mention = (process.env.DISCORD_MENTION || "").trim();
  const hot = (e) => remindList.includes(e.name.toLowerCase());

  let evs;
  try { evs = await fetchSchedule(region); } catch (e) { return new Response(String(e.message || e)); }
  const now = Date.now();

  let content = eventsText(evs, region, hot, now, { maxGroups: 4 });
  content += `\n\n-# Fuente: MetaForge · kyra-arc-mesas.netlify.app · comandos: /eventos /matriarcuda /falta /quien`;
  if (content.length > 1950) content = content.slice(0, 1940) + "…";

  const { ok: stateOk, state } = await loadState();
  let msgId = state.messageId || process.env.DISCORD_MESSAGE_ID || "";
  let note = "";

  // 1) Mensaje vivo: editar el que ya existe.
  if (msgId) {
    const p = await post(`${hook}/messages/${msgId}`, "PATCH", { content, allowed_mentions: { parse: [] } });
    if (p.status === 404) msgId = "";
  }
  // Solo crear uno nuevo si podemos recordarlo (si no, evitamos llenar el canal).
  if (!msgId) {
    if (!stateOk) {
      note = " · sin memoria: no creo mensaje (falta la tabla bot_state)";
    } else {
      const c = await post(`${hook}?wait=true`, "POST", { content, allowed_mentions: { parse: [] } });
      const m = await c.json().catch(() => null);
      if (m && m.id) { msgId = m.id; state.messageId = msgId; await saveState(state); }
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
      content: `${mention} 🔥 ¡**${es(e.name)}**! abre en ${remindMin} min en **${mp(e.map)}** (${REGION_ES[region] || region}) · ${ts(e.start, "t")} (${ts(e.start, "R")})`.trim(),
      allowed_mentions: { parse: ["roles", "everyone"] },
    });
    state.lastReminder = key; sent++;
    await saveState(state);
  }

  const cmd = await ensureCommands(state);
  const active = evs.filter((e) => e.start <= now && e.end > now).length;
  return new Response(`ok · estado ${stateOk ? "sí" : "no"} · msg ${msgId || "-"} · activos ${active} · avisos ${sent}${cmd}${note}`);
};
