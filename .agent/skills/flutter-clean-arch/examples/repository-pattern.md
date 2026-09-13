# Repository Pattern

Implementation of Repository pattern with Either for error handling.

## Repository Interface

```dart
// lib/data/repositories/auth/auth_repository.dart

import 'package:dartz/dartz.dart';

import '../../data_sources/api/error/failures.dart';
import '../../models/auth/login_request.dart';
import '../../models/auth/login_response.dart';

abstract class AuthRepository {
  Future<Either<Failure, LoginResponse>> login(LoginRequest data);
  Future<Either<Failure, bool>> logout();
  Future<Either<Failure, bool>> checkPhoneExists(String phone);
  Future<Either<Failure, void>> updatePassword(String oldPassword, String newPassword);
}
```

## Repository Implementation

```dart
// lib/data/repositories/auth/auth_repository.dart

import 'package:dartz/dartz.dart';

import '../../data_sources/api/error/failures.dart';
import '../../data_sources/remote/auth_remote_datasource.dart';
import '../../models/auth/login_request.dart';
import '../../models/auth/login_response.dart';
import '../../../core/network/network_info.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, LoginResponse>> login(LoginRequest data) async {
    // Check network connection
    final isConnected = await networkInfo.isConnected;
    if (!isConnected) {
      return Left(InternetFailure());
    }

    try {
      final response = await remoteDataSource.login(data);

      if (response.success == true) {
        return Right(LoginResponse.fromJson(response.data));
      } else {
        return Left(ServerFailure(errorMessage: response.message));
      }
    } catch (e) {
      return Left(ServerFailure(errorMessage: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> logout() async {
    final isConnected = await networkInfo.isConnected;
    if (!isConnected) {
      return Left(InternetFailure());
    }

    try {
      final response = await remoteDataSource.logout();
      
      if (response.success == true) {
        return const Right(true);
      } else {
        return Left(ServerFailure(errorMessage: response.message));
      }
    } catch (e) {
      return Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, bool>> checkPhoneExists(String phone) async {
    final isConnected = await networkInfo.isConnected;
    if (!isConnected) {
      return Left(InternetFailure());
    }

    try {
      final response = await remoteDataSource.checkPhoneExists(phone);

      if (response.success == true) {
        return const Right(true);
      } else if (response.statusCode == 404) {
        return const Right(false);
      } else {
        return Left(ServerFailure(errorMessage: response.message));
      }
    } catch (e) {
      return Left(ServerFailure());
    }
  }

  @override
  Future<Either<Failure, void>> updatePassword(
    String oldPassword,
    String newPassword,
  ) async {
    final isConnected = await networkInfo.isConnected;
    if (!isConnected) {
      return Left(InternetFailure());
    }

    try {
      final response = await remoteDataSource.updatePassword(
        oldPassword,
        newPassword,
      );

      if (response.success == true) {
        return const Right(null);
      } else {
        return Left(ServerFailure(errorMessage: response.message));
      }
    } catch (e) {
      return Left(ServerFailure());
    }
  }
}
```

## Remote Data Source

```dart
// lib/data/data_sources/remote/auth_remote_datasource.dart

import '../../models/api/response_model.dart';
import '../../models/auth/login_request.dart';
import '../api/api_path.dart';
import '../api/dio/dio_client.dart';

abstract class AuthRemoteDataSource {
  Future<ResponseModel> login(LoginRequest data);
  Future<ResponseModel> logout();
  Future<ResponseModel> checkPhoneExists(String phone);
  Future<ResponseModel> updatePassword(String oldPassword, String newPassword);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final DioClient dioClient;

  AuthRemoteDataSourceImpl({required this.dioClient});

  @override
  Future<ResponseModel> login(LoginRequest data) async {
    final response = await dioClient.instance.post(
      ApiPath.login,
      data: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> logout() async {
    final response = await dioClient.instance.post(ApiPath.logout);
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> checkPhoneExists(String phone) async {
    final response = await dioClient.instance.get(
      ApiPath.checkPhoneExists,
      queryParameters: {'phone': phone},
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> updatePassword(
    String oldPassword,
    String newPassword,
  ) async {
    final response = await dioClient.instance.post(
      ApiPath.updatePassword,
      data: {
        'old_password': oldPassword,
        'new_password': newPassword,
      },
    );
    return ResponseModel.fromJson(response.data);
  }
}
```

## Network Info

```dart
// lib/core/network/network_info.dart

import 'dart:io';

abstract class NetworkInfo {
  Future<bool> get isConnected;
}

class NetworkInfoImpl implements NetworkInfo {
  @override
  Future<bool> get isConnected async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      return false;
    }
  }
}
```

## Models with JSON Serialization

### Login Request

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

  LoginRequest({
    required this.phone,
    required this.password,
    this.countryCode,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) =>
      _$LoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}
```

### Login Response

```dart
// lib/data/models/auth/login_response.dart

import 'package:json_annotation/json_annotation.dart';

part 'login_response.g.dart';

@JsonSerializable()
class LoginResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;
  
  @JsonKey(name: 'refresh_token')
  final String refreshToken;
  
  final UserInfo? user;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);

  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

@JsonSerializable()
class UserInfo {
  final int id;
  final String? name;
  final String? email;
  final String? phone;
  final String? avatar;

  UserInfo({
    required this.id,
    this.name,
    this.email,
    this.phone,
    this.avatar,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) =>
      _$UserInfoFromJson(json);

  Map<String, dynamic> toJson() => _$UserInfoToJson(this);
}
```

## Using Either in Cubit

```dart
// In cubit
Future<void> login(LoginRequest data) async {
  emit(state.copyWith(isLoading: true));

  final result = await authRepository.login(data);

  result.fold(
    (failure) => emit(state.copyWith(
      isLoading: false,
      errorMessage: failure.message,
    )),
    (response) async {
      // Save tokens
      await secureStorage.setToken(response.accessToken);
      await secureStorage.setRefreshToken(response.refreshToken);

      emit(state.copyWith(
        isLoading: false,
        loginResponse: response,
      ));
    },
  );
}
```

## Best Practices

1. **Always check network** before making API calls
2. **Use abstract classes** for testability
3. **Return Either** for explicit error handling
4. **Keep data sources simple** - just API calls
5. **Repository handles business logic** - validation, transformation

