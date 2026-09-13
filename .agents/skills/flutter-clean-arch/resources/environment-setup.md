# Environment Setup

Complete guide for managing multiple environments with flutter_dotenv.

## File Structure

```
project_root/
├── .env                  # Active environment (git-ignored)
├── .env.example          # Template (committed)
├── .env.development      # Dev config (optional, git-ignored)
├── .env.staging          # Staging config (optional, git-ignored)
├── .env.production       # Prod config (optional, git-ignored)
└── lib/
    └── core/
        └── environment/
            └── environment.dart
```

## .env File

```bash
# Production
API_URL=https://api.example.com/
SOCKET_URL=wss://api.example.com
SOCKET_PORT=3333
API_KEY=YOUR_PRODUCTION_API_KEY
MEDIA_URL=https://media.example.com

# Staging
API_URL_STAGING=https://staging-api.example.com/
SOCKET_URL_STAGING=wss://staging-api.example.com
SOCKET_PORT_STAGING=3333
API_KEY_STAGING=YOUR_STAGING_API_KEY
MEDIA_URL_STAGING=https://staging-media.example.com

# Development
API_URL_DEV=https://dev-api.example.com/
SOCKET_URL_DEV=wss://dev-api.example.com
SOCKET_PORT_DEV=3333
API_KEY_DEV=YOUR_DEV_API_KEY
MEDIA_URL_DEV=https://dev-media.example.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASHLYTICS=true
DEBUG_MODE=false
```

## .env.example (for version control)

```bash
# Copy this file to .env and fill in your values

# Production
API_URL=
SOCKET_URL=
SOCKET_PORT=
API_KEY=
MEDIA_URL=

# Staging
API_URL_STAGING=
SOCKET_URL_STAGING=
SOCKET_PORT_STAGING=
API_KEY_STAGING=
MEDIA_URL_STAGING=

# Development
API_URL_DEV=
SOCKET_URL_DEV=
SOCKET_PORT_DEV=
API_KEY_DEV=
MEDIA_URL_DEV=

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASHLYTICS=true
DEBUG_MODE=false
```

## Environment Class

```dart
// lib/core/environment/environment.dart

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

enum Flavor { development, staging, production }

abstract class Env {
  final String serverApiUrl;
  final String serverSocketUrl;
  final int serverSocketPort;
  final String apiKey;
  final String serverMediaUrl;
  final int connectTimeout;
  final int receiveTimeout;

  Env({
    required this.serverApiUrl,
    required this.serverSocketUrl,
    required this.serverSocketPort,
    required this.apiKey,
    required this.serverMediaUrl,
    required this.connectTimeout,
    required this.receiveTimeout,
  });
}

class Environment extends Env {
  final Flavor flavor;

  static Environment? _instance;

  static Environment get instance {
    _instance ??= Environment._production();
    return _instance!;
  }

  Environment._({
    required super.serverApiUrl,
    required super.serverSocketUrl,
    required super.serverSocketPort,
    required super.apiKey,
    required super.serverMediaUrl,
    required this.flavor,
    required super.connectTimeout,
    required super.receiveTimeout,
  });

  Environment._development()
      : this._(
          serverApiUrl: "${dotenv.env['API_URL_DEV']}",
          serverSocketUrl: "${dotenv.env['SOCKET_URL_DEV']}",
          serverSocketPort: int.parse("${dotenv.env['SOCKET_PORT_DEV']}"),
          apiKey: "${dotenv.env['API_KEY_DEV']}",
          serverMediaUrl: "${dotenv.env['MEDIA_URL_DEV']}",
          flavor: Flavor.development,
          connectTimeout: 30,
          receiveTimeout: 30,
        );

  Environment._staging()
      : this._(
          serverApiUrl: "${dotenv.env['API_URL_STAGING']}",
          serverSocketUrl: "${dotenv.env['SOCKET_URL_STAGING']}",
          serverSocketPort: int.parse("${dotenv.env['SOCKET_PORT_STAGING']}"),
          apiKey: "${dotenv.env['API_KEY_STAGING']}",
          serverMediaUrl: "${dotenv.env['MEDIA_URL_STAGING']}",
          flavor: Flavor.staging,
          connectTimeout: 30,
          receiveTimeout: 30,
        );

  Environment._production()
      : this._(
          serverApiUrl: "${dotenv.env['API_URL']}",
          serverSocketUrl: "${dotenv.env['SOCKET_URL']}",
          serverSocketPort: int.parse("${dotenv.env['SOCKET_PORT']}"),
          apiKey: "${dotenv.env['API_KEY']}",
          serverMediaUrl: "${dotenv.env['MEDIA_URL']}",
          flavor: Flavor.production,
          connectTimeout: kDebugMode ? 15 : 30,
          receiveTimeout: kDebugMode ? 15 : 30,
        );

  /// Initialize environment with [Flavor]
  static void init({Flavor? flavor}) {
    switch (flavor) {
      case Flavor.development:
        _instance = Environment._development();
        break;
      case Flavor.staging:
        _instance = Environment._staging();
        break;
      case Flavor.production:
      default:
        _instance = Environment._production();
        break;
    }
  }

  /// Return current flavor name
  static String flavorName() => _instance?.flavor.name ?? "";

  /// Create environment with specific flavor
  static Environment withFlavor(Flavor flavor) {
    switch (flavor) {
      case Flavor.development:
        return Environment._development();
      case Flavor.staging:
        return Environment._staging();
      case Flavor.production:
      default:
        return Environment._production();
    }
  }

  // Environment checks
  static bool isProduction() => _instance?.flavor == Flavor.production;
  static bool isStaging() => _instance?.flavor == Flavor.staging;
  static bool isDevelopment() => _instance?.flavor == Flavor.development;
}
```

