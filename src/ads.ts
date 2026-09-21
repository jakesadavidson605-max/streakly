// ============================================================
// ADS — centralized ad unit configuration.
// ============================================================
// PLACEHOLDER TEST IDs — swap for real AdMob IDs before monetizing.
//
// USE_REAL_ADS = false  -> the app only ever requests Google's official
// sample/test ad units, so no real impressions or revenue are generated.
// When you have real AdMob IDs: set USE_REAL_ADS = true and replace the
// values below with your own IDs (and the android_app_id in app.config.ts).
// ============================================================

export const USE_REAL_ADS = false;

export const AD_IDS = {
  /** Google sample AdMob app id (Android). */
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  /** Google sample adaptive banner unit (Android). */
  banner: 'ca-app-pub-3940256099942544/9214589741',
} as const;
