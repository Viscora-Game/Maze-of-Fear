/**
 * AdMob JavaScript Bridge for Maze of Fear (Native Android)
 * Enables seamless triggers for Interstitial Ads, Rewarded Ads, and Banner Ads
 */
export const AdMob = {
  isAvailable() {
    return typeof window !== "undefined" && window.AndroidBridge !== undefined;
  },

  showInterstitial() {
    if (this.isAvailable() && typeof window.AndroidBridge.showInterstitial === "function") {
      try {
        window.AndroidBridge.showInterstitial();
      } catch (e) {
        console.warn("AdMob Interstitial invocation failed:", e);
      }
    } else {
      console.log("AdMob (Test/Browser Mode): Interstitial requested.");
    }
  },

  showRewarded(onRewardCallback) {
    if (this.isAvailable() && typeof window.AndroidBridge.showRewarded === "function") {
      window._admobRewardSuccess = onRewardCallback;
      try {
        window.AndroidBridge.showRewarded();
      } catch (e) {
        console.warn("AdMob Rewarded invocation failed:", e);
      }
    } else {
      console.log("AdMob (Test/Browser Mode): Rewarded ad requested. Granting test reward.");
      if (typeof onRewardCallback === "function") {
        onRewardCallback();
      }
    }
  },

  showBanner() {
    if (this.isAvailable() && typeof window.AndroidBridge.showBanner === "function") {
      try {
        window.AndroidBridge.showBanner();
      } catch (e) {
        console.warn("AdMob Banner invocation failed:", e);
      }
    }
  },

  hideBanner() {
    if (this.isAvailable() && typeof window.AndroidBridge.hideBanner === "function") {
      try {
        window.AndroidBridge.hideBanner();
      } catch (e) {
        console.warn("AdMob Hide Banner invocation failed:", e);
      }
    }
  }
};

// Global JS reward callback triggered by Native Android WebAppInterface
window.onAdMobRewardGranted = function() {
  if (typeof window._admobRewardSuccess === "function") {
    window._admobRewardSuccess();
    window._admobRewardSuccess = null;
  }
};
