---
name: thebruma-proyecto
description: Contexto y memoria del proyecto Bruma / TheBruma (antes "Isla Bruma"), el RPG medieval-pirata 2.5D isométrico en cuadrícula de ventisca-gif, con APK Android. Úsala siempre que el usuario hable de Bruma, TheBruma, Isla Bruma, "mi juego pirata", el repo 2.5-D, o pida cambios, APKs o ideas para ese juego. NO es "The Bound": The Bound es otro juego distinto del usuario con su propia memoria; no mezcles contenido, nombres ni decisiones entre ambos.
---

# Bruma (TheBruma) — memoria del proyecto

> **Dos memorias separadas:** esta es la de **Bruma** (el RPG medieval-pirata). **The Bound** es otro juego del usuario con su propia memoria. No mezclar nunca nombres, mecánicas, archivos ni decisiones entre los dos.

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

## v2.7
- `more.js`: mascotas (`PETS`: loro, mono, gato, cría de dragón; `petObj`, ayudan en combate, `petOnKill`), bandera de tripulación (`flagCfg`, `drawFlag` → textura en barco propio y de remotos, y en el cartel), casa propia (sala `casa5`, se compra a Lope, dormir = buff `descanso`, decorable como el camarote), citas (`DATES`, `loveData`) y boda (anillo `anillo_boda` en la forja; `soc.married`, buff `juntos`; boda entre jugadores con `spouseP`), mapas del tesoro (`tmaps`, `mapCanvas`, cavar), regata (`raceCourse`, Nerea) y torneo (3 duelos, Marisol), Cripta de la Bruma (región `dungeon` en x=2000, 4 salas con rejas, `crypt_king`; la controla el anfitrión) y barcos de piratas famosos (`spawnFamousShip`; abordarlos mete al famoso en la cubierta).
- Multijugador: los enemigos temporales del anfitrión se sincronizan (`announceSpawn` → `clientSpawn`, `g.netMap` por índice del anfitrión, `e.netIdx`); los del cliente para sí mismo son `e.local`. El anfitrión no hace `purgeTemps` mientras hay partida. Mensajes genéricos `net.sendX` / `g.onNetX` (bodas, regatas, rejas de la cripta, botín). `myInfo` lleva mascota, bandera y cónyuge.

## v2.8
- `more2.js`: monturas (`MOUNTS`: caballo de Lucía, camello de Zaid, salamandra de Brasa; `toggleMount`, botón 🐴/K, `p.yOff`, pose `st.ride`; remotos con `s.mt`), Isla Espectral (`makeGhostIslet`, región que solo existe con niebla o de 0 a 4 h: `R.hidden`, `updateGhost`, jefe `ghost_captain`), clanes (`clan`, `foundClan`/`inviteClan`; nombre y bandera del fundador) y cofre (personal o del clan guardado por el anfitrión: `stashes`, `onNetHost`), música generativa por zona (`updateMusic`, `ZONES`; ajuste `settings.music`), logros con títulos (`LOGROS`, `title`, etiqueta `.ttl`), casas (`HOUSES`: casa5, casaplaya —se crea en `addBeachHouse`—, casa2 mansión; cama y cofre) y muebles de lujo (`PREMIUM_DECOR`, catálogo de Bruno `flags.furn`), puestos de tripulación (`CREW_JOBS`, `soc.cjob`) y PvP naval (`pvpShips`, `shiphit`) + Captura la bandera (`ctfStart`, lo controla el anfitrión).

