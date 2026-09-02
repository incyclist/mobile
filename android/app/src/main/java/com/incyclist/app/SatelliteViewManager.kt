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
import com.facebook.react.viewmanagers.SatelliteViewManagerDelegate
import com.facebook.react.viewmanagers.SatelliteViewManagerInterface
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.MapView
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.OnMapsSdkInitializedCallback
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import org.json.JSONObject
import java.util.WeakHashMap

/**
 * SatelliteViewManager — Fabric Native View Component (Android)
 *
 * Wraps Google's MapView from the Maps SDK for Android, rendered as satellite imagery under a
 * fixed, non-interactive camera. Structurally a sibling of StreetViewManager: same event
 * contract shape, same buffered-event/logging discipline, same package/registration pattern.
 *
 * ── Camera ────────────────────────────────────────────────────────────────
 *
 * MAP_TYPE_SATELLITE at zoom 20 with a 45° tilt, all gestures disabled. Those numbers are not
 * chosen here — they are what the desktop/web satellite view has always rendered (Google Maps
 * JS API: mapTypeId 'satellite', zoom 20, tilt 45), so mobile matches what riders already know.
 * MAP_TYPE_HYBRID would add road/place labels on top of the same imagery, which desktop does
 * not show.
 *
 * Bearing follows the `heading` prop, matching desktop exactly: desktop calls
 * `setOptions({center, heading, tilt:45})` on every update, rotating the view with the rider.
 * The camera itself is still non-interactive (no rotation gesture), the heading is driven
 * entirely by the prop, not by touch input.
 *
 * ── Position updates ──────────────────────────────────────────────────────
 *
 * Every position prop that arrives is applied — there is no throttling here and none in the
 * service layer either. Unlike Street View, an update is not a network fetch of new imagery:
 * it is a camera move over tiles the map already has, the same thing a turn-by-turn navigation
 * app does continuously. The first position is applied instantly (moveCamera) so the view is
 * correct the moment it becomes visible; later ones are animated over CAMERA_ANIMATION_MS,
 * roughly the ride engine's update cadence, so consecutive ~1Hz updates interpolate smoothly
 * instead of jumping.
 *
 * ── Marker ────────────────────────────────────────────────────────────────
 *
 * One plain default marker for the current position. No avatar icon, and no other riders —
 * this mirrors exactly what the desktop satellite view renders today.
 *
 * ── Event contract ────────────────────────────────────────────────────────
 *
 * onLicenseConsumed   Fires once per MapView instantiation, from createViewInstance
 *                     immediately after the view is constructed and onCreate() is called.
 *                     Google bills the Dynamic Maps SKU per map load, and onCreate() is the
 *                     trigger — so the charge happens here, whether or not the map ever
 *                     renders a tile. A recycled/recreated view is a new instantiation and is
 *                     counted again. Emitted before any imagery is known to exist, on purpose:
 *                     a map object that is charged but never answers must still be counted.
 *
 * onLoaded            Fires once per component lifetime, on GoogleMap's first
 *                     OnMapLoadedCallback — i.e. when the visible tiles have actually
 *                     finished rendering, not merely when the SDK handed us a GoogleMap.
 *                     Start overlay dismissal waits for this.
 *
 * onError             reason='apiKeyMissing': no com.google.android.geo.API_KEY in the
 *                       manifest. Raised before onCreate(), so no billable map is created.
 *                     reason='unknown':       getMapAsync did not fire within readyTimeout ms.
 *                       Likely: Google Play Services missing or Maps SDK init failure.
 *                     reason='unavailable':   the map was handed over but never finished
 *                       rendering within LOAD_TIMEOUT_MS. Likely: invalid API key, no
 *                       network, or no imagery served.
 *
 * onLog               Diagnostics for the JS layer to forward to the app's event log.
 *
 * ── Logging ──────────────────────────────────────────────────────────────
 *
 * Never android.util.Log for anything we actually need to see: the riders who hit these
 * problems are non-technical and cannot produce adb logs, so anything logged that way is
 * invisible in practice. Everything diagnostic is emitted as onLog and ends up in the app's
 * event log. The one exception is a failure of the event pipeline itself (see emitEvent) — an
 * event cannot report that events are broken.
 *
 * Events raised before the view has a React tag (createViewInstance runs before the tag is
 * assigned) are buffered on MapState and flushed from onAfterUpdateTransaction, the first
 * point at which the view is addressable. This applies to onLog, onLicenseConsumed and
 * onError alike — all three are raised from inside createViewInstance, where an unbuffered
 * emitEvent is a silent no-op.
 */
