# Native Splash Screen Setup

Complete guide for configuring flutter_native_splash.

## Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter_native_splash: ^2.4.0
```

## Configuration File

Create `flutter_native_splash.yaml` in project root:

```yaml
flutter_native_splash:
  # Background color (solid color)
  color: "#FFFFFF"
  
  # OR use background image (for gradients)
  # background_image: "assets/splash/splash_bg.png"

  # Splash logo image (centered)
  image: assets/splash/logo.png

  # Dark mode configuration
  color_dark: "#121212"
  image_dark: assets/splash/logo_dark.png

  # Branding image (bottom of screen)
  # branding: assets/splash/branding.png
  # branding_mode: bottom

  # Android 12+ specific settings
  android_12:
    # Icon image (will be clipped to circle)
    image: assets/splash/android12_logo.png
    
    # Background color
    color: "#FFFFFF"
    
    # Icon background color (optional)
    # icon_background_color: "#FFFFFF"
    
    # Dark mode
    color_dark: "#121212"
    image_dark: assets/splash/android12_logo_dark.png

  # Platform toggles
  android: true
  ios: true
  web: true

  # Image positioning
  android_gravity: center
  ios_content_mode: center
  
  # Fullscreen (hide status bar)
  fullscreen: false
```

## Asset Requirements

### Logo Sizes
- **Standard**: 768×768 pixels (4x density)
- **Android 12 with background**: 960×960 pixels (fit within 640px circle)
- **Android 12 without background**: 1152×1152 pixels (fit within 768px circle)

### File Structure
```
assets/
└── splash/
    ├── logo.png              # Main logo
    ├── logo_dark.png         # Dark mode logo
    ├── splash_bg.png         # Background image (optional)
    ├── android12_logo.png    # Android 12 icon
    └── branding.png          # Branding (optional)
```

## Generate Splash Screen

Run after configuration:

```bash
# Generate splash screens
flutter pub run flutter_native_splash:create

# Generate with specific config file
flutter pub run flutter_native_splash:create --path=flutter_native_splash.yaml

# Remove splash (restore default)
flutter pub run flutter_native_splash:remove
```

## Usage in main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

void main() async {
  // Preserve splash screen
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Initialize app (DI, environment, etc.)
  await initializeApp();

  runApp(const MyApp());

  // Remove splash after initialization (with optional delay)
  Future.delayed(const Duration(milliseconds: 500), () {
    FlutterNativeSplash.remove();
  });
}

Future<void> initializeApp() async {
  // Load environment
  await dotenv.load(fileName: ".env");
  
  // Initialize DI
  await AppInjection().init();
  
  // Other initialization...
}
```

## Advanced Configuration

### Platform-Specific Images

```yaml
flutter_native_splash:
  # Android specific
  color_android: "#42a5f5"
  image_android: assets/splash/logo_android.png
  background_image_android: "assets/splash/bg_android.png"
  
  # iOS specific
  color_ios: "#42a5f5"
  image_ios: assets/splash/logo_ios.png
  
  # Web specific
  color_web: "#42a5f5"
  image_web: assets/splash/logo_web.png
```

### Full Example Configuration

```yaml
flutter_native_splash:
  # Light mode
  color: "#FFFFFF"
  image: assets/splash/logo.png
  branding: assets/splash/branding.png
  branding_mode: bottom
  
  # Dark mode
  color_dark: "#121212"
  image_dark: assets/splash/logo_dark.png
  branding_dark: assets/splash/branding_dark.png
  
  # Android 12
  android_12:
    image: assets/splash/android12_icon.png
    color: "#FFFFFF"
    icon_background_color: "#FFFFFF"
    image_dark: assets/splash/android12_icon_dark.png
    color_dark: "#121212"
    icon_background_color_dark: "#121212"
  
  # Settings
  android_gravity: center
  ios_content_mode: center
  fullscreen: false
  
  # Enable for all platforms
  android: true
  ios: true
  web: true
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Splash not updating | Run `flutter clean` then regenerate |
| Image not showing | Check image path and format (PNG only) |
| Android 12 icon cropped | Ensure logo fits within circle specs |
| Dark mode not working | Verify `*_dark` parameters are set |

## Best Practices

1. **Use PNG format** - Only PNG images are supported
2. **Center logo** - Allow padding around logo for different screen sizes
3. **Test both modes** - Verify light and dark mode appearance
4. **Android 12** - Use simpler icon that looks good when clipped to circle
5. **Delay removal** - Small delay (300-600ms) for smoother transition

