package com.incyclist

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import android.content.Context
// 1. Add this import
import java.io.File 

class MainApplication : Application(), ReactApplication {


    // override val reactHost: ReactHost by lazy {
    //     val localBundle = File(applicationContext.filesDir, "bundle/index.android.bundle")
    //     val bundlePath = if (localBundle.exists()) localBundle.absolutePath else null

    //     getDefaultReactHost(
    //         context = applicationContext,
    //         packageList = PackageList(this).packages,
    //         // Add these named arguments to match the function signature
    //         jsMainModulePath = "index",
    //         jsBundleFilePath = bundlePath 
    //     )
    // }  

    override val reactHost: ReactHost by lazy {
        // Read the path set by TypeScript's DefaultPreference
        var prefs = getSharedPreferences("react-native-default-preference", Context.MODE_PRIVATE)
        var bundlePathRoot = prefs.getString("active_bundle_path", null)
        if (bundlePathRoot == null) {
            prefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this)
            bundlePathRoot = prefs.getString("active_bundle_path", null)
        }

        android.util.Log.d("Incyclist", "Native Shell looking for bundle at: $bundlePathRoot")

        
        val bundleFile = bundlePathRoot?.let { path ->
            val file = File(path, "index.android.bundle")
            android.util.Log.d("Incyclist", "Bundle file exists? ${file.exists()}")
            if (file.exists()) file.absolutePath else null
        }

        getDefaultReactHost(
            context = applicationContext,
            packageList = PackageList(this).packages,
            jsMainModulePath = "index",
            jsBundleFilePath = bundleFile 
        )
    }    

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
    }
}