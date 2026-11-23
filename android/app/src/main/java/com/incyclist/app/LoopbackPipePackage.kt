package com.incyclist.app

import android.util.Log
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers LoopbackPipeModule. A plain ReactPackage, like NativeCapabilitiesPackage. */
class LoopbackPipePackage : ReactPackage {
    companion object {
        /** true once the module has been created in this process; read by NativeCapabilitiesModule */
        @Volatile
        @JvmStatic
        var registered: Boolean = false
    }

    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> =
        try {
            val module = LoopbackPipeModule(reactContext)
            registered = true
            listOf(module)
        } catch (e: Throwable) {
            // optional: without it JS keeps the JS pipe
            Log.e(LoopbackPipeModule.NAME, "module creation failed", e)
            emptyList()
        }

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
