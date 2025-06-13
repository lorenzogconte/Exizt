package com.lorenzoconte.Exizt

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.util.Log
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

class AppBlockModule(private val reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {
    
    private val TAG = "AppBlockModule"
    
    // Move eventEmitter inside the class
    private val eventEmitter by lazy { 
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java) 
    }

    init {
        AppBlockAccessibilityService.setReactContext(reactContext)
    }

    // Add these methods inside the class
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in EventEmitter
        // No implementation needed
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in EventEmitter
        // No implementation needed
    }

    override fun getName(): String = "AppBlockModule"

    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        try {
            val enabled = isAccessibilityServiceEnabled()
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        try {
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

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val blockedAppsString = prefs.getString("blockedApps", "")
            promise.resolve(blockedAppsString)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setBlockingActive(active: Boolean, promise: Promise) {
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

    @ReactMethod
    fun setFocusModeActive(active: Boolean, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("AppBlockPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putBoolean("focusModeActive", active)
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val service = "${reactContext.packageName}/${AppBlockAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        
        return enabledServices != null && enabledServices.contains(service)
    }

    // Add this new method to your existing AppBlockModule class

    @ReactMethod
    fun getInstalledApplications(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val packageManager = reactContext.packageManager
                val installedPackages = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
                
                val result = WritableNativeArray()
                
                Log.d("AppBlockModule", "Found ${installedPackages.size} installed applications")
                var filtered = 0
                for (appInfo in installedPackages) {
                    val packageName = appInfo.packageName
                    val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    
                    // Get the app name first to check if it should be filtered
                    val appName = try {
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (e: Exception) {
                        packageName
                    }

                    if (appName == packageName ||
                        packageName == reactContext.packageName ||
                        (packageName.startsWith("com.android.") && 
                        !packageName.equals("com.android.providers.settings") && 
                        !packageName.equals("com.android.phone") &&
                        !packageName.equals("com.android.chrome") &&
                        !packageName.equals("com.android.providers.contacts") && 
                        !packageName.equals("com.android.providers.settings") && 
                        !packageName.equals("com.android.providers.calendar")) ||
                        (packageName.startsWith("com.google.android.") && 
                        !packageName.startsWith("com.google.android.apps.") && 
                        !packageName.equals("com.google.android.documentsui"))) {
                        filtered++
                        continue
                    }
                    // App passed all filters, add it to results
                    val appMap = WritableNativeMap()
                    appMap.putString("packageName", packageName)
                    appMap.putString("appName", appName)
                    appMap.putBoolean("isSystemApp", isSystemApp)
                    
                    // Get the app icon as base64
                    try {
                        val icon = packageManager.getApplicationIcon(packageName)
                        val bitmap = drawableToBitmap(icon)
                        val iconBase64 = bitmapToBase64(bitmap)
                        appMap.putString("iconBase64", iconBase64)
                    } catch (e: Exception) {
                        Log.e("AppBlockModule", "Error getting icon for $packageName: ${e.message}")
                        // No icon provided if there's an error
                    }
                    
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

    // Helper function to convert Drawable to Bitmap
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

    // Helper function to convert Bitmap to Base64
    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        // Compress to a smaller size to improve performance
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return android.util.Base64.encodeToString(byteArray, android.util.Base64.DEFAULT)
    }

}