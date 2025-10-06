
package com.lorenzoconte.Exizt

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import android.util.Log
import com.lorenzoconte.Exizt.appblock.AppBlocker

class BlockModule(private val reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BlockModule"

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    @ReactMethod
    fun checkAccessibilityPermission(mode: String, promise: Promise) {
        AppBlocker.checkAccessibilityPermission(reactContext, mode, promise)
    }

    @ReactMethod
    fun openAccessibilitySettings(mode: String) {
        AppBlocker.openAccessibilitySettings(reactContext, mode)
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        AppBlocker.setBlockedApps(reactContext, apps, promise)
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        AppBlocker.getBlockedApps(reactContext, promise)
    }

    @ReactMethod
    fun setBlockingActive(active: Boolean, promise: Promise) {
        AppBlocker.setBlockingActive(reactContext, active, promise)
    }

    @ReactMethod
    fun getFocusMode(promise: Promise) {
        AppBlocker.getFocusMode(reactContext, promise)
    }

    @ReactMethod
    fun setFocusMode(active: Boolean, promise: Promise) {
        android.util.Log.d("BlockModule", "setFocusMode called with active = $active")
        AppBlocker.setFocusMode(reactContext, active, promise)
    }

    @ReactMethod
    fun getInstalledApplications(promise: Promise) {
        AppBlocker.getInstalledApplications(reactContext, promise)
    }
}