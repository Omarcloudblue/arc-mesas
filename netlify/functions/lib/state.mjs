// Estado del bot guardado en Supabase (tabla bot_state). Sin dependencias de npm.
const SUPA_URL = "https://kmwznwopkjsxorgyikec.supabase.co";
const SUPA_KEY = "sb_publishable_AGUwrsh5ia9Qt_gIexwyWg_EiqBPqvG";
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "content-type": "application/json" };
const KEY = "main";

export async function loadState() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/bot_state?key=eq.${KEY}&select=value`, { headers: H });
    if (!r.ok) return { ok: false, state: {} };
    const rows = await r.json();
    return { ok: true, state: (rows[0] && rows[0].value) || {} };
  } catch (e) { return { ok: false, state: {} }; }
}

export async function saveState(state) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/bot_state?on_conflict=key`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: KEY, value: state, updated_at: new Date().toISOString() }),
    });
    return r.ok;
  } catch (e) { return false; }
}
