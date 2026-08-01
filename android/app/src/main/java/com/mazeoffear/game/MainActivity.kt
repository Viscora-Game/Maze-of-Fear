package com.mazeoffear.game

import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
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
        
        // Strict Landscape Orientation Enforcement (SDK 36 compliant)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        
        // Display Cutout / Notch Edge-to-Edge Fill for SDK 35/36
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        
        // Setup Fullscreen Layout FIRST
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

        // Enable Immersive Sticky Fullscreen AFTER setContentView (100% crash-proof)
        hideSystemUI()

        // Modern Predictive Back Gesture Callback (SDK 34/35/36 compatible)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

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
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = true
        
        webView.setInitialScale(1)
        webView.settings.loadWithOverviewMode = true
        webView.settings.useWideViewPort = true

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d("MazeOfFear_JS", "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                return true
            }
        }

        // Register Javascript Interface Bridge
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "Game loaded successfully in Native Android WebView.")
            }
        }

        // Load local game assets
        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        try {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
            windowInsetsController.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            windowInsetsController.hide(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
        } catch (e: Exception) {
            Log.w(TAG, "Error applying hideSystemUI: ${e.message}")
        }
    }

    override fun onPause() {
        super.onPause()
        if (::webView.isInitialized) {
            webView.onPause()
            webView.pauseTimers()
            webView.evaluateJavascript("if(window.game && window.game.audio && typeof window.game.audio.suspendAudio === 'function') window.game.audio.suspendAudio();", null)
        }
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
            webView.resumeTimers()
            webView.evaluateJavascript("if(window.game && window.game.audio && typeof window.game.audio.resumeAudio === 'function') window.game.audio.resumeAudio();", null)
        }
        hideSystemUI()
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
}
