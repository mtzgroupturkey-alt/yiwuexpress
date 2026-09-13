# Service Layer

The service layer contains business logic, repository traits, and service errors. It depends only on the domain layer.

## Repository Trait Pattern

Repository traits define the data access contract. They are implemented in the database layer.

### Complete Repository Trait

```rust
// lib/services/src/products.rs
use std::sync::Arc;

use async_trait::async_trait;
use domain::{Product, ProductId, DomainError};
use thiserror::Error;

use crate::RepositoryError;

// ========== FILTER & DTO ==========

/// Filter for listing products
#[derive(Debug, Clone, Default)]
pub struct ProductFilter {
    pub category_id: Option<i32>,
    pub name_contains: Option<String>,
    pub min_price_cents: Option<i64>,
    pub max_price_cents: Option<i64>,
    pub in_stock_only: bool,
    pub include_inactive: bool,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

/// DTO for creating new products
#[derive(Debug, Clone)]
pub struct NewProduct {
    pub name: String,
    pub description: Option<String>,
    pub price_cents: i64,
    pub category_id: i32,
    pub stock_quantity: i32,
}

/// DTO for updating products  
#[derive(Debug, Clone, Default)]
pub struct UpdateProduct {
    pub name: Option<String>,
    pub description: Option<Option<String>>, // Some(None) = clear
    pub price_cents: Option<i64>,
    pub category_id: Option<i32>,
}

// ========== REPOSITORY TRAIT ==========

/// Repository trait - defines data access contract
/// Implemented by database layer (e.g., SeaOrmProductRepository)
#[async_trait]
pub trait ProductRepository: Send + Sync {
    /// Fetch single product by ID
    async fn fetch(&self, id: ProductId) -> Result<Option<Product>, RepositoryError>;
    
    /// Fetch multiple products by IDs
    async fn fetch_many(&self, ids: &[ProductId]) -> Result<Vec<Product>, RepositoryError>;
    
    /// List products with filter
    async fn list(&self, filter: &ProductFilter) -> Result<Vec<Product>, RepositoryError>;
    
    /// Count products matching filter
    async fn count(&self, filter: &ProductFilter) -> Result<usize, RepositoryError>;
    
    /// Save (insert or update) product
    async fn save(&self, product: &Product) -> Result<(), RepositoryError>;
    
    /// Delete product by ID
    async fn delete(&self, id: ProductId) -> Result<(), RepositoryError>;
    
    /// Check if product with identifier exists
    async fn exists_by_name(&self, name: &str, exclude_id: Option<ProductId>) -> Result<bool, RepositoryError>;
}

/// Blanket impl for Arc<R> to support shared ownership
#[async_trait]
impl<R> ProductRepository for Arc<R>
where
    R: ProductRepository,
{
    async fn fetch(&self, id: ProductId) -> Result<Option<Product>, RepositoryError> {
        (**self).fetch(id).await
    }

    async fn fetch_many(&self, ids: &[ProductId]) -> Result<Vec<Product>, RepositoryError> {
        (**self).fetch_many(ids).await
    }

    async fn list(&self, filter: &ProductFilter) -> Result<Vec<Product>, RepositoryError> {
        (**self).list(filter).await
    }

    async fn count(&self, filter: &ProductFilter) -> Result<usize, RepositoryError> {
        (**self).count(filter).await
    }

    async fn save(&self, product: &Product) -> Result<(), RepositoryError> {
        (**self).save(product).await
    }

    async fn delete(&self, id: ProductId) -> Result<(), RepositoryError> {
        (**self).delete(id).await
    }

    async fn exists_by_name(&self, name: &str, exclude_id: Option<ProductId>) -> Result<bool, RepositoryError> {
        (**self).exists_by_name(name, exclude_id).await
    }
}
```

## Service Error Pattern

