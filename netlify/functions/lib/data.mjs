// Datos de mesas y materiales (copia de los que usa index.html; mantener sincronizados).
export const S = [
  ["Chatarrín", [
    [["Dog Collar", 1]],
    [["Lemon", 3], ["Apricot", 3]],
    [["Prickly Pear", 6], ["Olives", 6], ["Cat Bed", 1]],
    [["Apricot", 12], ["Mushroom", 12], ["Very Comfortable Pillow", 3]]], 1],
  ["Refinería", [
    [["Metal Parts", 60], ["ARC Powercell", 5]],
    [["Toaster", 3], ["ARC Motion Core", 5], ["Fireball Burner", 8]],
    [["Motor", 3], ["ARC Circuitry", 10], ["Bombardier Cell", 6]]], 0],
  ["Armero", [
    [["Metal Parts", 20], ["Rubber Parts", 30]],
    [["Rusted Tools", 3], ["Mechanical Components", 5], ["Wasp Driver", 8]],
    [["Rusted Gear", 3], ["Advanced Mechanical Components", 5], ["Sentinel Firing Core", 4]]], 0],
  ["Banco de equipo", [
    [["Plastic Parts", 25], ["Fabric", 30]],
    [["Power Cable", 3], ["Electrical Components", 5], ["Hornet Driver", 5]],
    [["Industrial Battery", 3], ["Advanced Electrical Components", 5], ["Bastion Cell", 6]]], 0],
  ["Laboratorio médico", [
    [["Fabric", 50], ["ARC Alloy", 6]],
    [["Cracked Bioscanner", 2], ["Durable Cloth", 5], ["Tick Pod", 8]],
    [["Rusted Shut Medical Kit", 3], ["Antiseptic", 8], ["Surveyor Vault", 5]]], 0],
  ["Estación de explosivos", [
    [["Chemicals", 50], ["ARC Alloy", 6]],
    [["Synthesized Fuel", 3], ["Crude Explosives", 5], ["Pop Trigger", 5]],
    [["Laboratory Reagents", 3], ["Explosive Compound", 5], ["Rocketeer Driver", 3]]], 0],
  ["Estación de utilidad", [
    [["Plastic Parts", 50], ["ARC Alloy", 6]],
    [["Damaged Heat Sink", 2], ["Electrical Components", 5], ["Snitch Scanner", 6]],
    [["Fried Motherboard", 3], ["Advanced Electrical Components", 5], ["Leaper Pulse Unit", 4]]], 0],
];

export const ES = {
  "Metal Parts": "Piezas de metal", "Rubber Parts": "Piezas de goma", "Plastic Parts": "Piezas de plástico", "Fabric": "Tela",
  "Chemicals": "Productos químicos", "ARC Alloy": "Aleación ARC", "ARC Powercell": "Célula de energía ARC",
  "Mechanical Components": "Componentes mecánicos", "Electrical Components": "Componentes eléctricos", "Durable Cloth": "Tela resistente",
  "Crude Explosives": "Explosivos rudimentarios", "Advanced Mechanical Components": "Componentes mecánicos avanzados",
  "Advanced Electrical Components": "Componentes eléctricos avanzados", "Antiseptic": "Antiséptico", "Explosive Compound": "Compuesto explosivo",
  "ARC Circuitry": "Sistema de circuitos ARC", "Rusted Tools": "Herramientas oxidadas", "Rusted Gear": "Engranaje oxidado",
  "Power Cable": "Cable de alimentación", "Industrial Battery": "Batería industrial", "Cracked Bioscanner": "Bioescáner agrietado",
  "Rusted Shut Medical Kit": "Botiquín oxidado", "Synthesized Fuel": "Combustible sintetizado", "Laboratory Reagents": "Reactivos de laboratorio",
  "Damaged Heat Sink": "Disipador de calor dañado", "Fried Motherboard": "Placa base quemada", "Toaster": "Tostadora", "Motor": "Motor",
  "Wasp Driver": "Controlador de Avispa", "Hornet Driver": "Controlador de Avispón", "Tick Pod": "Cápsula de Garrapata", "Pop Trigger": "Gatillo de Tronador",
  "Snitch Scanner": "Escáner de Delator", "Fireball Burner": "Quemador de Esferígneo", "ARC Motion Core": "Núcleo de movimiento ARC",
  "Sentinel Firing Core": "Núcleo de disparo de Centinela", "Bastion Cell": "Célula de Bastión", "Surveyor Vault": "Depósito de Vigilante",
  "Rocketeer Driver": "Controlador de Cohetero", "Leaper Pulse Unit": "Unidad de impulso de Saltador", "Bombardier Cell": "Célula de Bombardero",
  "Dog Collar": "Collar de perro", "Lemon": "Limón", "Apricot": "Albaricoque", "Prickly Pear": "Higo chumbo", "Olives": "Aceitunas",
  "Cat Bed": "Cama para gatos", "Mushroom": "Champiñón", "Very Comfortable Pillow": "Almohada muy cómoda",
};

