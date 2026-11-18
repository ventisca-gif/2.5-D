---
name: thebruma-proyecto
description: Contexto y memoria del proyecto TheBruma (antes "Isla Bruma"), el RPG medieval-pirata 2.5D isométrico en cuadrícula de ventisca-gif, con APK Android. Úsala siempre que el usuario hable de TheBruma, Isla Bruma, "mi juego pirata", el repo 2.5-D, o pida cambios, APKs o ideas para ese juego. NO es "The Bound": The Bound es otro juego distinto del usuario con su propia memoria; no mezcles contenido, nombres ni decisiones entre ambos.
---

# TheBruma — memoria del proyecto

Juego del usuario (ventisca-gif). Es **independiente de su otro juego "The Bound"**: nunca reutilices nombres, mecánicas ni archivos de uno en el otro sin que el usuario lo pida.

## Qué es
- RPG **medieval + pirata**, **2.5D isométrico sobre cuadrícula**, todo en **español**.
- Gráficos 100% procedurales con **Three.js** (low-poly redondeado, contorno oscuro estilo cartoon). Sin assets externos salvo el icono.
- Plataformas: navegador y **APK Android** (WebView). Se juega en **horizontal y vertical**.
- Estilo pedido por el usuario: referencias tipo isométrico con personajes "estructurados" (cabeza con cara, hombreras, capas, armaduras visibles), contorno y mucho detalle en trajes. Nombre del juego: **TheBruma**; la isla principal sigue llamándose Isla Bruma.
- Contenido siempre **original** (no copiar juegos existentes).

## Repo y flujo
- Repo `ventisca-gif/2.5-D`, rama de trabajo `claude/rpg-medieval-pirata-2d5-wruege`.
- `npm run build` → `www/` (bundle IIFE `game.js`, sin módulos ES para que funcione en `file://`).
- `./android/build-apk.sh` → `dist/TheBruma.apk` (sin Gradle: aapt + javac + dalvik-exchange + zipalign + apksigner, paquetes apt `aapt apksigner zipalign dalvik-exchange android-sdk-platform-23`). `dl.google.com` puede estar bloqueado: por eso no se usa Gradle.
- Keystore propio en `android/islabruma.keystore` (para que las actualizaciones se instalen encima). Paquete `com.islabruma.juego`, etiqueta "TheBruma". Sube `versionCode` en cada APK publicada.
- **Actualizador dentro de la app** (`src/updater.js` + `MainActivity`): al abrir, consulta `api.github.com/repos/ventisca-gif/2.5-D/releases/latest`, lee `versionCode=N` de las notas y, si es mayor que el instalado, ofrece descargar la APK (DownloadManager) y abre el instalador. **Para publicar una versión: sube `versionCode` y `versionName` en `android/AndroidManifest.xml`, haz commit y push** a la rama de trabajo; el workflow `.github/workflows/apk.yml` compila y crea/actualiza la Release `v{versionName}` con `TheBruma.apk`. Sin subir versionCode, los móviles no ven la actualización.
- Icono: `android/res/mipmap-*/ic_launcher.png` (imagen del usuario con esquinas redondeadas).
- Pruebas: Playwright con Chromium preinstalado y `--use-angle=swiftshader`; la lógica se prueba llamando a `game.update(0.05)` en bucle con `game.paused = true`.
- Push a GitHub ha fallado con 403 en sesiones anteriores: si pasa, avisar y dejar commits locales.

