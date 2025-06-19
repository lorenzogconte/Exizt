package com.lorenzoconte.Exizt

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

class ScreenTimeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenTimeStats"

    @ReactMethod
    fun getTodaysScreenTime(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val startOfToday = Calendar.getInstance().apply {
                    timeZone = TimeZone.getDefault()
                    set(Calendar.HOUR_OF_DAY, 0)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis

                val currentTime = System.currentTimeMillis()
                val usageStatsManager = reactContext.getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
                val packageManager = reactContext.packageManager
                // Get launcher apps
                val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                val launcherApps = packageManager.queryIntentActivities(launcherIntent, 0)
                    .map { it.activityInfo.packageName }
                    .toSet()

                val stats = usageStatsManager.queryUsageStats(
                    INTERVAL_DAILY,
                    startOfToday,
                    currentTime
                )

                val today = Calendar.getInstance()
                val todayYear = today.get(Calendar.YEAR)
                val todayDayOfYear = today.get(Calendar.DAY_OF_YEAR)

                val totalTimeInMillis = stats
                    .filter { stat ->
                        // Exclude launcher apps
                        !launcherApps.contains(stat.packageName) &&
                                // Filter for today's stats
                                Calendar.getInstance().apply {
                                    timeInMillis = stat.firstTimeStamp
                                }.let { statCalendar ->
                                    val statYear = statCalendar.get(Calendar.YEAR)
                                    val statDayOfYear = statCalendar.get(Calendar.DAY_OF_YEAR)
                                    statYear == todayYear && statDayOfYear == todayDayOfYear
                                }
                    }
                    .sumOf { it.totalTimeInForeground }

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
                // Resolve on the main thread
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
                // Calculate start of week (last 7 days)
                val startOfWeek = Calendar.getInstance().apply {
                    timeZone = TimeZone.getDefault()
                    add(Calendar.DAY_OF_YEAR, -7)
                }.timeInMillis

                val currentTime = System.currentTimeMillis()
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
    fun getMonthlyScreenTime(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Calculate start of month (last 30 days)
                val startOfMonth = Calendar.getInstance().apply {
                    timeZone = TimeZone.getDefault()
                    add(Calendar.DAY_OF_YEAR, -30)
                }.timeInMillis

                val currentTime = System.currentTimeMillis()
                val usageStatsManager = reactContext.getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
                val packageManager = reactContext.packageManager

                // Get launcher apps
                val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                val launcherApps = packageManager.queryIntentActivities(launcherIntent, 0)
                    .map { it.activityInfo.packageName }
                    .toSet()

                val stats = usageStatsManager.queryUsageStats(
                    INTERVAL_MONTHLY,
                    startOfMonth,
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