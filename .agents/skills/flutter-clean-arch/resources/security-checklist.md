# Security Checklist

Security best practices for Flutter applications.

## Secure Storage

### ✅ Use FlutterSecureStorage for Sensitive Data

```dart
// lib/data/data_sources/local/secure_storage.dart

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final FlutterSecureStorage storage;

  SecureStorage(this.storage);

  // Tokens
  Future<String?> getToken() async {
    try {
      return await storage.read(key: 'access_token');
    } catch (_) {
      await clearAll();
      return null;
    }
  }

  Future<void> setToken(String? token) async {
    await storage.write(key: 'access_token', value: token);
  }

  Future<void> clearAll() async {
    await storage.deleteAll();
  }
}
```

### ✅ Clear Secure Storage on First Install

```dart
SecureStorage(this.storage, {bool isFirstInstall = false}) {
  if (isFirstInstall) {
    clearAll();
  }
}
```

## Network Security

### ✅ Enforce HTTPS

**Android** (network_security_config.xml):
```xml
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

**iOS** (Info.plist):
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <!-- No NSAllowsArbitraryLoads = HTTPS enforced -->
</dict>
```

### ✅ Certificate Pinning (Optional)

```dart
// For high-security apps
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'dart:io';

void setupCertificatePinning(Dio dio) {
  (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
    final client = HttpClient();
    client.badCertificateCallback = (cert, host, port) {
      // Add your certificate validation logic
      return false;
    };
    return client;
  };
}
```

## API Security

### ✅ API Key Protection

```dart
// Store API key in .env, not in code
class Environment {
  static String get apiKey => dotenv.env['API_KEY'] ?? '';
}

// Add to headers
options.headers['X-API-KEY'] = Environment.instance.apiKey;
```

### ✅ Token Refresh with Race Condition Protection

```dart
class DioAuthInterceptor extends InterceptorsWrapper {
  static Completer<String?>? _refreshTokenCompleter;

  Future<String?> refreshToken() async {
    // Prevent multiple simultaneous refresh calls
    if (_refreshTokenCompleter != null) {
      return _refreshTokenCompleter!.future;
    }

    _refreshTokenCompleter = Completer<String?>();
    
    try {
      // Refresh logic...
      _refreshTokenCompleter?.complete(newToken);
      return newToken;
    } finally {
      _refreshTokenCompleter = null;
    }
  }
}
```

## Code Obfuscation

### ✅ Enable ProGuard (Android)

```groovy
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 
                      'proguard-rules.pro'
    }
}
```

### ✅ Flutter Obfuscation

```bash
# Build with obfuscation
flutter build apk --obfuscate --split-debug-info=./debug-info
flutter build ios --obfuscate --split-debug-info=./debug-info
```

## Keystore Security

### ✅ Secure Keystore Storage

```properties
# android/key.properties (NEVER COMMIT)
storePassword=your_password
keyPassword=your_key_password
keyAlias=your_alias
storeFile=../keystore/release.jks
```

Add to `.gitignore`:
```gitignore
android/key.properties
*.jks
*.keystore
```

## Input Validation

### ✅ Validate All User Input

```dart
class Validators {
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Invalid email format';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }

  static String? sanitizeInput(String input) {
    // Remove potential XSS/injection characters
    return input.replaceAll(RegExp(r'[<>"\']'), '');
  }
}
```

## Biometric Authentication

### ✅ Face ID / Fingerprint

```dart
// pubspec.yaml: local_auth: ^2.1.0

import 'package:local_auth/local_auth.dart';

class BiometricAuth {
  final LocalAuthentication _auth = LocalAuthentication();

  Future<bool> authenticate() async {
    final canCheck = await _auth.canCheckBiometrics;
    if (!canCheck) return false;

    try {
      return await _auth.authenticate(
        localizedReason: 'Authenticate to access the app',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }
}
```

## Debug Protection

### ✅ Disable Debug Features in Release

```dart
import 'package:flutter/foundation.dart';

// Only enable in debug mode
if (kDebugMode) {
  NConsole.isEnable = true;
  // Enable debug logging
}

// Disable in release
if (kReleaseMode) {
  // Disable all logging
  debugPrint = (String? message, {int? wrapWidth}) {};
}
```

## Backup Rules

### ✅ Exclude Sensitive Data from Backup

**Android** (backup_rules.xml):
```xml
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="FlutterSecureStorage"/>
    <exclude domain="database" path="*.db"/>
</full-backup-content>
```

## Security Checklist

| Category | Item | Status |
|----------|------|--------|
| **Storage** | Use FlutterSecureStorage for tokens | ☐ |
| **Storage** | Clear storage on first install | ☐ |
| **Network** | Enforce HTTPS | ☐ |
| **Network** | Disable cleartext traffic | ☐ |
| **API** | Store API keys in .env | ☐ |
| **API** | Implement token refresh | ☐ |
| **Build** | Enable ProGuard | ☐ |
| **Build** | Enable Flutter obfuscation | ☐ |
| **Keystore** | Secure keystore file | ☐ |
| **Keystore** | Add to .gitignore | ☐ |
| **Input** | Validate all user input | ☐ |
| **Input** | Sanitize input data | ☐ |
| **Debug** | Disable logging in release | ☐ |
| **Backup** | Exclude sensitive data | ☐ |

## Common Vulnerabilities to Avoid

| Vulnerability | Prevention |
|---------------|------------|
| Hardcoded secrets | Use .env files |
| Cleartext traffic | Enforce HTTPS |
| Debug logging in production | Check kReleaseMode |
| Insecure token storage | Use FlutterSecureStorage |
| Missing input validation | Validate all inputs |
| Exposed API keys | Add to .gitignore |

