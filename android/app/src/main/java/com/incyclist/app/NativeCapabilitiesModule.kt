package com.incyclist.app

import android.util.Log
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
 * - "local-link-media": the native loopback pipe (LoopbackPipeModule) is registered. Reported only
 *   when LoopbackPipePackage created its module. The media player reaches the pipe over cleartext
 *   HTTP on 127.0.0.1, which release builds only permit through
 *   res/xml/network_security_config.xml (referenced from the manifest); a binary must carry that
 *   configuration together with the module, so the capability is reported only by builds that
 *   ship both.
 */
@ReactModule(name = NativeCapabilitiesModule.NAME)
class NativeCapabilitiesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    // Never throws into the bridge: on any failure the binary reports no capability.
    override fun getConstants(): MutableMap<String, Any> =
        try {
            val capabilities = mutableListOf("local-link")
            // only when the loopback pipe module is really registered in this binary
            if (LoopbackPipePackage.registered) capabilities.add("local-link-media")
            hashMapOf<String, Any>("capabilities" to capabilities)
        } catch (e: Throwable) {
            Log.e(NAME, "getConstants failed", e)
            hashMapOf<String, Any>("capabilities" to emptyList<String>())
        }

    companion object {
        const val NAME = "NativeCapabilities"
    }
}
