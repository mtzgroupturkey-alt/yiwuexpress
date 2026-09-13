---
name: rust-backend
description: Build robust backend services with Rust using Clean Architecture. Use when creating APIs, microservices, or server applications with domain-driven design, repository pattern, and async operations.
---

# Rust Backend Development

Build production-ready backend services with Rust following Clean Architecture principles: Domain-Driven Design, Repository Pattern, and layered separation of concerns.

## When to Use This Skill

- Building REST APIs or gRPC services with Rust
- Creating microservices with clean architecture
- Implementing domain-driven design patterns
- Setting up database layers with SeaORM
- Writing async services with proper error handling

## Examples & Resources

### Examples
- [Project Structure](examples/project-structure.md) - Workspace layout and Cargo.toml setup
- [Domain Layer](examples/domain-layer.md) - Entities, value objects, and domain errors
- [Service Layer](examples/service-layer.md) - Business logic and repository traits
- [Database Layer](examples/database-layer.md) - SeaORM repository implementations
- [API Layer](examples/api-layer.md) - HTTP handlers with poem-openapi
- [Docker Packaging](examples/docker-packaging.md) - Multi-stage builds and deployment

### Resources
- [Cargo.toml Template](resources/cargo-template.toml) - Workspace dependencies

## Architecture Overview

```
project/
├── Cargo.toml              # Workspace root
├── bin/                    # Binaries (API servers, CLI tools)
│   └── api-server/
│       ├── src/
│       │   ├── main.rs     # Entry point
│       │   ├── lib.rs      # Server setup
│       │   ├── api/        # HTTP handlers
│       │   └── cmd/        # CLI arguments
└── lib/                    # Libraries (business logic)
    ├── domain/             # Entities, value objects, errors
    ├── services/           # Business logic, repository traits
    └── database/           # Repository implementations
```

## Layer Responsibilities

| Layer | Responsibility | Dependencies |
|-------|----------------|--------------|
| `bin/` | Entry points, server setup | services, database |
| `lib/domain` | Entities, value objects, errors | None (pure Rust) |
| `lib/services` | Business logic, repository traits | domain |
| `lib/database` | Repository implementations | domain, services |

> [!IMPORTANT]
> Dependencies flow inward: `bin → services → domain`. Domain layer has NO external dependencies.

## Quick Start

### 1. Entity Pattern

```rust
// lib/domain/src/entities/user.rs
#[derive(Debug, Clone, PartialEq)]
pub struct User {
    id: UserId,
    email: String,
    name: Option<String>,
    is_active: bool,
}

impl User {
    pub fn new(id: UserId, email: impl Into<String>, name: Option<String>) -> Result<Self, DomainError> {
        let email = email.into().trim().to_lowercase();
        if email.is_empty() || !email.contains('@') {
            return Err(DomainError::validation("invalid email"));
        }
        Ok(Self { id, email, name, is_active: true })
    }

    pub fn create(email: impl Into<String>, name: Option<String>) -> Result<Self, DomainError> {
        Self::new(UserId::new(), email, name)
    }

    // Getters
    pub fn id(&self) -> UserId { self.id }
    pub fn email(&self) -> &str { &self.email }
    
    // Mutations
    pub fn deactivate(&mut self) { self.is_active = false; }
}
```

### 2. Repository Trait Pattern

```rust
// lib/services/src/users.rs
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn fetch(&self, id: UserId) -> Result<Option<User>, RepositoryError>;
    async fn list(&self, filter: &UserFilter) -> Result<Vec<User>, RepositoryError>;
    async fn save(&self, user: &User) -> Result<(), RepositoryError>;
    async fn delete(&self, id: UserId) -> Result<(), RepositoryError>;
}

// Blanket impl for Arc<R>
#[async_trait]
impl<R: UserRepository> UserRepository for Arc<R> {
    async fn fetch(&self, id: UserId) -> Result<Option<User>, RepositoryError> {
        (**self).fetch(id).await
    }
    // ... other methods
}
```

### 3. Service Pattern

```rust
// lib/services/src/users.rs
#[derive(Clone)]
pub struct UserService<R: UserRepository> {
    repository: R,
}

impl<R: UserRepository> UserService<R> {
    pub fn new(repository: R) -> Self { Self { repository } }

    pub async fn create_user(&self, new: NewUser) -> Result<User, UserServiceError> {
        let user = User::create(new.email, new.name)?;
        self.repository.save(&user).await?;
        Ok(user)
    }

    pub async fn get_user(&self, id: UserId) -> Result<User, UserServiceError> {
        self.repository.fetch(id).await?
            .ok_or(UserServiceError::NotFound { id })
    }
}
```

