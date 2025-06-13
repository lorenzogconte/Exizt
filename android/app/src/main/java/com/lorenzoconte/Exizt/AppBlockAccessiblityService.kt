package com.lorenzoconte.Exizt

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppBlockAccessibilityService : AccessibilityService() {
    companion object {
        private const val TAG = "AppBlockService"
        private var reactContext: ReactApplicationContext? = null

        fun setReactContext(context: ReactApplicationContext) {
            reactContext = context
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            event.packageName?.toString()?.let { packageName ->
                // Check if this package should be blocked
                if (shouldBlockApp(packageName)) {
                    Log.d(TAG, "Blocking app: $packageName")
                    
                    // Send event to React Native
                    sendBlockedAppEvent(packageName)
                    
                    // Go back to home screen
                    val startMain = Intent(Intent.ACTION_MAIN)
                    startMain.addCategory(Intent.CATEGORY_HOME)
                    startMain.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(startMain)
                    
                    // Open our block screen
                    val blockIntent = Intent(this, MainActivity::class.java)
                    blockIntent.putExtra("blocked_app", packageName)
                    blockIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(blockIntent)
                }
            }
        }
    }

    private fun shouldBlockApp(packageName: String): Boolean {
        // Don't block our own app
        if (packageName == packageName) {
            return false
        }
        
        // Don't block system UI
        if (packageName == "com.android.systemui") {
            return false
        }
        
        // Check if it's in the blocked list and if blocking is active
        val prefs = getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
        val blockingActive = prefs.getBoolean("blockingActive", false)
        val focusModeActive = prefs.getBoolean("focusModeActive", false)
        
        if (!blockingActive && !focusModeActive) {
            return false
        }
        
        // Get the set of blocked apps
        val blockedAppsString = prefs.getString("blockedApps", "")
        val blockedApps = blockedAppsString?.split(",") ?: emptyList()
        
        return blockedApps.any { it.trim() == packageName }
    }

    private fun sendBlockedAppEvent(packageName: String) {
        reactContext?.let { context ->
            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
            }
            
            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onAppBlocked", params)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility Service interrupted")
    }

    override fun onServiceConnected() {
        Log.d(TAG, "Accessibility Service connected")
    }
}