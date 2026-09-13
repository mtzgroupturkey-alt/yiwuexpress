# Dependency Injection

Complete guide for setting up Dependency Injection with GetIt.

## Main Injection Container

```dart
// lib/di/app_inject.dart

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/network/network_info.dart';
import '../data/data_sources/api/dio/dio_client.dart';
import '../data/data_sources/local/app_storage.dart';
import '../data/data_sources/local/secure_storage.dart';
import '../model_view/app_config/cubit/language/language_cubit.dart';
import '../model_view/app_config/cubit/theme/theme_cubit.dart';
import 'auth_inject.dart';
import 'user_inject.dart';

final sl = GetIt.instance;

abstract class DIModule {
  Future<void> inject();
}

abstract class DIModuleRegister {
  Future<void> init({Function? onStoreLoaded});
}

class AppInjection extends DIModuleRegister {
  @override
  Future<void> init({Function? onStoreLoaded}) async {
    // ============ Core ============
    
    // SharedPreferences
    final SharedPreferences sharedPreferences =
        await SharedPreferences.getInstance();
    sl.registerLazySingleton(() => sharedPreferences);
    sl.registerLazySingleton(() => AppStorage(sl()));

    // Secure Storage
    sl.registerLazySingleton(() => const FlutterSecureStorage());
    sl.registerLazySingleton(() => SecureStorage(sl()));

    // Callback after storage loaded
    await onStoreLoaded?.call();

    // Network Info
    sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl());

    // Dio
    sl.registerLazySingleton(() => Dio());
    sl.registerLazySingleton(
      () => DioClient(
        dio: sl(),
        secureStorage: sl(),
        appStorage: sl(),
      ),
    );

    // ============ App Config ============
    sl.registerLazySingleton(() => LanguageCubit(sl()));
    sl.registerLazySingleton(() => ThemeCubit(sl()));

    // ============ Feature Modules ============
    await AuthInject().inject();
    await UserInject().inject();
  }
}
```

## Feature-based DI Modules

### Auth Module

```dart
// lib/di/auth_inject.dart

import 'package:get_it/get_it.dart';

import '../data/data_sources/remote/auth_remote_datasource.dart';
import '../data/repositories/auth/auth_repository.dart';
import '../model_view/auth/login/login_cubit.dart';
import '../model_view/auth/register/register_cubit.dart';
import 'app_inject.dart';

class AuthInject extends DIModule {
  @override
  Future<void> inject() async {
    // Data Sources
    sl.registerLazySingleton<AuthRemoteDataSource>(
      () => AuthRemoteDataSourceImpl(dioClient: sl()),
    );

    // Repository
    sl.registerLazySingleton<AuthRepository>(
      () => AuthRepositoryImpl(
        remoteDataSource: sl(),
        networkInfo: sl(),
      ),
    );

    // Cubits - Use registerFactory for BLoCs/Cubits
    sl.registerFactory(() => LoginCubit(sl()));
    sl.registerFactory(() => RegisterCubit(sl()));
  }
}
```

### User Module

```dart
// lib/di/user_inject.dart

import 'package:get_it/get_it.dart';

import '../data/data_sources/remote/user_remote_datasource.dart';
import '../data/repositories/user/user_repository.dart';
import '../model_view/user/profile/profile_cubit.dart';
import 'app_inject.dart';

class UserInject extends DIModule {
  @override
  Future<void> inject() async {
    // Data Sources
    sl.registerLazySingleton<UserRemoteDataSource>(
      () => UserRemoteDataSourceImpl(dioClient: sl()),
    );

    // Repository
    sl.registerLazySingleton<UserRepository>(
      () => UserRepositoryImpl(
        remoteDataSource: sl(),
        networkInfo: sl(),
      ),
    );

    // Cubits
    sl.registerFactory(() => ProfileCubit(sl()));
  }
}
```

## Registration Types

### LazySingleton vs Factory vs Singleton

```dart
// LazySingleton - Created once when first accessed
// Use for: Services, Repositories, Storage
sl.registerLazySingleton(() => MyService());

// Factory - New instance every time
// Use for: BLoCs, Cubits, ViewModels
sl.registerFactory(() => MyCubit(sl()));

// Singleton - Created immediately at registration
// Use for: Config that must exist at startup
sl.registerSingleton(AppConfig());

// Async Factory - For async initialization
sl.registerSingletonAsync<Database>(() async {
  final db = Database();
  await db.init();
  return db;
});
```

## Using DI in Widgets

### With BlocProvider

```dart
// In app_providers.dart
class AppProviders {
  static List<BlocProvider> get providers => [
    BlocProvider<LoginCubit>(create: (_) => sl()),
    BlocProvider<ThemeCubit>(create: (_) => sl()),
  ];
}

// In app_root.dart
MultiBlocProvider(
  providers: AppProviders.providers,
  child: MaterialApp(...),
)
```

### Direct Access

```dart
// Get instance directly
final authRepository = sl<AuthRepository>();

// In widget
@override
Widget build(BuildContext context) {
  return BlocProvider(
    create: (_) => sl<LoginCubit>(),
    child: const LoginPage(),
  );
}
```

### Scoped BlocProvider

```dart
// For page-specific cubit
GoRoute(
  path: '/profile',
  builder: (context, state) => BlocProvider(
    create: (_) => sl<ProfileCubit>()..loadProfile(),
    child: const ProfilePage(),
  ),
),
```

## Multiple Cubits with Dependencies

```dart
// Cubit with multiple dependencies
class AppSettingCubit extends Cubit<AppSettingState> {
  final AccountCubit accountCubit;
  final SecureStorage secureStorage;
  final AppStorage appStorage;

  AppSettingCubit({
    required this.accountCubit,
    required this.secureStorage,
    required this.appStorage,
  }) : super(const AppSettingState());
}

// Registration
sl.registerLazySingleton(
  () => AppSettingCubit(
    accountCubit: sl(),
    secureStorage: sl(),
    appStorage: sl(),
  ),
);
```

## Testing with DI

```dart
// In test setup
void main() {
  setUpAll(() {
    // Register mocks
    sl.registerLazySingleton<AuthRepository>(() => MockAuthRepository());
  });

  tearDownAll(() {
    sl.reset();
  });

  test('login test', () async {
    final cubit = LoginCubit(sl());
    // Test cubit...
  });
}
```

## Best Practices

1. **Use LazySingleton for services** - Shared instances
2. **Use Factory for Cubits/BLoCs** - Fresh instance per screen
3. **Group by feature** - Separate inject files per module
4. **Register interfaces** - `sl.registerLazySingleton<AuthRepository>(...)`
5. **Order matters** - Register dependencies before dependents
6. **Avoid circular dependencies** - Check your DI graph

## Common Patterns

### Feature Provider Pattern

```dart
// For feature with multiple related cubits
class SmartHomeProvider {
  static List<BlocProvider> get providers => [
    BlocProvider<HomesCubit>(create: (_) => sl()),
    BlocProvider<RoomsCubit>(create: (_) => sl()),
    BlocProvider<DevicesCubit>(create: (_) => sl()),
  ];
}

// In app_providers.dart
class AppProviders {
  static List<BlocProvider> get providers => [
    ...baseProviders,
    ...SmartHomeProvider.providers,
    ...AuthProvider.providers,
  ];
}
```

