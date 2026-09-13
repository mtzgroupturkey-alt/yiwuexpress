# Remote DataSource Pattern

Complete guide for implementing Remote DataSource layer.

## DataSource Structure

```
lib/data/data_sources/remote/
├── auth_remote_datasource.dart
├── user_remote_datasource.dart
├── account_remote_datasource.dart
└── media_remote_datasource.dart
```

## Basic Remote DataSource

### Abstract Class (Interface)

```dart
// lib/data/data_sources/remote/auth_remote_datasource.dart

import '../../models/api/response_model.dart';
import '../../models/auth/login_request.dart';

abstract class AuthRemoteDataSource {
  Future<ResponseModel> login(LoginRequest data);
  Future<ResponseModel> logout();
  Future<ResponseModel> refreshToken(String refreshToken);
  Future<ResponseModel> register(RegisterRequest data);
  Future<ResponseModel> forgotPassword(String phone);
  Future<ResponseModel> resetPassword(ResetPasswordRequest data);
}
```

### Implementation

```dart
// lib/data/data_sources/remote/auth_remote_datasource.dart

import '../api/api_path.dart';
import '../api/dio/dio_client.dart';
import '../../models/api/response_model.dart';
import '../../models/auth/login_request.dart';

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
  Future<ResponseModel> refreshToken(String refreshToken) async {
    final response = await dioClient.instance.post(
      ApiPath.refreshToken,
      data: {'refresh_token': refreshToken},
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> register(RegisterRequest data) async {
    final response = await dioClient.instance.post(
      ApiPath.register,
      data: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> forgotPassword(String phone) async {
    final response = await dioClient.instance.post(
      ApiPath.forgotPassword,
      data: {'phone': phone},
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> resetPassword(ResetPasswordRequest data) async {
    final response = await dioClient.instance.post(
      ApiPath.resetPassword,
      data: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }
}
```

## Account DataSource (Full Example)

```dart
// lib/data/data_sources/remote/account_remote_datasource.dart

import 'dart:io';
import '../../models/api/response_model.dart';
import '../../models/account/account.dart';
import '../../models/account/check_info/check_info.dart';
import '../api/api_path.dart';
import '../api/dio/dio_client.dart';
import 'media_remote_datasource.dart';

abstract class AccountRemoteDataSource {
  Future<ResponseModel> checkInfo(CheckInfoRequest data);
  Future<ResponseModel> getInfo();
  Future<ResponseModel> getAccountInfo();
  Future<ResponseModel> updateProfile(Account params);
  Future<ResponseModel> updateProfileConfirm(Account params);
  Future<ResponseModel> deleteAccount();
}

class AccountRemoteDataSourceImpl implements AccountRemoteDataSource {
  final DioClient dioClient;

  AccountRemoteDataSourceImpl({required this.dioClient});

  @override
  Future<ResponseModel> checkInfo(CheckInfoRequest data) async {
    final response = await dioClient.instance.get(
      ApiPath.checkInfo,
      queryParameters: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> getInfo() async {
    final response = await dioClient.instance.get(ApiPath.info);
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> getAccountInfo() async {
    final response = await dioClient.instance.get(ApiPath.getUserInfo);
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> updateProfile(Account params) async {
    // Upload avatar if provided
    if (params.avatar != null && params.avatar!.startsWith('/')) {
      String? avatarUrl = await _uploadFile(File(params.avatar!));
      params = params.copyWith(avatar: avatarUrl);
    }

    final response = await dioClient.instance.post(
      ApiPath.profileUpdate,
      data: params.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> updateProfileConfirm(Account params) async {
    final response = await dioClient.instance.post(
      ApiPath.profileUpdateConfirm,
      data: params.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> deleteAccount() async {
    final response = await dioClient.instance.post(ApiPath.deleteAccount);
    return ResponseModel.fromJson(response.data);
  }

  // Private helper method
  Future<String?> _uploadFile(File file) async {
    try {
      final mediaDataSource = MediaRemoteDataSourceImpl();
      final response = await mediaDataSource.uploadFile(file);
      return response.data['files'][0];
    } catch (e) {
      return null;
    }
  }
}
```

## Media Upload DataSource

