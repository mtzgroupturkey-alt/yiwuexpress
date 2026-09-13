# Domain Layer

The domain layer contains core business entities, value objects, and domain errors. It has **NO external dependencies** except standard library and minimal crates like `uuid`, `chrono`.

## Entity Pattern

Entities have identity and lifecycle. They encapsulate business rules and validation.

### Complete Entity Example

```rust
// lib/domain/src/entities/product.rs
use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;

use crate::{errors::DomainError, value_objects::ProductId};

/// Product entity with business rules
#[derive(Debug, Clone, PartialEq)]
pub struct Product {
    // Identity
    id: ProductId,
    
    // Core attributes
    name: String,
    description: Option<String>,
    price_cents: i64,
    
    // Relationships
    category_id: i32,
    
    // Metadata
    metadata: Option<JsonValue>,
    
    // State
    is_active: bool,
    stock_quantity: i32,
    
    // Timestamps (managed by repository)
    created_at: Option<DateTime<Utc>>,
    updated_at: Option<DateTime<Utc>>,
}

impl Product {
    /// Constructor with full validation
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: ProductId,
        name: impl Into<String>,
        description: Option<String>,
        price_cents: i64,
        category_id: i32,
        stock_quantity: i32,
        metadata: Option<JsonValue>,
    ) -> Result<Self, DomainError> {
        // Validate name
        let name = name.into().trim().to_owned();
        if name.is_empty() {
            return Err(DomainError::validation("product name cannot be empty"));
        }
        if name.len() > 255 {
            return Err(DomainError::validation("product name too long (max 255)"));
        }

        // Validate price
        if price_cents < 0 {
            return Err(DomainError::validation("price cannot be negative"));
        }

        // Validate stock
        if stock_quantity < 0 {
            return Err(DomainError::validation("stock cannot be negative"));
        }

        // Clean description
        let description = description.and_then(|d| {
            let trimmed = d.trim().to_owned();
            if trimmed.is_empty() { None } else { Some(trimmed) }
        });

        Ok(Self {
            id,
            name,
            description,
            price_cents,
            category_id,
            metadata,
            is_active: true,
            stock_quantity,
            created_at: None,
            updated_at: None,
        })
    }

    /// Factory method for creating new products
    pub fn create(
        name: impl Into<String>,
        description: Option<String>,
        price_cents: i64,
        category_id: i32,
        stock_quantity: i32,
    ) -> Result<Self, DomainError> {
        Self::new(
            ProductId::new(),
            name,
            description,
            price_cents,
            category_id,
            stock_quantity,
            None,
        )
    }

    // ========== GETTERS ==========
    // Return references or copies, never &String
    
    pub fn id(&self) -> ProductId {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn description(&self) -> Option<&str> {
        self.description.as_deref()
    }

    pub fn price_cents(&self) -> i64 {
        self.price_cents
    }

    /// Price in dollars as display string
    pub fn price_display(&self) -> String {
        format!("${:.2}", self.price_cents as f64 / 100.0)
    }

    pub fn category_id(&self) -> i32 {
        self.category_id
    }

    pub fn metadata(&self) -> Option<&JsonValue> {
        self.metadata.as_ref()
    }

    pub fn is_active(&self) -> bool {
        self.is_active
    }

    pub fn stock_quantity(&self) -> i32 {
        self.stock_quantity
    }

    pub fn is_in_stock(&self) -> bool {
        self.stock_quantity > 0
    }

    // ========== MUTATION METHODS ==========
    // Return Result for operations that can fail

    pub fn rename(&mut self, name: impl Into<String>) -> Result<(), DomainError> {
        let name = name.into().trim().to_owned();
        if name.is_empty() {
            return Err(DomainError::validation("product name cannot be empty"));
        }
        if name.len() > 255 {
            return Err(DomainError::validation("product name too long (max 255)"));
        }
        self.name = name;
        Ok(())
    }

    pub fn set_description(&mut self, description: Option<String>) {
        self.description = description.and_then(|d| {
            let trimmed = d.trim().to_owned();
            if trimmed.is_empty() { None } else { Some(trimmed) }
        });
    }

    pub fn set_price(&mut self, price_cents: i64) -> Result<(), DomainError> {
        if price_cents < 0 {
            return Err(DomainError::validation("price cannot be negative"));
        }
        self.price_cents = price_cents;
        Ok(())
    }

    pub fn change_category(&mut self, category_id: i32) {
        self.category_id = category_id;
    }

    pub fn set_metadata(&mut self, metadata: Option<JsonValue>) {
        self.metadata = metadata;
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
    }

    pub fn activate(&mut self) {
        self.is_active = true;
    }

    /// Add stock - returns new quantity
    pub fn add_stock(&mut self, quantity: i32) -> Result<i32, DomainError> {
        if quantity < 0 {
            return Err(DomainError::validation("quantity must be positive"));
        }
        self.stock_quantity = self.stock_quantity.saturating_add(quantity);
        Ok(self.stock_quantity)
    }

    /// Remove stock - fails if insufficient
    pub fn remove_stock(&mut self, quantity: i32) -> Result<i32, DomainError> {
        if quantity < 0 {
            return Err(DomainError::validation("quantity must be positive"));
        }
        if quantity > self.stock_quantity {
            return Err(DomainError::validation("insufficient stock"));
        }
        self.stock_quantity -= quantity;
        Ok(self.stock_quantity)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_product_successfully() {
        let product = Product::create(
            "Widget",
            Some("A useful widget".into()),
            1999, // $19.99
            1,
            100,
        )
        .expect("valid product");

        assert_eq!(product.name(), "Widget");
        assert_eq!(product.price_cents(), 1999);
        assert_eq!(product.price_display(), "$19.99");
        assert!(product.is_active());
        assert!(product.is_in_stock());
    }

    #[test]
    fn reject_empty_name() {
        let result = Product::create("", None, 1000, 1, 10);
        assert!(matches!(result, Err(DomainError::Validation(_))));
    }

    #[test]
    fn reject_negative_price() {
        let result = Product::create("Widget", None, -100, 1, 10);
        assert!(matches!(result, Err(DomainError::Validation(_))));
    }

    #[test]
    fn stock_operations() {
        let mut product = Product::create("Widget", None, 1000, 1, 10).unwrap();
        
        product.add_stock(5).unwrap();
        assert_eq!(product.stock_quantity(), 15);

        product.remove_stock(3).unwrap();
        assert_eq!(product.stock_quantity(), 12);

        // Insufficient stock
        let result = product.remove_stock(20);
        assert!(matches!(result, Err(DomainError::Validation(_))));
    }
}
```

