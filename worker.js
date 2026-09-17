// Worker de Cloudflare: sirve la página (carpeta public/) y atiende /api/*.
// El cron (cada minuto, ver wrangler.jsonc) ejecuta el bot del canal de Discord.
import { onRequest as apiEvents } from "./functions/api/events.js";
import { onRequest as apiDiscord } from "./functions/api/discord.js";
import { onRequest as apiSetup } from "./functions/api/setup.js";
import { runBot } from "./shared/bot.js";

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/events") return apiEvents({ request, env });
    if (pathname === "/api/discord") return apiDiscord({ request, env });
    if (pathname === "/api/setup") return apiSetup({ request, env });
    if (pathname === "/api/bot") {
      // Ejecución manual, protegida por BOT_KEY (el cron no la necesita)
      const k = new URL(request.url).searchParams.get("k");
      if (!env.BOT_KEY || k !== env.BOT_KEY) return new Response("no", { status: 401 });
      return new Response(await runBot(env));
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBot(env));
  },
};
