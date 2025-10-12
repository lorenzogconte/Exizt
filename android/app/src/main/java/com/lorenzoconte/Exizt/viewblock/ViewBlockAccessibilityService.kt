package com.lorenzoconte.Exizt.viewblock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import android.os.SystemClock
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.accessibilityservice.AccessibilityServiceInfo
import com.lorenzoconte.Exizt.WarningActivity

class ViewBlockAccessibilityService : AccessibilityService() {

    private val viewBlocker = ViewBlocker()

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        Log.d("ViewBlockerService", "onAccessibilityEvent called")
        if (event == null) {
            Log.d("ViewBlockerService", "Event is null, returning")
            return
        }
        val rootNode = rootInActiveWindow
        if (rootNode == null) {
            Log.d("ViewBlockerService", "rootInActiveWindow is null, returning")
            return
        }
        val packageName = event.packageName?.toString()
        if (packageName == null) {
            Log.d("ViewBlockerService", "packageName is null, returning")
            return
        }

        Log.d("ViewBlockerService", "Received event for package: $packageName, eventType: ${event.eventType}")

    // Check if current view should be blocked
    val result = viewBlocker.doesViewNeedToBeBlocked(rootNode, packageName, this)
        if (result?.isBlocked == true) {
            Log.d("ViewBlockerService", "Blocking content for $packageName, viewId: ${result.viewId}")
            performGlobalAction(GLOBAL_ACTION_HOME)
            val intent = Intent(this, WarningActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            intent.putExtra("packageName", packageName)
            startActivity(intent)
        } else {
            Log.d("ViewBlockerService", "No block needed for $packageName")
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d("ViewBlockerService", "onServiceConnected called")
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
            packageNames = arrayOf(
                "com.google.android.youtube",
                "com.instagram.android",
                "com.ss.android.ugc.trill",
                "com.zhiliaoapp.musically",
                "com.ss.android.ugc.aweme"
            )
        }
        this.serviceInfo = info
        Log.d("ViewBlockerService", "Accessibility Service configured and connected")
    }

    override fun onInterrupt() {
        Log.d("ViewBlockerService", "Service interrupted")
    }
}
