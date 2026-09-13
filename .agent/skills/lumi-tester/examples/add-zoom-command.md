# Example: Adding a `zoomIn` Command

This example demonstrates the complete workflow for adding a `zoomIn` command to `lumi-tester`.

## 1. Parser (`src/parser/types.rs`)

Add parameter struct and enum variant.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoomParams {
    pub scale: f32, // e.g., 2.0 for 2x
    #[serde(default)]
    pub duration_ms: Option<u64>,
}

pub enum TestCommand {
    // ...
    #[serde(alias = "zoom")]
    ZoomIn(ZoomParams),
}
```

## 2. Driver Trait (`src/driver/traits.rs`)

Add abstract method.

```rust
#[async_trait]
pub trait PlatformDriver: Send + Sync {
    // ...
    async fn zoom_in(&self, scale: f32, duration_ms: Option<u64>) -> Result<()>;
}
```

## 3. Executor (`src/runner/executor.rs`)

Connect parser to driver.

```rust
async fn execute_command(&mut self, command: &TestCommand) -> Result<()> {
    match command {
        // ...
        TestCommand::ZoomIn(params) => {
            println!("  {} Zooming in (scale: {})...", "🔍".blue(), params.scale);
            self.driver.zoom_in(params.scale, params.duration_ms).await?;
        }
    }
}
```

## 4. Driver Implementation (`src/driver/*/driver.rs`)

### Android (`android/driver.rs`) using pinch gesture
```rust
async fn zoom_in(&self, scale: f32, duration_ms: Option<u64>) -> Result<()> {
    // Complex gesture: using adb shell input swipe with 2 pointers is hard.
    // Better to use `adb exec-out uiautomator` or accessibility service if available.
    // For simplicity, let's say we implement a basic center-out swipe.
    println!("    {} Android zoom not fully implemented, simulating...", "⚠️".yellow());
    Ok(())
}
```

### iOS (`ios/driver.rs`) using WDA
```rust
async fn zoom_in(&self, scale: f32, duration_ms: Option<u64>) -> Result<()> {
    // WDA has pinch method
    self.wda_client.lock().await.perform_pinch(scale, ...).await?;
    Ok(())
}
```

### Web (`web/driver.rs`) using CSS
```rust
async fn zoom_in(&self, scale: f32, duration_ms: Option<u64>) -> Result<()> {
    let page = self.page.lock().await;
    page.evaluate::<_, ()>("scale => document.body.style.zoom = scale", scale).await?;
    Ok(())
}
```