## Value Object Pattern

Value objects have no identity - they are defined by their attributes. They should be immutable.

### Complete Value Object Example

```rust
// lib/domain/src/value_objects/email.rs
use std::fmt;

use crate::errors::DomainError;

/// Email value object with validation
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Email(String);

impl Email {
    pub fn new(email: impl Into<String>) -> Result<Self, DomainError> {
        let email = email.into().trim().to_lowercase();
        
        if email.is_empty() {
            return Err(DomainError::validation("email cannot be empty"));
        }

        if !email.contains('@') {
            return Err(DomainError::validation("invalid email format"));
        }

        // Basic format validation
        let parts: Vec<&str> = email.split('@').collect();
        if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
            return Err(DomainError::validation("invalid email format"));
        }

        if !parts[1].contains('.') {
            return Err(DomainError::validation("invalid email domain"));
        }

        Ok(Self(email))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn domain(&self) -> &str {
        self.0.split('@').nth(1).unwrap_or("")
    }

    pub fn local_part(&self) -> &str {
        self.0.split('@').next().unwrap_or("")
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl AsRef<str> for Email {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_email() {
        let email = Email::new("User@Example.COM").unwrap();
        assert_eq!(email.as_str(), "user@example.com");
        assert_eq!(email.domain(), "example.com");
        assert_eq!(email.local_part(), "user");
    }

    #[test]
    fn invalid_email_no_at() {
        assert!(Email::new("invalid").is_err());
    }

    #[test]
    fn invalid_email_no_domain() {
        assert!(Email::new("user@").is_err());
    }
}
```

### ID Value Object

```rust
// lib/domain/src/value_objects/product_id.rs
use uuid::Uuid;

/// Product ID - wrapper around UUID
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ProductId(Uuid);

impl ProductId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    pub fn as_uuid(&self) -> Uuid {
        self.0
    }
}

impl Default for ProductId {
    fn default() -> Self {
        Self::new()
    }
}

impl From<ProductId> for Uuid {
    fn from(id: ProductId) -> Self {
        id.0
    }
}

impl From<Uuid> for ProductId {
    fn from(uuid: Uuid) -> Self {
        Self(uuid)
    }
}

impl std::fmt::Display for ProductId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

// For serde serialization
impl serde::Serialize for ProductId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl<'de> serde::Deserialize<'de> for ProductId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let uuid = Uuid::deserialize(deserializer)?;
        Ok(Self(uuid))
    }
}
```

## Domain Error

```rust
// lib/domain/src/errors/domain_error.rs
use thiserror::Error;

/// Generic error type for domain-level operations
#[derive(Debug, Error, Clone, PartialEq, Eq)]
pub enum DomainError {
    #[error("validation error: {0}")]
    Validation(String),
    
    #[error("not found: {0}")]
    NotFound(String),
    
    #[error("conflict: {0}")]
    Conflict(String),
    
    #[error("unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("forbidden: {0}")]
    Forbidden(String),
}

impl DomainError {
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::NotFound(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::Unauthorized(message.into())
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::Forbidden(message.into())
    }
}
```

## Module Organization

```rust
// lib/domain/src/entities/mod.rs
pub mod product;
pub mod user;
pub mod order;

// Re-exports for convenience
pub use product::Product;
pub use user::User;
pub use order::Order;
```

```rust
// lib/domain/src/value_objects/mod.rs
mod product_id;
mod user_id;
mod email;

pub use product_id::ProductId;
pub use user_id::UserId;
pub use email::Email;
```

```rust
// lib/domain/src/errors/mod.rs
mod domain_error;

pub use domain_error::DomainError;
```

## Best Practices

| Practice | Description |
|----------|-------------|
| Validate in `new()` | All validation at construction time |
| Factory methods | Use `create()` for new entities with generated IDs |
| Immutable getters | Return `&str` not `&String` |
| Result for mutations | Return `Result<(), DomainError>` for operations that can fail |
| Copy for IDs | Make ID types `Copy` for easy passing |
| Private fields | All fields private, exposed via methods |
| No database logic | Domain layer is persistence-agnostic |
