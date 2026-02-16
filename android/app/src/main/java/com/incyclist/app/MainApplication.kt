package com.incyclist.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import android.content.Context
import com.facebook.soloader.SoLoader
import java.io.File 


class MainApplication : Application(), ReactApplication {

    /**
     * Legacy/Standard Host (Still required for many tools)
     */
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> {
                val packages = PackageList(this).packages.toMutableList()
                packages.add(ExitPackage()) // Add manual package here
                return packages
            }

            override fun getJSMainModuleName(): String = "index"
            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }


    /**
     * Custom ReactHost implementation.
     * This is where your app handles dynamic bundle paths.
     */

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


        
        // IMPORTANT: Manually merge ExitPackage into the host's package list
        val packages = PackageList(this).packages.toMutableList()
        packages.add(ExitPackage())

        getDefaultReactHost(
            context = applicationContext,
            packageList = packages,
            jsMainModulePath = "index", // This must be a non-null String
            jsBundleFilePath = bundleFile // This is allowed to be String?
        )


    }    

    override fun onCreate() {
        // super.onCreate()
        // loadReactNative(this)
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }

    }
}