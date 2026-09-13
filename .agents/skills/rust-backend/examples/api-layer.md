# API Layer

HTTP handlers using poem-openapi for REST API with auto-generated OpenAPI documentation.

## Controller Pattern

```rust
// bin/api-server/src/api/users.rs
use poem::http::StatusCode;
use poem::{Error as PoemError, Result as PoemResult};
use poem_openapi::{param::Path, param::Query, payload::Json, Object, OpenApi, Tags};
use serde::{Deserialize, Serialize};
use services::{NewUser, UserFilter, UserRepository, UserService, UserServiceError};
use domain::UserId;

// ========== TAGS ==========

#[derive(Tags)]
enum ApiTags {
    /// User management endpoints
    Users,
}

// ========== REQUEST/RESPONSE DTOs ==========

#[derive(Debug, Clone, Serialize, Object)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub is_active: bool,
}

impl From<domain::User> for UserResponse {
    fn from(user: domain::User) -> Self {
        Self {
            id: user.id().to_string(),
            email: user.email().to_string(),
            name: user.name().map(|s| s.to_string()),
            is_active: user.is_active(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Object)]
pub struct CreateUserRequest {
    /// User email address
    #[oai(validator(max_length = 255))]
    pub email: String,
    /// Optional display name
    #[oai(validator(max_length = 100))]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Object)]
pub struct UpdateUserRequest {
    /// New display name
    #[oai(validator(max_length = 100))]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Object)]
pub struct ListResponse<T: poem_openapi::types::Type + Send + Sync> {
    pub data: Vec<T>,
    pub total: usize,
}

// ========== CONTROLLER ==========

pub struct UserController<R>
where
    R: UserRepository + Clone + Send + Sync + 'static,
{
    service: UserService<R>,
}

impl<R> UserController<R>
where
    R: UserRepository + Clone + Send + Sync + 'static,
{
    pub fn new(service: UserService<R>) -> Self {
        Self { service }
    }
}

#[OpenApi]
impl<R> UserController<R>
where
    R: UserRepository + Clone + Send + Sync + 'static,
{
    /// Create a new user
    #[oai(path = "/users", method = "post", tag = "ApiTags::Users")]
    async fn create_user(
        &self,
        body: Json<CreateUserRequest>,
    ) -> PoemResult<Json<UserResponse>> {
        let user = self
            .service
            .create_user(NewUser {
                email: body.0.email,
                name: body.0.name,
            })
            .await
            .map_err(map_service_error)?;

        Ok(Json(user.into()))
    }

    /// Get user by ID
    #[oai(path = "/users/:id", method = "get", tag = "ApiTags::Users")]
    async fn get_user(
        &self,
        /// User ID (UUID format)
        id: Path<String>,
    ) -> PoemResult<Json<UserResponse>> {
        let user_id = parse_uuid(&id.0)?;
        let user = self
            .service
            .get_user(user_id)
            .await
            .map_err(map_service_error)?;

        Ok(Json(user.into()))
    }

    /// List all users
    #[oai(path = "/users", method = "get", tag = "ApiTags::Users")]
    async fn list_users(
        &self,
        /// Include inactive users
        #[oai(name = "include_inactive")] include_inactive: Query<Option<bool>>,
        /// Maximum number of results
        #[oai(name = "limit")] limit: Query<Option<usize>>,
    ) -> PoemResult<Json<ListResponse<UserResponse>>> {
        let filter = UserFilter {
            include_inactive: include_inactive.0.unwrap_or(false),
            limit: limit.0,
            ..Default::default()
        };

        let users = self
            .service
            .list_users(&filter)
            .await
            .map_err(map_service_error)?;

        let total = users.len();
        let data: Vec<UserResponse> = users.into_iter().map(Into::into).collect();

        Ok(Json(ListResponse { data, total }))
    }

    /// Update user
    #[oai(path = "/users/:id", method = "patch", tag = "ApiTags::Users")]
    async fn update_user(
        &self,
        id: Path<String>,
        body: Json<UpdateUserRequest>,
    ) -> PoemResult<Json<UserResponse>> {
        let user_id = parse_uuid(&id.0)?;
        let user = self
            .service
            .rename_user(user_id, body.0.name)
            .await
            .map_err(map_service_error)?;

        Ok(Json(user.into()))
    }

    /// Deactivate user
    #[oai(path = "/users/:id/deactivate", method = "post", tag = "ApiTags::Users")]
    async fn deactivate_user(&self, id: Path<String>) -> PoemResult<Json<UserResponse>> {
        let user_id = parse_uuid(&id.0)?;
        let user = self
            .service
            .deactivate_user(user_id)
            .await
            .map_err(map_service_error)?;

        Ok(Json(user.into()))
    }

    /// Delete user
    #[oai(path = "/users/:id", method = "delete", tag = "ApiTags::Users")]
    async fn delete_user(&self, id: Path<String>) -> PoemResult<()> {
        let user_id = parse_uuid(&id.0)?;
        self.service
            .delete_user(user_id)
            .await
            .map_err(map_service_error)?;

        Ok(())
    }
}

// ========== ERROR MAPPING ==========

fn map_service_error(error: UserServiceError) -> PoemError {
    match error {
        UserServiceError::Domain(err) => {
            tracing::warn!("Domain error: {}", err);
            PoemError::from_string(err.to_string(), StatusCode::BAD_REQUEST)
        }
        UserServiceError::NotFound { id } => {
            tracing::warn!("User not found: {}", id);
            PoemError::from_status(StatusCode::NOT_FOUND)
        }
        UserServiceError::Repository(err) => {
            tracing::error!("Repository error: {}", err);
            PoemError::from_string(
                "Internal server error".to_string(),
                StatusCode::INTERNAL_SERVER_ERROR,
            )
        }
    }
}

fn parse_uuid(s: &str) -> PoemResult<UserId> {
    let uuid = uuid::Uuid::parse_str(s).map_err(|_| {
        PoemError::from_string("Invalid UUID format".to_string(), StatusCode::BAD_REQUEST)
    })?;
    Ok(UserId::from_uuid(uuid))
}
```

