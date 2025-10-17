package com.lorenzoconte.Exizt.appblock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.util.Log
import org.json.JSONArray
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.accessibilityservice.AccessibilityServiceInfo
import com.lorenzoconte.Exizt.WarningActivity

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
            Thread.sleep(50)
            val dialogIntent = Intent(this, WarningActivity::class.java)
            dialogIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            dialogIntent.putExtra("packageName", packageName)
            Log.d(TAG, "Starting WarningActivity")
            startActivity(dialogIntent)
        }
    }

    private fun shouldBlockApp(packageName: String): Boolean {
        // Don't block our own app
        if (packageName == "com.lorenzoconte.Exizt" || packageName == "com.miui.home" || packageName == "com.android.systemui") {
            return false
        }

        Log.d(TAG, "Checking if app should be blocked: $packageName")
        // Check if it's in the blocked list and if blocking is active
        val prefs = getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
        val focusModeActive = prefs.getBoolean("focusModeActive", false)
        Log.d("focusModeActive", focusModeActive.toString())
        val groupsJson = prefs.getString("appGroups", "[]")
        val groupsArr = JSONArray(groupsJson)
        var shouldBlockForGroup = false
        for (i in 0 until groupsArr.length()) {
            val groupObj = groupsArr.getJSONObject(i)
            Log.d(TAG, "Checking group: ${groupObj.getString("name")}")
            val appsArr = groupObj.getJSONArray("apps")
            val timeLimit = groupObj.getInt("timeLimit")
            val appList = mutableListOf<String>()
            for (j in 0 until appsArr.length()) {
                appList.add(appsArr.getString(j))
            }
            if (appList.contains(packageName)) {
                Log.d(TAG, "App $packageName found in group")
                if (AppBlocker().isAppGroupLimitExceeded(this, appList, timeLimit)) {
                    return true
                }
            }
        }
        return false;
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