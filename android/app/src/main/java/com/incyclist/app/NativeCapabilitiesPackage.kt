package com.incyclist.app

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers NativeCapabilitiesModule. A plain ReactPackage, like MapAvailabilityPackage. */
class NativeCapabilitiesPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> =
        try {
            listOf(NativeCapabilitiesModule(reactContext))
        } catch (e: Throwable) {
            // the module is optional: without it JS sees no capability
            Log.e(NativeCapabilitiesModule.NAME, "module creation failed", e)
            emptyList()
        }

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
