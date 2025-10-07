package com.lorenzoconte.Exizt.viewblock

import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import java.util.*
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import android.util.Log
import com.lorenzoconte.Exizt.utils.SavedPreferencesLoader

class ViewBlocker {

    companion object {
        val BLOCKED_VIEW_IDS = listOf(
            "com.instagram.android:id/root_clips_layout", // Instagram Reels
            "com.google.android.youtube:id/reel_recycler", // YouTube Shorts
            "app.revanced.android.youtube:id/reel_recycler",
        )

        val TIKTOK_PACKAGES = setOf(
            "com.ss.android.ugc.trill",
            "com.zhiliaoapp.musically",
            "com.ss.android.ugc.aweme"
        )

        fun findElementById(node: AccessibilityNodeInfo?, id: String?): AccessibilityNodeInfo? {
            return try {
                node?.findAccessibilityNodeInfosByViewId(id!!)?.firstOrNull()
            } catch (e: Exception) {
                null
            }
        }
    }

    fun doesViewNeedToBeBlocked(
        rootNode: AccessibilityNodeInfo,
        packageName: String,
        context: Context
    ): ViewBlockerResult? {
        val prefsLoader = SavedPreferencesLoader(context)
        var isViewBlockerEnabled = prefsLoader.getViewBlockerEnabled()
        Log.d("ViewBlocker", "doesViewNeedToBeBlocked called. isViewBlockerEnabled: $isViewBlockerEnabled, packageName: $packageName")
        if (!isViewBlockerEnabled) {
            Log.d("ViewBlocker", "View blocker is disabled, not blocking anything.")
            return null
        }
        if (TIKTOK_PACKAGES.contains(packageName)) {
            Log.d("ViewBlocker", "Blocking TikTok package: $packageName")
            return ViewBlockerResult(isBlocked = true, viewId = packageName)
        }
        for (viewId in BLOCKED_VIEW_IDS) {
            Log.d("ViewBlocker", "Checking viewId: $viewId")
            val found = findElementById(rootNode, viewId)
            if (found != null) {
                Log.d("ViewBlocker", "Blocking viewId: $viewId for package: $packageName")
                return ViewBlockerResult(isBlocked = true, viewId = viewId)
            }
        }
        Log.d("ViewBlocker", "No views blocked for package: $packageName")
        return null
    }

    data class ViewBlockerResult(
        val isBlocked: Boolean = false,
        val viewId: String = ""
    )

    fun setViewBlockerEnabled(reactContext: ReactApplicationContext, enabled: Boolean, promise: Promise) {
        val prefs = reactContext.getSharedPreferences("view_blocker_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("isViewBlockerEnabled", enabled).apply()
        var isViewBlockerEnabled = enabled
        Log.d("ViewBlocker", "setViewBlockerEnabled called with value $isViewBlockerEnabled")
        promise.resolve(true)
    }

    // Get the value from SharedPreferences
    fun getViewBlockerEnabled(reactContext: ReactApplicationContext, promise: Promise) {
        val prefs = reactContext.getSharedPreferences("view_blocker_prefs", Context.MODE_PRIVATE)
        val isViewBlockerEnabled = prefs.getBoolean("isViewBlockerEnabled", false)
        Log.d("ViewBlocker", "getViewBlockerEnabled called, returning: $isViewBlockerEnabled")
        promise.resolve(isViewBlockerEnabled)
    }
}