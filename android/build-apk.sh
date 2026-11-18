#!/usr/bin/env bash
# Compila la APK de Isla Bruma sin Gradle, con las herramientas de Android de Ubuntu/Debian:
#   sudo apt-get install -y aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk
# Uso: ./android/build-apk.sh   ->  dist/IslaBruma.apk
set -euo pipefail
cd "$(dirname "$0")/.."

ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
DX="$(command -v dalvik-exchange || command -v dx)"
KS=android/islabruma.keystore
KS_PASS="${KS_PASS:-islabruma}"
B=android/build

echo "==> Juego web"
npm run build

echo "==> Empaquetando recursos"
rm -rf "$B"; mkdir -p "$B/classes" "$B/assets" dist
cp -r www "$B/assets/www"
rm -f "$B/assets/www/showcase."*
aapt package -f -M android/AndroidManifest.xml -S android/res -A "$B/assets" -I "$ANDROID_JAR" -F "$B/unsigned.apk"

echo "==> Compilando Java"
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d "$B/classes" android/src/com/islabruma/juego/*.java
"$DX" --dex --output="$B/classes.dex" "$B/classes"
(cd "$B" && aapt add unsigned.apk classes.dex >/dev/null)

echo "==> Alineando y firmando"
zipalign -f 4 "$B/unsigned.apk" "$B/aligned.apk"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias islabruma \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Isla Bruma, O=Isla Bruma, C=ES"
fi
apksigner sign --ks "$KS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" --ks-key-alias islabruma \
  --out dist/IslaBruma.apk "$B/aligned.apk"
apksigner verify dist/IslaBruma.apk
rm -f dist/IslaBruma.apk.idsig
ls -lh dist/IslaBruma.apk
echo "APK lista: dist/IslaBruma.apk"
