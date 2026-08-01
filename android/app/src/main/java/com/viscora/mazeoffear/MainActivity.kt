package com.viscora.mazeoffear

import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var adContainer: FrameLayout
    private var adView: AdView? = null
    
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null
    
    private val TAG = "MazeOfFear_AdMob"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Setup Fullscreen Layout
        val rootLayout = FrameLayout(this)
        
        webView = WebView(this)
        rootLayout.addView(webView, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        
        adContainer = FrameLayout(this)
        val bannerParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = android.view.Gravity.BOTTOM
        }
        rootLayout.addView(adContainer, bannerParams)
        
        setContentView(rootLayout)

        // Initialize AdMob SDK
        MobileAds.initialize(this) { initializationStatus ->
            Log.d(TAG, "AdMob SDK Initialized: $initializationStatus")
            loadInterstitialAd()
            loadRewardedAd()
        }

        // Configure WebView settings for 60 FPS WebGL
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        
        webView.setInitialScale(1)
        webView.settings.loadWithOverviewMode = true
        webView.settings.useWideViewPort = true

        // Register Javascript Interface Bridge
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Game loaded successfully in Native Android WebView.")
            }
        }

        // Load local game assets (or web URL)
        webView.loadUrl("file:///android_asset/index.html")
    }

    fun loadInterstitialAd() {
        val adUnitId = getString(R.string.admob_interstitial_ad_unit_id)
        val adRequest = AdRequest.Builder().build()

        InterstitialAd.load(this, adUnitId, adRequest, object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) {
                interstitialAd = ad
                Log.d(TAG, "AdMob Interstitial Ad Loaded.")
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                interstitialAd = null
                Log.w(TAG, "AdMob Interstitial Ad Failed to Load: ${error.message}")
            }
        })
    }

    fun showInterstitialAd() {
        if (interstitialAd != null) {
            interstitialAd?.show(this)
            loadInterstitialAd() // Pre-load next interstitial
        } else {
            Log.d(TAG, "Interstitial ad not ready yet. Reloading...")
            loadInterstitialAd()
        }
    }

    fun loadRewardedAd() {
        val adUnitId = getString(R.string.admob_rewarded_ad_unit_id)
        val adRequest = AdRequest.Builder().build()

        RewardedAd.load(this, adUnitId, adRequest, object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
                Log.d(TAG, "AdMob Rewarded Ad Loaded.")
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                rewardedAd = null
                Log.w(TAG, "AdMob Rewarded Ad Failed to Load: ${error.message}")
            }
        })
    }

    fun showRewardedAd() {
        if (rewardedAd != null) {
            rewardedAd?.show(this) { rewardItem ->
                Log.d(TAG, "User earned reward: ${rewardItem.amount} ${rewardItem.type}")
                webView.post {
                    webView.evaluateJavascript("if(window.onAdMobRewardGranted) window.onAdMobRewardGranted();", null)
                }
            }
            loadRewardedAd() // Pre-load next rewarded ad
        } else {
            Log.d(TAG, "Rewarded ad not ready yet. Reloading...")
            loadRewardedAd()
        }
    }

    fun showBannerAd() {
        if (adView == null) {
            adView = AdView(this).apply {
                setAdSize(AdSize.BANNER)
                adUnitId = getString(R.string.admob_banner_ad_unit_id)
            }
            adContainer.addView(adView)
            val adRequest = AdRequest.Builder().build()
            adView?.loadAd(adRequest)
        }
        adContainer.visibility = View.VISIBLE
    }

    fun hideBannerAd() {
        adContainer.visibility = View.GONE
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
