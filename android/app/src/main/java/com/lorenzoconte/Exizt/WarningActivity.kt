package com.lorenzoconte.Exizt

import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.lorenzoconte.Exizt.AppBlockAccessibilityService
import com.lorenzoconte.Exizt.SavedPreferencesLoader
import android.util.Log

class WarningActivity : AppCompatActivity() {

    data class WarningData(
        val title: String = "Blocked",
        val message: String = "Access to this app is blocked",
        val packageName: String? = null,
        val blockType: String? = null,
        val blockDuration: Int? = null
    )

    private var proceedTimer: CountDownTimer? = null
    companion object {
        private const val TAG = "WarningActivity"
    }
    private var dialog: AlertDialog? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        Log.d(TAG, "onCreate called")
        super.onCreate(savedInstanceState)
        val savedPreferencesLoader = SavedPreferencesLoader(this)

        // Use WarningData default values
        val warningData = WarningData()

        // Build dialog UI
        dialog = AlertDialog.Builder(this)
            .setTitle(warningData.title)
            .setMessage(warningData.message)
            .setCancelable(false)
            .setNegativeButton("Cancel") { _, _ ->
                finish()
            }
            .create()

        dialog?.show()
    }

    private fun launchPackage(pkg: String) {
        try {
            val launch = packageManager.getLaunchIntentForPackage(pkg)
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(launch)
            } else {
                Log.w(TAG, "No launch intent for $pkg")
            }
        } catch (t: Throwable) {
            Log.e(TAG, "Failed relaunch", t)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        proceedTimer?.onFinish()
        dialog?.dismiss()
    }

    private fun sendRefreshRequest(id: String, action: String, time: Int) {
        val intent = Intent(action)
        intent.putExtra("result_id", id)
        intent.putExtra("selected_time", time * 60_000)
        sendBroadcast(intent)
    }
}