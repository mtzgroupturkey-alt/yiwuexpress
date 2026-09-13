# Core Architecture & Internals

This document explains the internal working of `lumi-tester` to assist with maintenance and core refactoring.

## 1. Execution Flow (`Executor`)

 The `TestExecutor` (`src/runner/executor.rs`) is the heart of the runner.

### Lifecycle of a Test Run
1.  **Parsing**: `parse_test_file` (in `parser/yaml.rs`) converts YAML -> `TestFlow` struct.
2.  **Initialization**: `TestExecutor::new` creates:
    -   `TestContext`: Holds variables, app ID, platform-specific configs.
    -   `TestSessionState`: Tracks overall progress.
    -   `EventEmitter`: Async channel for reporting events (logs, status updates).
3.  **Flow Execution** (`run_file` -> `run_commands_set`):
    -   **Context Update**: Merges flow-specific header configs.
    -   **DDT Loop**: If `data` (CSV) is present, iterates over rows, injecting variables.
    -   **Command Loop**: Iterates through `TestCommand`s.
        -   **State Tracking**: Updates `CommandState` (Running -> Passed/Failed).
        -   **Event Emission**: Emits `CommandStarted`, `CommandPassed`, `CommandFailed`.
        -   **Error Handling**: Catches errors from `execute_command`.
            -   *Soft Errors*: Logged but don't stop flow (unless `continueOnFailure` is false).
            -   *Hard Errors*: Stop execution immediately.

## 2. State Management (`State`)

State is managed hierarchically in `src/runner/state.rs`:

-   **TestSessionState**: Root level. Contains multiple `FlowState`s.
-   **FlowState**: Represents one test file execution (or one DDT iteration). Contains `CommandState`s.
-   **CommandState**: Individual command status (Pending, Running, Passed, Failed).

> **Maintenance Tip**: When adding new execution logic (e.g., `retry`), update `CommandStatus` enum and handle state transitions in `executor.rs`.

## 3. Driver Architecture

The `PlatformDriver` trait (`src/driver/traits.rs`) enforces consistency.

-   **Lazy Initialization**: Drivers (especially iOS/Web) often use `OnceCell` for expensive resources (WDA client, Browser instance).
-   **Thread Safety**: Drivers must be `Send + Sync` to work with async runtime.
-   **Selector Handling**: `find_element` is usually the choke point.
    -   *Android*: Parsing XML hierarchy from `adb exec-out uiautomator`.
    -   *iOS*: `idb` UI tree or WDA predicate string.
    -   *Web*: Playwright selector engine.

## 4. Testing Strategy

To safely refactor core logic:
1.  **Unit Tests**: located in `src/driver/*/mod.rs` or alongside source. Run with `cargo test`.
2.  **E2E Verification**: Use the `my_testing/` folder YAMLs.
    -   Run `cargo run -- run my_testing/android/demo.yaml --platform android` for regression testing.
