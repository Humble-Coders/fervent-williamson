package com.cutq.store;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {

    private ConnectivityManager connectivityManager;
    private SwipeRefreshLayout swipeRefreshLayout;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Setup edge-to-edge display with proper insets
        setupEdgeToEdge();

        // Initialize connectivity manager
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        // Setup network callback
        setupNetworkCallback();

        // Setup WebView client for error handling
        getBridge().getWebView().post(() -> {
            setupWebViewClient();
        });
    }

    /**
     * Setup edge-to-edge display with proper system bar handling
     */
    private void setupEdgeToEdge() {
        // Make app draw behind system bars but respect their space
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ (API 30+)
            getWindow().setDecorFitsSystemWindows(false);

            // Set status bar and navigation bar appearance
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Light status bar (dark icons)
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );
                // Light navigation bar (dark icons)
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        } else {
            // Android 10 and below
            View decorView = getWindow().getDecorView();
            int flags = decorView.getSystemUiVisibility();
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            decorView.setSystemUiVisibility(flags);
        }

        // Apply window insets to the bridge view
        getBridge().getWebView().post(() -> {
            View bridgeView = findViewById(android.R.id.content);
            if (bridgeView != null) {
                ViewCompat.setOnApplyWindowInsetsListener(bridgeView, (v, insets) -> {
                    // Get system bars insets
                    androidx.core.graphics.Insets systemBars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars()
                    );

                    // Apply padding to avoid content being hidden behind system bars
                    v.setPadding(
                        systemBars.left,
                        systemBars.top,
                        systemBars.right,
                        systemBars.bottom
                    );

                    return insets;
                });
            }
        });
    }

    /**
     * Handle back button press to navigate within WebView history
     */
    @Override
    public void onBackPressed() {
        Bridge bridge = this.bridge;
        if (bridge != null) {
            WebView webView = bridge.getWebView();

            // Check if WebView can go back
            if (webView != null && webView.canGoBack()) {
                webView.goBack();  // Navigate back in WebView history
            } else {
                super.onBackPressed();  // Exit app or go to previous activity
            }
        } else {
            super.onBackPressed();
        }
    }

    /**
     * Setup network callback to monitor connectivity changes
     */
    private void setupNetworkCallback() {
        ConnectivityManager.NetworkCallback networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                // Don't show toast when internet connects - it's annoying
                // The web layer will handle reconnection automatically
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "No Internet Connection", Toast.LENGTH_LONG).show();
                });
            }
        };

        connectivityManager.registerDefaultNetworkCallback(networkCallback);
    }

    /**
     * Setup WebView client for error handling
     */
    private void setupWebViewClient() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    if (!isNetworkAvailable()) {
                        // Network error will be handled by the Capacitor Network plugin in the web layer
                        Toast.makeText(MainActivity.this, "Network error: " + description, Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
    }

    /**
     * Check if network is available
     */
    private boolean isNetworkAvailable() {
        Network network = connectivityManager.getActiveNetwork();
        if (network == null) return false;

        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        return capabilities != null &&
               (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
    }
}