## v2.9
- `more3.js`: Ciudad de Coralia (región `coralia` en x=2100, `underwater`; se baja con la campana de buceo de Marga `flags.diveBell` desde ⚙️ Barco; aire `oxy`; enemigos `merfolk`, `jelly`, jefa `abyss_queen`; 5 cofres diarios), granja (huerto con semillas y riego, `gallinero` y `establo`; oficio `granjero`; recetas nuevas), mercado entre jugadores (lo guarda el anfitrión: `marketHost`, mensajes `mk*`), historias de la tripulación (`CREW_STORIES`, `crewQ`, `soc.loyal` +25% daño), combos (`comboMul`, remate cada 3 golpes) y parada perfecta (`blockPress`/`blockDamage`, botón 🛡️ o B), mareas (`tideLevel`, bajío `tor.tidal` al este de Tortuga hasta la Roca de la Marea, almejas) y modo foto (`photoMode`, poses `st.pose`, marcos y filtros; Android guarda con `AndroidBridge.saveImage` en Imágenes/Bruma).
- Caballo/camello rediseñados en `mountModel` (more2.js): proporciones reales, patas con rodilla, crin, cola, silla y riendas.

## v3.0
- Interfaz: el usuario NO quiere la pantalla llena de botones. Todo va en el botón ⚡ Atajos (`#shortcuts`: Mochila, Bitácora, Online, Construir, Guía, Meditar, Foto). Todo lo nuevo se documenta en Bitácora › 🌍 Novedades (`g.mundoHtml()` en more4.js) y en la Guía.
- `more4.js`: 4 islas (`makeIslands4`: Isla Escarcha `snow` ox175/oz-95 con Monasterio del Pico y Maestro Ishvar; Isla Merengue `candy` ox-100/oz84; Archipiélago Burbuja `mangrove` ox-95/oz-95; Isla Engranaje `tech` ox178/oz40), cielo propio (`AMBIENT`, `updateAmbience`, `forceSnow`), enemigos `lobo_nieve`, `yeti`, `galleta`, `cangrejo_burbuja`, `automata` (`tintModel` en main.js tiñe colores de vértice), tiers 7 Escarcha (cristal) y 8 Estelar (meteorito).
- Armamento Espiritual (referencia al haki, nombre propio; NO copiar One Piece): Maestro Ishvar a nivel 100 por 20000 oro, `esp {l,xp}` hasta 50, `espMul` (+20% +0,6%/nivel), `espRes` (5% +0,3%/nivel), `espHit` al golpear; visual negro en antebrazos/arma con aura (`updateEsp`, `model.espFx`), torso al nivel 30.
- Contratos de captura (Ferro/Mara, `huntContracts`, `canCapture`/`capture` <15% vida), Gruta de los Cristales (región x=2200, `GROTTO_SPOTS`, entrar con «Gruta» navegando, salir = `surface`), evento `erupcion` (Isla Ceniza), Velaria ciudad flotante (`velariaPos` cambia cada 7 días, tienda), Bruja Mambé en Aldea Liana + hechizos `type:'spell'` («Lanzar» en la mochila, `castSpell`, buff `vudu`), ranking de recompensas + Día de la caza (anfitrión, `onNetX4`, mensajes `hunt`/`huntDown`; `bounty` va en `netExtraInfo`), pesca con minijuego (`startFishGame`, `#fishGame`, `fishDex`), oficios: +1% daño y +0,3% vida por nivel (`jobHp`), hitos 10/20/30 (`jobMilestone`), 4 trabajos/día con paga doble.
- El usuario dijo que NO quiere Nueva Partida+.
- v3.1: los enemigos fuertes también usan Armamento Espiritual (`enemyHasEsp`: tipos de `ESP_TYPES`, nivel ≥90, famosos ≥70, superjefes). Ciclo 7 s activo / 5 s descanso en combate (`updateEnemyEsp`, `e.espOn`, `enemyEspFx`: brazos/arma negros en humanoides, brazos grandes en gólems/yetis/autómatas, aura en bestias, anillo y 🖤 en la etiqueta). Activo: pegan ×1,2 (`enemyEspAtk` en damagePlayer) y reciben ×0,6 (`enemyEspDef` en damageEnemy); con el Armamento propio ×(0,75 + 0,01·nivel), daño completo desde el nivel 25.

