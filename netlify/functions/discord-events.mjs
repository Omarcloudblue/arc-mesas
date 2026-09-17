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
//   NOTIFY_HOURS         (opcional)     franja en que se avisa, por defecto "19-1" (7 p.m. a 1 a.m.)
//   NOTIFY_TZ            (opcional)     zona horaria de esa franja, por defecto America/Bogota

import { fetchSchedule, embedEvents, embedFocus, es, mp, ts, emo, REGION_ES, COLOR } from "./lib/events.mjs";
import { loadState, saveState } from "./lib/state.mjs";
import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "./lib/commands.mjs";

// Corre cada minuto para que los avisos lleguen puntuales; el mensaje fijo se edita cada 5.
export const config = { schedule: "* * * * *" };

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
  // Por defecto avisa con @here y solo cuando el evento cae en La Presa (Dam).
  const mention = (process.env.DISCORD_MENTION ?? "@here").trim();
  const remindMaps = (process.env.REMIND_MAPS ?? "Dam").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const mapOk = (e) => !remindMaps.length || remindMaps.some((m) => e.map.toLowerCase().includes(m) || mp(e.map).toLowerCase().includes(m));
  const hot = (e) => remindList.includes(e.name.toLowerCase());
  // Solo de noche: eventos que empiezan entre NOTIFY_HOURS (por defecto 19-1, es decir 7 p.m. a 1 a.m.) en hora de Colombia.
  const tz = process.env.NOTIFY_TZ || "America/Bogota";
  const [hFrom, hTo] = (process.env.NOTIFY_HOURS || "19-1").split("-").map((n) => Number(n));
  const hourIn = (ms) => {
    try { return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(ms)) % 24; }
    catch (err) { return (new Date(ms).getUTCHours() + 19) % 24; }
  };
  const nightOk = (e) => { const h = hourIn(e.start); return hFrom <= hTo ? h >= hFrom && h <= hTo : h >= hFrom || h <= hTo; };
  const alertable = (e) => hot(e) && mapOk(e) && nightOk(e);

  let evs;
  try { evs = await fetchSchedule(region); } catch (e) { return new Response(String(e.message || e)); }
  const now = Date.now();

  const embed = embedEvents(evs, region, now, { groups: 4, footer: "Se actualiza solo cada 5 min · /eventos /matriarcuda /falta /quien" });
  const payload = { content: "", embeds: [embed], allowed_mentions: { parse: [] } };

  const { ok: stateOk, state } = await loadState();
  let msgId = state.messageId || process.env.DISCORD_MESSAGE_ID || "";
  let note = "";

  // 1) Mensaje vivo: editar el que ya existe (cada 5 minutos, no en cada corrida).
  if (msgId && new Date(now).getMinutes() % 5 === 0) {
    const p = await post(`${hook}/messages/${msgId}`, "PATCH", payload);
    if (p.status === 404) msgId = "";
  }
  // Solo crear uno nuevo si podemos recordarlo (si no, evitamos llenar el canal).
  if (!msgId) {
    if (!stateOk) {
      note = " · sin memoria: no creo mensaje (falta la tabla bot_state)";
    } else {
      const c = await post(`${hook}?wait=true`, "POST", payload);
      const m = await c.json().catch(() => null);
      if (m && m.id) { msgId = m.id; state.messageId = msgId; await saveState(state); }
    }
  }

  // 2) Aviso anticipado (ventana de 1 min) y aviso de apertura, sin repetir
  const alerta = (e, embed) => post(hook, "POST", { content: mention, embeds: [embed], allowed_mentions: { parse: ["roles", "everyone"] } });
  let sent = 0;

  const soon = evs.filter((e) => alertable(e) && e.start - now > (remindMin - 1) * 60000 && e.start - now <= remindMin * 60000);
  for (const e of soon) {
    const key = `${e.name}|${e.map}|${e.start}`;
    if (state.lastReminder === key) continue;
    await alerta(e, {
      color: COLOR.hot,
      title: `${emo(e.name)} ¡${es(e.name)} en ${remindMin} minutos!`,
      description: `**${mp(e.map)}** · ${ts(e.start, "t")} (${ts(e.start, "R")})`,
      footer: { text: `Servidor ${REGION_ES[region] || region} · preparen munición pesada y explosivos` },
    });
    state.lastReminder = key; sent++;
    await saveState(state);
  }

  const abriendo = evs.filter((e) => alertable(e) && e.start <= now && e.start > now - 60000 && e.end > now);
  for (const e of abriendo) {
    const key = `start|${e.name}|${e.map}|${e.start}`;
    if (state.lastStart === key) continue;
    await alerta(e, {
      color: COLOR.live,
      title: `${emo(e.name)} ¡Es la hora! ${es(e.name)} ya está abierta`,
      description: `**${mp(e.map)}** · hasta ${ts(e.end, "t")} (${ts(e.end, "R")})`,
      footer: { text: `Servidor ${REGION_ES[region] || region} · ¡vamos!` },
    });
    state.lastStart = key; sent++;
    await saveState(state);
  }

  const cmd = await ensureCommands(state);
  const active = evs.filter((e) => e.start <= now && e.end > now).length;
  return new Response(`ok · estado ${stateOk ? "sí" : "no"} · msg ${msgId || "-"} · activos ${active} · avisos ${sent}${cmd}${note}`);
};