```dart
// lib/data/data_sources/remote/media_remote_datasource.dart

import 'dart:io';
import 'package:dio/dio.dart';
import '../api/api_path.dart';
import '../../models/api/response_model.dart';
import '../../../core/environment/environment.dart';

abstract class MediaRemoteDataSource {
  Future<ResponseModel> uploadFile(File file);
  Future<ResponseModel> uploadMultipleFiles(List<File> files);
}

class MediaRemoteDataSourceImpl implements MediaRemoteDataSource {
  final Dio _dio = Dio();

  MediaRemoteDataSourceImpl() {
    _dio.options.baseUrl = Environment.instance.serverMediaUrl;
    _dio.options.headers = {
      'Accept': 'application/json',
    };
  }

  @override
  Future<ResponseModel> uploadFile(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
    });

    final response = await _dio.post(
      ApiPath.uploadFile,
      data: formData,
    );

    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> uploadMultipleFiles(List<File> files) async {
    final formData = FormData();
    
    for (var file in files) {
      formData.files.add(MapEntry(
        'files',
        await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
      ));
    }

    final response = await _dio.post(
      ApiPath.uploadFile,
      data: formData,
    );

    return ResponseModel.fromJson(response.data);
  }
}
```

## CRUD DataSource Template

```dart
// lib/data/data_sources/remote/item_remote_datasource.dart

abstract class ItemRemoteDataSource {
  // Create
  Future<ResponseModel> create(CreateItemRequest data);
  
  // Read
  Future<ResponseModel> getById(int id);
  Future<ResponseModel> getList({int page = 1, int limit = 20});
  Future<ResponseModel> search(String query);
  
  // Update
  Future<ResponseModel> update(int id, UpdateItemRequest data);
  
  // Delete
  Future<ResponseModel> delete(int id);
}

class ItemRemoteDataSourceImpl implements ItemRemoteDataSource {
  final DioClient dioClient;

  ItemRemoteDataSourceImpl({required this.dioClient});

  @override
  Future<ResponseModel> create(CreateItemRequest data) async {
    final response = await dioClient.instance.post(
      '/items',
      data: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> getById(int id) async {
    final response = await dioClient.instance.get('/items/$id');
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> getList({int page = 1, int limit = 20}) async {
    final response = await dioClient.instance.get(
      '/items',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> search(String query) async {
    final response = await dioClient.instance.get(
      '/items/search',
      queryParameters: {'q': query},
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> update(int id, UpdateItemRequest data) async {
    final response = await dioClient.instance.put(
      '/items/$id',
      data: data.toJson(),
    );
    return ResponseModel.fromJson(response.data);
  }

  @override
  Future<ResponseModel> delete(int id) async {
    final response = await dioClient.instance.delete('/items/$id');
    return ResponseModel.fromJson(response.data);
  }
}
```

## Response Model

```dart
// lib/data/models/api/response_model.dart

class ResponseModel {
  final bool? success;
  final int? statusCode;
  final int? errorCode;
  final String? message;
  final dynamic data;

  ResponseModel({
    this.success,
    this.statusCode,
    this.errorCode,
    this.message,
    this.data,
  });

  factory ResponseModel.fromJson(Map<String, dynamic> json) {
    return ResponseModel(
      success: json['success'],
      statusCode: json['statusCode'],
      errorCode: json['errorCode'],
      message: json['message'],
      data: json['data'],
    );
  }

  bool get isSuccess => success == true;
  bool get isError => success != true;
}
```

## DI Registration

```dart
// lib/di/account_inject.dart

class AccountInject extends DIModule {
  @override
  Future<void> inject() async {
    // Data Source
    sl.registerLazySingleton<AccountRemoteDataSource>(
      () => AccountRemoteDataSourceImpl(dioClient: sl()),
    );

    // Repository
    sl.registerLazySingleton<AccountRepository>(
      () => AccountRepositoryImpl(
        remoteDataSource: sl(),
        networkInfo: sl(),
      ),
    );

    // Cubits
    sl.registerFactory(() => AccountCubit(sl()));
  }
}
```

## Best Practices

1. **Abstract first** - Always define interface before implementation
2. **Return ResponseModel** - Let repository handle success/error mapping
3. **Keep simple** - DataSource only does HTTP calls
4. **No business logic** - Logic belongs in Repository
5. **Inject DioClient** - Use DI for testability