## v3.2 (more5.js)
- Puños negros: el Armamento añade una esfera negra en la mano y el brillo rosa va en `BackSide` (halo detrás), en jugador y enemigos. Al usuario le gusta así (antebrazos + puños negros, torso a nivel 30).
- Jefes `reina_hielo` (Escarcha), `gran_automata` (Engranaje), `rey_pastel` (Merengue): `def.super` propio con `sCol/sTxt/sMin` (superTick de extra.js usa esos campos). Logro `islas`.
- Trineo de perros (`MOUNTS.trineo`, `sledModel`, vende Helga, `mountSpeed5` ×1,3 en nieve). Fragatas de globo cerca de Engranaje (`balloons`, `balloonTargets`/`balloonHit` enganchados en naval.js). Torneo de pesca (`day % 7 === 3`, Gaspar, `fishT`, `fishScore`). Puño espiritual (nivel 40, botón 🖤 `.skb.espk`, `espPunch`; nivel 50 Puño del Rey aturde y `_pierce` ignora el Armamento enemigo). Isla Naciente (`makeNewbornIslet`, ghost+newborn, solo con el evento `erupcion`, cofre `naciente_cofre`). Prisión del Bastión (`role: 'jail'`, `onPlayerDeath5` 45% si te derrota la Marina, `startRescue`/`updateRescue`). Clima por isla (`updateIsleWeather`, `WEATHER5`).
- v3.3: a nivel 30 el Armamento cubre torso, hombros y, en mujeres, también el busto (`espTorso` en more4.js; usa `model.look.female/bust`, que ahora devuelve `makeHumanoid2`). Antebrazos más gruesos para tapar los puños de la manga.
- Los diálogos (`ui.openDialog`) usan textContent: `<br>` se convierte en salto de línea y se quitan `<b>`/`<small>`.

## v3.4 (more6.js)
- Romper con la pareja / divorciarse (`breakUp`, `soc.exDay`; 7 días sin poder volver con esa persona, `canConfess`).
- Formación de seguidores: cada tripulante va a su puesto detrás del jugador (`followSlot`, `SLOTS`) y `separateFollowers` empuja a los que se pisan (tripulación, pareja y jugador).
- Defensas de enemigos por tipo (`defenseKind`/`enemyDefend`, envuelve `damageEnemy`): parry (+contraataque al 2º bloqueo, poción <30%), dodge/evade, shell (caparazón a media vida), stone (piel de piedra si le golpeas 4 veces en 2,5 s). Los famosos usan su propia IA.
- NPCs en duelo/pelea: bloquean, esquivan, poción en duelos (`npcDefend`, envuelve `damageNPC`) y técnica especial según arma cada 6-9 s (`npcFightSkill`, `pending.r/k`).

## v3.5 (more7.js)
- El usuario quiere que la tripulación y la pareja NO sean inmortales: vida como un jugador de su nivel (`compStats`: 60+12·(nivel-1)+vida de armadura `crewGear(compLevel)`), `chp/cmax/cdef`, los enemigos les eligen como objetivo (`enemyTarget` envuelto, `e.lock`), golpes vía `hitTarget` (main, extra superTick), `hurtCompanion` (bloqueo 12%), desmayo `knockOut` 30 s (`n.ko`), reanimar con poción (`Reanimar`), regeneración fuera de combate, pociones propias `soc.pots` (regalar pociones), retirada <20%. Etiqueta verde `.lbl.comp`.
- Expediciones `role: 'explore'` 8 min (`exploreMenu`/`sendExplore`/`updateExplore`): nivel, oro, materiales, pociones y `soc.gearB` (+10 niveles de armadura por punto, máx 3; `crewGearLevel` en rebuildCrewLook).
- Órdenes `crewOrder` (follow/attack/defend/gather/wait) en Atajos (`btnOrders`), `crewFoe` envuelto, `crewGatherTick`.
- Celos (`soc.jeal`, envuelve addFriend), rival que reta a duelo (`updateRival`, NPC id 'rival', envuelve endFight), hijo/hija tras casarse (`child`, NPC 'hijo', crece 4 niveles/día, reclutable a nivel 10 vía RECRUITABLE).
- Enemigos huyen a <20% (30%) y vuelven con 2 refuerzos (`updateFlee`, estado 'flee'). Mercado negro nocturno (NPC 'sombra' en Tortuga 20-5h, contrabando `smuggle` → envuelve `dock`). Carreras de monturas (Lucía/Zaid/Helga, `mrace`, apuesta ×3). Faros en cada muelle (`faros`, 10 madera + 2 hierro, `travelMenu`/`fastTravel` 50 oro, `btnTravel`).
- El usuario NO quiere motín.

