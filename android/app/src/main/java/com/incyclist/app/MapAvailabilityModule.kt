package com.incyclist.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/**
 * MapAvailabilityModule — reports whether the Maps SDK can actually work on this device.
 *
 * Exists so the ride-view options can be gated *before* a rider selects a view that cannot
 * work. Street View has until now only discovered a broken Maps SDK reactively, once the
 * panorama had already been asked for and its timeout expired — by which point the rider is
 * already on a black ride screen. The same question, asked up front, is a JS-side capability
 * check; but nothing about Play Services or MapsInitializer is reachable from JS, so it has to
 * be answered here.
 *
 * Deliberately a plain ReactContextBaseJavaModule rather than a Codegen TurboModule: the check
 * it wraps is Android-only (iOS's satellite view is MapKit, which has no equivalent
 * precondition, and iOS's Street View key is guaranteed present by a build script that fails
 * Release builds without one). A Codegen spec would generate an iOS protocol nothing
 * implements, for no gain. JS reads it as NativeModules.MapAvailability, the same way
 * ExitModule is read, and treats its absence as "no answer" rather than as "unavailable" — an
 * older binary reached by a JS-only hot update has no MapAvailability module but does still
 * have a working Street View.
 *
 * The answer is a snapshot, not a subscription: JS re-asks when the app returns to the
 * foreground, which is when a rider who just installed or re-enabled Play Services comes back.
 */
@ReactModule(name = MapAvailabilityModule.NAME)
class MapAvailabilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    /**
     * Resolves with the Maps SDK's own verdict plus the diagnostics that explain it. Never
     * rejects for a "not available" answer — an unusable Maps SDK is a normal, expected state
     * that has to be reported as data. A rejection here means the check itself could not be
     * made.
     *
     * Runs on the UI thread: MapsInitializer delivers its renderer callback there, and the
     * first call is what actually loads the Maps renderer. That is also why JS asks off the
     * startup critical path rather than awaiting this before the app is usable.
     */
    @ReactMethod
    fun getStatus(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val context = reactApplicationContext
                MapsAvailability.initialize(context)

                val status = Arguments.createMap().apply {
                    putBoolean("available", MapsAvailability.isUsable())
                    putString("reason", MapsAvailability.initResultName())
                    putString("apiKey", MapsAvailability.apiKeyState(context))
                    putString("playServices", MapsAvailability.playServicesVersion(context))
                    putString("renderer", MapsAvailability.renderer() ?: "pending")
                }
                promise.resolve(status)
            } catch (t: Throwable) {
                promise.reject(ERROR_CODE, t.message ?: "unknown", t)
            }
        }
    }

    companion object {
        const val NAME = "MapAvailability"
        private const val ERROR_CODE = "map-availability-failed"
    }
}
