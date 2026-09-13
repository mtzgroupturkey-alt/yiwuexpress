# Build Runner Guide

Complete guide for using build_runner with Flutter.

## Installation

```yaml
dev_dependencies:
  build_runner: ^2.4.9
  freezed: ^2.5.0
  json_serializable: ^6.8.0
```

## Basic Commands

### One-Time Build

```bash
# Standard build
flutter pub run build_runner build

# Delete conflicting outputs first
flutter pub run build_runner build --delete-conflicting-outputs

# Verbose output
flutter pub run build_runner build -v
```

### Watch Mode (Recommended for Development)

```bash
# Auto-rebuild on file changes
flutter pub run build_runner watch

# With delete conflicting
flutter pub run build_runner watch --delete-conflicting-outputs
```

### Clean Generated Files

```bash
# Remove all generated files
flutter pub run build_runner clean

# Full clean (including cache)
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

## Common Issues & Solutions

### Conflicting Outputs

```bash
# Error: Conflicting outputs
flutter pub run build_runner build --delete-conflicting-outputs
```

### Cache Issues

```bash
# Clear build cache
flutter pub run build_runner clean
rm -rf .dart_tool/build/

# Full clean
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Part Directive Errors

```dart
// Ensure correct part directives
part 'my_model.freezed.dart';  // For freezed
part 'my_model.g.dart';        // For json_serializable

// File structure:
// lib/data/models/user.dart
// lib/data/models/user.freezed.dart  (generated)
// lib/data/models/user.g.dart        (generated)
```

### Missing Generated Files

1. Check `part` directives match filename
2. Ensure annotations are correct (`@freezed`, `@JsonSerializable`)
3. Run build with verbose flag: `flutter pub run build_runner build -v`

## Build Configuration

### build.yaml

Create `build.yaml` in project root:

```yaml
targets:
  $default:
    builders:
      # JSON Serializable options
      json_serializable:
        options:
          include_if_null: false
          explicit_to_json: true
          field_rename: snake
          create_to_json: true
          create_factory: true

      # Freezed options
      freezed:
        options:
          # Add toString method
          to_string: true
          # Generate fromJson/toJson
          from_json: true
          to_json: true
          # Fallback union types
          fallback_union: null

      # Source gen options
      source_gen|combining_builder:
        options:
          # Ignore lint warnings in generated files
          ignore_for_file:
            - type=lint
```

## Script Shortcuts

### package.json style (Makefile)

Create `Makefile` in project root:

```makefile
.PHONY: build watch clean gen

# Generate code
build:
	flutter pub run build_runner build --delete-conflicting-outputs

# Watch mode
watch:
	flutter pub run build_runner watch --delete-conflicting-outputs

# Clean generated files
clean:
	flutter pub run build_runner clean
	flutter clean

# Full regenerate
gen:
	flutter clean
	flutter pub get
	flutter pub run build_runner build --delete-conflicting-outputs
```

Usage:
```bash
make build
make watch
make gen
```

### Shell Script

Create `scripts/build.sh`:

```bash
#!/bin/bash

case "$1" in
  "build")
    flutter pub run build_runner build --delete-conflicting-outputs
    ;;
  "watch")
    flutter pub run build_runner watch --delete-conflicting-outputs
    ;;
  "clean")
    flutter pub run build_runner clean
    flutter clean
    ;;
  "gen")
    flutter clean
    flutter pub get
    flutter pub run build_runner build --delete-conflicting-outputs
    ;;
  *)
    echo "Usage: ./scripts/build.sh [build|watch|clean|gen]"
    ;;
esac
```

## Workflow Tips

### Development Workflow

1. Start watch mode in terminal:
   ```bash
   flutter pub run build_runner watch --delete-conflicting-outputs
   ```

2. Edit your model files

3. Generated files update automatically

### Pre-Commit Check

```bash
# Run before committing
flutter analyze
flutter pub run build_runner build --delete-conflicting-outputs
flutter test
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
steps:
  - uses: actions/checkout@v3
  - uses: subosito/flutter-action@v2
  - run: flutter pub get
  - run: flutter pub run build_runner build --delete-conflicting-outputs
  - run: flutter analyze
  - run: flutter test
```

## Performance Tips

### Selective Building

```bash
# Build only specific files
flutter pub run build_runner build --build-filter="lib/data/models/*"
```

### Parallel Building

```yaml
# build.yaml
global_options:
  # Enable parallel builds
  build_runner:options:
    concurrent: true
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build hangs | Kill and restart, clear cache |
| "Could not find generator" | Check dev_dependencies are installed |
| Part file not found | Verify part directive matches filename |
| Outdated generated code | Run with `--delete-conflicting-outputs` |
| Import errors in generated | Check all imports are correct in source |

## Best Practices

1. **Use watch mode** during development
2. **Always use `--delete-conflicting-outputs`** to avoid conflicts
3. **Commit generated files** (or generate in CI)
4. **Add to .gitignore** if generating in CI:
   ```gitignore
   *.freezed.dart
   *.g.dart
   ```
5. **Create shortcuts** (Makefile or scripts) for common commands

