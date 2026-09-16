// Endpoint de interacciones de Discord (comandos slash). Sin bot encendido: Discord llama por HTTP.
// Configurar en el portal de Discord → General Information → Interactions Endpoint URL:
//   https://kyra-arc-mesas.netlify.app/.netlify/functions/discord-interactions
// Variables: DISCORD_PUBLIC_KEY (obligatoria, del portal).

import { createPublicKey, verify } from "node:crypto";
import { fetchSchedule, embedEvents, embedFocus, REGIONS, COLOR, SITE } from "./lib/events.mjs";
import { nm, MATERIALS, norm, computeMissing, BP, BP_NAME, bpStats } from "./lib/data.mjs";

const SUPA_URL = "https://kmwznwopkjsxorgyikec.supabase.co";
const SUPA_KEY = "sb_publishable_AGUwrsh5ia9Qt_gIexwyWg_EiqBPqvG";

const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });
const reply = (embed) => json({ type: 4, data: { embeds: [embed], allowed_mentions: { parse: [] } } });
const cut = (s, n = 1000) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const slug = (m) => m.toLowerCase().replace(/\s+/g, "-");
const bar = (pct) => "▰".repeat(Math.round(pct / 10)) + "▱".repeat(10 - Math.round(pct / 10));

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
  const r = await fetch(`${SUPA_URL}/rest/v1/progress?shared=eq.true&select=user_id,display_name,discord_id,avatar_url,data,blueprints,updated_at&order=updated_at.desc`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!r.ok) throw new Error("supabase " + r.status);
  return r.json();
}

const opt = (i, name) => ((i.data && i.data.options) || []).find((o) => o.name === name);
const optVal = (i, name) => { const o = opt(i, name); return o ? o.value : undefined; };
const region = (i) => { const r = optVal(i, "region"); return REGIONS.includes(r) ? r : (process.env.EVENTS_REGION || "north-america"); };

const aviso = { color: COLOR.squad, title: "Escuadrón", description: "Nadie está compartiendo su progreso todavía.", footer: { text: "Se activa en la página: panel Escuadrón → Compartir mi progreso" } };

function memberField(m, limit) {
  const c = computeMissing(m.data), pct = c.need ? Math.round(100 * c.got / c.need) : 0;
  const head = `${m.display_name || "Raider"} — ${c.doneLv}/${c.totLv} niveles`;
  if (!c.items.length) return { name: head, value: `${bar(100)} ¡completo! 🎉` };
  const top = c.items.slice(0, limit).map(([k, r]) => `\`${r}×\` ${nm(k)}`).join("\n");
  const more = c.items.length > limit ? `\n_…y ${c.items.length - limit} materiales más_` : "";
  return { name: head, value: cut(`${bar(pct)} ${pct}% · faltan ${c.need - c.got}\n${top}${more}`) };
}