@ReactModule(name = SatelliteViewManager.NAME)
class SatelliteViewManager(
    private val reactContext: ReactApplicationContext,
) : SimpleViewManager<MapView>(),
    SatelliteViewManagerInterface<MapView> {

    private val states = WeakHashMap<MapView, MapState>()
    private val mainHandler = Handler(Looper.getMainLooper())

    private val delegate: ViewManagerDelegate<MapView> =
        SatelliteViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<MapView> = delegate
    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): MapView {
        initializeMaps(context)

        val view = MapView(context)
        val state = MapState()
        states[view] = state

        // Check API key availability FIRST, before any lifecycle methods or license-consumed
        // event. If the key is missing or unreadable, fail immediately without triggering a
        // billable map load (onCreate is the billing trigger).
        val keyState = apiKeyState(context)
        if (keyState != "present") {
            emitLog(view, "createViewInstance", diagnostics(context, keyState))
            emitError(view, state, "apiKeyMissing")
            return view
        }

        // Hidden until the map has been handed over, so the rider never sees the SDK's empty
        // grey canvas between construction and first render.
        view.visibility = View.INVISIBLE
        view.onCreate(null)
        view.onStart()
        view.onResume()

        // The billable moment — see onLicenseConsumed in the class docs. Emitted here, right
        // after construction/onCreate, rather than on first render, so a map object that is
        // charged but never answers is still counted. The view has no React tag yet, so this
        // is buffered and flushed from onAfterUpdateTransaction like emitLog.
        emitLicenseConsumed(view, state)

        emitLog(view, "createViewInstance", diagnostics(context, keyState))

        armReadyTimeout(view, state)

        view.getMapAsync { map -> onMapReady(view, state, map) }

        return view
    }

    /**
     * Releases the events buffered during createViewInstance — this is the first point at
     * which the view has a React tag and can carry one.
     */
    override fun onAfterUpdateTransaction(view: MapView) {
        super.onAfterUpdateTransaction(view)
        flushPendingLogs(view)
    }

    override fun onDropViewInstance(view: MapView) {
        states[view]?.cancelTimeouts()
        try {
            view.visibility = View.INVISIBLE
            view.onPause()
            view.onStop()
            view.onDestroy()
        } catch (t: Throwable) {
            emitLog(view, "lifecycle teardown threw", mapOf("error" to t.message))
        }
        states.remove(view)
        super.onDropViewInstance(view)
    }

    // ── Map readiness ─────────────────────────────────────────────────────

    private fun armReadyTimeout(view: MapView, state: MapState) {
        val runnable = Runnable {
            emitLog(view, "ready timeout expired", mapOf("timeout" to state.readyTimeoutMs))
            emitError(view, state, "unknown")
        }
        state.readyTimeoutRunnable = runnable
        mainHandler.postDelayed(runnable, state.readyTimeoutMs)
    }

    private fun onMapReady(view: MapView, state: MapState, map: GoogleMap) {
        // The SDK answered — it is functional, whatever the tiles end up doing.
        state.readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        state.readyTimeoutRunnable = null

        state.map = map
        configureMap(map)

        emitLog(view, "map ready", mapOf(
            "renderer" to (activeRenderer ?: "unknown"),
            "elapsed" to state.elapsedSinceCreated(),
            "width" to view.width,
            "height" to view.height,
        ))

        // Tiles are fetched after this point, so a map that is handed over but never renders
        // (bad key, no network) needs its own timeout — the ready timeout has already been
        // cancelled by then.
        val loadRunnable = Runnable {
            emitLog(view, "load timeout expired", mapOf(
                "timeout" to LOAD_TIMEOUT_MS,
                "width" to view.width,
                "height" to view.height,
            ))
            emitError(view, state, "unavailable")
        }
        state.loadTimeoutRunnable = loadRunnable
        mainHandler.postDelayed(loadRunnable, LOAD_TIMEOUT_MS)

        map.setOnMapLoadedCallback { onMapLoaded(view, state) }

        view.visibility = View.VISIBLE
        state.applyIfReady()
    }

    private fun onMapLoaded(view: MapView, state: MapState) {
        state.loadTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        state.loadTimeoutRunnable = null

        if (state.loadedEmitted)
            return

        state.loadedEmitted = true
        emitLog(view, "first map render", mapOf(
            "elapsed" to state.elapsedSinceCreated(),
            "width" to view.width,
            "height" to view.height,
        ))
        emitEvent(view, EVENT_LOADED, null)
    }

    /**
     * Satellite imagery, fixed camera, no interaction. Everything the rider could otherwise
     * pan/tilt/rotate away from is switched off here rather than relying on the ride screen to
     * swallow the gestures.
     */
    private fun configureMap(map: GoogleMap) {
        map.mapType = GoogleMap.MAP_TYPE_SATELLITE
        map.uiSettings.apply {
            setAllGesturesEnabled(false)
            isZoomControlsEnabled = false
            isCompassEnabled = false
            isMapToolbarEnabled = false
            isIndoorLevelPickerEnabled = false
        }
        map.isBuildingsEnabled = false
        map.isIndoorEnabled = false
        map.isTrafficEnabled = false
    }

    // ── Maps SDK initialisation ───────────────────────────────────────────

    /**
     * MapsInitializer is process-global and only takes effect on its first call, so the result
     * and the renderer actually selected are cached for every later view.
     *
     * Kept self-contained rather than reaching into StreetViewManager's copy of this: the
     * underlying call is idempotent, so a second cached wrapper around it costs nothing and
     * keeps this component from changing Street View's shipped behaviour. The two are prime
     * candidates to be folded into one shared check when the availability binding lands.
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
     * What every instance reports about the environment it is working with. Whether the Maps
     * SDK is healthy on a given device is the question every black-screen report comes down
     * to, and none of it is derivable after the fact from the JS side.
     */
    private fun diagnostics(context: Context, keyState: String): Map<String, Any?> = mapOf(
        "apiKey" to keyState,
        "mapsInit" to mapsInitResult,
        "mapsInitName" to connectionResultName(mapsInitResult),
        "renderer" to (activeRenderer ?: "pending"),
        "playServices" to playServicesVersion(context),
    )

    /**
     * Whether the manifest carries a Maps API key at all — reported as present/missing, never
     * the value itself. Released builds have shipped `android:value=""` before now: the key
     * was absent from CI and the build substituted an empty string, producing a build that
     * initialises cleanly and then has every tile request rejected.
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

    // ── Props ─────────────────────────────────────────────────────────────

    @ReactProp(name = "latitude", defaultDouble = 0.0)
    override fun setLatitude(view: MapView, value: Double) {
        val state = states[view] ?: return
        state.pendingLat = value
        state.applyIfReady()
    }

    @ReactProp(name = "longitude", defaultDouble = 0.0)
    override fun setLongitude(view: MapView, value: Double) {
        val state = states[view] ?: return
        state.pendingLng = value
        state.applyIfReady()
    }

    @ReactProp(name = "heading", defaultDouble = 0.0)
    override fun setHeading(view: MapView, value: Double) {
        val state = states[view] ?: return
        state.pendingHeading = value
        state.applyIfReady()
    }

    @ReactProp(name = "readyTimeout", defaultDouble = DEFAULT_READY_TIMEOUT_MS.toDouble())
    override fun setReadyTimeout(view: MapView, value: Double) {
        val state = states[view] ?: return
        state.readyTimeoutMs = value.toLong()
        // The prop can arrive after the timeout was armed with the default, so reschedule a
        // still-pending one against the new value.
        state.readyTimeoutRunnable?.let {
            mainHandler.removeCallbacks(it)
            mainHandler.postDelayed(it, state.readyTimeoutMs)
        }
    }

    // ── Per-view state ────────────────────────────────────────────────────

    private inner class MapState {
        var map: GoogleMap? = null
        var marker: Marker? = null
        var pendingLat: Double? = null
        var pendingLng: Double? = null
        var pendingHeading: Double = MAP_BEARING.toDouble()

        var readyTimeoutMs: Long = DEFAULT_READY_TIMEOUT_MS

        // Pending timeout runnables. Held so they can be cancelled.
        var readyTimeoutRunnable: Runnable? = null
        var loadTimeoutRunnable: Runnable? = null

        /** whether onLoaded has already been emitted — it fires once per component lifetime */
        var loadedEmitted: Boolean = false

        /** whether a camera position has been applied at all — the first one is not animated */
        var cameraApplied: Boolean = false

        // Events raised before the view was addressable.
        val pendingLogs = mutableListOf<WritableMap>()
        var pendingLicense: Boolean = false
        var pendingError: WritableMap? = null

        val createdAt: Long = System.currentTimeMillis()

        fun elapsedSinceCreated(): Long = System.currentTimeMillis() - createdAt

        fun cancelTimeouts() {
            readyTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            loadTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
            readyTimeoutRunnable = null
            loadTimeoutRunnable = null
        }

        /**
         * Move the camera and the position marker to the pending coordinates, if the map is
         * ready and both coordinates have arrived. Called from the prop setters (map may not
         * be ready yet) and from the getMapAsync callback (map just became ready).
         *
         * lat and lng arrive as two separate prop setter calls, so this deliberately does
         * nothing until both are present — otherwise the first update of every pair would
         * animate towards a coordinate pairing one new value with one stale one.
         */
        fun applyIfReady() {
            val m = map ?: return
            val lat = pendingLat ?: return
            val lng = pendingLng ?: return

            val target = LatLng(lat, lng)
            val camera = CameraPosition.Builder()
                .target(target)
                .zoom(MAP_ZOOM)
                .tilt(MAP_TILT)
                .bearing(pendingHeading.toFloat())
                .build()

            val update = CameraUpdateFactory.newCameraPosition(camera)
            if (cameraApplied) {
                m.animateCamera(update, CAMERA_ANIMATION_MS, null)
            } else {
                // Instant, so the view is already showing the right place the moment it
                // becomes visible rather than flying in from (0,0).
                cameraApplied = true
                m.moveCamera(update)
            }

            applyMarker(m, target)
        }

        /** one plain default pin for the rider's own position — no avatar, no other riders */
        private fun applyMarker(m: GoogleMap, target: LatLng) {
            val existing = marker
            if (existing == null) {
                marker = m.addMarker(MarkerOptions().position(target))
            } else {
                existing.position = target
            }
        }
    }

    // ── Event emission helpers ────────────────────────────────────────────

    /**
     * Buffered while the view has no React tag yet, the same way emitLicenseConsumed and
     * emitLog are — see "Logging" in the class docs. createViewInstance's apiKeyMissing
     * early-return calls this from exactly that untagged window, where an unbuffered
     * emitEvent is a silent no-op.
     */
    private fun emitError(view: MapView, state: MapState, reason: String) {
        val payload = Arguments.createMap().apply {
            putString("reason", reason)
        }
        if (view.id == View.NO_ID) {
            state.pendingError = payload
            return
        }
        emitEvent(view, EVENT_ERROR, payload)
    }

    /**
     * The billable moment — see onLicenseConsumed in the class docs. Called from
     * createViewInstance, before the view has a React tag, so it is buffered and flushed from
     * onAfterUpdateTransaction alongside the buffered logs.
     */
    private fun emitLicenseConsumed(view: MapView, state: MapState) {
        if (view.id == View.NO_ID) {
            state.pendingLicense = true
            return
        }
        emitEvent(view, EVENT_LICENSE_CONSUMED, null)
    }

    /**
     * Reports a diagnostic to the JS layer, which forwards it to the app's event log.
     * Buffered while the view has no React tag yet — see "Logging" in the class docs.
     */
    private fun emitLog(
        view: MapView,
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

    /**
     * Releases everything buffered before the view had a React tag: pending logs, then the
     * pending licence-consumed event, then the pending error, in that order. Called from
     * onAfterUpdateTransaction and from emitLog itself, so a log raised once the view is
     * addressable is preceded by anything still queued.
     */
    private fun flushPendingLogs(view: MapView) {
        val state = states[view] ?: return
        if (view.id == View.NO_ID)
            return

        if (state.pendingLogs.isNotEmpty()) {
            val buffered = state.pendingLogs.toList()
            state.pendingLogs.clear()
            buffered.forEach { emitEvent(view, EVENT_LOG, it) }
        }

        if (state.pendingLicense) {
            state.pendingLicense = false
            emitEvent(view, EVENT_LICENSE_CONSUMED, null)
        }

        state.pendingError?.let { payload ->
            state.pendingError = null
            emitEvent(view, EVENT_ERROR, payload)
        }
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
        view: MapView,
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
        const val NAME = "SatelliteView"
        private const val TAG = "SatelliteViewManager"

        /** getMapAsync has not answered — Play Services missing or SDK init failure */
        private const val DEFAULT_READY_TIMEOUT_MS = 10_000L

        /** map handed over but never finished rendering — bad key, no network, no imagery */
        private const val LOAD_TIMEOUT_MS = 15_000L

        /**
         * Roughly the ride engine's position update cadence (~1Hz), so one move finishes about
         * as the next arrives and the camera reads as continuous rather than stepped.
         */
        private const val CAMERA_ANIMATION_MS = 900

        // Camera geometry — matches what the desktop/web satellite view renders.
        private const val MAP_ZOOM = 20f
        private const val MAP_TILT = 45f
        private const val MAP_BEARING = 0f

        private const val PLAY_SERVICES_PACKAGE = "com.google.android.gms"
        private const val API_KEY_META_DATA = "com.google.android.geo.API_KEY"

        /** sentinel for "MapsInitializer.initialize threw", which has no ConnectionResult */
        private const val INIT_THREW = -1

        /**
         * Renderer used for the Maps SDK. Process-global and applied on first use, so this
         * cannot be switched at runtime — changing it needs a new build. Deliberately the same
         * preference StreetViewManager sets, since whichever of the two runs first decides it
         * for the whole process anyway.
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
        private const val EVENT_ERROR            = "onError"
        private const val EVENT_LOG              = "onLog"
    }
}
