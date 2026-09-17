# Handoff · Mesas del Taller de Kyra (ARC Raiders)

> **Cómo usarlo:** en un chat nuevo pega este archivo completo (o, si el chat tiene acceso al PC, dile: *"lee `C:\Users\omarm\Downloads\arc-mesas-web\HANDOFF.md` y continúa el proyecto"*). Aquí no hay secretos: los tokens viven solo en Netlify.

---

## 1. Qué es

Web para el escuadrón de **Kyra** (Breaker, Storm y Miguelito) en ARC Raiders:

- **Mesas**: seguimiento de materiales para subir las 7 mesas del taller (incluye el Chatarrín, niveles 2–5).
- **Planos**: los 83 planos del juego con imagen; cada uno marca los que tiene.
- **Escuadrón**: quien activa "Compartir mi progreso" aparece con su avance, lo que le falta y sus planos.
- **Eventos**: calendario en vivo (datos de MetaForge) con contador por segundos; destaca la **Matriarcuda**.
- **Login con Discord** (Supabase): el progreso se guarda por cuenta.
- **Bot de Discord**: un mensaje fijo con los eventos que se edita solo, avisos de la Matriarcuda y comandos slash.

**Sitio en vivo:** https://kyra-arc-mesas.netlify.app

---

## 2. Reglas de trabajo con Kyra (importante)

1. **Todo en español**: interfaz, mensajes del bot y nombres del juego *tal como aparecen en su versión en español*. Si no se conoce el nombre oficial, preguntar o pedir captura; no inventar.
2. **Commits solo a su nombre**, **sin** línea `Co-Authored-By` ni ninguna mención a Claude. Identidad git: `Kyra <91569091+Omarcloudblue@users.noreply.github.com>`.
3. **Los cambios se publican solos** con `git push` (Netlify despliega en ~1 min). No usar artifacts ni subir ZIPs a mano.
4. Instrucciones para él siempre **paso a paso, con la ruta exacta de menús**.
5. **Nunca pedir ni mostrar secretos** en el chat (token del bot, URL del webhook). Si los pega, pedirle que los regenere.
6. Su proveedor de internet está bloqueado por el firewall de Vercel: **el panel de supabase.com no le abre desde el PC**, solo desde el celular con datos. La API de Supabase sí funciona normal.
7. Avisos del bot: **solo de noche (7 p.m. a 1 a.m., hora Colombia)**, solo **Matriarcuda en Campos de batalla de la presa**, con **@here**. No quiere avisos de día.
8. WhatsApp quedó **descartado**.

---

## 3. Dónde vive todo

| Qué | Dónde |
|---|---|
| Código (fuente de verdad) | `C:\Users\omarm\Downloads\arc-mesas-web` |
| Repositorio | https://github.com/Omarcloudblue/arc-mesas (público, rama `main`) |
| Git (portable, **no está en PATH**) | `C:\Users\omarm\PortableGit\cmd\git.exe` |
| Hosting | Netlify, proyecto `kyra-arc-mesas`, enlazado al repo (push = despliegue) |
| Versión offline (un solo archivo) | `C:\Users\omarm\Downloads\arc-raiders-mesas-standalone.html` |
| Base de datos y login | Supabase, proyecto `kmwznwopkjsxorgyikec` |
| SQL ya aplicado | `C:\Users\omarm\Downloads\arc-mesas-escuadron.sql` |
| App de Discord | "Mesas ARC", id `1549282552160985129` |
| Webhook | "Eventos ARC", canal `#arc-raiders` |

---

## 4. Estructura del repo

```
index.html                     todo el frontend (HTML + CSS + JS)
icons/*.png                    materiales, enemy-* (siluetas ARC), station-* (mesas)
icons/bp/*.webp                83 planos
netlify.toml                   publish ".", functions en netlify/functions
netlify/functions/
  events.js                    proxy con caché del calendario de MetaForge (no permite CORS)
  discord-events.mjs           programada cada minuto (ver sección 6)
  discord-interactions.mjs     comandos slash (verifica firma Ed25519)
  discord-setup.mjs            GET: registra comandos y da diagnóstico; ?prueba=1 manda un aviso de prueba
  lib/events.mjs               calendario, traducciones de eventos y mapas, tarjetas (embeds)
  lib/data.mjs                 mesas, materiales y planos (copia de lo que hay en index.html)
  lib/state.mjs                memoria del bot en Supabase (tabla bot_state)
  lib/commands.mjs             definición de comandos; subir COMMANDS_VERSION al cambiarlos
HANDOFF.md                     este archivo
```

**Sin dependencias de npm** (no agregar `package.json`: rompió el build una vez).

---

## 5. Base de datos (Supabase)

**`public.progress`** — una fila por usuario de Discord
- `user_id` (uuid, auth.users), `data` jsonb (contador por casilla, clave `indiceMesa-indiceNivel-Material`), `blueprints` jsonb (`{slug: 1}`), `shared` bool, `display_name`, `discord_id`, `avatar_url`, `updated_at`.
- RLS: cada quien lee/escribe lo suyo; **cualquiera puede leer las filas con `shared = true`** (así funcionan el panel Escuadrón y los comandos).

**`public.bot_state`** — fila `key = 'main'` con `{ messageId, lastReminder, lastStart, commandsVersion }`.

