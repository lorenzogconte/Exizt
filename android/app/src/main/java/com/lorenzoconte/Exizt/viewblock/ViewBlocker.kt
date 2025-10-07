package com.exizt.utils

import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import java.util.*

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
        packageName: String
    ): ViewBlockerResult? {

        // For TikTok (always block)
        if (TIKTOK_PACKAGES.contains(packageName)) {
            return ViewBlockerResult(isBlocked = true, viewId = packageName)
        }

        // For Instagram & YouTube
        for (viewId in BLOCKED_VIEW_IDS) {
            val found = findElementById(rootNode, viewId)
            if (found != null) {
                return ViewBlockerResult(isBlocked = true, viewId = viewId)
            }
        }
        return null
    }

    data class ViewBlockerResult(
        val isBlocked: Boolean = false,
        val viewId: String = ""
    )
}