async function run(i) {
  const name = i.data.name;
  if (name === "eventos") {
    const reg = region(i);
    return embedEvents(await fetchSchedule(reg), reg, Date.now(), { groups: 3 });
  }
  if (name === "matriarcuda") {
    const reg = region(i);
    return embedFocus(await fetchSchedule(reg), reg, "Matriarch");
  }
  if (name === "falta") {
    const members = await squad();
    const uid = optVal(i, "raider");
    if (uid) {
      const m = members.find((x) => x.discord_id === uid);
      const ru = (i.data.resolved && i.data.resolved.users && i.data.resolved.users[uid]) || {};
      const who = ru.global_name || ru.username || "Ese raider";
      if (!m) return { color: COLOR.squad, title: who, description: "No está compartiendo su progreso.", footer: { text: "Se activa en la página: panel Escuadrón → Compartir mi progreso" } };
      const f = memberField(m, 15);
      return { color: COLOR.squad, title: f.name, description: f.value, thumbnail: m.avatar_url ? { url: m.avatar_url } : undefined, footer: { text: "Mesas del Taller de Kyra" }, url: SITE };
    }
    if (!members.length) return aviso;
    return { color: COLOR.squad, title: "Escuadrón — qué falta", fields: members.slice(0, 10).map((m) => memberField(m, 6)), footer: { text: `${members.length} compartiendo · /falta raider:@alguien para ver a uno` }, url: SITE };
  }
  if (name === "quien") {
    const mat = optVal(i, "material");
    const key = MATERIALS.find((k) => k === mat) || MATERIALS.find((k) => norm(nm(k)) === norm(mat || ""));
    if (!key) return { color: COLOR.squad, title: "Material desconocido", description: `No encuentro «${mat}».` };
    const members = await squad();
    if (!members.length) return aviso;
    const need = members.map((m) => [m.display_name || "Raider", (computeMissing(m.data).items.find(([k]) => k === key) || [])[1] || 0]).filter(([, r]) => r > 0).sort((a, b) => b[1] - a[1]);
    return {
      color: need.length ? COLOR.hot : COLOR.live,
      title: nm(key),
      thumbnail: { url: `${SITE}/icons/${slug(key)}.png` },
      description: need.length ? need.map(([n, r]) => `\`${r}×\` **${n}**`).join("\n") : "Nadie del escuadrón lo necesita 🎉",
      footer: { text: need.length ? "Cantidades que aún les faltan" : "Mesas del Taller de Kyra" },
    };
  }
  if (name === "planos") {
    const members = await squad();
    if (!members.length) return aviso;
    const uid = optVal(i, "raider"), plano = optVal(i, "plano");

    if (plano) {
      const slug = BP.find(([s]) => s === plano) || BP.find(([, n]) => norm(n) === norm(plano));
      if (!slug) return { color: COLOR.squad, title: "Plano desconocido", description: `No encuentro «${plano}».` };
      const tiene = members.filter((m) => (m.blueprints || {})[slug[0]]).map((m) => m.display_name || "Raider");
      const falta = members.filter((m) => !(m.blueprints || {})[slug[0]]).map((m) => m.display_name || "Raider");
      return {
        color: tiene.length ? COLOR.live : COLOR.hot,
        title: slug[1],
        thumbnail: { url: `${SITE}/icons/bp/${slug[0]}.webp` },
        fields: [
          { name: `✅ Lo tienen (${tiene.length})`, value: cut(tiene.join(", ") || "_nadie_") },
          { name: `❌ Les falta (${falta.length})`, value: cut(falta.join(", ") || "_nadie_") },
        ],
        footer: { text: "Mesas del Taller de Kyra · Planos" },
      };
    }

    if (uid) {
      const m = members.find((x) => x.discord_id === uid);
      const ru = (i.data.resolved && i.data.resolved.users && i.data.resolved.users[uid]) || {};
      const who = ru.global_name || ru.username || "Ese raider";
      if (!m) return { color: COLOR.squad, title: who, description: "No está compartiendo su progreso.", footer: { text: "Se activa en la página: panel Escuadrón → Compartir mi progreso" } };
      const s = bpStats(m.blueprints), pct = Math.round(100 * s.own / s.total);
      return {
        color: COLOR.squad, title: `${m.display_name || who} · planos`,
        thumbnail: m.avatar_url ? { url: m.avatar_url } : undefined,
        description: `${bar(pct)} **${s.own}/${s.total}** (${pct}%)`,
        fields: s.missing.length ? [{ name: `Le faltan ${s.missing.length}`, value: cut(s.missing.map(([, n]) => n).join(" · ")) }] : [],
        footer: { text: s.missing.length ? "Mesas del Taller de Kyra · Planos" : "¡Los tiene todos! 🎉" },
      };
    }

    return {
      color: COLOR.squad, title: "Escuadrón — planos",
      fields: members.slice(0, 10).map((m) => {
        const s = bpStats(m.blueprints), pct = Math.round(100 * s.own / s.total);
        return { name: `${m.display_name || "Raider"} — ${s.own}/${s.total}`, value: `${bar(pct)} ${pct}%` };
      }),
      footer: { text: "/planos plano:<nombre> para ver quién tiene uno · /planos raider:@alguien para el detalle" },
      url: SITE,
    };
  }
  return { color: COLOR.arc, description: "Comando no reconocido." };
}

function autocomplete(i) {
  const focused = ((i.data && i.data.options) || []).find((o) => o.focused) || {};
  const q = norm(focused.value || "");
  if (focused.name === "plano") {
    return BP.filter(([s, n]) => !q || norm(n).includes(q) || norm(s).includes(q)).slice(0, 25).map(([s, n]) => ({ name: n, value: s }));
  }
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
    let embed;
    try { embed = await run(i); }
    catch (e) { embed = { color: COLOR.arc, title: "No pude consultar los datos", description: "Intenta de nuevo en un momento." }; }
    return reply(embed);
  }
  return json({ type: 4, data: { content: "…" } });
};