## v3.6 (more8.js; se instala DESPUÉS de installMore porque envuelve wedding/petLevel/updatePet de more.js)
- Habilidades de tripulantes (`crewClass`: sword/axe/spear/heal; sanadoras `HEALERS`), `crewSkillTick`, nivel `soc.sk` sube con usos.
- Equipo a mano: `soc.eq` por ranura (Mochila › «Dar a tripulante», `giveCrewItem`), `crewEquip` = crewGear + eq; `compStats` reescrito (cmax/cdef/catk), `crewDmgMul` (arma + rango).
- Rangos `RANKS` (Grumete→Primer oficial, `soc.rank`, `promote`), Primer oficial: cañón ×1,15 y velocidad ×1,08 (envuelve shipStats).
- Diario (`crewDiary`, `soc.mem` recuerdos, `kills/kos/exps`). Asedio al Bastión (Lucas, `siege`, 3 oleadas + comodoro, `flags.siegeDay`). Fiesta de boda (`party`). Mascotas con vida y nivel 50 (`petTarget` como objetivo de enemigos, `hurtPet`, ko 40 s). Peligros del mar (`updateSeaHazards`: icebergs en Escarcha, remolinos en aguas profundas con colisión, rayos en tormenta).

## v3.7 (more9.js; se instala tras installMore porque envuelve sleepHere)
- Segundo barco (`escortId`, `setEscort` rango ≥2 + 8000 oro, `updateEscort` sigue y dispara; si lo hunden 3 min de reparación).
- Escuela de combate (NPC 'sable' en la plaza, `soc.sk2` segunda técnica, `crewSkill2Tick`). Pueblos que crecen (`towns9`, `LEADERS9`, `helpTown`/`growTown` casas nuevas, `priceMul9` −4%/nivel, tienda nivel 3).
- Bestias legendarias (`bestia_lobo/tigre/golem`, `updateBeastHunt` cada 12-20 min, marcador rojo, `beastDown` en multijugador). Banquete (`BUFFS.banquete`, Atajos `btnBanquet`). Sueños (`dream` al dormir: mapa del tesoro o `vision` → jefe `sombra_abismo`). Torneo de tripulaciones (Marisol, `ctour`, 3 rondas en (50,30)).
- Isla Errante: 3 islotes ghost (`makeWanderIslets`, `WANDER_SPOTS`), visible el de `day % 3`; laberinto (`R.maze`, InstancedMesh), guardián `guardian_errante` y cofre diario `errante_cofreN`.

