// src/lib/adsService.js
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

const REAL_REWARDED_UNIT_ID = 'ca-app-pub-6387207876125603/2561908713';
const TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

const MAX_ADS_PER_SESSION = 3;
const MAX_ADS_PER_DAY    = 10;
const MIN_GAP_MS         = 2 * 60 * 1000; // 2 min entre anuncios
const STORAGE_KEY        = 'sudoku_ads_state_v1';

function todayString() { return new Date().toISOString().slice(0, 10); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error();
    const s = JSON.parse(raw);
    if (s.day !== todayString()) { s.day = todayString(); s.watchedToday = 0; }
    return s;
  } catch { return { day: todayString(), watchedToday: 0, lastAdTimestamp: 0 }; }
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let watchedThisSession = 0;
let initialized = false;

export async function initAds({ testMode = true } = {}) {
  if (initialized) return;
  try {
    await AdMob.initialize({ testingDevices: [], initializeForTesting: testMode });
    initialized = true;
  } catch (err) {
    console.warn('AdMob no disponible en navegador:', err?.message);
  }
}

export function resetSessionAdCount() { watchedThisSession = 0; }

export function canWatchAd() {
  const s = loadState();
  if (watchedThisSession >= MAX_ADS_PER_SESSION) return false;
  if (s.watchedToday >= MAX_ADS_PER_DAY) return false;
  if (Date.now() - s.lastAdTimestamp < MIN_GAP_MS) return false;
  return true;
}

export async function showRewardedAd({ testMode = true } = {}) {
  if (!canWatchAd()) return false;
  const adId = testMode ? TEST_REWARDED_UNIT_ID : REAL_REWARDED_UNIT_ID;

  return new Promise(async (resolve) => {
    let rewarded = false;

    const loadedHandle    = await AdMob.addListener(RewardAdPluginEvents.Loaded, async () => {
      try { await AdMob.showRewardVideoAd(); } catch { resolve(false); }
    });
    const rewardedHandle  = await AdMob.addListener(RewardAdPluginEvents.Rewarded,   () => { rewarded = true; });
    const dismissedHandle = await AdMob.addListener(RewardAdPluginEvents.Dismissed,  () => {
      _cleanup();
      if (rewarded) {
        watchedThisSession++;
        const s = loadState(); s.watchedToday++; s.lastAdTimestamp = Date.now(); saveState(s);
      }
      resolve(rewarded);
    });
    const failedHandle    = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => { _cleanup(); resolve(false); });

    function _cleanup() { loadedHandle.remove(); rewardedHandle.remove(); dismissedHandle.remove(); failedHandle.remove(); }

    try {
      await AdMob.prepareRewardVideoAd({ adId, isTesting: testMode });
    } catch {
      // Simulación en navegador (dev)
      _cleanup();
      setTimeout(() => {
        watchedThisSession++;
        const s = loadState(); s.watchedToday++; s.lastAdTimestamp = Date.now(); saveState(s);
        resolve(true);
      }, 1000);
    }
  });
}
