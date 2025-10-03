package com.lorenzoconte.Exizt

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.util.Log
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import java.io.ByteArrayOutputStream
import android.os.SystemClock
import android.net.Uri
import android.widget.Toast
import android.os.PowerManager

object AppBlocker {
    var blockedAppsList = hashSetOf("")

    const val TAG = "AppBlocker"

    data class FocusModeData(
        var isTurnedOn: Boolean = false,
        val endTime: Long = -1,
        var selectedApps: HashSet<String> = hashSetOf()
    )

    // Singleton instance to hold current focus mode state
    var focusModeData: FocusModeData = FocusModeData()

    data class AppBlockerResult(
        val isBlocked: Boolean
    )

    fun doesAppNeedToBeBlocked(packageName: String): AppBlockerResult {
        Log.d(TAG, "blockedAppsList: $blockedAppsList")
        return AppBlockerResult(isBlocked = blockedAppsList.contains(packageName))
    }

    fun isAppInFocus(packageName: String): AppBlockerResult {
        Log.d(TAG, "focusSelectedApps: ${focusModeData.selectedApps}")
        return AppBlockerResult(isBlocked = focusModeData.selectedApps.contains(packageName))
    }

    fun checkAccessibilityPermission(reactContext: ReactApplicationContext, mode: String, promise: Promise) {
        try {
            var enabled: Boolean = false
            if (mode != "normal" && mode != "blocking" && mode != "battery") {
                promise.reject("ERROR", "Invalid mode: $mode")
                return
            }
            if (mode == "normal") {
                enabled = isAccessibilityServiceEnabled(reactContext)
            } else if (mode == "blocking") {
                enabled = Settings.canDrawOverlays(reactContext)
            } else if (mode == "battery") {
                val packageName = reactContext.packageName
                val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                enabled = powerManager.isIgnoringBatteryOptimizations(packageName)
                Log.d(TAG, "Battery optimization disabled: $enabled")
            }
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun openAccessibilitySettings(reactContext: ReactApplicationContext, mode: String) {
        if (mode != "normal" && mode != "blocking" && mode != "battery") return
        if (mode == "normal") {
            Toast.makeText(reactContext, "Grant accessibility settings to enable the app to work.", Toast.LENGTH_SHORT).show()
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
        }
        if (mode == "blocking") {
            Toast.makeText(reactContext, "Grant overlay permission to enable the app to block other apps.", Toast.LENGTH_SHORT).show()
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.packageName))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        }
        if (mode == "battery") {
            Toast.makeText(reactContext, "Grant battery optimization settings to enable the app to work properly.", Toast.LENGTH_SHORT).show()
            val intent = Intent()
            intent.action = Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        }  
    }

    fun setBlockedApps(reactContext: ReactApplicationContext, apps: ReadableArray, promise: Promise) {
        try {
            Log.d(TAG, "setBlockedApps called with apps: $apps")
            val appsString = StringBuilder()
            for (i in 0 until apps.size()) {
                appsString.append(apps.getString(i))
                if (i < apps.size() - 1) {
                    appsString.append(",")
                }
            }
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putString("blockedApps", appsString.toString())
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun getBlockedApps(reactContext: ReactApplicationContext, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val blockedAppsString = prefs.getString("blockedApps", "")
            promise.resolve(blockedAppsString)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun setBlockingActive(reactContext: ReactApplicationContext, active: Boolean, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putBoolean("blockingActive", active)
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun getFocusMode(reactContext: ReactApplicationContext, promise: Promise) {
        try {
            Log.d(TAG, "getFocusMode called and")
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val focusModeActive = prefs.getBoolean("focusModeActive", false)
            Log.d(TAG, "getFocusMode called and focusModeActive = $focusModeActive")
            promise.resolve(focusModeActive)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    fun setFocusMode(reactContext: ReactApplicationContext, active: Boolean, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putBoolean("focusModeActive", active)
            android.util.Log.d(TAG, "setFocusMode called with active = $active")
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun isAccessibilityServiceEnabled(reactContext: ReactApplicationContext): Boolean {
        val service = "${reactContext.packageName}/${AppBlockAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        return enabledServices != null && enabledServices.contains(service)
    }

    fun getInstalledApplications(reactContext: ReactApplicationContext, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val packageManager = reactContext.packageManager
                val result = WritableNativeArray()
                val mainIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                }
                val launchableApps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.queryIntentActivities(mainIntent, PackageManager.ResolveInfoFlags.of(0L))
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.queryIntentActivities(mainIntent, 0)
                }
                val seenPackages = HashSet<String>()
                val appsToSort = mutableListOf<Map<String, Any>>()
                for (resolveInfo in launchableApps) {
                    val appInfo = resolveInfo.activityInfo.applicationInfo
                    val packageName = appInfo.packageName
                    if (packageName == reactContext.packageName) {
                        continue
                    }
                    if (seenPackages.contains(packageName)) {
                        continue
                    }
                    seenPackages.add(packageName)
                    val appName = packageManager.getApplicationLabel(appInfo).toString()
                    var iconBase64 = ""
                    try {
                        val icon = packageManager.getApplicationIcon(appInfo)
                        val bitmap = drawableToBitmap(icon)
                        iconBase64 = bitmapToBase64(bitmap)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error getting icon for $packageName: ${e.message}")
                    }
                    appsToSort.add(mapOf(
                        "packageName" to packageName,
                        "appName" to appName,
                        "iconBase64" to iconBase64
                    ))
                }
                Log.d("AppBlockModule", "INSTALLED APPLICATIONS: ${result.toString()}")
                appsToSort.sortBy { (it["appName"] as String).lowercase() }
                for (app in appsToSort) {
                    val appMap = WritableNativeMap()
                    appMap.putString("packageName", app["packageName"] as String)
                    appMap.putString("appName", app["appName"] as String)
                    appMap.putString("iconBase64", app["iconBase64"] as String)
                    result.pushMap(appMap)
                }
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("ERROR", e.message, e)
                }
            }
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable) {
            return drawable.bitmap
        }
        val bitmap = if (drawable.intrinsicWidth <= 0 || drawable.intrinsicHeight <= 0) {
            Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        } else {
            Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
        }
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return android.util.Base64.encodeToString(byteArray, android.util.Base64.DEFAULT)
    }
}