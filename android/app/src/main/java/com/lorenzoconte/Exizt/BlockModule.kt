
package com.lorenzoconte.Exizt

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import android.util.Log
import com.lorenzoconte.Exizt.appblock.AppBlocker
import com.lorenzoconte.Exizt.viewblock.ViewBlocker

class BlockModule(private val reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BlockModule"

    private val viewBlocker = ViewBlocker()
    private val appBlocker = AppBlocker()

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    @ReactMethod
    fun checkAccessibilityPermission(mode: String, promise: Promise) {
        appBlocker.checkAccessibilityPermission(reactContext, mode, promise)
    }

    @ReactMethod
    fun openAccessibilitySettings(mode: String) {
        appBlocker.openAccessibilitySettings(reactContext, mode)
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        appBlocker.setBlockedApps(reactContext, apps, promise)
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        appBlocker.getBlockedApps(reactContext, promise)
    }

    @ReactMethod
    fun setBlockingActive(active: Boolean, promise: Promise) {
        appBlocker.setBlockingActive(reactContext, active, promise)
    }

    @ReactMethod
    fun getFocusMode(promise: Promise) {
        appBlocker.getFocusMode(reactContext, promise)
    }

    @ReactMethod
    fun setFocusMode(active: Boolean, promise: Promise) {
        Log.d("BlockModule", "setFocusMode called with active = $active")
        appBlocker.setFocusMode(reactContext, active, promise)
    }

    @ReactMethod
    fun getInstalledApplications(promise: Promise) {
        appBlocker.getInstalledApplications(reactContext, promise)
    }

    @ReactMethod
    fun getViewBlocker(promise: Promise) {
        viewBlocker.getViewBlockerEnabled(reactContext, promise)
        promise.resolve(true)
    }
    
    @ReactMethod
    fun setViewBlocker(enabled: Boolean, promise: Promise) {
        viewBlocker.setViewBlockerEnabled(reactContext, enabled, promise)
    }

    @ReactMethod
    fun getAppGroups(promise: Promise) {
        appBlocker.getAppGroups(reactContext, promise)
    }

    @ReactMethod
    fun saveAppGroup(name: String, apps: ReadableArray, timeLimit: Int, promise: Promise) {
        appBlocker.saveAppGroup(reactContext, name, apps, timeLimit, promise)
    }

}