# Dio Setup

Complete guide for setting up Dio HTTP client with interceptors.

## DioClient

```dart
// lib/data/data_sources/api/dio/dio_client.dart

import 'package:dio/dio.dart';
import '../../local/app_storage.dart';
import '../../local/secure_storage.dart';
import '../../../core/environment/environment.dart';
import 'dio_auth_interceptor.dart';
import 'dio_logging.dart';

class DioClient {
  final Dio dio;
  final SecureStorage secureStorage;
  final AppStorage appStorage;

  DioClient({
    required this.dio,
    required this.secureStorage,
    required this.appStorage,
  }) {
    setupDio();
  }

  void setupDio() {
    BaseOptions options = BaseOptions(
      baseUrl: Environment.instance.serverApiUrl,
      connectTimeout: Duration(seconds: Environment.instance.connectTimeout),
      receiveTimeout: Duration(seconds: Environment.instance.receiveTimeout),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': Environment.instance.apiKey,
      },
    );

    dio.options = options;

    dio.interceptors.addAll([
      DioAuthInterceptor(
        dio: dio,
        secureStorage: secureStorage,
        appStorage: appStorage,
      ),
      DioLogging(),
    ]);
  }

  Dio get instance => dio;
}
```

## DioLogging Interceptor

```dart
// lib/data/data_sources/api/dio/dio_logging.dart

import 'package:dio/dio.dart';
import 'package:nconsole/nconsole.dart';

class DioLogging extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    NConsole.groupCollapsed(
      '%c${options.method.toUpperCase()} ${options.path}',
      'color: green',
    );
    NConsole.log('time: ${DateTime.now()}');

    if (options.method.toLowerCase() == 'get') {
      NConsole.log('queryParameters:', options.queryParameters);
    } else {
      NConsole.log('data:', options.data);
    }
    NConsole.groupEnd();
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    NConsole.groupCollapsed(
      '%cRESPONSE[${response.statusCode}] ${response.requestOptions.method.toUpperCase()} ${response.requestOptions.path}',
      'color: DodgerBlue',
    );
    NConsole.log('message:', response.statusMessage);
    NConsole.log('time: ${DateTime.now()}');
    NConsole.log('data:', response.data);
    NConsole.groupEnd();
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    NConsole.groupCollapsed(
      '%cERROR[${err.response?.statusCode}] ${err.requestOptions.method.toUpperCase()} ${err.requestOptions.path}',
      'color: red',
    );
    NConsole.log('message:', err.message);
    NConsole.log('headers:', err.response?.headers);
    NConsole.log('params:', err.response?.requestOptions.queryParameters);
    NConsole.log('data:', err.response?.data);
    NConsole.groupEnd();
    super.onError(err, handler);
  }
}
```

## DioAuthInterceptor