```rust
// lib/services/src/products.rs (continued)

/// Service-level errors
#[derive(Debug, Error)]
pub enum ProductServiceError {
    /// Domain validation errors
    #[error(transparent)]
    Domain(#[from] DomainError),
    
    /// Product not found
    #[error("product {id} not found")]
    NotFound { id: ProductId },
    
    /// Duplicate product name
    #[error("product with name '{name}' already exists")]
    DuplicateName { name: String },
    
    /// Insufficient stock
    #[error("insufficient stock for product {id}: requested {requested}, available {available}")]
    InsufficientStock {
        id: ProductId,
        requested: i32,
        available: i32,
    },
    
    /// Repository/database errors
    #[error("repository error: {0}")]
    Repository(#[from] RepositoryError),
}
```

## Service Pattern

```rust
// lib/services/src/products.rs (continued)

/// Product service - contains business logic
#[derive(Clone)]
pub struct ProductService<R>
where
    R: ProductRepository,
{
    repository: R,
}

impl<R> ProductService<R>
where
    R: ProductRepository,
{
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    // ========== CREATE ==========

    pub async fn create_product(
        &self,
        new_product: NewProduct,
    ) -> Result<Product, ProductServiceError> {
        // Check for duplicate name
        if self.repository.exists_by_name(&new_product.name, None).await? {
            return Err(ProductServiceError::DuplicateName {
                name: new_product.name,
            });
        }

        // Create domain entity (validates internally)
        let product = Product::create(
            new_product.name,
            new_product.description,
            new_product.price_cents,
            new_product.category_id,
            new_product.stock_quantity,
        )?;

        // Persist
        self.repository.save(&product).await?;
        
        Ok(product)
    }

    // ========== READ ==========

    pub async fn get_product(&self, id: ProductId) -> Result<Product, ProductServiceError> {
        self.load_product(id).await
    }

    pub async fn list_products(
        &self,
        filter: &ProductFilter,
    ) -> Result<Vec<Product>, ProductServiceError> {
        self.repository.list(filter).await.map_err(Into::into)
    }

    pub async fn count_products(
        &self,
        filter: &ProductFilter,
    ) -> Result<usize, ProductServiceError> {
        self.repository.count(filter).await.map_err(Into::into)
    }

    // ========== UPDATE ==========

    pub async fn update_product(
        &self,
        id: ProductId,
        update: UpdateProduct,
    ) -> Result<Product, ProductServiceError> {
        // Check for duplicate name if changing
        if let Some(ref name) = update.name {
            if self.repository.exists_by_name(name, Some(id)).await? {
                return Err(ProductServiceError::DuplicateName {
                    name: name.clone(),
                });
            }
        }

        self.modify_product(id, move |product| {
            if let Some(name) = update.name.clone() {
                product.rename(name)?;
            }
            if let Some(description) = update.description.clone() {
                product.set_description(description);
            }
            if let Some(price) = update.price_cents {
                product.set_price(price)?;
            }
            if let Some(category_id) = update.category_id {
                product.change_category(category_id);
            }
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    pub async fn rename_product(
        &self,
        id: ProductId,
        name: String,
    ) -> Result<Product, ProductServiceError> {
        // Check for duplicate
        if self.repository.exists_by_name(&name, Some(id)).await? {
            return Err(ProductServiceError::DuplicateName { name });
        }

        self.modify_product(id, move |product| {
            product.rename(name.clone())?;
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    pub async fn set_price(
        &self,
        id: ProductId,
        price_cents: i64,
    ) -> Result<Product, ProductServiceError> {
        self.modify_product(id, move |product| {
            product.set_price(price_cents)?;
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    // ========== STOCK OPERATIONS ==========

    pub async fn add_stock(
        &self,
        id: ProductId,
        quantity: i32,
    ) -> Result<Product, ProductServiceError> {
        self.modify_product(id, move |product| {
            product.add_stock(quantity)?;
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    pub async fn remove_stock(
        &self,
        id: ProductId,
        quantity: i32,
    ) -> Result<Product, ProductServiceError> {
        // Pre-check stock to give better error
        let product = self.load_product(id).await?;
        if product.stock_quantity() < quantity {
            return Err(ProductServiceError::InsufficientStock {
                id,
                requested: quantity,
                available: product.stock_quantity(),
            });
        }

        self.modify_product(id, move |product| {
            product.remove_stock(quantity)?;
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    // ========== LIFECYCLE ==========

    pub async fn deactivate_product(
        &self,
        id: ProductId,
    ) -> Result<Product, ProductServiceError> {
        self.modify_product(id, |product| {
            product.deactivate();
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    pub async fn activate_product(
        &self,
        id: ProductId,
    ) -> Result<Product, ProductServiceError> {
        self.modify_product(id, |product| {
            product.activate();
            Ok(())
        })
        .await
        .map(|(product, _)| product)
    }

    pub async fn delete_product(&self, id: ProductId) -> Result<(), ProductServiceError> {
        // Ensure exists
        let _ = self.load_product(id).await?;
        self.repository.delete(id).await.map_err(Into::into)
    }

    // ========== PRIVATE HELPERS ==========

    async fn load_product(&self, id: ProductId) -> Result<Product, ProductServiceError> {
        match self.repository.fetch(id).await? {
            Some(product) => Ok(product),
            None => Err(ProductServiceError::NotFound { id }),
        }
    }

    async fn modify_product<F, T>(
        &self,
        id: ProductId,
        operation: F,
    ) -> Result<(Product, T), ProductServiceError>
    where
        F: FnOnce(&mut Product) -> Result<T, DomainError>,
    {
        let mut product = self.load_product(id).await?;
        let outcome = operation(&mut product)?;
        self.repository.save(&product).await?;
        Ok((product, outcome))
    }
}
```

