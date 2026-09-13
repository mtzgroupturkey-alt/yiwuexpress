---
name: lumi-tester
description: Comprehensive guide for extending the Lumi Tester framework. Use when adding new commands, selectors, or debugging the test runner.
---

# Lumi Tester Development

This skill provides a step-by-step guide for extending the Lumi Tester automation framework. It covers adding new commands, selectors, and debugging workflows.

## When to Use This Skill

- Use when **adding a new automation command** (e.g., `scanBarcode`, `zoomIn`).
- Use when **adding a new selector strategy** (e.g., `barcode: "..."`, `ai_description: "..."`).
- Use when **debugging** command execution or driver issues.
- Use when **understanding the architecture** of `lumi-tester`.

## Architecture Overview

For a deep dive into the internal logic, see [Core Architecture & Internals](resources/core-architecture.md).

1.  **Parser** (`src/parser/types.rs`): deserializes YAML to `TestCommand` enums.
2.  **Executor** (`src/runner/executor.rs`): orchestrates execution, managing context (`TestContext`) and flow (`TestSessionState`). Handles logic *around* the driver (retries, logging, flow control).
3.  **Driver Trait** (`src/driver/traits.rs`): defines the abstract `PlatformDriver` interface. Handles direct device interactions.
4.  **Implementations** (`src/driver/<platform>/driver.rs`): concrete implementations for Android (ADB), iOS (IDB/WDA), and Web (Playwright).

## How to use

### Workflow 1: Add a New Command

Follow this strict order to ensure all layers are covered.

#### Step 1: Define Parser (`src/parser/types.rs`)

1.  Add a `struct` for your command parameters (if it takes arguments).
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")] // Ensures camelCase in YAML maps to struct fields
    pub struct MyNewCommandParams {
        pub target: String,
        #[serde(default)]
        pub duration: Option<u64>,
        /// Optional label for custom logging (e.g., "Press Login Button")
        #[serde(default)]
        pub label: Option<String>,
    }
    ```
2.  Add a variant to the `TestCommand` enum.
    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub enum TestCommand {
        // ...
        #[serde(alias = "myCmd")] // Optional alias for YAML convenience
        MyNewCommand(MyNewCommandParams), // or MyNewCommand, if no params
    }
    ```

#### Step 2: Define Interface (`src/driver/traits.rs`)

1.  Add the method signature to the `PlatformDriver` trait.
    ```rust
    #[async_trait]
    pub trait PlatformDriver: Send + Sync {
        // ...
        async fn my_new_command(&self, target: &str, duration: Option<u64>) -> Result<()>;
    }
    ```
2.  (Optional) Provide a default implementation returning `Err("Not implemented")` if it's not supported on all platforms immediately.

#### Step 3: Integrate Executor (`src/runner/executor.rs`)

1.  Locate `async fn execute_command`.
2.  Add a match arm for your new command variant.
    ```rust
    TestCommand::MyNewCommand(params) => {
        println!("  {} Executing MyNewCommand...", "➤".blue());
        // Verify selector if needed
        // let selector = self.build_selector(..., params.ocr, ...)?;
        self.driver.my_new_command(&params.target, params.duration).await?;
    }
    ```

#### Step 4: Implement Driver Logic (`src/driver/<platform>/driver.rs`)

Implement the trait method for **EACH** supported platform (`android`, `ios`, `web`).

**Android (`src/driver/android/driver.rs`):**
```rust
async fn my_new_command(&self, target: &str, duration: Option<u64>) -> Result<()> {
    // Use adb or uiautomator
    adb::exec_command(&self.serial, &["shell", "input", ...]).await?;
    Ok(())
}
```

**iOS (`src/driver/ios/driver.rs`):**
```rust
async fn my_new_command(&self, target: &str, duration: Option<u64>) -> Result<()> {
    // Use idb or WDA
    self.wda_client.lock().await.perform_action(...).await?;
    Ok(())
}
```

