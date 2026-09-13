# Project Structure

Recommended workspace layout for Rust backend projects following Clean Architecture.

## Full Structure

```
my-backend/
├── Cargo.toml                    # Workspace root
├── .cargo/
│   └── config.toml               # Cargo configuration
├── .env                          # Environment variables
├── .gitignore
├── README.md
│
├── bin/                          # Binary crates (executables)
│   └── api-server/
│       ├── Cargo.toml
│       ├── .env                  # Server-specific env
│       ├── run.sh                # Development script
│       └── src/
│           ├── main.rs           # Entry point
│           ├── lib.rs            # Server setup, service wiring
│           ├── cmd/              # CLI arguments
│           │   └── mod.rs
│           ├── api/              # HTTP handlers
│           │   ├── mod.rs
│           │   ├── v1/           # API version
│           │   │   ├── mod.rs
│           │   │   ├── users.rs
│           │   │   └── health.rs
│           │   └── response.rs   # Common response types
│           └── gateway/          # Transport layer
│               ├── mod.rs
│               └── http/
│                   ├── mod.rs
│                   └── middleware.rs
│
└── lib/                          # Library crates
    ├── domain/                   # Core business entities
    │   ├── Cargo.toml
    │   └── src/
    │       ├── lib.rs            # Re-exports
    │       ├── entities/         # Business entities
    │       │   ├── mod.rs
    │       │   ├── user.rs
    │       │   └── product.rs
    │       ├── value_objects/    # Value objects
    │       │   ├── mod.rs
    │       │   ├── user_id.rs
    │       │   └── email.rs
    │       └── errors/           # Domain errors
    │           ├── mod.rs
    │           └── domain_error.rs
    │
    ├── services/                 # Business logic
    │   ├── Cargo.toml
    │   └── src/
    │       ├── lib.rs            # Re-exports
    │       ├── repository.rs     # RepositoryError
    │       ├── users.rs          # UserService, UserRepository trait
    │       └── products.rs       # ProductService, ProductRepository trait
    │
    └── database/                 # Database implementation
        ├── Cargo.toml
        └── src/
            ├── lib.rs            # DatabaseContext, re-exports
            ├── entities/         # SeaORM entities
            │   ├── mod.rs
            │   ├── user.rs
            │   └── product.rs
            ├── repositories/     # Repository implementations
            │   ├── mod.rs
            │   ├── users.rs
            │   └── products.rs
            └── migrations/       # Database migrations
                ├── mod.rs
                ├── m20240101_000001_create_users.rs
                └── m20240102_000002_create_products.rs
```

## Cargo.toml Examples

### Root Cargo.toml

```toml
[workspace]
resolver = "2"
members = [
    "bin/api-server",
    "lib/domain",
    "lib/services",
    "lib/database",
]

[workspace.dependencies]
# Internal crates
domain = { path = "lib/domain" }
services = { path = "lib/services" }
database = { path = "lib/database" }

# Async
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"

# Web
poem = { version = "3.1" }
poem-openapi = { version = "5.1", features = ["swagger-ui"] }

# Database
sea-orm = { version = "1.1", features = ["sqlx-postgres", "runtime-tokio-rustls"] }
sea-orm-migration = "1.1"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "2.0"
anyhow = "1.0"

# Utilities
uuid = { version = "1.11", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
clap = { version = "4.5", features = ["derive"] }
dotenv = "0.15"
```

### lib/domain/Cargo.toml

```toml
[package]
name = "domain"
version = "0.1.0"
edition = "2021"

[dependencies]
# Minimal dependencies - domain should be pure
thiserror.workspace = true
uuid.workspace = true
chrono.workspace = true
serde.workspace = true
serde_json.workspace = true
```

### lib/services/Cargo.toml

```toml
[package]
name = "services"
version = "0.1.0"
edition = "2021"

[dependencies]
domain.workspace = true
async-trait.workspace = true
thiserror.workspace = true
serde.workspace = true
serde_json.workspace = true

[dev-dependencies]
tokio = { workspace = true, features = ["test-util", "macros"] }
```

### lib/database/Cargo.toml

```toml
[package]
name = "database"
version = "0.1.0"
edition = "2021"

[dependencies]
domain.workspace = true
services.workspace = true
sea-orm.workspace = true
sea-orm-migration.workspace = true
async-trait.workspace = true
uuid.workspace = true
chrono.workspace = true
anyhow.workspace = true
```

### bin/api-server/Cargo.toml

```toml
[package]
name = "api-server"
version = "0.1.0"
edition = "2021"

[dependencies]
domain.workspace = true
services.workspace = true
database.workspace = true

tokio.workspace = true
poem.workspace = true
poem-openapi.workspace = true
serde.workspace = true
serde_json.workspace = true
anyhow.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
clap.workspace = true
dotenv.workspace = true
```

## Layer lib.rs Exports

### lib/domain/src/lib.rs

```rust
//! Core domain module - entities, value objects, errors

pub mod entities;
pub mod errors;
pub mod value_objects;

// Re-export commonly used types
pub use entities::user::User;
pub use errors::DomainError;
pub use value_objects::UserId;

/// Prelude for convenient imports
pub mod prelude {
    pub use super::entities::user::User;
    pub use super::errors::DomainError;
    pub use super::value_objects::UserId;
}
```

### lib/services/src/lib.rs

```rust
//! Business logic layer - services and repository traits

pub mod repository;
pub mod users;

pub use repository::RepositoryError;
pub use users::{NewUser, UserFilter, UserRepository, UserService, UserServiceError};
```

### lib/database/src/lib.rs

```rust
//! Database layer - repository implementations

use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::MigratorTrait;

pub mod entities;
pub mod migrations;
pub mod repositories;

pub use repositories::users::UserSeaOrmRepository;

#[derive(Clone)]
pub struct DatabaseContext {
    pub connection: DatabaseConnection,
}

impl DatabaseContext {
    pub async fn connect(database_url: &str, run_migrations: bool) -> anyhow::Result<Self> {
        let connection = Database::connect(database_url).await?;
        if run_migrations {
            migrations::Migrator::up(&connection, None).await?;
        }
        Ok(Self { connection })
    }
}
```

## .env Example

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/mydb

# Server
PORT=3000
RUST_LOG=info,api_server=debug

# Optional
JWT_SECRET=your-secret-key
```

## run.sh Development Script

```bash
#!/bin/bash
set -e

# Load environment
source .env

# Build and run with hot reload
cargo watch -x 'run --bin api-server'
```

## .gitignore

```gitignore
/target
*.rs.bk
Cargo.lock
.env
*.log
```
