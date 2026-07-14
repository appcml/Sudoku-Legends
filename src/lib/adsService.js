// src/lib/adsService.js
// Envoltorio nativo de AdMob (solo anuncios recompensados) usando
// @capacitor-community/admob. Aplica las mismas reglas de monetización
// acordadas: máx. 3 anuncios por sesión, 10 por día, 2 min de espacio
// entre anuncios.

import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const REAL_APP_ID = 'ca-app-pub-6387207876125603~2840186870';
const REAL_REWARDED_UNIT_ID = 'ca-app-pub-6387207876125603/2561908713';
const TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

const MAX_ADS_PER_SESSION = 3;
const MAX_ADS_PER_DAY = 10;
const MIN_GAP_MS = 2 * 60 * 1000;

const STORAGE_KEY = 'sudoku_ads_state_v1';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('no state');
    const state = JSON.parse(raw);
    if (state.day !== todayString()) {
      state.day = todayString();
      state.watchedToday = 0;
    }
    return state;
  } catch {
    return { day: todayString(), watchedToday: 0, lastAdTimestamp: 0 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let watchedThisSession = 0;
let initialized = false;

/**
 * Inicializa el SDK de AdMob. Llamar una sola vez al arrancar la app
 * (por ejemplo en main.jsx o App.jsx), solo tiene efecto real en Android/iOS
 * nativo vía Capacitor; en el navegador simplemente no hace nada.
 */
export async function initAds({ testMode = true } = {}) {
  if (initialized) return;
  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: testMode,
    });
    initialized = true;
  } catch (err) {
    // En navegador (dev/preview web) el plugin nativo no existe: se ignora.
    console.warn('AdMob no disponible en este entorno (normal en navegador):', err?.message);
  }
}

export function resetSessionAdCount() {
  watchedThisSession = 0;
}

export function canWatchAd() {
  const state = loadState();
  if (watchedThisSession >= MAX_ADS_PER_SESSION) return false;
  if (state.watchedToday >= MAX_ADS_PER_DAY) return false;
  if (Date.now() - state.lastAdTimestamp < MIN_GAP_MS) return false;
  return true;
}

/**
 * Muestra un anuncio recompensado nativo. Devuelve una Promise<boolean>
 * que resuelve true si el usuario ganó la recompensa (por ejemplo,
 * +3 pistas), o false si no se pudo mostrar / el usuario cerró antes.
 */
export async function showRewardedAd({ testMode = true } = {}) {
  if (!canWatchAd()) return false;

  const adId = testMode ? TEST_REWARDED_UNIT_ID : REAL_REWARDED_UNIT_ID;

  return new Promise(async (resolve) => {
    let rewarded = false;

    const loadedHandle = await AdMob.addListener(RewardAdPluginEvents.Loaded, async () => {
      try {
        await AdMob.showRewardVideoAd();
      } catch (err) {
        resolve(false);
      }
    });
    const rewardedHandle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });
    const dismissedHandle = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      _cleanup();
      if (rewarded) {
        watchedThisSession += 1;
        const state = loadState();
        state.watchedToday += 1;
        state.lastAdTimestamp = Date.now();
        saveState(state);
      }
      resolve(rewarded);
    });
    const failedHandle = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
      _cleanup();
      resolve(false);
    });

    function _cleanup() {
      loadedHandle.remove();
      rewardedHandle.remove();
      dismissedHandle.remove();
      failedHandle.remove();
    }

    try {
      await AdMob.prepareRewardVideoAd({ adId, isTesting: testMode });
    } catch (err) {
      // Sin plugin nativo (navegador): simula recompensa tras 1s para
      // poder probar el flujo completo en vista previa web.
      _cleanup();
      setTimeout(() => {
        watchedThisSession += 1;
        const state = loadState();
        state.watchedToday += 1;
        state.lastAdTimestamp = Date.now();
        saveState(state);
        resolve(true);
      }, 1000);
    }
  });
}