**Web (`src/driver/web/driver.rs`):**
```rust
async fn my_new_command(&self, target: &str, duration: Option<u64>) -> Result<()> {
    let page = self.page.lock().await;
    page.evaluate_js(...).await?;
    Ok(())
}
```

#### Step 5: Update Documentation (`docs/commands.md`)

Add your new command to `lumi-tester/docs/commands.md`.
- Add to the Table of Contents if necessary.
- Add a new section with **Description**, **Example YAML**, and **Parameters Table**.

#### Step 6: Update VS Code Extension (`lumi-tester-vscode`)

Update `src/schema/commands.ts` in the `lumi-tester-vscode` repo to enable IntelliSense.

1.  Add a new object to the `LUMI_COMMANDS` array:
    ```typescript
    {
      name: 'myNewCommand',
      category: 'Interaction', // or 'App Management', 'Control Flow'...
      description: 'Description of what it does',
      hasParams: true,
      snippet: 'myNewCommand:\n    target: "$1"', // VS Code snippet
      params: [
        { name: 'target', type: 'string', description: 'Target element' },
        { name: 'duration', type: 'number', description: 'Duration in ms' },
        // For complex objects, use a rich snippet in the param definition:
        {
          name: 'ocr',
          type: 'object',
          description: 'Find by OCR',
          snippet: 'ocr:\n    text: "${1:text_to_find}"\n    region: "${2|all,center|}"'
        }
      ]
    },
    ```

    > [!TIP]
    > **Rich Snippets**: For complex object parameters (like `ocr`, `permissions`), add a `snippet` field to the parameter definition. This allows users to tab through properties (e.g., `text`, `region`) instead of just getting a generic completion.

Selectors allow finding elements in different ways (Text, ID, OCR, etc.).

#### Step 1: Define Selector (`src/driver/traits.rs`)

Add a variant to the `Selector` enum.

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Selector {
    // ...
    MySelector(String, usize), // args: query, index
}
```

#### Step 2: Update Parameter Structs (`src/parser/types.rs`)

If your selector needs specific parameters in command definitions (like `ocr: true` or `ocr: { text: ... }`), update the relevant parameter structs (e.g., `TapParams`, `AssertParams`).

```rust
pub struct TapParams {
    // ...
    pub my_selector: Option<String>,
}
```

#### Step 3: Builder Logic (`src/runner/executor.rs`)

Update the `build_selector` function signature and logic.

1.  Update function signature to accept your new parameter.
2.  Add logic to build the `Selector`.

```rust
fn build_selector(
    // ... existing params
    my_param: &Option<String>, // Add your new param here
) -> Result<Selector> {
    // ...
    if let Some(query) = my_param {
        return Ok(Selector::MySelector(query.clone(), 0));
    }
    // ...
}
```

> [!IMPORTANT]
> You MUST update **ALL** call sites of `build_selector` in `executor.rs` (e.g., inside `TapOn`, `AssertVisible`, etc.) to pass the new parameter. Usually pass `&None` or `&params.my_param`.

#### Step 4: Implement Finding Logic (`src/driver/<platform>/driver.rs`)

Update `find_element` (or equivalent internal finder) for each platform.

**Android:**
- Handle `Selector::MySelector` in `find_node_by_selector` (XML parsing) or `find_element` (UIA/OCR).

**iOS:**
- Handle `Selector::MySelector` in `find_element_internal`. Map to `idb` predicates or WDA class chains if possible.

**Web:**
- Update `selector_to_playwright` in `src/driver/web/driver.rs` to convert your selector to a Playwright-compatible string (CSS/XPath) OR handle it manually in `find_element`.

### Workflow 3: Modifying Existing Commands

If you add a field to an existing command struct (e.g., adding `label` to `TapParams`):

#### Step 1: Update Struct (`src/parser/types.rs`)
Add the field with `#[serde(default)]` if optional.