## Repository Error

```rust
// lib/services/src/repository.rs
use std::{error::Error, fmt};

/// Generic repository error wrapper
#[derive(Debug)]
pub struct RepositoryError(Box<dyn Error + Send + Sync>);

impl RepositoryError {
    pub fn new<E>(error: E) -> Self
    where
        E: Error + Send + Sync + 'static,
    {
        Self(Box::new(error))
    }

    pub fn message(message: impl Into<String>) -> Self {
        Self::new(SimpleError(message.into()))
    }
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Error for RepositoryError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&*self.0)
    }
}

#[derive(Debug)]
struct SimpleError(String);

impl fmt::Display for SimpleError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Error for SimpleError {}
```

## Unit Testing with In-Memory Repository

```rust
#[cfg(test)]
mod tests {
    use std::{collections::HashMap, sync::Arc};
    use tokio::sync::Mutex;

    use super::*;

    // In-memory repository for testing
    #[derive(Default)]
    struct InMemoryProductRepository {
        products: Mutex<HashMap<ProductId, Product>>,
    }

    #[async_trait]
    impl ProductRepository for InMemoryProductRepository {
        async fn fetch(&self, id: ProductId) -> Result<Option<Product>, RepositoryError> {
            Ok(self.products.lock().await.get(&id).cloned())
        }

        async fn fetch_many(&self, ids: &[ProductId]) -> Result<Vec<Product>, RepositoryError> {
            let products = self.products.lock().await;
            Ok(ids.iter().filter_map(|id| products.get(id).cloned()).collect())
        }

        async fn list(&self, filter: &ProductFilter) -> Result<Vec<Product>, RepositoryError> {
            let products: Vec<_> = self.products.lock().await
                .values()
                .filter(|p| {
                    (filter.include_inactive || p.is_active())
                        && filter.category_id.map_or(true, |c| c == p.category_id())
                        && (!filter.in_stock_only || p.is_in_stock())
                })
                .cloned()
                .collect();
            Ok(products)
        }

        async fn count(&self, filter: &ProductFilter) -> Result<usize, RepositoryError> {
            Ok(self.list(filter).await?.len())
        }

        async fn save(&self, product: &Product) -> Result<(), RepositoryError> {
            self.products.lock().await.insert(product.id(), product.clone());
            Ok(())
        }

        async fn delete(&self, id: ProductId) -> Result<(), RepositoryError> {
            self.products.lock().await.remove(&id);
            Ok(())
        }

        async fn exists_by_name(
            &self,
            name: &str,
            exclude_id: Option<ProductId>,
        ) -> Result<bool, RepositoryError> {
            let products = self.products.lock().await;
            let exists = products.values().any(|p| {
                p.name().eq_ignore_ascii_case(name) && Some(p.id()) != exclude_id
            });
            Ok(exists)
        }
    }

    fn service() -> ProductService<Arc<InMemoryProductRepository>> {
        let repo = Arc::new(InMemoryProductRepository::default());
        ProductService::new(repo)
    }

    fn new_product(name: &str) -> NewProduct {
        NewProduct {
            name: name.to_string(),
            description: None,
            price_cents: 1999,
            category_id: 1,
            stock_quantity: 100,
        }
    }

    #[tokio::test]
    async fn create_and_fetch_product() {
        let service = service();
        let product = service
            .create_product(new_product("Widget"))
            .await
            .expect("product created");

        assert_eq!(product.name(), "Widget");
        assert_eq!(product.price_cents(), 1999);
        assert!(product.is_active());

        let fetched = service.get_product(product.id()).await.unwrap();
        assert_eq!(fetched.id(), product.id());
    }

    #[tokio::test]
    async fn reject_duplicate_name() {
        let service = service();
        service.create_product(new_product("Widget")).await.unwrap();

        let result = service.create_product(new_product("Widget")).await;
        assert!(matches!(result, Err(ProductServiceError::DuplicateName { .. })));
    }

    #[tokio::test]
    async fn stock_operations() {
        let service = service();
        let product = service.create_product(new_product("Widget")).await.unwrap();

        let updated = service.add_stock(product.id(), 50).await.unwrap();
        assert_eq!(updated.stock_quantity(), 150);

        let updated = service.remove_stock(product.id(), 30).await.unwrap();
        assert_eq!(updated.stock_quantity(), 120);
    }

    #[tokio::test]
    async fn insufficient_stock_error() {
        let service = service();
        let mut new = new_product("Widget");
        new.stock_quantity = 10;
        let product = service.create_product(new).await.unwrap();

        let result = service.remove_stock(product.id(), 20).await;
        assert!(matches!(
            result,
            Err(ProductServiceError::InsufficientStock { .. })
        ));
    }

    #[tokio::test]
    async fn list_active_only() {
        let service = service();
        let p1 = service.create_product(new_product("A")).await.unwrap();
        let p2 = service.create_product(new_product("B")).await.unwrap();
        service.deactivate_product(p2.id()).await.unwrap();

        let active = service
            .list_products(&ProductFilter {
                include_inactive: false,
                ..Default::default()
            })
            .await
            .unwrap();

        assert_eq!(active.len(), 1);
        assert_eq!(active[0].id(), p1.id());
    }
}
```

## Module Organization

```rust
// lib/services/src/lib.rs
pub mod repository;
pub mod products;
pub mod users;
pub mod orders;

// Re-exports
pub use repository::RepositoryError;

pub use products::{
    NewProduct, ProductFilter, ProductRepository, 
    ProductService, ProductServiceError, UpdateProduct,
};

pub use users::{
    NewUser, UserFilter, UserRepository,
    UserService, UserServiceError,
};
```

## Best Practices

| Practice | Description |
|----------|-------------|
| Trait in services | Define repository trait in services, implement in database |
| Arc blanket impl | Add `impl<R> Trait for Arc<R>` for easy sharing |
| Specific errors | Use `thiserror` with descriptive variants |
| Load before modify | Always load entity before modifying |
| Business validation | Validate business rules in service, domain rules in entity |
| In-memory tests | Use HashMap-based repository for fast unit tests |
