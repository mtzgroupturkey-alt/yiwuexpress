# iOS Permissions

Complete guide for configuring iOS permissions in Info.plist.

## Info.plist Configuration

```xml
<!-- ios/Runner/Info.plist -->

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Information -->
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>My App</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>my_app</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$(FLUTTER_BUILD_NAME)</string>
    <key>CFBundleVersion</key>
    <string>$(FLUTTER_BUILD_NUMBER)</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>

    <!-- URL Schemes for Deep Linking -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>CFBundleURLName</key>
            <string>myapp.com</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>myapp</string>
            </array>
        </dict>
    </array>

    <!-- Enable Flutter Deep Linking -->
    <key>FlutterDeepLinkingEnabled</key>
    <true/>

    <!-- === PERMISSIONS === -->

    <!-- Camera Permission -->
    <key>NSCameraUsageDescription</key>
    <string>This app needs camera access to take photos for your profile and scan QR codes.</string>

    <!-- Photo Library Permission -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>This app needs access to your photo library to select profile pictures.</string>

    <!-- Photo Library Add Permission (iOS 11+) -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>This app needs permission to save photos to your library.</string>

    <!-- Location Permissions -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs your location for weather updates and nearby services.</string>
    
    <key>NSLocationAlwaysUsageDescription</key>
    <string>This app needs your location to provide location-based features.</string>
    
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>This app needs your location for continuous location-based services.</string>

    <!-- Bluetooth Permissions -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>This app needs Bluetooth to connect to smart devices.</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>This app needs Bluetooth to communicate with smart devices.</string>

    <!-- Local Network Permission (iOS 14+) -->
    <key>NSLocalNetworkUsageDescription</key>
    <string>This app needs local network access to discover and control smart devices on your network.</string>

    <!-- Microphone Permission -->
    <key>NSMicrophoneUsageDescription</key>
    <string>This app needs microphone access for voice commands.</string>

    <!-- Face ID Permission -->
    <key>NSFaceIDUsageDescription</key>
    <string>This app uses Face ID for secure authentication.</string>

    <!-- Contacts Permission -->
    <key>NSContactsUsageDescription</key>
    <string>This app needs access to contacts to share with family members.</string>

    <!-- === APP CONFIGURATION === -->

    <!-- Disable 120Hz display issues (iOS 15+) -->
    <key>CADisableMinimumFrameDurationOnPhone</key>
    <true/>

    <!-- File Sharing -->
    <key>LSSupportsOpeningDocumentsInPlace</key>
    <true/>
    <key>UIFileSharingEnabled</key>
    <true/>

    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
        <!-- Add these if needed -->
        <!-- <string>bluetooth-central</string> -->
        <!-- <string>location</string> -->
    </array>

    <!-- Launch Screen -->
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIMainStoryboardFile</key>
    <string>Main</string>

    <!-- Status Bar -->
    <key>UIStatusBarHidden</key>
    <false/>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>

    <!-- Supported Orientations (iPhone) -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <!-- Add these for landscape support -->
        <!-- <string>UIInterfaceOrientationLandscapeLeft</string> -->
        <!-- <string>UIInterfaceOrientationLandscapeRight</string> -->
    </array>

    <!-- Supported Orientations (iPad) -->
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>

    <!-- Indirect Input Events -->
    <key>UIApplicationSupportsIndirectInputEvents</key>
    <true/>

    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <!-- For production: Remove this entire dict to enforce HTTPS -->
        <!-- For development: Allow local network -->
        <key>NSAllowsLocalNetworking</key>
        <true/>
        <!-- Only if absolutely needed -->
        <!-- <key>NSAllowsArbitraryLoads</key> -->
        <!-- <true/> -->
    </dict>

</dict>
</plist>
```

## Permission Descriptions Best Practices

| Permission | Good Description |
|------------|------------------|
| Camera | "This app needs camera access to take photos for your profile and scan QR codes." |
| Photos | "This app needs access to your photo library to select profile pictures." |
| Location | "This app needs your location for weather updates and nearby services." |
| Bluetooth | "This app needs Bluetooth to connect to and control smart home devices." |
| Microphone | "This app needs microphone access for voice commands and video calls." |
| Face ID | "This app uses Face ID for quick and secure login." |

## Entitlements Configuration

```xml
<!-- ios/Runner/Runner.entitlements -->

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Push Notifications -->
    <key>aps-environment</key>
    <string>development</string>
    
    <!-- App Groups (for shared data) -->
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.example.myapp</string>
    </array>
    
    <!-- Keychain Access Groups -->
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.example.myapp</string>
    </array>
    
    <!-- Associated Domains (for Universal Links) -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:myapp.com</string>
    </array>
</dict>
</plist>
```

## Podfile Configuration

```ruby
# ios/Podfile

platform :ios, '12.0'

ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

def flutter_root
  generated_xcode_build_settings_path = File.expand_path(File.join('..', 'Flutter', 'Generated.xcconfig'), __FILE__)
  unless File.exist?(generated_xcode_build_settings_path)
    raise "#{generated_xcode_build_settings_path} must exist."
  end

  File.foreach(generated_xcode_build_settings_path) do |line|
    matches = line.match(/FLUTTER_ROOT\=(.*)/)
    return matches[1].strip if matches
  end
  raise "FLUTTER_ROOT not found"
end

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '12.0'
    end
  end
end
```

## Common Permission Combinations

| Feature | Required Keys |
|---------|---------------|
| Camera + Photos | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` |
| Location | `NSLocationWhenInUseUsageDescription` |
| Background Location | Above + `NSLocationAlwaysAndWhenInUseUsageDescription` + `UIBackgroundModes: location` |
| Bluetooth | `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription` |
| Push Notifications | `UIBackgroundModes: remote-notification` + entitlements |
| Local Network | `NSLocalNetworkUsageDescription` |

