package com.incyclist.app

import android.content.Context
import android.content.pm.PackageManager
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.OnMapsSdkInitializedCallback

/**
 * MapsAvailability — the single Maps-SDK health check for everything in this app that renders
 * Google map data.
 *
 * StreetViewManager and SatelliteViewManager each carried their own byte-identical copy of this
 * (MapsInitializer bootstrap, connection-result naming, manifest API-key state, Play Services
 * version). They are the same dependency measured the same way, so they now share one
 * implementation — which also makes the answer reportable to JS through MapAvailabilityModule,
 * so the ride-view options can be gated before a rider ever selects a view that cannot work,
 * instead of only failing afterwards.
 *
 * Everything here is process-global and cached, matching MapsInitializer's own semantics: it
 * only takes effect on its first call, so the result and the renderer it actually selected are
 * what every later caller has to work with anyway.
 */
object MapsAvailability {

    /** sentinel for "MapsInitializer.initialize threw", which has no ConnectionResult */
    const val INIT_THREW = -1

    private const val PLAY_SERVICES_PACKAGE = "com.google.android.gms"
    private const val API_KEY_META_DATA = "com.google.android.geo.API_KEY"

    /**
     * Renderer used for the Maps SDK. LATEST is the SDK default and is what the builds under
     * investigation for the Street View black screen have been running; LEGACY is the fallback
     * to try if diagnostics ever show the pipeline stalling with LATEST. Process-global and
     * applied on first use, so this cannot be switched at runtime — changing it needs a new
     * build.
     */
    private val RENDERER_PREFERENCE = MapsInitializer.Renderer.LATEST

    @Volatile
    private var initResult: Int? = null

    @Volatile
    private var initError: String? = null

    @Volatile
    private var activeRenderer: String? = null

    /**
     * Idempotent. Safe to call from a view manager creating its first view, or from
     * MapAvailabilityModule answering an availability query before any view exists — whichever
     * happens first performs the real initialisation and every later call reads the cache.
     */
    fun initialize(context: Context) {
        if (initResult != null)
            return

        try {
            initResult = MapsInitializer.initialize(
                context.applicationContext,
                RENDERER_PREFERENCE,
                OnMapsSdkInitializedCallback { renderer -> activeRenderer = renderer.name }
            )
        } catch (t: Throwable) {
            initError = t.message
            initResult = INIT_THREW
        }
    }

    fun initResult(): Int? = initResult

    fun renderer(): String? = activeRenderer

    /**
     * Whether the Maps SDK reported itself usable on this device. `false` before initialize()
     * has run: nothing is assumed about a check that has not been made.
     */
    fun isUsable(): Boolean = initResult == ConnectionResult.SUCCESS

    fun initResultName(): String = connectionResultName(initResult)

    fun connectionResultName(result: Int?): String = when (result) {
        null -> "not-initialised"
        ConnectionResult.SUCCESS -> "success"
        ConnectionResult.SERVICE_MISSING -> "service-missing"
        ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED -> "update-required"
        ConnectionResult.SERVICE_DISABLED -> "service-disabled"
        ConnectionResult.SERVICE_INVALID -> "service-invalid"
        INIT_THREW -> "threw: ${initError ?: "unknown"}"
        else -> "code-$result"
    }

    /**
     * Whether the manifest carries a Maps API key at all — reported as present/missing, never
     * the value itself. Released builds shipped `android:value=""` for months: the key was
     * absent from CI and the build substituted an empty string, producing a build that
     * initialises cleanly and then has every request rejected. Release builds now fail instead
     * (see android/app/build.gradle), so this is a diagnostic for debug/dev builds rather than
     * a device-capability signal.
     */
    fun apiKeyState(context: Context): String {
        return try {
            @Suppress("DEPRECATION")
            val info = context.packageManager.getApplicationInfo(
                context.packageName,
                PackageManager.GET_META_DATA,
            )
            val key = info.metaData?.getString(API_KEY_META_DATA)
            if (key.isNullOrBlank()) "missing" else "present"
        } catch (t: Throwable) {
            "unreadable"
        }
    }

    fun playServicesVersion(context: Context): String {
        return try {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(PLAY_SERVICES_PACKAGE, 0).versionName ?: "unknown"
        } catch (t: Throwable) {
            "missing"
        }
    }

    /**
     * What every view instance reports about the environment it is working with. Whether the
     * Maps SDK is healthy on a given device is the question every black-screen report comes
     * down to, and none of it is derivable after the fact from the JS side.
     */
    fun diagnostics(context: Context, keyState: String): Map<String, Any?> = mapOf(
        "apiKey" to keyState,
        "mapsInit" to initResult,
        "mapsInitName" to initResultName(),
        "renderer" to (activeRenderer ?: "pending"),
        "playServices" to playServicesVersion(context),
    )
}
