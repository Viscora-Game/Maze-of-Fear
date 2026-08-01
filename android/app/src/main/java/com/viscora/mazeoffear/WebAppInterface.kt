package com.viscora.mazeoffear

import android.webkit.JavascriptInterface

class WebAppInterface(private val activity: MainActivity) {

    @JavascriptInterface
    fun showInterstitial() {
        activity.runOnUiThread {
            activity.showInterstitialAd()
        }
    }

    @JavascriptInterface
    fun showRewarded() {
        activity.runOnUiThread {
            activity.showRewardedAd()
        }
    }

    @JavascriptInterface
    fun showBanner() {
        activity.runOnUiThread {
            activity.showBannerAd()
        }
    }

    @JavascriptInterface
    fun hideBanner() {
        activity.runOnUiThread {
            activity.hideBannerAd()
        }
    }
}
