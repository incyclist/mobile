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
    - GPS Support on Android (isGPSMandatory, isGPSEnabled, requestGPSEnable)     
    - LocationPermission (hasLocationPermission, requestLocationPermission)     
    - BLE Permission (hasBLEPermissoins, requestBLEPermission)
    - BLE Enabled ( isBLEnabled, requestBLEEnable)
    - Permission Management in UI
    - Scan for devices
    - Communicate with devices

- Direct Connect
    - Bonjour
    - Device Comms
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
- Wifi Binding
- User Settings
- Pairing Page
- <NOT YET IMPLENTED> Page
- Workouts
- Workout Ride 
- Main Menu


# OPEN FOR PROD
- Implement proper secret binding ( App Attestation + Secret Storage)
- Setup MQTT Server to use TLS
- Lookup for alternative MQTT lib
- Update Update-server to support mobile channel
- Find a way to define the App Features in a way that they cannot be overwritten by the bundles



# Features
- Manage Environment per config, so that DEBUG can be enabled

- No support for ANT+   ( remove from UI)
- No support for Serial/TCPIP ( remove from UI)
- (optional) Debug access
- UI Adaptations to smaller screen sizes
- Loading Screen
- Mobile UI adaptations ( dropping files does not work, hotkeys not working, ....)




