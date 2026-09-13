# BLoC/Cubit Example

Complete guide for implementing BLoC/Cubit state management with freezed.

## When to Use Cubit vs BLoC

| Use Cubit | Use BLoC |
|-----------|----------|
| Simple state changes | Complex event handling |
| Direct method calls | Event-driven architecture |
| Less boilerplate | More traceability |
| Most use cases | Analytics, logging needed |

## Cubit Implementation

### State with Freezed

```dart
// lib/model_view/auth/login/login_state.dart

part of 'login_cubit.dart';

@freezed
class LoginState with _$LoginState {
  const factory LoginState({
    @Default(false) bool isLoading,
    @Default(null) LoginResponse? loginResponse,
    @Default(null) String? errorMessage,
  }) = _LoginState;

  factory LoginState.fromJson(Map<String, dynamic> json) =>
      _$LoginStateFromJson(json);
}
```

### Cubit

```dart
// lib/model_view/auth/login/login_cubit.dart

import 'package:dartz/dartz.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../data/data_sources/api/error/failures.dart';
import '../../../data/models/auth/login_request.dart';
import '../../../data/models/auth/login_response.dart';
import '../../../data/repositories/auth/auth_repository.dart';

part 'login_state.dart';
part 'login_cubit.freezed.dart';
part 'login_cubit.g.dart';

class LoginCubit extends Cubit<LoginState> {
  final AuthRepository authRepository;

  LoginCubit(this.authRepository) : super(const LoginState());

  Future<Either<Failure, LoginResponse>> login(LoginRequest data) async {
    emit(state.copyWith(isLoading: true, errorMessage: null));

    final response = await authRepository.login(data);

    response.fold(
      (failure) => emit(state.copyWith(
        isLoading: false,
        errorMessage: failure.message,
      )),
      (loginResponse) => emit(state.copyWith(
        isLoading: false,
        loginResponse: loginResponse,
      )),
    );

    return response;
  }

  void clearError() {
    emit(state.copyWith(errorMessage: null));
  }

  void reset() {
    emit(const LoginState());
  }
}
```

## BLoC Implementation (Alternative)

### Events

```dart
// lib/model_view/auth/login/login_event.dart

part of 'login_bloc.dart';

@freezed
class LoginEvent with _$LoginEvent {
  const factory LoginEvent.login(LoginRequest request) = _Login;
  const factory LoginEvent.logout() = _Logout;
  const factory LoginEvent.clearError() = _ClearError;
}
```

### State

```dart
// lib/model_view/auth/login/login_state.dart

part of 'login_bloc.dart';

@freezed
class LoginState with _$LoginState {
  const factory LoginState.initial() = _Initial;
  const factory LoginState.loading() = _Loading;
  const factory LoginState.success(LoginResponse response) = _Success;
  const factory LoginState.failure(String message) = _Failure;
}
```

### BLoC

```dart
// lib/model_view/auth/login/login_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../data/models/auth/login_request.dart';
import '../../../data/models/auth/login_response.dart';
import '../../../data/repositories/auth/auth_repository.dart';

part 'login_event.dart';
part 'login_state.dart';
part 'login_bloc.freezed.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  final AuthRepository authRepository;

  LoginBloc(this.authRepository) : super(const LoginState.initial()) {
    on<_Login>(_onLogin);
    on<_Logout>(_onLogout);
    on<_ClearError>(_onClearError);
  }

  Future<void> _onLogin(_Login event, Emitter<LoginState> emit) async {
    emit(const LoginState.loading());

    final result = await authRepository.login(event.request);

    result.fold(
      (failure) => emit(LoginState.failure(failure.message)),
      (response) => emit(LoginState.success(response)),
    );
  }

  Future<void> _onLogout(_Logout event, Emitter<LoginState> emit) async {
    emit(const LoginState.initial());
  }

  void _onClearError(_ClearError event, Emitter<LoginState> emit) {
    emit(const LoginState.initial());
  }
}
```

## Usage in Widget

### With Cubit

```dart
// lib/views/auth/login/login_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../model_view/auth/login/login_cubit.dart';
import '../../../data/models/auth/login_request.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<LoginCubit, LoginState>(
        listenWhen: (previous, current) =>
            previous.loginResponse != current.loginResponse ||
            previous.errorMessage != current.errorMessage,
        listener: (context, state) {
          if (state.loginResponse != null) {
            // Navigate to home
            Navigator.pushReplacementNamed(context, '/home');
          }
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!)),
            );
          }
        },
        builder: (context, state) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: state.isLoading ? null : _onLogin,
                    child: state.isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Login'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _onLogin() {
    final request = LoginRequest(
      phone: _phoneController.text,
      password: _passwordController.text,
    );
    context.read<LoginCubit>().login(request);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

### With BLoC

```dart
// Using pattern matching with freezed states
BlocBuilder<LoginBloc, LoginState>(
  builder: (context, state) {
    return state.when(
      initial: () => const LoginForm(),
      loading: () => const CircularProgressIndicator(),
      success: (response) => Text('Welcome ${response.user.name}'),
      failure: (message) => ErrorWidget(message: message),
    );
  },
),
```

## Generate Code

Run build_runner to generate freezed files:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Or watch mode:

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## Best Practices

1. **Use `copyWith` for state updates** - Never mutate state directly
2. **Keep states immutable** - Use freezed for guaranteed immutability
3. **Separate concerns** - One Cubit/BLoC per feature
4. **Handle loading states** - Show feedback during async operations
5. **Handle errors gracefully** - Always provide error messages

