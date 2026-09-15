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
