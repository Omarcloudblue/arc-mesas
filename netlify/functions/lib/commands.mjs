// Definición de los comandos slash. Subir COMMANDS_VERSION cuando cambien para que se vuelvan a registrar.
export const APP_ID_DEFAULT = "1549282552160985129";
export const COMMANDS_VERSION = 2;

const regionOption = {
  type: 3, name: "region", description: "Servidor (por defecto Norteamérica)", required: false,
  choices: [
    { name: "Norteamérica", value: "north-america" },
    { name: "Sudamérica", value: "south-america" },
    { name: "Europa", value: "europe" },
    { name: "Asia", value: "asia" },
    { name: "Oceanía", value: "oceania" },
  ],
};

export const COMMANDS = [
  { name: "eventos", description: "Eventos del mapa activos y próximos", options: [regionOption] },
  { name: "matriarcuda", description: "¿Cuándo abre la Matriarcuda?", options: [regionOption] },
  { name: "falta", description: "Qué le falta a alguien del escuadrón (o a todos)", options: [
    { type: 6, name: "raider", description: "Miembro del escuadrón", required: false },
  ] },
  { name: "quien", description: "¿Quién del escuadrón necesita este material?", options: [
    { type: 3, name: "material", description: "Material", required: true, autocomplete: true },
  ] },
];