## Usage in main.dart

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'app_root.dart';
import 'core/environment/environment.dart';
import 'di/app_inject.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env file
  await dotenv.load(fileName: ".env");

  // Initialize DI
  await AppInjection().init(onStoreLoaded: () async {
    // Get saved flavor from storage or default to production
    final appStorage = sl<AppStorage>();
    String? serverType = appStorage.getServerType();
    
    Flavor flavor = Flavor.production;
    if (serverType != null) {
      flavor = Flavor.values.firstWhere(
        (e) => e.name == serverType,
        orElse: () => Flavor.production,
      );
    }

    Environment.init(flavor: flavor);
    print("Environment: ${Environment.flavorName()}");
    print("API URL: ${Environment.instance.serverApiUrl}");
  });

  runApp(const AppRoot());
}
```

## Feature Flags

```dart
// lib/core/config/feature_flags.dart

import 'package:flutter_dotenv/flutter_dotenv.dart';

class FeatureFlags {
  static bool get analyticsEnabled =>
      dotenv.env['ENABLE_ANALYTICS']?.toLowerCase() == 'true';

  static bool get crashlyticsEnabled =>
      dotenv.env['ENABLE_CRASHLYTICS']?.toLowerCase() == 'true';

  static bool get debugMode =>
      dotenv.env['DEBUG_MODE']?.toLowerCase() == 'true';
}
```

## pubspec.yaml Configuration

```yaml
flutter:
  assets:
    - .env
```

## .gitignore

```gitignore
# Environment files
.env
.env.development
.env.staging
.env.production

# Keep template
!.env.example
```

## Environment Switcher (Debug Only)

```dart
// lib/core/widgets/environment_switcher.dart

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

class EnvironmentSwitcher extends StatelessWidget {
  const EnvironmentSwitcher({super.key});

  @override
  Widget build(BuildContext context) {
    // Only show in debug mode
    if (!kDebugMode) return const SizedBox.shrink();

    return Positioned(
      top: 50,
      right: 10,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: _getColor(),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          Environment.flavorName().toUpperCase(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Color _getColor() {
    switch (Environment.instance.flavor) {
      case Flavor.development:
        return Colors.green;
      case Flavor.staging:
        return Colors.orange;
      case Flavor.production:
        return Colors.red;
    }
  }
}
```

## Best Practices

1. **Never commit `.env`** - Add to .gitignore
2. **Provide `.env.example`** - Template for new developers
3. **Use typed accessors** - Wrap dotenv in Environment class
4. **Validate at startup** - Check required variables exist
5. **Use compile-time constants** - For sensitive production keys

