package com.incyclist.app

import android.content.Context
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.StreetViewManagerDelegate
import com.facebook.react.viewmanagers.StreetViewManagerInterface
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.OnMapsSdkInitializedCallback
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera
import org.json.JSONObject
import java.util.WeakHashMap

/**
 * StreetViewManager — Fabric Native View Component (Android)
 *
 * Wraps Google's StreetViewPanoramaView from the Maps SDK for Android.
 *
 * ── Event contract ────────────────────────────────────────────────────────
 *
 * onLicenseConsumed   Fires once per component lifetime on the first
 *                     OnStreetViewPanoramaChangeListener callback. This is
 *                     the moment Google charges a Dynamic Street View SKU
 *                     event. Never fires again after the first time.
 *
 * onLoaded            Fires once per component lifetime immediately after
 *                     onLicenseConsumed. Signals that the component has
 *                     settled on its first rendered state (panorama visible
 *                     or black screen if no imagery). Start overlay dismissal
 *                     should wait for this event.
 *
 * onNoPanorama        Fires when OnStreetViewPanoramaChangeListener returns
 *                     a null location — no Street View imagery at the
 *                     requested position. Fires on initial load AND on
 *                     subsequent position updates. The service layer decides
 *                     UX (popup, pill, fallback to MapView). When onNoPanorama
 *                     fires, the previous image remains visible; if this is
 *                     the initial position, a black screen is shown.
 *
 * onPanoramaChanged   Fires when OnStreetViewPanoramaChangeListener returns
 *                     a non-null location for a position update AFTER the
 *                     initial onLoaded has fired. Used by the service to
 *                     measure update round-trip time and throttle update rate.
 *                     Does NOT fire on the initial load.
 *
 * onError             Fires when a timeout expires:
 *                     - reason='unknown':     getStreetViewPanoramaAsync did
 *                       not fire within readyTimeout ms. Likely: Google Play
 *                       Services not installed or SDK init failure.
 *                     - reason='unavailable': OnStreetViewPanoramaChangeListener
 *                       did not fire within positionTimeout ms after setPosition.
 *                       Likely: invalid API key or network failure.
 *                     Fires throughout the component lifetime — the service
 *                     layer decides whether to act on single vs recurring errors.
 *
 * onLog               Diagnostics for the JS layer to forward to the app's own
 *                     event log. See "Logging" below.
 *
 * ── Logging ──────────────────────────────────────────────────────────────
 *
 * This component must never use android.util.Log for anything we actually need
 * to see: the users hitting Street View problems are non-technical and cannot
 * produce adb logs, so anything logged that way is invisible in practice.
 * Everything diagnostic is emitted as onLog and ends up in the app's event log.
 *
 * The one exception is a failure of the event pipeline itself (see emitEvent) —
 * an event cannot report that events are broken.
 *
 * Logs raised before the view has a React tag (createViewInstance runs before
 * the tag is assigned) are buffered in PanoramaState and flushed from
 * onAfterUpdateTransaction, which is the first point at which the view is
 * addressable.
 *
 * ── Teardown / black screen workaround ───────────────────────────────────
 *
 * If StreetViewPanoramaView occupies 100% of the Activity surface,
 * onDestroy() corrupts the window compositor, leaving a black region on the
 * next visible screen. The JS wrapper applies margin:1 by default so the
 * view never owns the full surface. Do not remove this margin.
 *
 * ── Single-instance constraint ───────────────────────────────────────────
 *
 * The Maps SDK for Android does not support multiple StreetViewPanoramaView
 * instances in one Activity. The demo page (and later GPXTourPage) must
 * render exactly one StreetView at a time.
 */
