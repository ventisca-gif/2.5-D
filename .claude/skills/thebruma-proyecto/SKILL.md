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
- Icono: `android/res/mipmap-*/ic_launcher.png` (imagen del usuario con esquinas redondeadas).
- Pruebas: Playwright con Chromium preinstalado y `--use-angle=swiftshader`; la lógica se prueba llamando a `game.update(0.05)` en bucle con `game.paused = true`.
- Push a GitHub ha fallado con 403 en sesiones anteriores: si pasa, avisar y dejar commits locales.

## Estructura (src/)
- `world.js` mapa 100×100 (Villarroca amurallada, Puerto Salitre, bosque, pedregal, granja, cala) · `regions.js` islas extra (Tortuga, Calavera) e interiores (x ≥ 1000, incluida la bodega del barco) que comparten cuadrícula y A*.
- `chars2.js` personajes (humanos con género, peinados, busto, escudos; esqueletos, lobos, jabalíes, cangrejos) horneados en pocas mallas + contorno `OUTLINE` · `characters.js` animaciones.
- `items.js` objetos, equipo visible por tiers (madera/cuero, hierro, plata, oro + piezas corsarias), recetas de forja/banco/cocina, botines, aspecto (`buildLook`), nivel máx. 50.
- `social.js` niveles de NPC por isla, amistad, tripulación (máx. 10), romance.
- `panels.js` UI de equipo+mochila (vista previa 3D), forja/cocina, bitácora, guía, regalos · `ui.js` HUD, minimapa, joystick.
- `quests.js` 10 misiones y tiendas · `main.js` bucle, combate, barco, guardado en 3 ranuras (`thebruma_slot_N`) con tiempo jugado.

## Sistemas ya hechos
Combate (enemigos atacan en movimiento), correr con estamina, recursos y menas por isla, forja/banco/cocina, comer para curar, mochila y equipo (todo visible), amistad (charlar, regalar), duelos y peleas con NPCs (nadie muere), tripulación que sigue, lucha, sube de nivel y mejora armadura, barco navegable con bodega, romance (declararse, besar, pasear de la mano), día/noche, interiores, 2 islas extra, menú pirata con creador (chico/chica, 6 peinados cada uno).

## Ideas pendientes que el usuario mencionó
Cubierta del barco caminable, más islas/misiones, interacción más rica de la tripulación en tiendas, más armaduras únicas.

## Cómo trabajar con el usuario
- Escribe en español, frases cortas. Envía la APK con SendUserFile y capturas horizontal/vertical.
- Si pide "un ejemplo primero", haz una muestra (p. ej. `www/showcase.html`) y espera su aprobación antes de cambiarlo todo.