```dart
// lib/data/data_sources/api/dio/dio_auth_interceptor.dart

import 'dart:async';
import 'package:dio/dio.dart';
import '../../local/secure_storage.dart';
import '../../local/app_storage.dart';
import '../api_path.dart';

class DioAuthInterceptor extends InterceptorsWrapper {
  final Dio dio;
  final SecureStorage secureStorage;
  final AppStorage appStorage;
  static Completer<String?>? _refreshTokenCompleter;

  DioAuthInterceptor({
    required this.dio,
    required this.secureStorage,
    required this.appStorage,
  });

  @override
  Future onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    String? accessToken = await secureStorage.getToken();

    // Set language header
    String currentLanguage = appStorage.getLanguage();
    options.headers['Accept-Language'] = 
        currentLanguage == 'vi' ? 'vi-VN' : 'en-US';

    if (accessToken == null) {
      return super.onRequest(options, handler);
    }

    options.headers['Authorization'] = 'Bearer $accessToken';

    return handler.next(options);
  }

  @override
  Future onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    // Handle token expired (customize based on your API)
    if (response.data['errorCode'] == 699 ||
        (response.data['statusCode'] == 401)) {
      
      String? newToken;

      if (_refreshTokenCompleter == null) {
        _refreshTokenCompleter = Completer<String?>();
        newToken = await _refreshToken();
      } else {
        newToken = await _refreshTokenCompleter!.future;
      }

      _refreshTokenCompleter = null;

      if (newToken != null) {
        final options = Options(
          method: response.requestOptions.method,
          headers: {
            ...response.requestOptions.headers,
            'Authorization': 'Bearer $newToken',
          },
        );

        try {
          final res = await dio.request(
            response.requestOptions.path,
            data: response.requestOptions.data,
            queryParameters: response.requestOptions.queryParameters,
            options: options,
          );

          return handler.next(res);
        } catch (error) {
          // Handle retry error
        }
      }
    }

    return super.onResponse(response, handler);
  }

  Future<String?> _refreshToken() async {
    String? refreshToken = await secureStorage.getRefreshToken();
    
    if (refreshToken == null) {
      _refreshTokenCompleter?.complete(null);
      return null;
    }

    try {
      Response response = await dio.post(
        ApiPath.refreshToken,
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        String accessToken = response.data['data']['access_token'];
        String newRefreshToken = response.data['data']['refresh_token'];
        
        await secureStorage.setToken(accessToken);
        await secureStorage.setRefreshToken(newRefreshToken);

        _refreshTokenCompleter?.complete(accessToken);
        return accessToken;
      }
    } catch (e) {
      // Handle refresh error
    }

    _refreshTokenCompleter?.complete(null);
    return null;
  }
}
```

## API Path

```dart
// lib/data/data_sources/api/api_path.dart

class ApiPath {
  // Auth
  static String login = "/auth/login";
  static String logout = "/auth/logout";
  static String refreshToken = "/auth/refresh-token";
  static String register = "/auth/register";
  
  // User
  static String userInfo = "/user/info";
  static String updateProfile = "/user/update-profile";
  
  // Add more endpoints...
}
```

## Failures

```dart
// lib/data/data_sources/api/error/failures.dart

import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  @override
  List<Object> get props => [];
}

enum ErrorCode {
  requestTimeout,
  lostInternet,
  serverError,
  unauthorized,
  other,
}

class ServerFailure extends Failure {
  final String? errorMessage;
  final ErrorCode? errorCode;

  ServerFailure({this.errorMessage, this.errorCode});
  
  @override
  List<Object?> get props => [errorMessage, errorCode];
}

class InternetFailure extends Failure {}

class CacheFailure extends Failure {}

extension FailureExtension on Failure {
  String get message {
    if (this is CacheFailure) {
      return 'Cache error';
    }
    if (this is InternetFailure) {
      return 'No internet connection';
    }
    if (this is ServerFailure) {
      final error = this as ServerFailure;
      if (error.errorMessage != null) {
        return error.errorMessage!;
      }
      switch (error.errorCode) {
        case ErrorCode.requestTimeout:
          return 'Request timeout';
        case ErrorCode.lostInternet:
          return 'Lost internet connection';
        case ErrorCode.serverError:
          return 'Server error';
        default:
          return 'Unknown error';
      }
    }
    return 'Unknown error';
  }
}
```

## Response Model

```dart
// lib/data/models/api/response_model.dart

class ResponseModel {
  final bool? success;
  final int? statusCode;
  final String? message;
  final dynamic data;

  ResponseModel({
    this.success,
    this.statusCode,
    this.message,
    this.data,
  });

  factory ResponseModel.fromJson(Map<String, dynamic> json) {
    return ResponseModel(
      success: json['success'],
      statusCode: json['statusCode'],
      message: json['message'],
      data: json['data'],
    );
  }
}
```

## Usage Example

```dart
// In remote data source
class AuthRemoteDataSourceImpl extends AuthRemoteDataSource {
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
}
```