@ReactModule(name = StreetViewManager.NAME)
class StreetViewManager(
    private val reactContext: ReactApplicationContext,
) : SimpleViewManager<StreetViewPanoramaView>(),
    StreetViewManagerInterface<StreetViewPanoramaView> {

    private val states = WeakHashMap<StreetViewPanoramaView, PanoramaState>()
    private val mainHandler = Handler(Looper.getMainLooper())

    private val delegate: ViewManagerDelegate<StreetViewPanoramaView> =
        StreetViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<StreetViewPanoramaView> = delegate
    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): StreetViewPanoramaView {
        initializeMaps(context)

        val view = StreetViewPanoramaView(context)
        val state = PanoramaState()
        states[view] = state

        view.visibility = View.INVISIBLE // black-screen workaround companion
        view.onCreate(null)
        view.onResume()

        // Whether the Maps SDK is healthy on this device is the main open question for the
        // black-screen reports, so every instance reports what it is working with.
        emitLog(view, "createViewInstance", mapOf(
            "apiKey" to apiKeyState(context),
            "mapsInit" to mapsInitResult,
            "mapsInitName" to connectionResultName(mapsInitResult),
            "renderer" to (activeRenderer ?: "pending"),
            "playServices" to playServicesVersion(context),
        ))

        // Arm the ready timeout. Cancelled when getStreetViewPanoramaAsync fires.
        val readyTimeoutRunnable = Runnable {
            emitLog(view, "ready timeout expired", mapOf("timeout" to state.readyTimeoutMs))
            emitError(view, "unknown")
        }
        state.readyTimeoutRunnable = readyTimeoutRunnable
        mainHandler.postDelayed(readyTimeoutRunnable, state.readyTimeoutMs)

        view.getStreetViewPanoramaAsync { panorama ->
            // Cancel ready timeout — SDK is functional.
            state.readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            state.readyTimeoutRunnable = null

            state.panorama = panorama

            emitLog(view, "panorama ready", mapOf(
                "renderer" to (activeRenderer ?: "unknown"),
                "width" to view.width,
                "height" to view.height,
            ))

            panorama.isStreetNamesEnabled = false
            panorama.isZoomGesturesEnabled = false
            panorama.isPanningGesturesEnabled = false
            panorama.isUserNavigationEnabled = false

            // Listen for panorama location changes. This is the primary signal
            // for all position-related events.
            //
            // Deliberately routed through the Java NullSafeStreetViewPanoramaChangeListener
            // shim rather than a Kotlin lambda/override: the SDK annotates this parameter
            // @NonNull yet legitimately calls it with null when there is no Street View
            // imagery at the requested position - that IS how "no panorama" is reported. A
            // Kotlin implementation is forced to match the (incorrect) @NonNull annotation,
            // and Kotlin's compiler then generates a null-check that crashes the app the
            // moment the SDK does exactly what its own contract says it will. See the shim's
            // class doc. handlePanoramaChange already expects and handles null (hasImagery).
            panorama.setOnStreetViewPanoramaChangeListener(
                NullSafeStreetViewPanoramaChangeListener { location ->
                    handlePanoramaChange(view, state, location)
                }
            )

            view.visibility = View.VISIBLE
            state.applyIfReady(view)
        }

        return view
    }

    /**
     * Used only to release the logs buffered during createViewInstance — this is the first
     * point at which the view has a React tag and can carry an event.
     *
     * Applying the position here instead of from the individual prop setters would be the
     * better behaviour (setters issue setPosition once per prop, so a position update sends
     * two requests, the second superseding the first), but that is a behavioural change on a
     * path with no automated coverage: if this hook does not fire as expected the panorama
     * loads and then silently stops following the rider. Not worth risking in a build whose
     * job is to carry diagnostics, so it is deliberately left alone here.
     */
    override fun onAfterUpdateTransaction(view: StreetViewPanoramaView) {
        super.onAfterUpdateTransaction(view)
        flushPendingLogs(view)
    }

    override fun onDropViewInstance(view: StreetViewPanoramaView) {
        val state = states[view]
        if (state != null) {
            // Cancel any pending timeouts to avoid firing events after teardown.
            state.readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            state.positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        }
        try {
            view.visibility = View.INVISIBLE
            view.onPause()
            view.onDestroy()
        } catch (t: Throwable) {
            emitLog(view, "lifecycle teardown threw", mapOf("error" to t.message))
        }
        states.remove(view)
        super.onDropViewInstance(view)
    }

    // ── Maps SDK initialisation ───────────────────────────────────────────

    /**
     * MapsInitializer is process-global and only takes effect on its first call, so the
     * result and the renderer that was actually selected are cached for every later view.
     *
     * The renderer matters: the black screen we are chasing looks exactly like the panorama
     * pipeline stalling on a specific device, and RENDERER_PREFERENCE is the one lever we
     * have over it. The previous code used the deprecated single-argument overload and threw
     * the ConnectionResult away, so a degraded Play Services install was indistinguishable
     * from a healthy one.
     */
    private fun initializeMaps(context: Context) {
        if (mapsInitResult != null)
            return

        try {
            mapsInitResult = MapsInitializer.initialize(
                context.applicationContext,
                RENDERER_PREFERENCE,
                OnMapsSdkInitializedCallback { renderer -> activeRenderer = renderer.name }
            )
        } catch (t: Throwable) {
            mapsInitError = t.message
            mapsInitResult = INIT_THREW
        }
    }

    /**
     * Whether the manifest carries a Maps API key at all — reported as present/missing, never
     * the value itself.
     *
     * This exists because released builds shipped `android:value=""` for months: the key was
     * absent from CI and the Gradle build substituted an empty string. An empty key produces
     * a build that initialises cleanly and then has every panorama request rejected, so the
     * ride screen was black with nothing anywhere saying why. One line here would have made
     * that obvious from the first user report.
     */
    private fun apiKeyState(context: Context): String {
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

    private fun playServicesVersion(context: Context): String {
        return try {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(PLAY_SERVICES_PACKAGE, 0).versionName ?: "unknown"
        } catch (t: Throwable) {
            "missing"
        }
    }

    private fun connectionResultName(result: Int?): String = when (result) {
        null -> "not-initialised"
        ConnectionResult.SUCCESS -> "success"
        ConnectionResult.SERVICE_MISSING -> "service-missing"
        ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED -> "update-required"
        ConnectionResult.SERVICE_DISABLED -> "service-disabled"
        ConnectionResult.SERVICE_INVALID -> "service-invalid"
        INIT_THREW -> "threw: ${mapsInitError ?: "unknown"}"
        else -> "code-$result"
    }

    // ── Panorama change handler ────────────────────────────────────────────

    private fun handlePanoramaChange(
        view: StreetViewPanoramaView,
        state: PanoramaState,
        location: com.google.android.gms.maps.model.StreetViewPanoramaLocation?,
    ) {
        // Cancel the position timeout — the SDK acknowledged the position
        // request, regardless of whether imagery was found.
        state.positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        state.positionTimeoutRunnable = null

        val hasImagery = location != null

        if (!state.licenseConsumed) {
            // First change event ever — emit license + loaded, then conditionally
            // noPanorama. onPanoramaChanged does NOT fire on initial load.
            state.licenseConsumed = true
            emitLog(view, "first panorama change", mapOf(
                "hasImagery" to hasImagery,
                "elapsed" to state.elapsedSinceRequest(),
                "width" to view.width,
                "height" to view.height,
            ))
            emitEvent(view, EVENT_LICENSE_CONSUMED, null)
            emitEvent(view, EVENT_LOADED, null)
            if (!hasImagery) {
                emitEvent(view, EVENT_NO_PANORAMA, null)
            }
        } else {
            // Subsequent position updates.
            if (hasImagery) {
                emitEvent(view, EVENT_PANORAMA_CHANGED, null)
            } else {
                emitEvent(view, EVENT_NO_PANORAMA, null)
            }
        }
    }

    // ── Props ─────────────────────────────────────────────────────────────

    @ReactProp(name = "latitude", defaultDouble = 0.0)
    override fun setLatitude(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingLat = value
        state.applyIfReady(view)
    }

    @ReactProp(name = "longitude", defaultDouble = 0.0)
    override fun setLongitude(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingLng = value
        state.applyIfReady(view)
    }

    @ReactProp(name = "heading", defaultDouble = 0.0)
    override fun setHeading(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.pendingHeading = value
        state.applyIfReady(view)
    }

    @ReactProp(name = "readyTimeout", defaultDouble = DEFAULT_READY_TIMEOUT_MS.toDouble())
    override fun setReadyTimeout(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.readyTimeoutMs = value.toLong()
        // If the ready timeout runnable is still pending, reschedule it with
        // the new value. This handles the case where the prop arrives before
        // the panorama is ready.
        state.readyTimeoutRunnable?.let {
            mainHandler.removeCallbacks(it)
            mainHandler.postDelayed(it, state.readyTimeoutMs)
        }
    }

    @ReactProp(name = "positionTimeout", defaultDouble = DEFAULT_POSITION_TIMEOUT_MS.toDouble())
    override fun setPositionTimeout(view: StreetViewPanoramaView, value: Double) {
        val state = states[view] ?: return
        state.positionTimeoutMs = value.toLong()
        // No rescheduling needed — positionTimeout is read on the next
        // setPosition call.
    }

    // ── Per-view state ────────────────────────────────────────────────────

    private inner class PanoramaState {
        var panorama: StreetViewPanorama? = null
        var pendingLat: Double? = null
        var pendingLng: Double? = null
        var pendingHeading: Double? = null

        // Timeout configuration — overridable via props.
        var readyTimeoutMs: Long = DEFAULT_READY_TIMEOUT_MS
        var positionTimeoutMs: Long = DEFAULT_POSITION_TIMEOUT_MS

        // Pending timeout runnables. Held so they can be cancelled.
        var readyTimeoutRunnable: Runnable? = null
        var positionTimeoutRunnable: Runnable? = null

        // Whether the first OnStreetViewPanoramaChangeListener has fired.
        // Controls onLicenseConsumed / onLoaded emission (once only) and
        // whether subsequent changes emit onPanoramaChanged vs initial events.
        var licenseConsumed: Boolean = false

        // Logs raised before the view was addressable.
        val pendingLogs = mutableListOf<WritableMap>()

        var requestedAt: Long = 0

        fun elapsedSinceRequest(): Long =
            if (requestedAt == 0L) -1 else System.currentTimeMillis() - requestedAt

        /**
         * Apply pending lat/lng/heading to the panorama if it is ready. Called from prop
         * setters (panorama may not be ready yet) and from the getStreetViewPanoramaAsync
         * callback (panorama just became ready).
         *
         * Position timeout is armed on each setPosition call and cancelled when
         * OnStreetViewPanoramaChangeListener fires.
         *
         * Skipping a request for a position the panorama already shows would avoid arming
         * the timeout against what the SDK may treat as a no-op, but that is a behavioural
         * change and this build is meant to carry diagnostics only.
         */
        fun applyIfReady(view: StreetViewPanoramaView) {
            val p = panorama ?: return
            val lat = pendingLat ?: return
            val lng = pendingLng ?: return

            requestedAt = System.currentTimeMillis()

            // Arm (or re-arm) the position timeout before calling setPosition.
            positionTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            val timeoutRunnable = Runnable {
                emitLog(view, "position timeout expired", mapOf(
                    "timeout" to positionTimeoutMs,
                    "loaded" to licenseConsumed,
                    "width" to view.width,
                    "height" to view.height,
                ))
                emitError(view, "unavailable")
            }
            positionTimeoutRunnable = timeoutRunnable
            mainHandler.postDelayed(timeoutRunnable, positionTimeoutMs)

            p.setPosition(LatLng(lat, lng), PANORAMA_SEARCH_RADIUS)
            applyHeading(p)
        }

        private fun applyHeading(p: StreetViewPanorama) {
            val heading = pendingHeading ?: return
            val current = p.panoramaCamera
            if (current.bearing == heading.toFloat())
                return

            val newCamera = StreetViewPanoramaCamera.Builder(current)
                .bearing(heading.toFloat())
                .build()
            p.animateTo(newCamera, 0)
        }
    }

    // ── Event emission helpers ────────────────────────────────────────────

    private fun emitError(view: StreetViewPanoramaView, reason: String) {
        val payload = Arguments.createMap().apply {
            putString("reason", reason)
        }
        emitEvent(view, EVENT_ERROR, payload)
    }

    /**
     * Reports a diagnostic to the JS layer, which forwards it to the app's event log.
     * Buffered while the view has no React tag yet — see "Logging" in the class docs.
     */
    private fun emitLog(
        view: StreetViewPanoramaView,
        message: String,
        detail: Map<String, Any?> = emptyMap(),
    ) {
        val payload = Arguments.createMap().apply {
            putString("message", message)
            putString("detail", toJson(detail))
        }

        if (view.id == View.NO_ID) {
            states[view]?.pendingLogs?.add(payload)
            return
        }

        flushPendingLogs(view)
        emitEvent(view, EVENT_LOG, payload)
    }

    private fun flushPendingLogs(view: StreetViewPanoramaView) {
        val pending = states[view]?.pendingLogs ?: return
        if (pending.isEmpty() || view.id == View.NO_ID)
            return

        val buffered = pending.toList()
        pending.clear()
        buffered.forEach { emitEvent(view, EVENT_LOG, it) }
    }

    private fun toJson(detail: Map<String, Any?>): String {
        if (detail.isEmpty())
            return ""

        return try {
            JSONObject(detail).toString()
        } catch (t: Throwable) {
            ""
        }
    }

    private fun emitEvent(
        view: StreetViewPanoramaView,
        eventName: String,
        payload: WritableMap?,
    ) {
        val context = view.context as? ThemedReactContext ?: return
        try {
            val surfaceId = UIManagerHelper.getSurfaceId(context)
            val eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
            val finalPayload = payload ?: Arguments.createMap()
            eventDispatcher?.dispatchEvent(
                object : Event<Nothing>(surfaceId, view.id) {
                    override fun getEventName() = eventName
                    override fun getEventData() = finalPayload
                }
            )
        } catch (t: Throwable) {
            // Deliberately the one android.util.Log left: an event cannot report that the
            // event pipeline is broken.
            android.util.Log.w(TAG, "emitEvent $eventName threw: ${t.message}")
        }
    }


    companion object {
        const val NAME = "StreetView"
        private const val TAG = "StreetViewManager"

        private const val DEFAULT_READY_TIMEOUT_MS = 10_000L
        private const val DEFAULT_POSITION_TIMEOUT_MS = 2_000L

        private const val PANORAMA_SEARCH_RADIUS = 50
        private const val PLAY_SERVICES_PACKAGE = "com.google.android.gms"
        private const val API_KEY_META_DATA = "com.google.android.geo.API_KEY"

        /** sentinel for "MapsInitializer.initialize threw", which has no ConnectionResult */
        private const val INIT_THREW = -1

        /**
         * Renderer used for the Maps SDK. LATEST is the SDK default and is what the failing
         * builds have been running; LEGACY is the fallback to try if the diagnostics show
         * the panorama pipeline stalling with LATEST. Process-global and applied on first
         * use, so this cannot be switched at runtime — changing it needs a new build.
         */
        private val RENDERER_PREFERENCE = MapsInitializer.Renderer.LATEST

        @Volatile
        private var mapsInitResult: Int? = null

        @Volatile
        private var mapsInitError: String? = null

        @Volatile
        private var activeRenderer: String? = null

        // Event name constants — must match the prop names in the Codegen spec.
        private const val EVENT_LICENSE_CONSUMED = "onLicenseConsumed"
        private const val EVENT_LOADED           = "onLoaded"
        private const val EVENT_NO_PANORAMA      = "onNoPanorama"
        private const val EVENT_PANORAMA_CHANGED = "onPanoramaChanged"
        private const val EVENT_ERROR            = "onError"
        private const val EVENT_LOG              = "onLog"
    }
}
