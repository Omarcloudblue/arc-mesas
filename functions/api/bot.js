// Ejecución manual del bot (el cron del Worker lo corre solo cada minuto).
//   /api/bot?k=<BOT_KEY>
import { runBot } from "../../shared/bot.js";

export async function onRequest({ request, env }) {
  const k = new URL(request.url).searchParams.get("k");
  if (!env.BOT_KEY || k !== env.BOT_KEY) return new Response("no", { status: 401 });
  return new Response(await runBot(env));
}