### 4. Repository Implementation

```rust
// lib/database/src/repositories/users.rs
#[derive(Clone)]
pub struct UserSeaOrmRepository {
    conn: DatabaseConnection,
}

#[async_trait]
impl UserRepository for UserSeaOrmRepository {
    async fn fetch(&self, id: UserId) -> Result<Option<User>, RepositoryError> {
        let model = user::Entity::find_by_id(id.into())
            .one(&self.conn)
            .await
            .map_err(RepositoryError::new)?;
        
        model.map(|m| build_user(m)).transpose()
    }

    async fn save(&self, user: &User) -> Result<(), RepositoryError> {
        // Upsert logic - see examples/database-layer.md
    }
}
```

### 5. API Handler

```rust
// bin/api-server/src/api/users.rs
#[OpenApi]
impl<R: UserRepository + Clone + Send + Sync + 'static> UserController<R> {
    #[oai(path = "/users", method = "post")]
    async fn create_user(&self, body: Json<CreateUserRequest>) -> PoemResult<Json<UserResponse>> {
        let user = self.service.create_user(NewUser {
            email: body.0.email,
            name: body.0.name,
        }).await.map_err(map_error)?;
        
        Ok(Json(user.into()))
    }
}
```

## Error Handling

```rust
// Domain errors
#[derive(Debug, Error, Clone, PartialEq)]
pub enum DomainError {
    #[error("validation error: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
}

// Service errors
#[derive(Debug, Error)]
pub enum UserServiceError {
    #[error(transparent)]
    Domain(#[from] DomainError),
    #[error("user {id} not found")]
    NotFound { id: UserId },
    #[error("repository error: {0}")]
    Repository(#[from] RepositoryError),
}

// Map to HTTP status
fn map_error(err: UserServiceError) -> PoemError {
    match err {
        UserServiceError::Domain(e) => PoemError::from_string(e.to_string(), StatusCode::BAD_REQUEST),
        UserServiceError::NotFound { .. } => PoemError::from_status(StatusCode::NOT_FOUND),
        UserServiceError::Repository(e) => PoemError::from_string(e.to_string(), StatusCode::INTERNAL_SERVER_ERROR),
    }
}
```

## Testing Pattern

```rust
#[cfg(test)]
mod tests {
    // In-memory repository for testing
    #[derive(Default)]
    struct InMemoryUserRepository {
        users: Mutex<HashMap<UserId, User>>,
    }

    #[async_trait]
    impl UserRepository for InMemoryUserRepository {
        async fn fetch(&self, id: UserId) -> Result<Option<User>, RepositoryError> {
            Ok(self.users.lock().await.get(&id).cloned())
        }
        // ... other methods
    }

    #[tokio::test]
    async fn create_and_fetch_user() {
        let repo = Arc::new(InMemoryUserRepository::default());
        let service = UserService::new(repo);
        
        let user = service.create_user(NewUser { 
            email: "test@example.com".into(), 
            name: None 
        }).await.unwrap();
        
        let fetched = service.get_user(user.id()).await.unwrap();
        assert_eq!(fetched.email(), "test@example.com");
    }
}
```

## Best Practices

| Practice | Description |
|----------|-------------|
| Domain isolation | Domain layer has NO external dependencies |
| Repository trait | Define in services, implement in database |
| Error hierarchy | Domain → Service → API error mapping |
| Validate in `new()` | Validate at entity construction time |
| Arc for sharing | Use `Arc<R>` blanket impl for shared repositories |
| In-memory tests | Use HashMap-based repo for fast unit tests |

## Key Dependencies

```toml
[workspace.dependencies]
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
poem = "3.1"
poem-openapi = { version = "5.1", features = ["swagger-ui"] }
sea-orm = { version = "1.1", features = ["sqlx-postgres", "runtime-tokio-rustls"] }
thiserror = "2.0"
anyhow = "1.0"
uuid = { version = "1.11", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1.0", features = ["derive"] }
```

See [resources/cargo-template.toml](resources/cargo-template.toml) for full template.

## References

- [SeaORM Documentation](https://www.sea-ql.org/SeaORM/)
- [Poem Framework](https://docs.rs/poem/latest/poem/)
- [poem-openapi](https://docs.rs/poem-openapi/latest/poem_openapi/)
