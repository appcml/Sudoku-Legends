# Sudoku Legends — APK nativo con Capacitor (sin Godot)

Tu app React/Vite existente, envuelta como app Android nativa con
**Capacitor**, con AdMob nativo (`@capacitor-community/admob`) y un
workflow de GitHub Actions que compila y **firma** el APK automáticamente
en cada push a `main`.

## Qué se hizo

- Se instaló Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
  y se generó la carpeta `android/` real (proyecto Gradle nativo), usando
  las herramientas oficiales de Capacitor — no está escrita a mano.
- `capacitor.config.json`: `appId = com.appcml.sudokulegends`.
- `android/app/src/main/AndroidManifest.xml`: se agregó el App ID de
  AdMob (`ca-app-pub-6387207876125603~2840186870`) y el permiso
  `ACCESS_NETWORK_STATE`.
- `android/app/build.gradle`: bloque `signingConfigs.release` que lee la
  contraseña y el alias **desde variables de entorno**, nunca desde el
  archivo (así el repo puede seguir siendo público).
- `src/lib/adsService.js`: servicio de anuncios recompensados nativos con
  tus reglas de monetización (máx. 3/sesión, 10/día, 2 min entre anuncios).
  Solo falta importarlo donde tengas el botón de "pista" en tu juego.
- `.github/workflows/build-apk.yml`: instala Node, Java 21 y el Android
  SDK, compila el React con Vite, sincroniza Capacitor, decodifica el
  keystore desde un secret, compila `assembleRelease` con Gradle, y sube
  el APK como artifact descargable.

## 1. Conectar el anuncio recompensado a tu UI

En el componente donde el jugador pide una pista viendo un anuncio,
importa el servicio:

```jsx
import { initAds, showRewardedAd, canWatchAd } from '../lib/adsService';

// una vez, al iniciar la app (por ejemplo en App.jsx)
useEffect(() => { initAds({ testMode: true }); }, []);

// al presionar "Ver anuncio +3 pistas"
async function handleWatchAd() {
  if (!canWatchAd()) return;
  const rewarded = await showRewardedAd({ testMode: true });
  if (rewarded) {
    // súmale 3 pistas al estado del jugador
  }
}
```

Cuando publiques de verdad, cambia `testMode: true` a `testMode: false`
en ambas llamadas.

## 2. Crear los 3 secretos en GitHub

En tu repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | tu `mis-juegos.keystore` en base64 (te doy el texto exacto en cuanto me lo subas al chat) |
| `ANDROID_KEYSTORE_ALIAS` | `cic` |
| `ANDROID_KEYSTORE_PASSWORD` | la contraseña de tu keystore |

**Nunca subas el archivo `.keystore` al repo** — por eso está en
`.gitignore`. El workflow lo reconstruye desde el secret en cada build.

## 3. Subir esto al repo

```bash
git checkout main
# Reemplaza TODO el contenido actual por el de este zip (descomprimido)
git add .
git commit -m "Migración a Capacitor: APK nativo con AdMob, build automático"
git push
```

Al hacer push, la Action **Build Android APK** corre sola. El resultado
queda en **Actions → (el run) → Artifacts → SudokuLegends-apk**.

## 4. Importante — no pude compilar el Gradle aquí

Generé el proyecto Android con las herramientas reales de Capacitor
(`npx cap add android`, no archivos escritos a mano), así que la
estructura es correcta. Pero mi entorno de pruebas no tiene salida a
internet hacia los repositorios de Google/Gradle, así que no pude
ejecutar `./gradlew assembleRelease` de punta a punta para confirmar una
compilación 100% exitosa. El workflow de GitHub Actions sí tiene acceso
completo a internet y es el lugar donde esto se valida de verdad; si algo
falla ahí, el log de la Action dirá exactamente qué falta (revisa la
pestaña **Actions** después del primer push).