## Estructura (src/)
- `world.js` mapa 100×100 (Villarroca amurallada, Puerto Salitre, bosque, pedregal, granja, cala) · `regions.js` islas extra (Tortuga, Calavera), `makeIslet` con biomas (`desert`, `jungle`, `volcano`, `fort`; casillas `T.ROCK`/`T.LAVA`) e interiores (x ≥ 1000, incluida la bodega del barco) que comparten cuadrícula y A*.
- `isles2.js` capítulo 2: Isla Duna (oeste, Oasis de Sal, ámbar), Isla Selva (norte, Aldea Liana, jade), Bastión de la Marina + Villa Grillete (sur), Isla Ceniza (sureste lejano, volcán, obsidiana). Mar navegable de -104 a 244 (`SEA` en terrain.js).
- `naval.js` (se instala en el prototipo de Game): vida del barco y mejoras (`shipUp`: casco, cañones, velas, tamaño) con la Astillera Marga (Puerto Salitre), cañones (`fireCannons`, botón 💣 / F), fragatas de la Marina y piratas con IA, serpiente marina, abordaje en la región `arena` (x=1700, dos cubiertas + pasarela), hundimiento y rescate, recompensa `bounty` (≥300 la Marina ataca al verte, pregunta en pueblos, desembarca: `updateRaids`, vecinos de `DEFENDERS` luchan), soborno con el Teniente Ferro.
- `chars2.js` personajes (humanos con género, peinados, busto, escudos, hachas, tridentes; esqueletos, lobos, jabalíes, tigres, cangrejos, escorpiones, murciélagos, gólems, calaveras llameantes, serpiente marina) horneados en pocas mallas + contorno `OUTLINE` · `characters.js` animaciones.
- `items.js` objetos, equipo visible por tiers (madera/cuero, hierro, plata, oro + piezas corsarias), recetas de forja/banco/cocina, botines, aspecto (`buildLook`), nivel máx. **100**. Tiers 0-6: cuero, hierro, plata, oro, ámbar, jade, obsidiana (`TIER_NAMES`). Cosméticos en ranuras `cosHead/cosBody/cosCape` (`COS_SLOTS`): se ven encima de la armadura sin cambiar estadísticas.
- `social.js` niveles de NPC por isla, amistad, tripulación (máx. 10), romance.
- `panels.js` UI de equipo+mochila (vista previa 3D), forja/cocina, bitácora, guía, regalos · `ui.js` HUD, minimapa, joystick.
- `quests.js` 22 misiones (capítulo 2 desde la 10, con `talkText`/`doneText`/`zone`), `SIDE_QUESTS` (un encargo por NPC, no se repiten, `g.side`) y tiendas · `main.js` bucle, combate, barco, guardado en 3 ranuras (`thebruma_slot_N`) con tiempo jugado.

## Sistemas ya hechos
Combate **manual** (solo se ataca con el botón ⚔️, también andando/corriendo con joystick; mantener = repetir; sin autoataque), Marina neutral hasta que te buscan (`hostile()`), bestiario y armería en la bitácora, correr con estamina, recursos y menas por isla, forja/banco/cocina, comer para curar, mochila y equipo (todo visible), amistad (charlar, regalar), duelos y peleas con NPCs (nadie muere), tripulación que sigue, lucha, sube de nivel y mejora armadura, barco navegable con bodega, romance (declararse, besar, pasear de la mano), día/noche, interiores, 2 islas extra, menú pirata con creador. Personajes estilo anime (`src/anime.js`): cara pintada en textura (4 expresiones por género, 8 colores de ojos, nariz/boca/rubor opcionales), 4 formas de cara, pelo de mechones 3D (6 peinados por género, 10 colores), 5 cuerpos por género (incluido "Clásico" de bloques), busto en 4 tamaños; los NPCs reciben cara anime determinista por id (`animeLook` en main.js). Nadar (brazadas, gasta estamina, ahogo) y tajo de espada con estela (`slash`).

