package com.incyclist.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.os.Process
import kotlin.system.exitProcess

class ExitModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ExitModule"

    @ReactMethod
    fun killApp() {
        // Accessing via reactApplicationContext to resolve the scope error
        reactApplicationContext.currentActivity?.finishAffinity()
        
        // Immediate process termination
        Process.killProcess(Process.myPid())
        exitProcess(0)
    }
}