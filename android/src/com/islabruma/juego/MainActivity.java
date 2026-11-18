package com.islabruma.juego;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import java.io.File;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Contenedor Android del juego: un WebView a pantalla completa que carga www/ desde assets. */
public class MainActivity extends Activity {
    private WebView web;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private long downloadId = -1;
    private boolean installPending = false;
    private static final String APK_MIME = "application/vnd.android.package-archive";
    private final NetHub hub = new NetHub();
    private Object multicastLock = null;

    // permite recibir los paquetes de difusión del descubrimiento de partidas
    private void lockMulticast(boolean on) {
        try {
            if (on && multicastLock == null) {
                android.net.wifi.WifiManager wm = (android.net.wifi.WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                android.net.wifi.WifiManager.MulticastLock l = wm.createMulticastLock("thebruma");
                l.setReferenceCounted(false);
                l.acquire();
                multicastLock = l;
            } else if (!on && multicastLock != null) {
                ((android.net.wifi.WifiManager.MulticastLock) multicastLock).release();
                multicastLock = null;
            }
        } catch (Exception ignored) { }
    }

    @Override
    protected void onDestroy() {
        hub.stop();
        lockMulticast(false);
        super.onDestroy();
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                // LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES = 1 (usar también la zona del notch)
                WindowManager.LayoutParams.class.getField("layoutInDisplayCutoutMode").setInt(lp, 1);
                getWindow().setAttributes(lp);
            } catch (Exception ignored) {
            }
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(14, 20, 32));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);
        hideSystemUi();
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    private void hideSystemUi() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.onAndroidBack && window.onAndroidBack()) ? 'yes' : 'no'",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String v) {
                        if (v == null || !v.contains("yes")) moveTaskToBack(true);
                    }
                });
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.game && window.game.save && window.game.save()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        hideSystemUi();
        // volvió de los ajustes de "instalar apps desconocidas": continuar la instalación
        if (installPending && canInstall()) {
            installPending = false;
            installDownloaded();
        }
    }

    // ------------------------------------------------------------------ actualizador
    private void js(final String code) {
        handler.post(new Runnable() {
            @Override
            public void run() {
                web.evaluateJavascript(code, null);
            }
        });
    }

    private boolean canInstall() {
        if (Build.VERSION.SDK_INT < 26) return true;
        try {
            Object pm = getPackageManager();
            return (Boolean) pm.getClass().getMethod("canRequestPackageInstalls").invoke(pm);
        } catch (Exception e) {
            return true;
        }
    }

    private void startDownload(String url, String version) {
        try {
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            String name = "TheBruma-" + version.replaceAll("[^A-Za-z0-9._-]", "") + ".apk";
            File old = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), name);
            if (old.exists()) old.delete();
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.setTitle("TheBruma " + version);
            req.setDescription("Descargando actualización");
            req.setMimeType(APK_MIME);
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            req.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, name);
            downloadId = dm.enqueue(req);
            pollDownload();
        } catch (Exception e) {
            js("window.onUpdateError && window.onUpdateError('" + e.getClass().getSimpleName() + "')");
            openInBrowser(url);
        }
    }

    private void pollDownload() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                Cursor c = dm.query(new DownloadManager.Query().setFilterById(downloadId));
                if (c == null || !c.moveToFirst()) {
                    if (c != null) c.close();
                    js("window.onUpdateError && window.onUpdateError('cancelada')");
                    return;
                }
                int status = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_STATUS));
                long done = c.getLong(c.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                long total = c.getLong(c.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                c.close();
                if (status == DownloadManager.STATUS_SUCCESSFUL) {
                    js("window.onUpdateProgress && window.onUpdateProgress(100, 'listo')");
                    if (canInstall()) installDownloaded();
                    else {
                        installPending = true;
                        js("window.onUpdateProgress && window.onUpdateProgress(100, 'permiso')");
                        try {
                            Intent i = new Intent("android.settings.MANAGE_UNKNOWN_APP_SOURCES", Uri.parse("package:" + getPackageName()));
                            startActivity(i);
                        } catch (Exception e) {
                            installDownloaded();
                        }
                    }
                } else if (status == DownloadManager.STATUS_FAILED) {
                    js("window.onUpdateError && window.onUpdateError('descarga')");
                } else {
                    int pct = total > 0 ? (int) (done * 100 / total) : 0;
                    js("window.onUpdateProgress && window.onUpdateProgress(" + pct + ", 'bajando')");
                    pollDownload();
                }
            }
        }, 400);
    }

    private void installDownloaded() {
        try {
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            Uri uri;
            if (Build.VERSION.SDK_INT >= 24) {
                uri = dm.getUriForDownloadedFile(downloadId);
            } else {
                Cursor c = dm.query(new DownloadManager.Query().setFilterById(downloadId));
                c.moveToFirst();
                uri = Uri.parse(c.getString(c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI)));
                c.close();
            }
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, APK_MIME);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) {
            js("window.onUpdateError && window.onUpdateError('instalar')");
        }
    }

    private void openInBrowser(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** Puente JS -> Android (window.AndroidBridge). */
    public class Bridge {
        @JavascriptInterface
        public int getVersionCode() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pi.versionCode;
            } catch (Exception e) {
                return 0;
            }
        }

        @JavascriptInterface
        public String getVersionName() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public void downloadUpdate(final String url, final String version) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startDownload(url, version);
                }
            });
        }

        // ---------------- actualizador: consulta nativa (evita bloqueos del WebView)
        @JavascriptInterface
        public void checkUpdate() {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    String body = null, err = "";
                    try {
                        java.net.HttpURLConnection c = (java.net.HttpURLConnection) new java.net.URL("https://api.github.com/repos/ventisca-gif/2.5-D/releases/latest").openConnection();
                        c.setRequestProperty("User-Agent", "TheBruma-App");
                        c.setRequestProperty("Accept", "application/vnd.github+json");
                        c.setConnectTimeout(10000);
                        c.setReadTimeout(15000);
                        int code = c.getResponseCode();
                        if (code == 200) {
                            java.io.InputStream in = c.getInputStream();
                            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
                            in.close();
                            body = new String(bo.toByteArray(), "UTF-8");
                        } else err = "HTTP " + code;
                    } catch (Exception e) {
                        err = e.getClass().getSimpleName() + ": " + e.getMessage();
                    }
                    js("window.onUpdateJson && window.onUpdateJson(" + (body == null ? "null" : org.json.JSONObject.quote(body)) + "," + org.json.JSONObject.quote(err) + ")");
                }
            }).start();
        }

        // ---------------- multijugador local
        @JavascriptInterface
        public String startHub(String name) {
            if (!hub.start(name)) return "[]";
            lockMulticast(true);
            return NetHub.localIps();
        }

        @JavascriptInterface
        public void stopHub() {
            hub.stop();
            lockMulticast(false);
        }

        @JavascriptInterface
        public String localIps() {
            return NetHub.localIps();
        }

        @JavascriptInterface
        public void discover() {
            lockMulticast(true);
            new Thread(new Runnable() {
                @Override
                public void run() {
                    final String found = NetHub.discover();
                    js("window.onHostsFound && window.onHostsFound(" + found + ")");
                }
            }).start();
        }

        @JavascriptInterface
        public void openUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    openInBrowser(url);
                }
            });
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }
}
