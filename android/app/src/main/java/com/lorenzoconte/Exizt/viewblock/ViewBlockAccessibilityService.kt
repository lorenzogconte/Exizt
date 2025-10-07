package com.lorenzoconte.Exizt.viewblock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import android.os.SystemClock
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.accessibilityservice.AccessibilityServiceInfo
import com.lorenzoconte.Exizt.WarningActivity

class ViewBlockerService : AccessibilityService() {

    private val viewBlocker = ViewBlocker()

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val rootNode = rootInActiveWindow ?: return
        val packageName = event?.packageName?.toString() ?: return

        // Check if current view should be blocked
        val result = viewBlocker.doesViewNeedToBeBlocked(rootNode, packageName)
        if (result?.isBlocked == true) {
            Log.d("ViewBlockerService", "Blocking content for $packageName")
            performGlobalAction(GLOBAL_ACTION_HOME) // instantly take the user home
        }
    }

    override fun onInterrupt() {}
}
