package com.lorenzoconte.Exizt.utils

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.lorenzoconte.Exizt.appblock.AppBlocker
import com.lorenzoconte.Exizt.MainActivity
import com.lorenzoconte.Exizt.WarningActivity

class SavedPreferencesLoader(private val context: Context) {

    fun loadBlockedApps(): Set<String> {
        val sharedPreferences =
            context.getSharedPreferences("app_preferences", Context.MODE_PRIVATE)
        return sharedPreferences.getStringSet("blocked_apps", emptySet()) ?: emptySet()
    }

    fun saveBlockedApps(pinnedApps: Set<String>) {
        val sharedPreferences =
            context.getSharedPreferences("app_preferences", Context.MODE_PRIVATE)
        sharedPreferences.edit().putStringSet("blocked_apps", pinnedApps).apply()
    }

    fun saveAppBlockerWarningInfo(warningData: WarningActivity.WarningData) {
        val sharedPreferences = context.getSharedPreferences("warning_data", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        val gson = Gson()

        val json = gson.toJson(warningData)

        editor.putString("app_blocker", json)
        editor.apply()
    }

    fun loadAppBlockerWarningInfo(): WarningActivity.WarningData {
        val sharedPreferences = context.getSharedPreferences("warning_data", Context.MODE_PRIVATE)
        val gson = Gson()

        val json = sharedPreferences.getString("app_blocker", null)

        if (json.isNullOrEmpty()) return WarningActivity.WarningData()

        val type = object : TypeToken<WarningActivity.WarningData>() {}.type
        return gson.fromJson<WarningActivity.WarningData>(json, type)
    }

    fun saveFocusModeData(focusModeData: AppBlocker.FocusModeData) {
        val sharedPreferences =
            context.getSharedPreferences("focus_mode", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        val gson = Gson()

        val json = gson.toJson(focusModeData)

        editor.putString("focus_mode", json)
        editor.apply()
    }


    fun getFocusModeData(): AppBlocker.FocusModeData {
        val sharedPreferences =
            context.getSharedPreferences("focus_mode", Context.MODE_PRIVATE)
        val gson = Gson()

        val json = sharedPreferences.getString("focus_mode", null)

        if (json.isNullOrEmpty()) return AppBlocker.FocusModeData()

        val type = object : TypeToken<AppBlocker.FocusModeData>() {}.type
        return gson.fromJson<AppBlocker.FocusModeData>(json, type)
    }

    fun saveFocusModeSelectedApps(appList: List<String>) {
        val sharedPreferences =
            context.getSharedPreferences("focus_mode", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        val gson = Gson()

        val json = gson.toJson(appList)

        editor.putString("selected_apps", json)
        editor.apply()
    }

    fun getFocusModeSelectedApps(): List<String> {
        val sharedPreferences =
            context.getSharedPreferences("focus_mode", Context.MODE_PRIVATE)
        val gson = Gson()

        val json = sharedPreferences.getString("selected_apps", null)

        if (json.isNullOrEmpty()) return listOf()

        val type =
            object : TypeToken<List<String>>() {}.type
        return gson.fromJson(json, type)
    }

    fun getViewBlockerEnabled(): Boolean {
        val sharedPreferences =
            context.getSharedPreferences("view_blocker_prefs", Context.MODE_PRIVATE)
        return sharedPreferences.getBoolean("isViewBlockerEnabled", false)
    }
     
}