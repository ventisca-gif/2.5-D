# Isla Bruma — Espadas y Velas

RPG **medieval y pirata** en **2.5D isométrico** sobre cuadrícula, para Android (APK) y navegador.
Todo el arte es procedural (Three.js + primitivas low-poly): no hay imágenes ni modelos externos.

## Descargar y jugar

- **APK Android:** [`dist/IslaBruma.apk`](dist/IslaBruma.apk) — instálala en el móvil (permite "instalar apps de origen desconocido").
- Gira el móvil cuando quieras: funciona en **horizontal y vertical**.

## El juego

- **Una isla grande** (100 × 100 casillas):
  - **Villarroca**: ciudad amurallada con torres y vigías, plaza con fuente, mercado, Ayuntamiento, Herrería, Taberna y Torre del Reloj.
  - **Puerto Salitre**: muelles, barco pirata *Gaviota Negra*, faro, taberna La Sirena Tuerta y almacén.
  - **Bosque Norte**, **Pedregal del Oeste**, **Granja de los Trigales** y **Cala de los Huesos** (barco hundido).
- **14 NPCs** con nombre y diálogo (alcaldesa, herrero, tabernera, capitana pirata, mercader, guardias…).
- **Cadena de 9 misiones** hasta el jefe final, el Capitán Huesoamargo.
- **Combate** contra lobos, jabalíes, cangrejos y piratas esqueleto; experiencia, niveles y oro.
- **Recursos**: tala árboles (madera) y pica rocas (piedra); vende al mercader o mejora arma y armadura en la herrería.
- **Ciclo día/noche** con farolas, ventanas encendidas y haz de luz del faro.
- **Creador de personaje**: Caballero, Corsario, Exploradora o Mercenario + tono de piel.
- Guardado automático.

## Controles

| Acción | Móvil | PC |
|---|---|---|
| Moverse | Tocar el suelo (camino A* por la cuadrícula) o joystick | Clic / WASD / flechas |
| Atacar, hablar, talar, picar | Tocar el objetivo o botón grande | Clic / Espacio |
| Ron curativo | Botón 🍶 | Q |
| Zoom | Pellizcar | Rueda |
| Mapa grande | Tocar el minimapa | M |
| Menú | ☰ o botón Atrás | Esc |

## Desarrollo

```bash
npm install
npm run build        # genera www/ (index.html + game.js)
npm run serve        # http://localhost:8080
```

### Compilar la APK

Sin Gradle ni Android Studio, con las herramientas de Ubuntu/Debian:

```bash
sudo apt-get install -y aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk
./android/build-apk.sh   # -> dist/IslaBruma.apk
```

GitHub Actions (`.github/workflows/apk.yml`) recompila la APK en cada push y la deja como artefacto.

### Estructura

```
src/world.js        mapa en cuadrícula: isla, ciudad, puerto, NPCs y zonas de enemigos
src/terrain.js      terreno texturizado + agua con espuma
src/props.js        casas, murallas, torres, barco, árboles, decoración (mallas fusionadas)
src/characters.js   personajes de bloques y animaciones
src/pathfinding.js  A* en 8 direcciones
src/quests.js       misiones y diálogos
src/ui.js           HUD, minimapa, joystick, diálogos
src/main.js         bucle del juego, cámara isométrica, combate, IA, guardado
android/            WebView nativo, icono y script de la APK
```
