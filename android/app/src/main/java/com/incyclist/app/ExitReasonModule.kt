package com.incyclist.app

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.module.annotations.ReactModule

/**
 * ExitReasonModule - reports why earlier processes of this app ended.
 *
 * A process that is killed (low memory, the system's resource limits, a force stop, an ANR,
 * a native crash) cannot log anything about it itself, so the app only sees a session that
 * stops. Android keeps a short history of the reasons per package (API 30+), which this module
 * hands to JS at startup so they can be logged.
 *
 * Read-only: no permission is needed to query the app's own exit history.
 *
 * Deliberately a plain ReactContextBaseJavaModule, read from JS as NativeModules.ExitReason
 * like ExitModule and MapAvailability. A JS-only hot update can reach a binary built before
 * this module existed; JS treats its absence as "no answer".
 *
 * Only records newer than the last one already handed out are returned, and at most
 * [MAX_RECORDS] per call. The newest timestamp seen is persisted when the records are read, so
 * each record is reported once, even if the app is killed again before JS has logged it.
 * Nothing is returned on Android 10 and older, which do not have the API.
 */
@ReactModule(name = ExitReasonModule.NAME)
class ExitReasonModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun getNewExitReasons(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                promise.resolve(Arguments.createArray())
                return
            }
            promise.resolve(readNewRecords())
        } catch (t: Throwable) {
            promise.reject(ERROR_CODE, t.message ?: "unknown", t)
        }
    }

    private fun readNewRecords(): WritableArray {
        val result = Arguments.createArray()
        val context = reactApplicationContext

        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            ?: return result

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastSeen = prefs.getLong(KEY_LAST_TIMESTAMP, 0L)

        // newest first
        val records = activityManager.getHistoricalProcessExitReasons(null, 0, MAX_RECORDS)
        val fresh = records.filter { it.timestamp > lastSeen }.take(MAX_RECORDS)
        if (fresh.isEmpty())
            return result

        // persisted before handing over: a record must never be reported twice
        prefs.edit().putLong(KEY_LAST_TIMESTAMP, fresh.maxOf { it.timestamp }).apply()

        // oldest first, so the logged events follow the order in which the processes ended
        fresh.reversed().forEach { info ->
            val map = Arguments.createMap()
            map.putString("reason", reasonName(info.reason))
            map.putString("importance", importanceName(info.importance))
            map.putDouble("rssKb", info.rss.toDouble())
            map.putDouble("pssKb", info.pss.toDouble())
            map.putDouble("timestamp", info.timestamp.toDouble())
            map.putString("description", truncate(info.description))
            result.pushMap(map)
        }
        return result
    }

    private fun truncate(text: String?): String =
        if (text == null) "" else if (text.length > MAX_DESCRIPTION) text.substring(0, MAX_DESCRIPTION) else text

    companion object {
        const val NAME = "ExitReason"
        private const val ERROR_CODE = "exit-reason-failed"
        private const val PREFS_NAME = "exit_reason_logging"
        private const val KEY_LAST_TIMESTAMP = "last_exit_timestamp"
        private const val MAX_RECORDS = 5
        private const val MAX_DESCRIPTION = 200

        /** Values of ApplicationExitInfo.REASON_*; unknown (newer) values keep their number. */
        fun reasonName(reason: Int): String = when (reason) {
            0 -> "UNKNOWN"
            1 -> "EXIT_SELF"
            2 -> "SIGNALED"
            3 -> "LOW_MEMORY"
            4 -> "CRASH"
            5 -> "CRASH_NATIVE"
            6 -> "ANR"
            7 -> "INITIALIZATION_FAILURE"
            8 -> "PERMISSION_CHANGE"
            9 -> "EXCESSIVE_RESOURCE_USAGE"
            10 -> "USER_REQUESTED"
            11 -> "USER_STOPPED"
            12 -> "DEPENDENCY_DIED"
            13 -> "OTHER"
            14 -> "FREEZER"
            15 -> "PACKAGE_STATE_CHANGE"
            16 -> "PACKAGE_UPDATED"
            else -> "REASON_$reason"
        }

        /** Values of ActivityManager.RunningAppProcessInfo.IMPORTANCE_*. */
        fun importanceName(importance: Int): String = when (importance) {
            100 -> "FOREGROUND"
            125 -> "FOREGROUND_SERVICE"
            150 -> "TOP_SLEEPING"
            200 -> "VISIBLE"
            230 -> "PERCEPTIBLE"
            270 -> "CANT_SAVE_STATE"
            300 -> "SERVICE"
            400 -> "CACHED"
            1000 -> "GONE"
            else -> "IMPORTANCE_$importance"
        }
    }
}