```rust
pub struct TapParams {
    // ...
    #[serde(default)]
    pub label: Option<String>,
}
```

> [!WARNING]
> **CRITICAL: Check for Manual Parsing (`src/parser/yaml.rs`)**
> Some commands (like `LaunchApp`, `TapOn`) are **manually constructed** in `src/parser/yaml.rs` inside `parse_command_with_params`.
> If you add a field to the struct, you **MUST** update the initialization logic in `yaml.rs`.
>
> **Also Check**: `impl Default` blocks in `src/parser/types.rs`. If you add a field, update the default implementation.

#### Step 2: Update Usage
Update `executor.rs` or `driver` implementations to use the new field.

#### Step 3: Update Docs & VS Code
1.  **Docs**: Update the parameter table in `docs/commands.md`.
2.  **VS Code**: Add the new parameter to the `params` array in `lumi-tester-vscode/src/schema/commands.ts`.

> [!IMPORTANT]
> **Standardize Selectors**: If you add a new selector (e.g., `ocr`, `role`, `desc`) to `tap`, you **MUST** also add it to **ALL** other interaction and assertion commands that use selectors:
> - **Interactions**: `doubleTap`, `longPress`, `rightClick`, `type`, `tapAt`
> - **Scroll**: `scrollTo`, `scrollUntilVisible`
> - **Assertions**: `see`, `notSee`, `waitUntilVisible`, `waitNotSee`
>
> Failure to do this results in inconsistent autocomplete and frustrates users who expect the new selector to work everywhere.

## Logging & Debugging

### Logging Guidelines
- **User-Facing Logs**: Use `println!` with colored output for high-level steps (e.g., `➤ Executing...`).
    - **Info**: `println!("{}", "➤ Message".blue())`
    - **Success**: `println!("{}", "✓ Message".green())`
    - **Error**: `println!("{}", "✗ Message".red())`
- **Debug Logs**: Use the `log` crate macros (`debug!`, `trace!`). These are hidden by default and only show when `RUST_LOG=debug` is set.
    - **DO NOT** use `println!` for internal details.
    - Example:
      ```rust
      // In your driver or executor
      log::debug!("Finding element with selector: {:?}", selector);
      ```

## Examples

- [Adding a Zoom Command](examples/add-zoom-command.md): End-to-end walkthrough of adding a new command across all layers.

## Troubleshooting

- **Common Issues**: See [Common Pitfalls & Troubleshooting](resources/common-pitfalls.md) for detailed solutions to parsing and execution errors.
- **Logs**: Use `println!` with colored output (`"msg".blue()`) for visibility.
    - Blue: Info/Action (`"➤ Executing..."`)
    - Cyan: Detail (`"  Tap at..."`)
    - Yellow: Warning
    - Red: Error
- **Run with Trace**: `RUST_LOG=trace cargo run ...`
- **Output Dir**: Check the output directory (default `test_output/<timestamp>/`) for screenshots and logs.
- **Unit Tests**: Create a small unit test in the driver file to verify specific logic (e.g., regex parsing) without running a full simulator.

## Checklist for Success

- [ ] **Parser**: Did you add `struct` and `TestCommand` variant with correct `serde` attributes?
- [ ] **Executor**: Did you add the `match` arm? Did you update `build_selector` calls if needed?
- [ ] **Trait**: Did you add the method to `PlatformDriver`?
- [ ] **Impl**: Did you implement it for **Android**, **iOS**, and **Web**? (Or use `unimplemented!()`).
- [ ] **Legacy Init**: If modifying an existing command, did you check `src/parser/yaml.rs` for manual initialization?
- [ ] **Docs**: Did you update `docs/commands.md`?
- [ ] **VS Code**: Did you update `lumi-tester-vscode/src/schema/commands.ts`?
- [ ] **Build**: Run `cargo check` to catch missing implementations.
- [ ] **Test**: Verify with a minimal YAML file.
