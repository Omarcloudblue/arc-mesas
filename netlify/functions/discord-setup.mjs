// Registra (o vuelve a registrar) los comandos slash y reporta el resultado.
// Útil para diagnosticar: GET https://kyra-arc-mesas.netlify.app/.netlify/functions/discord-setup
// No expone secretos: solo dice si el token está presente y qué respondió Discord.

import { COMMANDS, COMMANDS_VERSION, APP_ID_DEFAULT } from "./lib/commands.mjs";
import { loadState, saveState } from "./lib/state.mjs";

export default async () => {
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
