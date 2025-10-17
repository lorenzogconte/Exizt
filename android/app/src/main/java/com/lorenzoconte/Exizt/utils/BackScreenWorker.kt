package com.lorenzoconte.Exizt.utils

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit  // Keep only one import for TimeUnit
import com.lorenzoconte.Exizt.screentime.ScreenTimeModule
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
        private const val API_URL = "https://serverexizt.fly.dev"

        fun scheduleDailyUpload(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val initialDelay = TimeUnit.MINUTES.toMillis(10)
            val uploadWorkRequest = PeriodicWorkRequestBuilder<ScreenTimeUploadWorker>(2, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "screen_time_upload",
                ExistingPeriodicWorkPolicy.UPDATE,
                uploadWorkRequest
            )
        }

        // Calculate delay until next midnight
        fun calculateInitialDelay(): Long {
            val now = Calendar.getInstance()
            val nextMidnight = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            return nextMidnight.timeInMillis - now.timeInMillis
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {

        try {
            android.util.Log.i("ScreenTimeUpload", "Starting screen time upload...")
            // Use ScreenTimeModule to get daily screen time
            val (totalTimeInMillis, _) = ScreenTimeModule.getDailyScreenTimeInternal(applicationContext)

            // ...existing code for auth token and upload...
            val sharedPrefs = applicationContext.getSharedPreferences("ExiztPrefs", Context.MODE_PRIVATE)
            val token = sharedPrefs.getString("authToken", null)

            if (token == null) {
                // No token, fail
                android.util.Log.e("ScreenTimeUpload", "No auth token found, upload aborted.")
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
                .url("$API_URL/screentime/update/")
                .post(requestBody)
                .header("Authorization", "Token $token")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    android.util.Log.e("ScreenTimeUpload", "Failed to upload: ${response.code}")
                    return@withContext Result.failure()
                }
            }

            android.util.Log.i("ScreenTimeUpload", "Screen time upload successful.")
            return@withContext Result.success()
        } catch (e: Exception) {
            android.util.Log.e("ScreenTimeUpload", "Error in upload worker: ${e.message}")
            return@withContext Result.failure()
        }
    }
}