// Lógica del bot del canal: mensaje fijo de eventos, avisos de la Matriarcuda y
// solicitudes nuevas del tablón. La llama el cron del Worker (cada minuto) o /api/bot.
import { fetchSchedule, embedEvents, es, mp, ts, emo, REGION_ES, COLOR, site } from "./events.js";
import { loadState, saveState, supaGet } from "./state.js";
import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "./commands.js";

const post = (url, method, payload, headers = {}) =>
  fetch(url, { method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) });

export async function runBot(env) {
  const hook = env.DISCORD_WEBHOOK_URL;
  if (!hook) return "falta DISCORD_WEBHOOK_URL";

  const SITE = site(env);
  const region = env.EVENTS_REGION || "north-america";
  const remindList = (env.REMIND_EVENTS || "Matriarch").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const remindMin = Number(env.REMIND_MINUTES || 30);
  const mention = (env.DISCORD_MENTION ?? "@here").trim();
  const remindMaps = (env.REMIND_MAPS ?? "Dam").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tz = env.NOTIFY_TZ || "America/Bogota";
  const [hFrom, hTo] = (env.NOTIFY_HOURS || "19-1").split("-").map(Number);

  const hourIn = (ms) => {
    try { return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(ms)) % 24; }
    catch (e) { return (new Date(ms).getUTCHours() + 19) % 24; }
  };
  const hot = (e) => remindList.includes(e.name.toLowerCase());
  const mapOk = (e) => !remindMaps.length || remindMaps.some((m) => e.map.toLowerCase().includes(m) || mp(e.map).toLowerCase().includes(m));
  const nightOk = (e) => { const h = hourIn(e.start); return hFrom <= hTo ? h >= hFrom && h <= hTo : h >= hFrom || h <= hTo; };
  const alertable = (e) => hot(e) && mapOk(e) && nightOk(e);

  let evs;
  try { evs = await fetchSchedule(region); } catch (e) { return "upstream: " + e.message; }
  const now = Date.now();

  const embed = embedEvents(evs, region, now, { groups: 4, site: SITE, footer: "Se actualiza solo cada 5 min · /eventos /matriarcuda /falta /quien /planos /tablon" });
  const payload = { content: "", embeds: [embed], allowed_mentions: { parse: [] } };

  const { ok: stateOk, state } = await loadState();
  let msgId = state.messageId || env.DISCORD_MESSAGE_ID || "";
  let note = "";

  // 1) Mensaje fijo: se edita cada 5 minutos
  if (msgId && new Date(now).getMinutes() % 5 === 0) {
    const p = await post(`${hook}/messages/${msgId}`, "PATCH", payload);
    if (p.status === 404) msgId = "";
  }
  if (!msgId) {
    if (!stateOk) note = " · sin memoria: no creo mensaje (falta la tabla bot_state)";
    else {
      const c = await post(`${hook}?wait=true`, "POST", payload);
      const m = await c.json().catch(() => null);
      if (m && m.id) { msgId = m.id; state.messageId = msgId; await saveState(state); }
    }
  }

  // 2) Avisos de la Matriarcuda: 30 minutos antes y al abrir
  const alerta = (e2) => post(hook, "POST", { content: mention, embeds: [e2], allowed_mentions: { parse: ["roles", "everyone"] } });
  let sent = 0;
  for (const e of evs.filter((x) => alertable(x) && x.start - now > (remindMin - 1) * 60000 && x.start - now <= remindMin * 60000)) {
    const key = `${e.name}|${e.map}|${e.start}`;
    if (state.lastReminder === key) continue;
    await alerta({
      color: COLOR.hot,
      title: `${emo(e.name)} ¡${es(e.name)} en ${remindMin} minutos!`,
      description: `**${mp(e.map)}** · ${ts(e.start, "t")} (${ts(e.start, "R")})`,
      footer: { text: `Servidor ${REGION_ES[region] || region} · preparen munición pesada y explosivos` },
    });
    state.lastReminder = key; sent++; await saveState(state);
  }
  for (const e of evs.filter((x) => alertable(x) && x.start <= now && x.start > now - 60000 && x.end > now)) {
    const key = `start|${e.name}|${e.map}|${e.start}`;
    if (state.lastStart === key) continue;
    await alerta({
      color: COLOR.live,
      title: `${emo(e.name)} ¡Es la hora! ${es(e.name)} ya está abierta`,
      description: `**${mp(e.map)}** · hasta ${ts(e.end, "t")} (${ts(e.end, "R")})`,
      footer: { text: `Servidor ${REGION_ES[region] || region} · ¡vamos!` },
    });
    state.lastStart = key; sent++; await saveState(state);
  }

  // 3) Solicitudes nuevas del tablón
  let tablon = 0;
  try {
    const desde = state.lastPostAt || new Date(now - 5 * 60000).toISOString();
    const nuevos = await supaGet(`posts?select=id,kind,item,qty,note,display_name,avatar_url,created_at&created_at=gt.${encodeURIComponent(desde)}&order=created_at.asc&limit=5`);
    for (const p of nuevos) {
      const busca = p.kind === "busco";
      await post(hook, "POST", {
        content: (env.POSTS_MENTION || "").trim(),
        embeds: [{
          color: busca ? COLOR.hot : COLOR.live,
          author: { name: `${p.display_name || "Raider"} ${busca ? "busca" : "ofrece"}`, icon_url: p.avatar_url || undefined },
          title: `${busca ? "🔎" : "🎁"} ${p.item}${p.qty > 1 ? ` ×${p.qty}` : ""}`,
          description: p.note || undefined,
          footer: { text: "Tablón · " + SITE.replace(/^https?:\/\//, "") },
          timestamp: p.created_at,
        }],
        allowed_mentions: { parse: ["roles", "everyone"] },
      });
      state.lastPostAt = p.created_at; tablon++;
    }
    if (tablon) await saveState(state);
    else if (!state.lastPostAt) { state.lastPostAt = new Date(now).toISOString(); await saveState(state); }
  } catch (e) { /* el tablón puede no existir todavía */ }

  // 4) Comandos slash (una sola vez por versión)
  let cmd = "";
  if (env.DISCORD_BOT_TOKEN && state.commandsVersion !== COMMANDS_VERSION) {
    const appId = env.DISCORD_APP_ID || APP_ID_DEFAULT;
    const r = await post(`https://discord.com/api/v10/applications/${appId}/commands`, "PUT", COMMANDS, { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` });
    if (r.ok) { state.commandsVersion = COMMANDS_VERSION; await saveState(state); cmd = " · comandos registrados"; }
    else cmd = ` · comandos: error ${r.status}`;
  }

  const activos = evs.filter((e) => e.start <= now && e.end > now).length;
  return `ok · estado ${stateOk ? "sí" : "no"} · msg ${msgId || "-"} · activos ${activos} · avisos ${sent} · tablón ${tablon}${cmd}${note}`;
}