El plan gratis de Supabase **se pausa tras 7 días sin uso**; se reactiva desde el panel (desde el celular).

---

## 6. Bot de Discord

**Mensaje fijo**: `discord-events.mjs` corre cada minuto; edita **un solo** mensaje cada 5 minutos (guarda su id en `bot_state`; si no puede guardarlo, no crea mensajes para evitar spam).

**Avisos** (con `@here`), solo si el evento es Matriarch + mapa Dam + empieza entre 19:00 y 01:00 hora Colombia:
- 30 minutos antes: tarjeta ámbar "¡Matriarcuda en 30 minutos!"
- Al abrir: tarjeta verde "¡Es la hora! Matriarcuda ya está abierta"

**Comandos:** `/eventos` · `/matriarcuda` · `/falta [raider]` · `/quien material` · `/planos [raider] [plano]`

**Variables en Netlify** (Project configuration → Environment variables):
- Obligatorias (secretas): `DISCORD_WEBHOOK_URL`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`
- Opcionales y su valor por defecto: `DISCORD_MENTION`=`@here`, `REMIND_EVENTS`=`Matriarch`, `REMIND_MAPS`=`Dam`, `REMIND_MINUTES`=`30`, `NOTIFY_HOURS`=`19-1`, `NOTIFY_TZ`=`America/Bogota`, `EVENTS_REGION`=`north-america`
- Al cambiar variables hay que **redesplegar** (un commit vacío basta).

**Diagnóstico:** https://kyra-arc-mesas.netlify.app/.netlify/functions/discord-setup

---

## 7. Cómo publicar un cambio

```powershell
$git = "C:\Users\omarm\PortableGit\cmd\git.exe"
Set-Location "C:\Users\omarm\Downloads\arc-mesas-web"
# ...editar archivos...
& $git add -A
& $git commit -q -m "Mensaje en español, sin trailers"
& $git push origin main
```

Luego verificar en el sitio en vivo (esperar ~80 s). Si se tocaron funciones, abrir el enlace de diagnóstico.

**Regenerar la versión offline** (después de cambiar `index.html`): tomar `index.html`, reemplazar
`const asset=s=>\`icons/${s}.png\`;` por un mapa `ICONS` con los PNG en base64 + `const asset=s=>ICONS[s];`,
y en los planos reemplazar `src="icons/bp/${slug}.webp"` por `src="${BPICONS[slug]||""}"` (mapa `BPICONS` con los webp en base64). Guardar en `Downloads\arc-raiders-mesas-standalone.html`.

**Trampas de PowerShell 5.1:** `Invoke-WebRequest` necesita `-UseBasicParsing`; mensajes de commit de varias líneas → escribirlos a un archivo y usar `git commit -F`.

---

## 8. Decisiones de contenido

- **Mesas**: Chatarrín (niveles 2–5, datos de metaforge.app/arc-raiders/hideout), Refinería, Armero, Banco de equipo, Laboratorio médico, Estación de explosivos, Estación de utilidad (niveles 1–3). Cada casilla lleva su propio contador (no se comparte entre niveles).
- **Colores de rareza** (del juego): Común gris, Inusual verde `#41eb6a`, Poco común azul `#1ecbfc`, Excepcional magenta `#d8299b`.
- **Nombres de materiales**: confirmados con capturas del juego.
- **Mapas**: confirmados *Mareas divididas* (Riven Tides) y *Campos de batalla de la presa* (Dam). Puerto espacial, Ciudad enterrada y Puerta azul son traducción propia.
- **Eventos**: traducción propia, salvo **Matriarcuda** = apodo de Kyra para la Matriarca (escrito exactamente así).
- **Planos** (83, de metaforge.app/arc-raiders/blueprint-tracker): confirmados *Aguafiestas* (Showstopper) y *Ultimátum* (Deadline); *Bobina* (Surge Coil) muy probable. **Pendientes en inglés** (faltan los nombres oficiales): Anvil, Bettina, Bobcat, Burletta, Canto, Dolabra, Equalizer, Hullcracker, Il Toro, Osprey, Rascal, Tempest, Venator, Vita Shot, Vita Spray, Vulcano, Wolfpack. Los nombres de planos están en **dos lugares** que deben coincidir: `index.html` (const `BP`) y `netlify/functions/lib/data.mjs`.
- **Pie de página**: "Hecho por Kyra para Breaker, Storm y Miguelito fiu fiu".

---

## 9. Problemas ya resueltos (no repetir)

- **Netlify bloqueaba despliegues** por "contribuidor de Git no reconocido": el autor de los commits debe ser la dirección noreply de GitHub de arriba, y el repo quedó público.
- Las **funciones programadas no se pueden abrir por URL** (dan 403); para probar usar `discord-setup`.
- En el JS, el panel de planos también usa la clase `.station`: los recorridos de mesas deben usar **`#stations .station`**.
- El bot llegó a llenar el canal de mensajes repetidos: por eso guarda el id del mensaje en `bot_state`.

---

## 10. Pendientes e ideas

- Traducir los 17 planos pendientes (pedir a Kyra captura de la lista de planos del juego).
- Confirmar nombres de mapas y eventos que aún son traducción propia.
- Posible mejora: usar un rol `@Matriarcuda` en vez de `@here` para avisar solo a quien se apunte.
