# Database Layer

The database layer implements repository traits defined in the services layer using SeaORM.

## Repository Implementation Pattern

```rust
// lib/database/src/repositories/users.rs
use async_trait::async_trait;
use chrono::Utc;
use domain::{User, UserId, DomainError};
use services::{UserFilter, UserRepository, RepositoryError};
use sea_orm::{
    prelude::*, ActiveModelTrait, ActiveValue::Set, 
    ColumnTrait, DatabaseConnection, EntityTrait,
    QueryFilter, QueryOrder, QuerySelect,
};
use uuid::Uuid;

use crate::entities::user;

#[derive(Clone)]
pub struct UserSeaOrmRepository {
    conn: DatabaseConnection,
}

impl UserSeaOrmRepository {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }

    fn to_repository_error(err: sea_orm::DbErr) -> RepositoryError {
        RepositoryError::new(err)
    }

    fn domain_error(err: DomainError) -> RepositoryError {
        RepositoryError::new(err)
    }
}

#[async_trait]
impl UserRepository for UserSeaOrmRepository {
    async fn fetch(&self, id: UserId) -> Result<Option<User>, RepositoryError> {
        let id_uuid: Uuid = id.into();
        let maybe_user = user::Entity::find_by_id(id_uuid)
            .one(&self.conn)
            .await
            .map_err(Self::to_repository_error)?;

        match maybe_user {
            None => Ok(None),
            Some(model) => {
                let domain = build_user(model)?;
                Ok(Some(domain))
            }
        }
    }

    async fn list(&self, filter: &UserFilter) -> Result<Vec<User>, RepositoryError> {
        let mut query = user::Entity::find();

        // Apply filters
        if let Some(email) = &filter.email {
            query = query.filter(user::Column::Email.eq(email.as_str()));
        }

        if !filter.include_inactive {
            query = query.filter(user::Column::IsActive.eq(true));
        }

        if let Some(limit) = filter.limit {
            query = query.limit(limit as u64);
        }

        // Execute query
        let users = query
            .order_by_asc(user::Column::CreatedAt)
            .all(&self.conn)
            .await
            .map_err(Self::to_repository_error)?;

        // Convert to domain entities
        let mut result = Vec::with_capacity(users.len());
        for model in users {
            result.push(build_user(model)?);
        }

        Ok(result)
    }

    async fn save(&self, user: &User) -> Result<(), RepositoryError> {
        let user_id: Uuid = user.id().into();
        let existing = user::Entity::find_by_id(user_id)
            .one(&self.conn)
            .await
            .map_err(Self::to_repository_error)?;

        let now = Utc::now();

        if let Some(model) = existing {
            // UPDATE existing record
            let mut active: user::ActiveModel = model.into();
            active.email = Set(user.email().to_string());
            active.name = Set(user.name().map(|s| s.to_string()));
            active.is_active = Set(user.is_active());
            active.updated_at = Set(Some(now));
            active.update(&self.conn).await.map_err(Self::to_repository_error)?;
        } else {
            // INSERT new record
            let active = user::ActiveModel {
                id: Set(user_id),
                email: Set(user.email().to_string()),
                name: Set(user.name().map(|s| s.to_string())),
                is_active: Set(user.is_active()),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
            };
            active.insert(&self.conn).await.map_err(Self::to_repository_error)?;
        }

        Ok(())
    }

    async fn delete(&self, id: UserId) -> Result<(), RepositoryError> {
        let user_id: Uuid = id.into();
        user::Entity::delete_by_id(user_id)
            .exec(&self.conn)
            .await
            .map_err(Self::to_repository_error)?;
        Ok(())
    }
}

/// Convert SeaORM model to domain entity
fn build_user(model: user::Model) -> Result<User, RepositoryError> {
    let user = User::new(
        UserId::from_uuid(model.id),
        model.email,
        model.name,
    )
    .map_err(UserSeaOrmRepository::domain_error)?;

    Ok(user)
}
```

## SeaORM Entity

```rust
// lib/database/src/entities/user.rs
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub is_active: bool,
    pub created_at: Option<DateTimeUtc>,
    pub updated_at: Option<DateTimeUtc>,
    pub deleted_at: Option<DateTimeUtc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

## Database Context

```rust
// lib/database/src/lib.rs
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

## Migration Example

