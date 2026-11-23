package com.incyclist.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

/**
 * NativeCapabilitiesModule - tells the JS layer which capabilities THIS native binary carries.
 *
 * JS arrives by hot update on arbitrarily old binaries, so it asks instead of guessing from a
 * version number; a binary without this module reports nothing and the feature stays off.
 * Exposed as constants so JS can read them synchronously: NativeModules.NativeCapabilities.capabilities.
 *
 * - "local-link": the control connection and discovery are possible (the build carries the
 *   inert pair host; raw TCP needs no further configuration).
 * - "local-link-media" is intentionally NOT reported yet: it is reserved for the release that
 *   ships the loopback network configuration and pipe.
 */
@ReactModule(name = NativeCapabilitiesModule.NAME)
class NativeCapabilitiesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    override fun getConstants(): MutableMap<String, Any> = hashMapOf(
        "capabilities" to listOf("local-link"),
    )

    companion object {
        const val NAME = "NativeCapabilities"
    }
}
