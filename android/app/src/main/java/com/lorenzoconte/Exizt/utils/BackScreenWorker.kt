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
        // Use HTTP for local development to avoid TLS errors
        private const val API_URL = "https://serverexizt.fly.dev"

        fun scheduleDailyUpload(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val initialDelay = calculateInitialDelay()
            val uploadWorkRequest = PeriodicWorkRequestBuilder<ScreenTimeUploadWorker>(1, TimeUnit.DAYS)
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
            // Calculate yesterday's date
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -1)
            val year = cal.get(Calendar.YEAR)
            val month = cal.get(Calendar.MONTH) + 1 // Calendar.MONTH is 0-based
            val day = cal.get(Calendar.DAY_OF_MONTH)
            // Use ScreenTimeModule to get yesterday's screen time
            val (totalTimeInMillis, _) = ScreenTimeModule.getDailyScreenTimeInternal(applicationContext, year, month, day)

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
            val screenTimeMinutes = Math.round(totalTimeInMillis / 1000.0 / 60.0).toInt()
            android.util.Log.i("ScreenTimeUpload", "Total screen time minutes: $screenTimeMinutes")
            val json = JSONObject().apply {
                put("screen_time_minutes", screenTimeMinutes)
                put("date", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time))
            }

            val requestBody = json.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$API_URL/competitions/screen-time/update/")
                .post(requestBody)
                .header("Authorization", "Token $token")
                .build()

            client.newCall(request).execute().use { response ->
                val responseBody = response.body?.string()
                android.util.Log.i("ScreenTimeUpload", "Response: $responseBody")
                if (!response.isSuccessful) {
                    return@withContext Result.failure()
                }
            }
            return@withContext Result.success()
        } catch (e: Exception) {
            android.util.Log.e("ScreenTimeUpload", "Error in upload worker: ${e.message}")
            return@withContext Result.failure()
        }
    }
}