# Navigation Setup

Complete guide for setting up GoRouter navigation.

## Basic Setup

```dart
// lib/route/app_route.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../data/data_sources/local/app_storage.dart';
import '../views/auth/login/login_page.dart';
import '../views/home/home_page.dart';
import '../views/onboarding/onboarding_page.dart';
import '../di/app_inject.dart';

part 'app_route_path.dart';

final GlobalKey<NavigatorState> rootNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> shellNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'shell');

class AppRoute {
  static final appStorage = sl<AppStorage>();

  static bool get isFirstRun => appStorage.getFirstInstall();

  static GoRouter router = GoRouter(
    debugLogDiagnostics: true,
    navigatorKey: rootNavigatorKey,
    initialLocation: isFirstRun 
        ? AppRoutePath.onboarding 
        : AppRoutePath.home,
    routes: [
      // Onboarding
      GoRoute(
        path: AppRoutePath.onboarding,
        builder: (context, state) => const OnboardingPage(),
      ),

      // Auth routes
      GoRoute(
        path: AppRoutePath.login,
        builder: (context, state) => const LoginPage(),
      ),

      // Main app with bottom navigation
      ShellRoute(
        navigatorKey: shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutePath.home,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const HomePage(),
              key: ValueKey(state.matchedLocation),
            ),
          ),
          GoRoute(
            path: AppRoutePath.settings,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const SettingsPage(),
              key: ValueKey(state.matchedLocation),
            ),
          ),
        ],
      ),

      // Detail routes with parameters
      GoRoute(
        path: '${AppRoutePath.profile}/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return ProfilePage(userId: userId);
        },
      ),

      // Routes with extra data
      GoRoute(
        path: AppRoutePath.deviceDetail,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return DeviceDetailPage(
            deviceId: extra['deviceId'],
            deviceName: extra['deviceName'],
          );
        },
      ),
    ],

    // Error handling
    errorBuilder: (context, state) => ErrorPage(error: state.error),

    // Redirect logic
    redirect: (context, state) {
      final isLoggedIn = sl<SecureStorage>().hasToken;
      final isLoggingIn = state.matchedLocation == AppRoutePath.login;
      final isOnboarding = state.matchedLocation == AppRoutePath.onboarding;

      // Skip redirect for onboarding
      if (isOnboarding) return null;

      // Redirect to login if not logged in
      if (!isLoggedIn && !isLoggingIn) {
        return AppRoutePath.login;
      }

      // Redirect to home if already logged in
      if (isLoggedIn && isLoggingIn) {
        return AppRoutePath.home;
      }

      return null;
    },
  );
}
```

## Route Paths

```dart
// lib/route/app_route_path.dart

part of 'app_route.dart';

class AppRoutePath {
  // Auth
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';

  // Main
  static const String home = '/';
  static const String settings = '/settings';
  static const String profile = '/profile';

  // Features
  static const String deviceDetail = '/device-detail';
  static const String roomDetail = '/room-detail';
  static const String notifications = '/notifications';

  // Nested routes
  static const String accountSettings = '/settings/account';
  static const String appSettings = '/settings/app';
}
```

## Navigation Methods

### Basic Navigation

```dart
// Push to route
context.go('/home');

// Push with path parameters
context.go('/profile/123');

// Push with extra data
context.go(
  '/device-detail',
  extra: {
    'deviceId': device.id,
    'deviceName': device.name,
  },
);

// Pop current route
context.pop();

// Push and replace
context.pushReplacement('/home');

// Go back to specific route
context.goNamed('home');
```

### Named Routes

```dart
// Define named route
GoRoute(
  name: 'profile',
  path: '/profile/:userId',
  builder: (context, state) {
    return ProfilePage(userId: state.pathParameters['userId']!);
  },
),

// Navigate using name
context.goNamed(
  'profile',
  pathParameters: {'userId': '123'},
  queryParameters: {'tab': 'settings'},
);
```

## Bottom Navigation Shell

```dart
// lib/views/main_shell.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainShell extends StatelessWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _getCurrentIndex(context),
        onTap: (index) => _onTap(context, index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/settings')) return 1;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/settings');
        break;
    }
  }
}
```

## Deep Linking

### Android Setup

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity ...>
    <meta-data 
        android:name="flutter_deeplinking_enabled" 
        android:value="true" />
    
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data 
            android:scheme="https" 
            android:host="myapp.com" 
            android:pathPrefix="/" />
        <data android:scheme="myapp" />
    </intent-filter>
</activity>
```

### iOS Setup

```xml
<!-- ios/Runner/Info.plist -->
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
<key>FlutterDeepLinkingEnabled</key>
<true/>
```

## Page Transitions

```dart
// Custom transition
GoRoute(
  path: '/details',
  pageBuilder: (context, state) => CustomTransitionPage(
    child: const DetailsPage(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: animation.drive(
          Tween(begin: const Offset(1, 0), end: Offset.zero),
        ),
        child: child,
      );
    },
  ),
),

// No transition (for tab switching)
GoRoute(
  path: '/home',
  pageBuilder: (context, state) => NoTransitionPage(
    child: const HomePage(),
    key: ValueKey(state.matchedLocation),
  ),
),

// Fade transition
GoRoute(
  path: '/fade',
  pageBuilder: (context, state) => CustomTransitionPage(
    child: const FadePage(),
    transitionsBuilder: (context, animation, _, child) {
      return FadeTransition(opacity: animation, child: child);
    },
  ),
),
```

## Route Guards

```dart
// Check authentication before route
GoRoute(
  path: '/protected',
  redirect: (context, state) {
    final isLoggedIn = sl<SecureStorage>().hasToken;
    if (!isLoggedIn) {
      return '/login?redirect=${state.matchedLocation}';
    }
    return null;
  },
  builder: (context, state) => const ProtectedPage(),
),
```

## Usage in MaterialApp

```dart
// lib/app_root.dart

MaterialApp.router(
  routerConfig: AppRoute.router,
  // other properties...
)
```

