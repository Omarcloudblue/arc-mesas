// Registra (o vuelve a registrar) los comandos slash y reporta el resultado.
// Útil para diagnosticar: GET https://kyra-arc-mesas.netlify.app/.netlify/functions/discord-setup
// No expone secretos: solo dice si el token está presente y qué respondió Discord.

import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "./lib/commands.mjs";
import { loadState, saveState } from "./lib/state.mjs";
import { fetchSchedule, splitNow, es, mp, emo, ts, COLOR, REGION_ES } from "./lib/events.mjs";

// ?prueba=1 manda al canal un aviso de ejemplo (mismo formato que el real) para verificar el @here.
async function prueba() {
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return { prueba: "falta DISCORD_WEBHOOK_URL" };
  const region = process.env.EVENTS_REGION || "north-america";
  const mention = (process.env.DISCORD_MENTION ?? "@here").trim();
  const evs = await fetchSchedule(region);
  const { upcoming } = splitNow(evs);
  const e = upcoming.find((x) => x.name === "Matriarch") || upcoming[0];
  const r = await fetch(hook, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: mention,
      embeds: [{
        color: COLOR.hot,
        title: `${emo(e.name)} PRUEBA · así se verá el aviso de ${es(e.name)}`,
        description: `**${mp(e.map)}** · ${ts(e.start, "t")} (${ts(e.start, "R")})`,
        footer: { text: `Servidor ${REGION_ES[region] || region} · mensaje de prueba, puedes borrarlo` },
      }],
      allowed_mentions: { parse: ["roles", "everyone"] },
    }),
  });
  return { prueba: r.ok ? "aviso de prueba enviado" : `error ${r.status}: ${(await r.text()).slice(0, 200)}` };
}

export default async (req) => {
  if (new URL(req.url).searchParams.get("prueba")) {
    return new Response(JSON.stringify(await prueba(), null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
  }
  const token = process.env.DISCORD_BOT_TOKEN;
  const appId = process.env.DISCORD_APP_ID || APP_ID_DEFAULT;
  const out = {
    token: token ? `presente (${token.length} caracteres)` : "FALTA la variable DISCORD_BOT_TOKEN",
    appId,
    webhook: process.env.DISCORD_WEBHOOK_URL ? "presente" : "falta",
    publicKey: process.env.DISCORD_PUBLIC_KEY ? "presente" : "falta",
    comandos: COMMANDS.map((c) => "/" + c.name),
  };

  if (token) {
    const r = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: "PUT",
      headers: { "content-type": "application/json", Authorization: `Bot ${token}` },
      body: JSON.stringify(COMMANDS),
    });
    out.registro = r.status;
    if (r.ok) {
      const { ok, state } = await loadState();
      if (ok) { state.commandsVersion = COMMANDS_VERSION; await saveState(state); }
      out.resultado = "comandos registrados";
    } else {
      out.resultado = (await r.text()).slice(0, 300);
    }
  }

  out.instalar = `https://discord.com/oauth2/authorize?client_id=${appId}&scope=applications.commands`;
  return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
};
