package com.lorenzoconte.Exizt

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.accessibilityservice.AccessibilityServiceInfo

class AppBlockAccessibilityService : AccessibilityService() {
    companion object {
        private const val TAG = "AppBlockService"
        private var reactContext: ReactApplicationContext? = null

        fun setReactContext(context: ReactApplicationContext) {
            reactContext = context
        }
    }

    fun pressHome() {
        performGlobalAction(GLOBAL_ACTION_HOME)
    }

    fun pressBack() {
        performGlobalAction(GLOBAL_ACTION_BACK)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val eventType = event?.eventType
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }
        val packageName = event?.packageName.toString()
        Log.d(TAG, "Switched to app $packageName")
        val blocked = shouldBlockApp(packageName)
        Log.d("blocked", blocked.toString())
        if (shouldBlockApp(packageName)) {
            Log.d(TAG, "Blocking app: $packageName")
            pressHome()
            Thread.sleep(300)
            val dialogIntent = Intent(this, WarningActivity::class.java)
            dialogIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            dialogIntent.putExtra("packageName", packageName)
            startActivity(dialogIntent)
        }
    }

    private fun shouldBlockApp(packageName: String): Boolean {
        // Don't block our own app
        if (packageName == "com.lorenzoconte.Exizt") {
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
        Log.d("focusModeActive", focusModeActive.toString())
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
        super.onServiceConnected()
        val info = AccessibilityServiceInfo()
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                         AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                         AccessibilityEvent.TYPE_VIEW_SCROLLED
        
        this.setServiceInfo(info)
    }

}