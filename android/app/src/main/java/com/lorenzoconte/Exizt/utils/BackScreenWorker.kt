package com.lorenzoconte.Exizt.utils

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit  // Keep only one import for TimeUnit
import android.app.usage.UsageStatsManager
import android.content.Context.USAGE_STATS_SERVICE
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat

class ScreenTimeUploadWorker(context: Context, params: WorkerParameters) : 
    CoroutineWorker(context, params) {

    companion object {
        private const val API_URL = "http://172.20.10.2:8000"
        // Schedule daily screen time upload at midnight
        fun scheduleDaily(context: Context) {
            // Calculate time until midnight
            val calendar = Calendar.getInstance()
            val now = calendar.timeInMillis

            val targetHour = 23
            val targetMinute = 59
            calendar.apply {
                set(Calendar.HOUR_OF_DAY, targetHour)
                set(Calendar.MINUTE, targetMinute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)

                if (timeInMillis <= now) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }
            val midnight = calendar.timeInMillis
            val initialDelay = midnight - now

            val uploadWorkRequest = OneTimeWorkRequestBuilder<ScreenTimeUploadWorker>()
                .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(
                    "screen_time_upload",
                    ExistingWorkPolicy.REPLACE,
                    uploadWorkRequest
                )
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // Get today's screen time
            val startOfDay = Calendar.getInstance().apply {
                timeZone = TimeZone.getDefault()
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis

            val endOfDay = Calendar.getInstance().apply {
                timeZone = TimeZone.getDefault()
                set(Calendar.HOUR_OF_DAY, 23)
                set(Calendar.MINUTE, 59)
                set(Calendar.SECOND, 59)
                set(Calendar.MILLISECOND, 999)
            }.timeInMillis

            val usageStatsManager = applicationContext.getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Get launcher apps to exclude
            val launcherIntent = android.content.Intent(android.content.Intent.ACTION_MAIN)
                .addCategory(android.content.Intent.CATEGORY_HOME)
            val launcherApps = applicationContext.packageManager.queryIntentActivities(launcherIntent, 0)
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
                    !stat.packageName.contains("launcher", ignoreCase = true) &&
                    !stat.packageName.contains("quicksearchbox", ignoreCase = true) &&
                    !stat.packageName.contains("permissioncontroller", ignoreCase = true) &&
                    !stat.packageName.contains("inputmethod", ignoreCase = true) &&
                    stat.totalTimeInForeground > 0
                }
                .sumOf { it.totalTimeInForeground }

            // Get auth token from shared preferences
            val sharedPrefs = applicationContext.getSharedPreferences("ExiztPrefs", Context.MODE_PRIVATE)
            val token = sharedPrefs.getString("authToken", null)
            
            if (token == null) {
                // Reschedule for tomorrow and return failure
                scheduleDaily(applicationContext)
                return@withContext Result.failure()
            }

            // Upload to backend
            val client = OkHttpClient()
            val json = JSONObject().apply {
                put("total_screen_time_ms", totalTimeInMillis)
                put("date", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()))
            }

            val requestBody = json.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$API_URL/screentime/upload/")
                .post(requestBody)
                .header("Authorization", "Token $token")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    // Log error but still schedule for tomorrow
                    android.util.Log.e("ScreenTimeUpload", "Failed to upload: ${response.code}")
                    scheduleDaily(applicationContext)
                    return@withContext Result.failure()
                }
            }

            // Schedule next day's upload
            scheduleDaily(applicationContext)
            return@withContext Result.success()
        } catch (e: Exception) {
            android.util.Log.e("ScreenTimeUpload", "Error in upload worker: ${e.message}")
            // Schedule again for tomorrow even if there was an error
            scheduleDaily(applicationContext)
            return@withContext Result.failure()
        }
    }
}