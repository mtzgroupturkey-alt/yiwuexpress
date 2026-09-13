# Freezed & JSON Serializable

Complete guide for code generation with freezed and json_serializable.

## Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

dev_dependencies:
  build_runner: ^2.4.9
  freezed: ^2.5.0
  json_serializable: ^6.8.0
```

## Model with Freezed + JSON

### Basic Model

```dart
// lib/data/models/user/user_model.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required int id,
    required String name,
    String? email,
    String? phone,
    String? avatar,
    @Default(false) bool isActive,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
```

### Model with JSON Key Mapping

```dart
// lib/data/models/auth/login_response.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'login_response.freezed.dart';
part 'login_response.g.dart';

@freezed
class LoginResponse with _$LoginResponse {
  const factory LoginResponse({
    @JsonKey(name: 'access_token') required String accessToken,
    @JsonKey(name: 'refresh_token') required String refreshToken,
    @JsonKey(name: 'expires_in') int? expiresIn,
    @JsonKey(name: 'token_type') @Default('Bearer') String tokenType,
    UserModel? user,
  }) = _LoginResponse;

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);
}
```

### Request Model (No Freezed)

```dart
// lib/data/models/auth/login_request.dart

import 'package:json_annotation/json_annotation.dart';

part 'login_request.g.dart';

@JsonSerializable()
class LoginRequest {
  final String phone;
  final String password;
  @JsonKey(name: 'country_code')
  final String? countryCode;
  @JsonKey(name: 'device_id')
  final String? deviceId;

  LoginRequest({
    required this.phone,
    required this.password,
    this.countryCode,
    this.deviceId,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) =>
      _$LoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}
```

## State with Freezed

### Cubit State

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

### BLoC State with Union Types

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

// Usage in widget:
state.when(
  initial: () => const LoginForm(),
  loading: () => const CircularProgressIndicator(),
  success: (response) => Text('Welcome ${response.user?.name}'),
  failure: (message) => ErrorWidget(message: message),
);

// Or with maybeWhen:
state.maybeWhen(
  loading: () => const CircularProgressIndicator(),
  orElse: () => const LoginForm(),
);
```

### BLoC Events

```dart
// lib/model_view/auth/login/login_event.dart

part of 'login_bloc.dart';

@freezed
class LoginEvent with _$LoginEvent {
  const factory LoginEvent.login(LoginRequest request) = _Login;
  const factory LoginEvent.logout() = _Logout;
  const factory LoginEvent.refreshToken() = _RefreshToken;
}
```

## Complex Models

### Nested Models

```dart
@freezed
class HomeModel with _$HomeModel {
  const factory HomeModel({
    required int id,
    required String name,
    @Default([]) List<RoomModel> rooms,
    @Default([]) List<DeviceModel> devices,
    AddressModel? address,
  }) = _HomeModel;

  factory HomeModel.fromJson(Map<String, dynamic> json) =>
      _$HomeModelFromJson(json);
}

@freezed
class RoomModel with _$RoomModel {
  const factory RoomModel({
    required int id,
    required String name,
    String? icon,
  }) = _RoomModel;

  factory RoomModel.fromJson(Map<String, dynamic> json) =>
      _$RoomModelFromJson(json);
}
```

### Enum Handling

```dart
enum UserRole {
  @JsonValue('admin')
  admin,
  @JsonValue('member')
  member,
  @JsonValue('guest')
  guest,
}

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required int id,
    required String name,
    @Default(UserRole.member) UserRole role,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
```

### Custom Converters

```dart
class DateTimeConverter implements JsonConverter<DateTime, String> {
  const DateTimeConverter();

  @override
  DateTime fromJson(String json) => DateTime.parse(json);

  @override
  String toJson(DateTime object) => object.toIso8601String();
}

@freezed
class EventModel with _$EventModel {
  const factory EventModel({
    required int id,
    required String title,
    @DateTimeConverter() required DateTime createdAt,
    @DateTimeConverter() DateTime? updatedAt,
  }) = _EventModel;

  factory EventModel.fromJson(Map<String, dynamic> json) =>
      _$EventModelFromJson(json);
}
```

## Methods and Getters

```dart
@freezed
class UserModel with _$UserModel {
  const UserModel._(); // Required for custom methods

  const factory UserModel({
    required int id,
    required String? firstName,
    required String? lastName,
    String? email,
  }) = _UserModel;

  // Custom getter
  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  // Custom method
  bool get hasEmail => email != null && email!.isNotEmpty;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
```

## JSON Serializable Options

### Global Configuration

Create `build.yaml` in project root:

```yaml
targets:
  $default:
    builders:
      json_serializable:
        options:
          # Include fields with null values
          include_if_null: false
          # Explicit to JSON
          explicit_to_json: true
          # Field rename strategy
          field_rename: snake
```

### Per-Class Configuration

```dart
@JsonSerializable(
  includeIfNull: false,
  explicitToJson: true,
  fieldRename: FieldRename.snake,
)
class MyModel {
  // ...
}
```

## CopyWith Usage

```dart
final user = UserModel(id: 1, name: 'John');

// Create modified copy
final updatedUser = user.copyWith(name: 'Jane');

// Nullify optional field
final noEmail = user.copyWith(email: null);
```

## Best Practices

1. **Use `part` directives** - Required for code generation
2. **Request models** - Use `@JsonSerializable` only (no freezed) for simpler toJson
3. **Response models** - Use `@freezed` for immutability and copyWith
4. **State classes** - Always use `@freezed` for BLoC/Cubit states
5. **Private constructor** - Add `const ClassName._();` for custom methods

