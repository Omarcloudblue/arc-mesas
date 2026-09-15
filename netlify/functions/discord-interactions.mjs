// Endpoint de interacciones de Discord (comandos slash). Sin bot encendido: Discord llama por HTTP.
// Configurar en el portal de Discord → General Information → Interactions Endpoint URL:
//   https://kyra-arc-mesas.netlify.app/.netlify/functions/discord-interactions
// Variables: DISCORD_PUBLIC_KEY (obligatoria, del portal).

import { createPublicKey, verify } from "node:crypto";
import { fetchSchedule, eventsText, matriText, REGIONS } from "./lib/events.mjs";
import { nm, MATERIALS, norm, computeMissing } from "./lib/data.mjs";

const SUPA_URL = "https://kmwznwopkjsxorgyikec.supabase.co";
const SUPA_KEY = "sb_publishable_AGUwrsh5ia9Qt_gIexwyWg_EiqBPqvG";

const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });

function verifySig(req, body) {
  const sig = req.headers.get("x-signature-ed25519"), stamp = req.headers.get("x-signature-timestamp");
  const pk = process.env.DISCORD_PUBLIC_KEY;
  if (!sig || !stamp || !pk) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pk, "hex")]),
      format: "der", type: "spki",
    });
    return verify(null, Buffer.from(stamp + body), key, Buffer.from(sig, "hex"));
  } catch (e) { return false; }
}

async function squad() {
  const r = await fetch(`${SUPA_URL}/rest/v1/progress?shared=eq.true&select=user_id,display_name,discord_id,data,updated_at&order=updated_at.desc`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error("supabase " + r.status);
  return r.json();
}

const opt = (i, name) => ((i.data && i.data.options) || []).find((o) => o.name === name);
const optVal = (i, name) => { const o = opt(i, name); return o ? o.value : undefined; };
const region = (i) => { const r = optVal(i, "region"); return REGIONS.includes(r) ? r : (process.env.EVENTS_REGION || "north-america"); };
const remindList = () => (process.env.REMIND_EVENTS || "Matriarch").split(",").map((s) => s.trim().toLowerCase());

function memberLine(m, limit = 8) {
  const c = computeMissing(m.data);
  const name = m.display_name || "Raider";
  if (!c.items.length) return `**${name}** — ${c.doneLv}/${c.totLv} niveles · ¡todo completo! 🎉`;
  const top = c.items.slice(0, limit).map(([k, r]) => `${nm(k)} ×${r}`).join(" · ");
  const more = c.items.length > limit ? ` · …y ${c.items.length - limit} más` : "";
  return `**${name}** — ${c.doneLv}/${c.totLv} niveles · ${c.need - c.got} por conseguir\n${top}${more}`;
}

async function run(i) {
  const name = i.data.name;
  if (name === "eventos") {
    const reg = region(i), hot = (e) => remindList().includes(e.name.toLowerCase());
    return eventsText(await fetchSchedule(reg), reg, hot, Date.now(), { maxGroups: 2 });
  }
  if (name === "matriarcuda") {
    const reg = region(i);
    return matriText(await fetchSchedule(reg), reg);
  }
  if (name === "falta") {
    const members = await squad();
    const uid = optVal(i, "raider");
    if (uid) {
      const m = members.find((x) => x.discord_id === uid);
      const ru = i.data.resolved && i.data.resolved.users && i.data.resolved.users[uid];
      const who = ru ? (ru.global_name || ru.username) : "ese raider";
      if (!m) return `**${who}** no está compartiendo su progreso (se activa en la página con "Compartir mi progreso con el escuadrón").`;
      return memberLine(m, 14);
    }
    if (!members.length) return "Nadie está compartiendo su progreso todavía. Se activa en la página, panel de la derecha → \"Compartir mi progreso con el escuadrón\".";
    let c = "**Escuadrón — qué falta**\n\n" + members.map((m) => memberLine(m, 6)).join("\n\n");
    return c.length > 1950 ? c.slice(0, 1940) + "…" : c;
  }
  if (name === "quien") {
    const mat = optVal(i, "material");
    const key = MATERIALS.find((k) => k === mat) || MATERIALS.find((k) => norm(nm(k)) === norm(mat || ""));
    if (!key) return `No conozco el material "${mat}".`;
    const members = await squad();
    const need = members.map((m) => [m.display_name || "Raider", (computeMissing(m.data).items.find(([k]) => k === key) || [])[1] || 0]).filter(([, r]) => r > 0).sort((a, b) => b[1] - a[1]);
    if (!need.length) return `**${nm(key)}** — nadie del escuadrón lo necesita 🎉`;
    return `**${nm(key)}** — lo necesitan: ` + need.map(([n, r]) => `**${n}** ×${r}`).join(", ");
  }
  return "Comando no reconocido.";
}

function autocomplete(i) {
  const focused = ((i.data && i.data.options) || []).find((o) => o.focused) || {};
  const q = norm(focused.value || "");
  return MATERIALS.filter((k) => !q || norm(nm(k)).includes(q) || norm(k).includes(q)).slice(0, 25).map((k) => ({ name: nm(k), value: k }));
}

export default async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();
  if (!verifySig(req, body)) return new Response("bad signature", { status: 401 });
  const i = JSON.parse(body);
  if (i.type === 1) return json({ type: 1 });
  if (i.type === 4) return json({ type: 8, data: { choices: autocomplete(i) } });
  if (i.type === 2) {
    let content;
    try { content = await run(i); } catch (e) { content = "No pude consultar los datos ahora mismo. Intenta de nuevo en un momento."; }
    return json({ type: 4, data: { content, allowed_mentions: { parse: [] } } });
  }
  return json({ type: 4, data: { content: "…" } });
};
