##  1. Run Pod install
npx pod-install

## 2. Native Bundle Loading Logic (iOS & Android)

To achieve the "Server -> Local File -> Asset" fallback, you need to modify how the native app initializes the JS engine.
For iOS (`AppDelegate.mm`):
Replace your `sourceURLForBridge` method with logic that checks for a local file first.

```objectivec
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  // 1. Path to downloaded update
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *localBundlePath = [[paths firstObject] stringByAppendingPathComponent:@"update.jsbundle"];
  
  // 2. Check if local bundle exists, otherwise use built-in asset
  if ([[NSFileManager defaultManager] fileExistsAtPath:localBundlePath]) {
    return [NSURL fileURLWithPath:localBundlePath];
  } else {
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  }
}
``` 


## 3. Metro Config Paths
In your metro.config.js, you used /mnt/c/... or absolute paths for watchFolders. These will not work on a Mac if you share the repo with others or move to a CI/CD environment.
Fix: Always use path.resolve(__dirname, '...') so the paths are relative to the project root, regardless of the OS.


## 4. Build Schemes (Matching your APP_VARIANT)
You created debug, dev, and release variants for Android. On iOS, you need to create matching Schemes in Xcode:
Open ios/YourProject.xcworkspace in Xcode.
Go to Product > Scheme > Manage Schemes.
Duplicate your main scheme and call it dev.
In the Build Settings of the new scheme, you can add Pre-processor Macros like APP_VARIANT=dev to mirror your Android logic.