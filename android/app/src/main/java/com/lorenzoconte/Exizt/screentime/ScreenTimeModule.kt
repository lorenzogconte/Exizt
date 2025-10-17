package com.lorenzoconte.Exizt.screentime

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.app.usage.UsageStatsManager.INTERVAL_DAILY
import android.app.usage.UsageStatsManager.INTERVAL_WEEKLY
import android.app.usage.UsageStatsManager.INTERVAL_MONTHLY
import android.content.Context.USAGE_STATS_SERVICE
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import java.util.*
import android.util.Log

class ScreenTimeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        /**
         * Returns total screen time in milliseconds and app usage map for a given day (or today if nulls).
         */
        fun getDailyScreenTimeInternal(context: Context, year: Int? = null, month: Int? = null, day: Int? = null): Pair<Double, WritableNativeMap> {
            val calendar = Calendar.getInstance().apply {
                timeZone = TimeZone.getDefault()
                if (year != null && month != null && day != null) {
                    set(Calendar.YEAR, year)
                    set(Calendar.MONTH, month - 1)
                    set(Calendar.DAY_OF_MONTH, day)
                }
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val startOfDay = calendar.timeInMillis

            val endOfDay = if (year == null || month == null || day == null) {
                System.currentTimeMillis()
            } else {
                Calendar.getInstance().apply {
                    timeZone = TimeZone.getDefault()
                    set(Calendar.YEAR, year)
                    set(Calendar.MONTH, month - 1)
                    set(Calendar.DAY_OF_MONTH, day)
                    set(Calendar.HOUR_OF_DAY, 23)
                    set(Calendar.MINUTE, 59)
                    set(Calendar.SECOND, 59)
                    set(Calendar.MILLISECOND, 999)
                }.timeInMillis
            }

            val usageStatsManager = context.getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
            val packageManager = context.packageManager
            val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
            val launcherApps = packageManager.queryIntentActivities(launcherIntent, 0)
                .map { it.activityInfo.packageName }
                .toSet()

            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startOfDay,
                endOfDay
            )

            val totalTimeInMillis = stats
                .filter { stat ->
                    !launcherApps.contains(stat.packageName) &&
                    !stat.packageName.startsWith("com.android.systemui") &&
                    stat.lastTimeUsed >= startOfDay && stat.firstTimeStamp <= endOfDay
                }
                .sumOf { stat ->
                    val usageStart = maxOf(stat.firstTimeStamp, startOfDay)
                    val usageEnd = minOf(stat.lastTimeUsed, endOfDay)
                    val duration = usageEnd - usageStart
                    if (duration > 0 && duration < stat.totalTimeInForeground) duration else stat.totalTimeInForeground
                }

            val appUsageMap = WritableNativeMap()
            stats.filter { stat ->
                !launcherApps.contains(stat.packageName) &&
                !stat.packageName.startsWith("com.android.systemui") &&
                stat.lastTimeUsed >= startOfDay && stat.firstTimeStamp <= endOfDay
            }.forEach { stat ->
                val appMap = WritableNativeMap()
                appMap.putDouble("totalTimeInForeground", stat.totalTimeInForeground.toDouble())
                appMap.putDouble("lastTimeUsed", stat.lastTimeUsed.toDouble())
                // Get app label and icon as Base64 using AppBlocker utility functions
                try {
                    val appInfo = packageManager.getApplicationInfo(stat.packageName, 0)
                    val appLabel = packageManager.getApplicationLabel(appInfo).toString()
                    Log.d("ScreenTimeModule", "Fetched label for ${stat.packageName}: $appLabel")
                    appMap.putString("appLabel", appLabel)
                    val drawable = packageManager.getApplicationIcon(appInfo)
                    val bitmap = com.lorenzoconte.Exizt.appblock.AppBlocker.drawableToBitmap(drawable)
                    val iconBase64 = com.lorenzoconte.Exizt.appblock.AppBlocker.bitmapToBase64(bitmap)
                    appMap.putString("iconBase64", iconBase64)
                } catch (e: Exception) {
                    appMap.putString("iconBase64", "")
                    appMap.putString("appLabel", stat.packageName)
                }
                appUsageMap.putMap(stat.packageName, appMap)
            }
            return Pair(totalTimeInMillis.toDouble(), appUsageMap)
        }
    }

    override fun getName(): String = "ScreenTimeStats"

    /**
     * Retrieves the screen time for a specific day, or today if no date is provided.
     * If year, month, day are null, defaults to today.
     * @param year Optional year (Int or null)
     * @param month Optional month (1-based, January=1) (Int or null)
     * @param day Optional day of month (Int or null)
     * @param promise React Native promise
     */
    @ReactMethod
    fun getDailyScreenTime(year: Int?, month: Int?, day: Int?, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val (totalTimeInMillis, appUsageMap) = getDailyScreenTimeInternal(reactContext, year, month, day)
                val result = WritableNativeMap()
                result.putDouble("totalScreenTimeMs", totalTimeInMillis)
                result.putMap("appUsage", appUsageMap)
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SCREEN_TIME_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun getWeeklyScreenTime(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Calculate start of week (Monday of current week)
                val startOfWeek = Calendar.getInstance().apply {
                    timeZone = TimeZone.getDefault()
                    set(Calendar.HOUR_OF_DAY, 0)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                    set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
                }.timeInMillis

                val currentTime = System.currentTimeMillis()
                Log.d("ScreenTimeModule", "Current time: $currentTime")
                Log.d("ScreenTimeModule", "Start of week: $startOfWeek")
                val usageStatsManager = reactContext.getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
                val packageManager = reactContext.packageManager

                // Get launcher apps to exclude them
                val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                val launcherApps = packageManager.queryIntentActivities(launcherIntent, 0)
                    .map { it.activityInfo.packageName }
                    .toSet()

                val stats = usageStatsManager.queryUsageStats(
                    INTERVAL_WEEKLY,
                    startOfWeek,
                    currentTime
                )

                val totalTimeInMillis = stats
                    .filter { stat ->
                        // Exclude launcher apps and system UI
                        !launcherApps.contains(stat.packageName) &&
                        !stat.packageName.startsWith("com.android.systemui")
                    }
                    .sumOf { it.totalTimeInForeground }

                // Create app usage data map
                val appUsageMap = WritableNativeMap()
                stats.filter { !launcherApps.contains(it.packageName) }
                    .forEach { stat ->
                    val appMap = WritableNativeMap()
                        appMap.putDouble("totalTimeInForeground", stat.totalTimeInForeground.toDouble())
                        appMap.putDouble("lastTimeUsed", stat.lastTimeUsed.toDouble())
                        appUsageMap.putMap(stat.packageName, appMap)
                }

                // Create result object
                val result = WritableNativeMap()
                result.putDouble("totalScreenTimeMs", totalTimeInMillis.toDouble())
                result.putMap("appUsage", appUsageMap)

                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SCREEN_TIME_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun formatTimeSpent(timeInMillis: Double, promise: Promise) {
        val hours = (timeInMillis / (1000 * 60 * 60)).toInt()
        val minutes = ((timeInMillis / (1000 * 60)) % 60).toInt()
        
        val formattedTime = when {
            hours > 0 -> "${hours}h ${minutes}m"
            minutes > 0 -> "${minutes}m"
            else -> "${(timeInMillis / 1000).toInt()}s"
        }
        
        promise.resolve(formattedTime)
    }
}