# Tasks to implement mobile client

## Basics
x Run on Android Device
- Run on IOS Device

## Bindings
x AppInfo
- AppSettings
- FS
x Logging
x UserSettings
- BLE
    x GPS Support on Android (isGPSMandatory, isGPSEnabled, requestGPSEnable)     
    x LocationPermission (hasLocationPermission, requestLocationPermission)     
    x BLE Permission (hasBLEPermissoins, requestBLEPermission)
    x BLE Enabled ( isBLEnabled, requestBLEEnable)
    - Permission Management in UI
    x Scan for devices
    x Communicate with devices

x Direct Connect
    x Bonjour
    x Device Comms
- Download ( Interruptable Download)
- Form Post
- OAuth
- UI
    - manage screensaver
    - full screeen
    - open URL ( in browser, in app)
    - take screenshot
    - quit
    - open folder
- Video Scheme ( no implementation as ffmpeg cannot be supported)
- FileSelection
x MQTT
<> Secret Management
- UI Bundle Management
- (Optional) Auto-Update


# OPEN FOR BETA
x Wifi Binding
- User Settings
- Pairing Page
- <NOT YET IMPLENTED> Page
- Workouts
- Workout Ride 
- Main Menu


# OPEN FOR PROD
- Implement proper secret binding ( App Attestation + Secret Storage)
- Setup MQTT Server to use TLS (Potentially migrate to mosquitto)
- Lookup for alternative MQTT lib
- Update Update-server to support mobile channel
- Find a way to define the App Features in a way that they cannot be overwritten by the bundles

# Planning



## Phase 1: MVP Single GPX Ride Only ( no workout, no video, no activity, no upload)
15.2.: 
    x BLE integrated, 
    - Pairing Page completed, 
    x Routes Dummy Page ( will equal Routes and Search in Desktop)
    x Workout Dummy Page
    x (Search Dummy Page)
    x Activities Dummy Page
    x NavigationBar
22.2: 
    - Fix: BLE Enable/Disable does not work properly
    - Add Interface Settings Dialog
    - User Settings   
    - Map Component
    - MVP: Route Page               ( GPX only, list only, no search) 
    - MVP:Route Details Component   ( only route details and start button) 
    - MVP:Follow Route Ride Page    ( no overlays, just option to stop)
xxx: 
    - IOS !!
    - GPX Route Details Completion 
    - Ride Dashboard Component
    - Ride Map Component
    - Elevation Graph Component
    - Elevation Preview Overlay
    - Total Elevation Overlay
    - Ride Settings
        - Activity
        - Gear
        - Ride
    - Add Elevation Graph to Route List
    - Nearby Rides List
    - PrevRides List


## Phase 2: MVP Existing Video + GPX Ride Only ( no workout, no activity, no upload)
    + Activities (and redo activity)
    + Video Ride
    + Videos in Route page
    + Download (incl. binding)

## Phase 3: add external Apps, add GPX upload

## Phase 4: add workouts, add free ride

## Phase 5: completion and initial release




    
    




# Features
- Manage Environment per config, so that DEBUG can be enabled

- No support for ANT+   ( remove from UI)
- No support for Serial/TCPIP ( remove from UI)
- (optional) Debug access
- UI Adaptations to smaller screen sizes
- Loading Screen
- Mobile UI adaptations ( dropping files does not work, hotkeys not working, ....)