## Route Builder

```rust
// bin/api-server/src/api/mod.rs
use poem::{handler, Route};
use services::{UserRepository, ProductRepository};

pub mod users;
pub mod products;

#[handler]
async fn health() -> &'static str {
    "OK"
}

pub fn build_routes<UR, PR>(
    user_service: services::UserService<UR>,
    product_service: services::ProductService<PR>,
) -> Route
where
    UR: UserRepository + Clone + Send + Sync + 'static,
    PR: ProductRepository + Clone + Send + Sync + 'static,
{
    let user_api = users::UserController::new(user_service);
    let product_api = products::ProductController::new(product_service);

    Route::new()
        .nest("/users", user_api)
        .nest("/products", product_api)
        .at("/health", poem::get(health))
}
```

## Server Setup with OpenAPI

```rust
// bin/api-server/src/lib.rs
use database::{DatabaseContext, UserSeaOrmRepository, ProductSeaOrmRepository};
use services::{UserService, ProductService};
use poem::{listener::TcpListener, Route, Server, EndpointExt};
use poem_openapi::OpenApiService;

pub mod api;
pub mod cmd;

pub async fn serve(args: cmd::Args) -> anyhow::Result<()> {
    tracing::info!("Starting server on port {}", args.port);

    // 1. Database connection
    let db = DatabaseContext::connect(&args.database_url, true).await?;

    // 2. Repositories
    let user_repo = UserSeaOrmRepository::new(db.connection.clone());
    let product_repo = ProductSeaOrmRepository::new(db.connection.clone());

    // 3. Services
    let user_service = UserService::new(user_repo);
    let product_service = ProductService::new(product_repo);

    // 4. API controllers
    let user_api = api::users::UserController::new(user_service);
    let product_api = api::products::ProductController::new(product_service);

    // 5. OpenAPI service
    let api_service = OpenApiService::new((user_api, product_api), "My API", "1.0.0")
        .server(format!("http://localhost:{}/api", args.port));
    
    let swagger_ui = api_service.swagger_ui();
    let openapi_spec = api_service.spec_endpoint();

    // 6. Build app
    let app = Route::new()
        .nest("/api", api_service)
        .nest("/docs", swagger_ui)
        .at("/openapi.json", openapi_spec)
        .with(poem::middleware::Tracing);

    // 7. Start server
    tracing::info!("Swagger UI: http://localhost:{}/docs", args.port);
    Server::new(TcpListener::bind(format!("0.0.0.0:{}", args.port)))
        .run(app)
        .await?;

    Ok(())
}
```

## CLI Arguments

```rust
// bin/api-server/src/cmd/mod.rs
use clap::Parser;

#[derive(Parser, Debug)]
#[command(name = "api-server")]
#[command(about = "REST API Server")]
pub struct Args {
    /// Server port
    #[arg(short, long, env = "PORT", default_value = "3000")]
    pub port: u16,

    /// Database URL
    #[arg(long, env = "DATABASE_URL")]
    pub database_url: String,

    /// Log level
    #[arg(long, env = "RUST_LOG", default_value = "info")]
    pub log_level: String,
}
```

## Main Entry Point

```rust
// bin/api-server/src/main.rs
use clap::Parser;
use api_server::{cmd::Args, serve};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file
    dotenv::dotenv().ok();

    // Parse arguments
    let args = Args::parse();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(args.log_level.parse()?),
        )
        .init();

    // Start server
    serve(args).await
}
```

## Generic Response Wrapper

```rust
// bin/api-server/src/api/response.rs
use poem_openapi::Object;
use serde::Serialize;

#[derive(Debug, Serialize, Object)]
pub struct ApiResponse<T: poem_openapi::types::Type + Send + Sync> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: poem_openapi::types::Type + Send + Sync> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.into()),
        }
    }
}
```

## Middleware Example

```rust
// bin/api-server/src/gateway/middleware.rs
use poem::{Endpoint, Request, Response, Result, Middleware};
use std::time::Instant;

pub struct RequestLogger;

impl<E: Endpoint> Middleware<E> for RequestLogger {
    type Output = RequestLoggerEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        RequestLoggerEndpoint { ep }
    }
}

pub struct RequestLoggerEndpoint<E> {
    ep: E,
}

impl<E: Endpoint> Endpoint for RequestLoggerEndpoint<E> {
    type Output = Response;

    async fn call(&self, req: Request) -> Result<Self::Output> {
        let method = req.method().clone();
        let path = req.uri().path().to_string();
        let start = Instant::now();

        let res = self.ep.call(req).await;
        let duration = start.elapsed();

        match &res {
            Ok(response) => {
                tracing::info!(
                    method = %method,
                    path = %path,
                    status = %response.status().as_u16(),
                    duration_ms = duration.as_millis() as u64,
                    "Request completed"
                );
            }
            Err(err) => {
                tracing::error!(
                    method = %method,
                    path = %path,
                    error = %err,
                    duration_ms = duration.as_millis() as u64,
                    "Request failed"
                );
            }
        }

        res.map(|r| r.into_response())
    }
}
```

```rust
// Usage in server setup
let app = Route::new()
    .nest("/api", api_service)
    .with(RequestLogger)
    .with(poem::middleware::Tracing);
```