## v3.8 (more10.js)
- El usuario quiere TODO lo nuevo explicado en la Bitácora › pestaña «❓ Guía» (`guideSections()` en panels.js; lo nuevo = de «⚡ Atajos» a «🎯 Día de la caza», mostrado al revés, lo más reciente primero). Al añadir funciones, mete su entrada en guideSections antes de «🎯 Día de la caza».
- Arqueología (`pala` de Tadeo, 6 montículos diarios `digSites`, `excavate`), reliquias `RELICS` (type 'relic', máx 2 activas `relics`, `passiveMul` en buffMul/jobHp/shipStats). Gremio de aventureros (NPC 'orla', `adv` semanal, rangos Bronce→Leyenda, `c_capa_gremio`). Puente de hielo en invierno (región 'hielo' x 202-208, `season()===3`). Puerto propio (Isla Libre ox128 oz146, `flags.portLv` 1-5, impuestos `portDay`, `portMenu`). Concurso de barcos semanal (Nerea). Amuletos de 3 gemas (`GEMS`, `amulets`, `amuletEq`, Tadeo/Helga). Historia de la pareja (`soc.pq.s` 0-5: carta → Sombra → cazadores → medallón al excavar → Capitán Varek; premio `c_anillo_destino`, título, `loyal`).
- El usuario NO quiere «enemigos que aprenden».

## v3.9 (more11.js; se instala tras more8/9/10 porque envuelve compStats/crewDmgMul/companionTick/hurtCompanion)
- Islas conquistadas por famosos (`conq`, `updateConquest`, precios ×1,2, liberar u `owned` tributo 400/día). Alquimia (Mambé/Volta, `ELIXIRS` type 'elixir', `BUFFS.e_*`, oficio `alquimista`) y joyería (Tadeo/Helga, `cutAmulet` ×1,25 hasta 3, oficio `joyero`; añadidos a `JOBS`).
- Eventos de temporada por `season()`: 0 carnaval (Tortuga), 2 halloween (calabazas, fantasmas nocturnos → `caramelo` → disfraces con Marisol), 3 navidad (árbol en (54,47), regalo diario, nieve en Villarroca).
- Pecio submarino (región 'pecio' x=2300 `underwater`, `WRECK_SPOTS`, tiburones `tiburon` con `makeSharkModel`, 3 cofres diarios). Defensa del puerto con cañones en tierra (`praid`, `portCannons`, `fireLandCannon`). Rasgos (`TRAITS`, `soc.trait`). Mapa del mundo revelable (`wmap`, celdas de 6, Atajos `btnMap`). Leyenda final (`legend` 5 fragmentos de jefes → `summonFinal` `rey_bruma` 60000 vida con fases; premio `c_corona_bruma`, título «Leyenda de la Bruma»).
- En main.js ya existía `makeWreck` (barco hundido decorativo): el de buceo se llama `makeWreckDive`.

## Ideas pendientes (propuestas al usuario tras v2.8)
Ver el último mensaje de ideas en la conversación; se van implementando por lotes de 8.

## Multijugador local
`src/net.js` + `android/.../NetHub.java`: relé WebSocket en el móvil anfitrión (puerto 47800, UDP 47801 para buscar partidas). Anfitrión = autoridad de enemigos (`enemyTarget`, `hurtRemote`); clientes mandan su estado a 10 Hz y los golpes (`hitEnemy` → `hit`). Equipos y XP compartida (`killRecipients` → `grantKill`), PvP opcional del anfitrión. Para probar en PC: `node tools/hub.mjs` y `game.net.host('ws://127.0.0.1:47800/host')` / `game.net.join('127.0.0.1')` en varios contextos de Playwright.

## Ideas pendientes que el usuario mencionó
Sistema de construcción con materiales en 4 casillas y defensas de pueblo (dar materiales a los pueblos; la Marina las destruye o las reforzamos), cubierta exterior del barco caminable y ampliable por dentro, interacción más rica de la tripulación en tiendas.

## Actualizador
Desde v2.4 la consulta a GitHub se hace en Java (`AndroidBridge.checkUpdate` → `window.onUpdateJson`) porque el fetch del WebView fallaba. Quien tenga ≤ v2.3 debe instalar la v2.4 a mano una vez.

## Cómo trabajar con el usuario
- Escribe en español, frases cortas. Envía la APK con SendUserFile y capturas horizontal/vertical.
- Si pide "un ejemplo primero", haz una muestra (p. ej. `www/showcase.html`) y espera su aprobación antes de cambiarlo todo.
