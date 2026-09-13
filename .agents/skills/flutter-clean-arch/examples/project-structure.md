# Project Structure

Complete directory structure for Flutter Clean Architecture project.

## Full Structure

```
project_root/
├── .env                               # Environment variables (do not commit)
├── .env.example                       # Environment template
├── pubspec.yaml
├── analysis_options.yaml
│
├── android/
│   └── app/
│       ├── build.gradle              # Android build config
│       └── src/main/
│           └── AndroidManifest.xml   # Permissions
│
├── ios/
│   └── Runner/
│       └── Info.plist                # iOS permissions
│
├── assets/
│   ├── images/
│   ├── svg/
│   ├── l10n/                         # Localization files
│   │   ├── intl_en.arb
│   │   └── intl_vi.arb
│   └── cert/                         # SSL certificates (if needed)
│
└── lib/
    ├── main.dart
    ├── app_root.dart
    ├── app_providers.dart
    │
    ├── core/
    │   ├── environment/
    │   │   └── environment.dart
    │   ├── constants/
    │   │   └── app_constants.dart
    │   ├── theme/
    │   │   ├── app_theme.dart
    │   │   └── app_colors.dart
    │   └── widgets/
    │       ├── loading_widget.dart
    │       └── error_widget.dart
    │
    ├── utils/
    │   ├── helpers/
    │   │   └── date_helper.dart
    │   ├── extensions/
    │   │   ├── string_extension.dart
    │   │   └── context_extension.dart
    │   └── validators/
    │       └── form_validators.dart
    │
    ├── data/
    │   ├── data_sources/
    │   │   ├── api/
    │   │   │   ├── api_path.dart
    │   │   │   ├── dio/
    │   │   │   │   ├── dio_client.dart
    │   │   │   │   ├── dio_logging.dart
    │   │   │   │   └── dio_auth_interceptor.dart
    │   │   │   └── error/
    │   │   │       ├── failures.dart
    │   │   │       └── exceptions.dart
    │   │   ├── local/
    │   │   │   ├── app_storage.dart
    │   │   │   ├── secure_storage.dart
    │   │   │   └── storage_keys.dart
    │   │   └── remote/
    │   │       ├── auth_remote_datasource.dart
    │   │       └── user_remote_datasource.dart
    │   │
    │   ├── models/
    │   │   ├── api/
    │   │   │   └── response_model.dart
    │   │   ├── auth/
    │   │   │   ├── login_request.dart
    │   │   │   ├── login_request.g.dart
    │   │   │   ├── login_response.dart
    │   │   │   └── login_response.g.dart
    │   │   └── user/
    │   │       ├── user_model.dart
    │   │       └── user_model.g.dart
    │   │
    │   └── repositories/
    │       ├── auth/
    │       │   └── auth_repository.dart
    │       └── user/
    │           └── user_repository.dart
    │
    ├── model_view/
    │   ├── app_config/
    │   │   └── cubit/
    │   │       ├── language/
    │   │       │   ├── language_cubit.dart
    │   │       │   └── language_state.dart
    │   │       └── theme/
    │   │           ├── theme_cubit.dart
    │   │           └── theme_state.dart
    │   ├── auth/
    │   │   ├── login/
    │   │   │   ├── login_cubit.dart
    │   │   │   ├── login_state.dart
    │   │   │   └── login_cubit.freezed.dart
    │   │   └── register/
    │   │       ├── register_cubit.dart
    │   │       └── register_state.dart
    │   └── home/
    │       └── home_cubit.dart
    │
    ├── views/
    │   ├── auth/
    │   │   ├── login/
    │   │   │   ├── login_page.dart
    │   │   │   └── widgets/
    │   │   │       └── login_form.dart
    │   │   └── register/
    │   │       └── register_page.dart
    │   ├── home/
    │   │   ├── home_page.dart
    │   │   └── widgets/
    │   └── onboarding/
    │       └── onboarding_page.dart
    │
    ├── di/
    │   ├── app_inject.dart
    │   ├── auth_inject.dart
    │   └── user_inject.dart
    │
    ├── route/
    │   ├── app_route.dart
    │   └── app_route_path.dart
    │
    └── generated/
        └── l10n/
            └── l10n.dart
```

## Key Files Description

### Entry Point (`main.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

import 'app_root.dart';
import 'core/environment/environment.dart';
import 'di/app_inject.dart';

void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Load environment
  await dotenv.load(fileName: ".env");

  // Initialize DI
  await AppInjection().init();

  // Initialize environment
  Environment.init(flavor: Flavor.production);

  runApp(const AppRoot());

  // Remove splash after short delay
  Future.delayed(const Duration(milliseconds: 600), () {
    FlutterNativeSplash.remove();
  });
}
```

### App Root (`app_root.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'app_providers.dart';
import 'generated/l10n/l10n.dart';
import 'model_view/app_config/cubit/language/language_cubit.dart';
import 'model_view/app_config/cubit/theme/theme_cubit.dart';
import 'route/app_route.dart';

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: AppProviders.providers,
      child: BlocBuilder<LanguageCubit, LanguageState>(
        builder: (context, state) {
          final themeMode = context.watch<ThemeCubit>().state.themeMode;

          return MaterialApp.router(
            title: 'My App',
            debugShowCheckedModeBanner: false,
            theme: ThemeData.light(),
            darkTheme: ThemeData.dark(),
            themeMode: themeMode,
            localizationsDelegates: const [
              S.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: S.delegate.supportedLocales,
            locale: state.locale,
            routerConfig: AppRoute.router,
          );
        },
      ),
    );
  }
}
```

### App Providers (`app_providers.dart`)

```dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import 'model_view/app_config/cubit/language/language_cubit.dart';
import 'model_view/app_config/cubit/theme/theme_cubit.dart';
import 'model_view/auth/login/login_cubit.dart';

final sl = GetIt.instance;

class AppProviders {
  static List<BlocProvider> get providers => [
    BlocProvider<LanguageCubit>(create: (_) => sl()),
    BlocProvider<ThemeCubit>(create: (_) => sl()),
    BlocProvider<LoginCubit>(create: (_) => sl()),
  ];
}
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page | `*_page.dart` | `login_page.dart` |
| Widget | `*_widget.dart` or descriptive | `login_form.dart` |
| Cubit | `*_cubit.dart` | `login_cubit.dart` |
| State | `*_state.dart` | `login_state.dart` |
| Repository | `*_repository.dart` | `auth_repository.dart` |
| DataSource | `*_remote_datasource.dart` | `auth_remote_datasource.dart` |
| Model | `*_model.dart` or `*_request.dart` | `user_model.dart` |
| DI Module | `*_inject.dart` | `auth_inject.dart` |