## v2.5 (mundo vivo)
- Botones: grande = atacar siempre (navegando = cañones); botón azul `btnUse` = acción contextual (hablar, abrir, carteles, retar, estructura, ⚙️ Barco).
- Bando al crear (`ap.factionIdx`: 0 pirata, 1 Marina; `g.isMarine()`): pirata = recompensa imborrable; Marina = `honor` y rangos, marines aliados, piratas atacan; `questAt()` usa versiones `marine` de las misiones 15-17. La facción enemiga se llama **Marina** (antes "Guardia Naval").
- Tripulación: máx. 3 acompañan (`activeCrew`), `soc.role` = 'ship' | 'farm' (recolectar en una isla, `farmYield`/`collectFarm`), nivel hasta 100 (también la pareja). Timonel automático (`autoHelm`, `autoPilot`), pasear por cubierta (`deck`), bodega según tamaño (`bodega`, `bodega2`, `bodega3`).
- `life.js`: 16 piratas famosos (`FAMOUS`, 10 leyendas) que viajan entre islas (`g.famous`), cazan monstruos (`quietHit`) y pelean con IA (`famousUpdate`: combos, esquiva, bloqueo, especial por arma, ron). Tablones de Se busca (`posters`, prop/mueble `poster`) con retratos renderizados (`portrait`). Clima (lluvia, tormenta con rayos, niebla, nieve) y estaciones cada 3 días. Horarios de NPC (`npcRoutine`: dormir, taberna, refugiarse). Gestos de pareja (`coupleAct`: beso, abrazo, baile, en brazos).
- `skills.js`: clase según arma (espada/hacha/lanza), 5 habilidades cada una (niveles 2/6/12/20/30), meditar (buff Concentración), buffs.
- `build.js`: estructuras 2×2 (empalizada, muro, torre, cañón, fogata, tienda, huerto) que disparan, se reparan/refuerzan y los asaltantes destruyen; defensas de pueblo vía líderes (`townDef`).

## v2.6
- `extra.js`: oficios (`JOBS`, máx. 30, +0,5% daño por nivel vía `jobDmg`, ventajas propias), tablón diario `contracts()` (guardado en `jobBoard`; ¡no usar `this.board`, es el método de embarcar!), fichas de gremio (`ficha`), pesca (`startFishing`), armario de cosméticos (`wardrobe`, `addCos`, `equipCos`; `give()` manda los cosméticos al armario), superjefes nivel 101 (`serafin` en Isla Calavera, `dragon` en Isla Ceniza; `superTick`: área anunciada, refuerzos, furia; vida escalada con `superScale`) y Leviatán Abisal (`leviathanAttack`: la arena sin barco B, cabeza + tentáculos, toda la tripulación lucha; `crewScale` reparte el daño si hay más de 3), barcos comprables (`SHIP_TYPES`) y decorables (`applyShipDecor`, nombre), llamar al barco (`callShip`) y desembarcar en cualquier costa (`disembark`), camarote decorable en la bodega (`shipDecor`, `furniture` exportado de interiors.js) y eventos (`EVENTS`: festival, estrellas, mercader Zuri, invasión, tesoro).
- 42 cosméticos nuevos `c_*` en items.js (campo `src`: tienda, gremio, evento, dragon, serafin, leviatan); chars2 admite `wings`, `tail`, `halo`, `dragonHorns`, `visorGlow`.

## Multijugador local
`src/net.js` + `android/.../NetHub.java`: relé WebSocket en el móvil anfitrión (puerto 47800, UDP 47801 para buscar partidas). Anfitrión = autoridad de enemigos (`enemyTarget`, `hurtRemote`); clientes mandan su estado a 10 Hz y los golpes (`hitEnemy` → `hit`). Equipos y XP compartida (`killRecipients` → `grantKill`), PvP opcional del anfitrión. Para probar en PC: `node tools/hub.mjs` y `game.net.host('ws://127.0.0.1:47800/host')` / `game.net.join('127.0.0.1')` en varios contextos de Playwright.

## Ideas pendientes que el usuario mencionó
Sistema de construcción con materiales en 4 casillas y defensas de pueblo (dar materiales a los pueblos; la Marina las destruye o las reforzamos), cubierta exterior del barco caminable y ampliable por dentro, interacción más rica de la tripulación en tiendas.

## Actualizador
Desde v2.4 la consulta a GitHub se hace en Java (`AndroidBridge.checkUpdate` → `window.onUpdateJson`) porque el fetch del WebView fallaba. Quien tenga ≤ v2.3 debe instalar la v2.4 a mano una vez.

## Cómo trabajar con el usuario
- Escribe en español, frases cortas. Envía la APK con SendUserFile y capturas horizontal/vertical.
- Si pide "un ejemplo primero", haz una muestra (p. ej. `www/showcase.html`) y espera su aprobación antes de cambiarlo todo.
