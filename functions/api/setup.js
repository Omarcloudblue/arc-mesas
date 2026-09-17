// Diagnóstico y registro de los comandos de Discord.
//   /api/setup           → estado de las variables y registra los comandos
//   /api/setup?prueba=1  → manda un aviso de ejemplo al canal
import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "../../shared/commands.js";
import { loadState, saveState } from "../../shared/state.js";
import { fetchSchedule, splitNow, es, mp, emo, ts, COLOR, REGION_ES } from "../../shared/events.js";

const jsonRes = (o) => new Response(JSON.stringify(o, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (url.searchParams.get("prueba")) {
    const hook = env.DISCORD_WEBHOOK_URL;
    if (!hook) return jsonRes({ prueba: "falta DISCORD_WEBHOOK_URL" });
    const region = env.EVENTS_REGION || "north-america";
    const mention = (env.DISCORD_MENTION ?? "@here").trim();
    const { upcoming } = splitNow(await fetchSchedule(region));
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
    return jsonRes({ prueba: r.ok ? "aviso de prueba enviado" : `error ${r.status}` });
  }

  const token = env.DISCORD_BOT_TOKEN;
  const appId = env.DISCORD_APP_ID || APP_ID_DEFAULT;
  const out = {
    token: token ? `presente (${token.length} caracteres)` : "FALTA la variable DISCORD_BOT_TOKEN",
    webhook: env.DISCORD_WEBHOOK_URL ? "presente" : "falta",
    publicKey: env.DISCORD_PUBLIC_KEY ? "presente" : "falta",
    botKey: env.BOT_KEY ? "presente" : "falta (el cron no podrá llamar a /api/bot)",
    appId,
    comandos: COMMANDS.map((c) => "/" + c.name),
  };

  if (token) {
    const r = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: "PUT", headers: { "content-type": "application/json", Authorization: `Bot ${token}` },
      body: JSON.stringify(COMMANDS),
    });
    out.registro = r.status;
    if (r.ok) {
      const { ok, state } = await loadState();
      if (ok) { state.commandsVersion = COMMANDS_VERSION; await saveState(state); }
      out.resultado = "comandos registrados";
    } else out.resultado = (await r.text()).slice(0, 300);
  }

  out.instalar = `https://discord.com/oauth2/authorize?client_id=${appId}&scope=applications.commands`;
  out.interacciones = `${url.origin}/api/discord`;
  return jsonRes(out);
}