```rust
// lib/database/src/migrations/m20240101_000001_create_users.rs
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Users::Id).uuid().not_null().primary_key())
                    .col(ColumnDef::new(Users::Email).string().not_null().unique_key())
                    .col(ColumnDef::new(Users::Name).string().null())
                    .col(ColumnDef::new(Users::IsActive).boolean().not_null().default(true))
                    .col(ColumnDef::new(Users::CreatedAt).timestamp_with_time_zone().null())
                    .col(ColumnDef::new(Users::UpdatedAt).timestamp_with_time_zone().null())
                    .col(ColumnDef::new(Users::DeletedAt).timestamp_with_time_zone().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.drop_table(Table::drop().table(Users::Table).to_owned()).await
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Email,
    Name,
    IsActive,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
}
```

## Migrator Setup

```rust
// lib/database/src/migrations/mod.rs
use sea_orm_migration::prelude::*;

mod m20240101_000001_create_users;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20240101_000001_create_users::Migration),
        ]
    }
}
```

## lib.rs Exports

```rust
// lib/database/src/lib.rs
use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::MigratorTrait;

pub mod entities;
pub mod migrations;
pub mod repositories;

// Re-export repositories
pub use repositories::users::UserSeaOrmRepository;
pub use repositories::products::ProductSeaOrmRepository;

#[derive(Clone)]
pub struct DatabaseContext {
    pub connection: DatabaseConnection,
}

impl DatabaseContext {
    pub async fn connect(database_url: &str, run_migrations: bool) -> anyhow::Result<Self> {
        tracing::info!("Connecting to database...");
        let connection = Database::connect(database_url).await?;
        
        if run_migrations {
            tracing::info!("Running migrations...");
            migrations::Migrator::up(&connection, None).await?;
        }
        
        tracing::info!("Database connected successfully");
        Ok(Self { connection })
    }

    pub async fn close(self) -> anyhow::Result<()> {
        self.connection.close().await?;
        Ok(())
    }
}
```

## Query Patterns

### Complex Filtering

```rust
async fn list(&self, filter: &ProductFilter) -> Result<Vec<Product>, RepositoryError> {
    let mut query = product::Entity::find();

    // Text search
    if let Some(name) = &filter.name_contains {
        query = query.filter(product::Column::Name.contains(name));
    }

    // Range filter
    if let Some(min) = filter.min_price_cents {
        query = query.filter(product::Column::PriceCents.gte(min));
    }
    if let Some(max) = filter.max_price_cents {
        query = query.filter(product::Column::PriceCents.lte(max));
    }

    // Boolean filter
    if filter.in_stock_only {
        query = query.filter(product::Column::StockQuantity.gt(0));
    }

    // Pagination
    if let Some(offset) = filter.offset {
        query = query.offset(offset as u64);
    }
    if let Some(limit) = filter.limit {
        query = query.limit(limit as u64);
    }

    // Execute
    let models = query
        .order_by_desc(product::Column::CreatedAt)
        .all(&self.conn)
        .await
        .map_err(Self::to_repository_error)?;

    // Convert
    models.into_iter().map(build_product).collect()
}
```

### Exists Check

```rust
async fn exists_by_email(&self, email: &str, exclude_id: Option<UserId>) -> Result<bool, RepositoryError> {
    let mut query = user::Entity::find()
        .filter(user::Column::Email.eq(email));

    if let Some(id) = exclude_id {
        let uuid: Uuid = id.into();
        query = query.filter(user::Column::Id.ne(uuid));
    }

    let count = query
        .count(&self.conn)
        .await
        .map_err(Self::to_repository_error)?;

    Ok(count > 0)
}
```

### Transaction

```rust
use sea_orm::TransactionTrait;

async fn transfer_stock(
    &self,
    from_id: ProductId,
    to_id: ProductId,
    quantity: i32,
) -> Result<(), RepositoryError> {
    self.conn
        .transaction::<_, (), DbErr>(|txn| {
            Box::pin(async move {
                // Decrease from source
                let from = product::Entity::find_by_id(from_id.into())
                    .one(txn)
                    .await?
                    .ok_or(DbErr::RecordNotFound("source product".into()))?;
                
                let mut from_active: product::ActiveModel = from.into();
                from_active.stock_quantity = Set(from_active.stock_quantity.unwrap() - quantity);
                from_active.update(txn).await?;

                // Increase at destination
                let to = product::Entity::find_by_id(to_id.into())
                    .one(txn)
                    .await?
                    .ok_or(DbErr::RecordNotFound("dest product".into()))?;
                
                let mut to_active: product::ActiveModel = to.into();
                to_active.stock_quantity = Set(to_active.stock_quantity.unwrap() + quantity);
                to_active.update(txn).await?;

                Ok(())
            })
        })
        .await
        .map_err(Self::to_repository_error)
}
```
