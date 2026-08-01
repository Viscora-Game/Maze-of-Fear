package com.mazeoffear.game

import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val activity: MainActivity) {

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun showInterstitialAd() {
        activity.runOnUiThread {
            activity.showInterstitialAd()
        }
    }

    @JavascriptInterface
    fun showRewardedAd() {
        activity.runOnUiThread {
            activity.showRewardedAd()
        }
    }

    @JavascriptInterface
    fun showBannerAd() {
        activity.runOnUiThread {
            activity.showBannerAd()
        }
    }

    @JavascriptInterface
    fun hideBannerAd() {
        activity.runOnUiThread {
            activity.hideBannerAd()
        }
    }
}
