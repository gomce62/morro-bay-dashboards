package com.morrobay.indieskayak;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {

    private static final String TARGET_URL =
            "https://gomce62.github.io/morro-bay-dashboards/Indies%20Kayak%20Forecast/";

    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        tts = new TextToSpeech(this, this);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#020617"));
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new AndroidTTSBridge(), "AndroidTTS");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    showOfflineFallback();
                }
            }
        });

        setContentView(webView);
        hideSystemUI();
        webView.loadUrl(TARGET_URL);
    }

    private void showOfflineFallback() {
        String html = "<!DOCTYPE html><html><body style='margin:0;background:#020617;color:#f8fafc;"
                + "font-family:sans-serif;display:flex;flex-direction:column;align-items:center;"
                + "justify-content:center;height:100vh;text-align:center;padding:24px;'>"
                + "<h1 style='color:#2dd4bf;margin-bottom:8px;'>Indie's Kayak Forecast</h1>"
                + "<p style='color:#94a3b8;max-width:460px;margin-bottom:24px;'>"
                + "Waiting for internet connection to load live Morro Bay tides, weather, and webcams.</p>"
                + "<button autofocus onclick=\"location.href='" + TARGET_URL + "'\" "
                + "style='background:#14b8a6;color:#020617;border:none;padding:14px 28px;"
                + "border-radius:12px;font-size:18px;font-weight:700;cursor:pointer;'>Retry Connection</button>"
                + "</body></html>";
        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int res = tts.setLanguage(Locale.US);
            ttsReady = (res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    runOnUiThread(() -> webView.evaluateJavascript(
                            "window.__onAndroidTTSStart && window.__onAndroidTTSStart();", null));
                }

                @Override
                public void onDone(String utteranceId) {
                    runOnUiThread(() -> webView.evaluateJavascript(
                            "window.__onAndroidTTSEnd && window.__onAndroidTTSEnd();", null));
                }

                @Override
                public void onError(String utteranceId) {
                    runOnUiThread(() -> webView.evaluateJavascript(
                            "window.__onAndroidTTSError && window.__onAndroidTTSError();", null));
                }
            });
        }
    }

    public class AndroidTTSBridge {
        @JavascriptInterface
        public void speak(String text, float rate, float pitch) {
            if (!ttsReady || tts == null || text == null || text.isEmpty()) {
                runOnUiThread(() -> webView.evaluateJavascript(
                        "window.__onAndroidTTSError && window.__onAndroidTTSError();", null));
                return;
            }
            tts.setSpeechRate(Math.max(0.5f, Math.min(2.0f, rate)));
            tts.setPitch(Math.max(0.5f, Math.min(2.0f, pitch)));
            Bundle params = new Bundle();
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "indie_forecast");
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                tts.stop();
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Let JS close Indie's modal if open; otherwise navigate back or exit
            webView.evaluateJavascript(
                    "(function(){var m=document.getElementById('indie-modal');"
                            + "if(m&&!m.classList.contains('hidden')){closeIndieBriefing();return 'closed';}"
                            + "return 'none';})();",
                    value -> {
                        if (!"\"closed\"".equals(value)) {
                            if (webView.canGoBack()) {
                                webView.goBack();
                            } else {
                                finish();
                            }
                        }
                    }
            );
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