// Planos: [slug, nombre] (los iconos viven en /icons/bp/<slug>.webp)
export const BP = [["angled-grip-ii","Angled Grip II"],["angled-grip-iii-recipe","Angled Grip III"],["anvil","Anvil"],["aphelion-rifle-blueprint","Aphelion Rifle"],["barricade-kit","Barricade Kit"],["bettina-blueprint","Bettina"],["blaze-grenade","Blaze Grenade"],["blue-light-stick","Blue Light Stick"],["bobcat-i-recipe","Bobcat"],["burltetta-recipe","Burletta"],["canto-blueprint","Canto"],["combat-mk-3-flanking","Combat Mk.3 (Flanking)"],["combat-mk3-aggressive-blueprint","Combat Mk.3 (Aggressive)"],["compensator-ii","Compensator II"],["compensator-iii","Compensator III"],["complex-gun-parts","Complex Gun Parts"],["crash-mat-blueprint","Crash Mat"],["deadline","Deadline"],["defibrillator","Defibrillator"],["dolabra-blueprint","Dolabra"],["equalizer","Equalizer"],["explosive-mine-blueprint","Explosive Mine"],["extended-barrel-ii-blueprint","Extended Barrel II"],["extended-barrel-recipe","Extended Barrel III"],["extended-light-mag-ii","Extended Light Mag II"],["extended-light-mag-iii","Extended Light Mag III"],["extended-medium-mag-ii","Extended Medium Mag II"],["extended-medium-mag-iii","Extended Medium Mag III"],["extended-shotgun-mag-ii","Extended Shotgun Mag II"],["extended-shotgun-mag-iii","Extended Shotgun Mag III"],["fireworks-box-blueprint","Fireworks Box"],["gas-mine","Gas Mine"],["green-light-stick","Green Light Stick"],["heavy-gun-parts","Heavy Gun Parts"],["hullcracker","Hullcracker"],["il-toro-recipe","Il Toro"],["jolt-mine","Jolt Mine"],["jupiter-i-recipe","Jupiter"],["light-gun-parts","Light Gun Parts"],["lightweight-stock","Lightweight Stock"],["looting-mk-3-safekeeper-blueprint","Looting Mk.3 (Safekeeper)"],["looting-mk-3-survivor","Looting Mk.3 (Survivor)"],["lure-grenade","Lure Grenade"],["medium-gun-parts","Medium Gun Parts"],["muzzle-brake-ii","Muzzle Brake II"],["muzzle-brake-iii","Muzzle Brake III"],["osprey","Osprey"],["padded-stock","Padded Stock"],["powered-descender-blueprint","Powered Descender"],["pulse-mine","Pulse Mine"],["rascal-blueprint","Rascal"],["red-light-stick","Red Light Stick"],["remote-raider-flare","Remote Raider Flare"],["seeker-grenade","Seeker Grenade"],["shotgun-choke-ii","Shotgun Choke II"],["shotgun-choke-iii","Shotgun Choke III"],["shotgun-silencer","Shotgun Silencer"],["showstopper","Showstopper"],["silencer-i","Silencer I"],["silencer-ii","Silencer II"],["smoke-grenade","Smoke Grenade"],["snap-hook","Snap Hook"],["stable-stock-ii","Stable Stock II"],["stable-stock-iii","Stable Stock III"],["surge-coil-blueprint","Surge Coil"],["tactical-mk-3-revival","Tactical Mk.3 (Revival)"],["tactical-mk3-defensive","Tactical Mk.3 (Defensive)"],["tacical-mk3-healing-blueprint","Tactical Mk.3 (Healing)"],["utility-augment-t3-smoke-blueprint","Tactical Mk.3 (Smoke)"],["tagging-grenade","Tagging Grenade"],["tempest-i","Tempest"],["torrent-i-recipe","Torrente"],["trailblazer-grenade","Trailblazer Grenade"],["trigger-nade","Trigger Nade"],["venator","Venator"],["vertical-grip-ii","Vertical Grip II"],["vertical-grip-iii","Vertical Grip III"],["vita-shot","Vita Shot"],["vita-spray","Vita Spray"],["vulcano","Vulcano"],["white-flag-blueprint","White Flag"],["wolfpack","Wolfpack"],["yellow-light-stick-blueprint","Yellow Light Stick"]];
export const BP_NAME = (s) => (BP.find(([k]) => k === s) || [, s])[1];
export const bpStats = (b) => { const own = Object.keys(b || {}); return { own: own.length, total: BP.length, missing: BP.filter(([s]) => !(b || {})[s]) }; };

export const nm = (m) => ES[m] || m;
export const cellKey = (si, li, m) => `${si}-${li}-${m}`;
export const MATERIALS = Object.keys(ES).sort((a, b) => nm(a).localeCompare(nm(b), "es"));
export const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Qué le falta a un raider a partir de su progreso por casilla.
export function computeMissing(data) {
  const d = data || {};
  let doneLv = 0, totLv = 0, need = 0, got = 0;
  const rem = {};
  S.forEach(([, lv], si) => lv.forEach((l, li) => {
    let ok = true;
    l.forEach(([m, q]) => {
      const h = Math.min(q, d[cellKey(si, li, m)] || 0);
      need += q; got += h;
      if (h < q) { ok = false; rem[m] = (rem[m] || 0) + (q - h); }
    });
    totLv++; if (ok) doneLv++;
  }));
  return { doneLv, totLv, need, got, items: Object.entries(rem).sort((a, b) => b[1] - a[1]) };
}
