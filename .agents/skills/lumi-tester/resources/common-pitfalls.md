# Common Pitfalls & Troubleshooting

This guide addresses frequent issues encountered when extending `lumi-tester`.

## 1. Parser Issues (YAML -> Rust)

### Issue: "unknown field" error parsing YAML
**Cause:** Mismatch between YAML field names and Rust struct fields.
**Solution:**
- Ensure `#[serde(rename_all = "camelCase")]` is on your struct.
- Verify you aren't using snake_case in YAML if Rust expects camelCase.
- Use `#[serde(alias = "oldName")]` for backward compatibility.

### Issue: Enum variant not matching
**Cause:** `TestCommand` enum parsing is sensitive to case or aliases.
**Solution:**
- Check `#[serde(alias = "...")]` on the enum variant.
- Remember `rename_all="camelCase"` applies to variants too (e.g., `MyCommand` becomes `myCommand` in YAML).

### Issue: "missing field" compilation error in `yaml.rs`
**Cause:** You added a field to a struct in `types.rs`, but `src/parser/yaml.rs` manually initializes this struct without the new field.
**Solution:**
- Open `src/parser/yaml.rs`.
- Search for the struct name (e.g., `LaunchAppParams`).
- Add the missing field to the initialization block (usually `field: None` or `Default::default()`).

### Issue: "missing field" in `Default` impl
**Cause:** The struct implements `Default` manually in `types.rs`, and you didn't update it.
**Solution:** Find `impl Default for MyStruct` in `types.rs` and add the new field.

## 2. Executor Issues

### Issue: "No selector specified" panic
**Cause:** `build_selector` called with `&None` for all selector fields.
**Solution:** ensure your new selector parameter is passed correctly and `build_selector` logic handles it (returns `Ok(Selector::...)`).

### Issue: Command executes but does nothing
**Cause:** Driver implementation might be empty or returning `Ok(())` without action.
**Solution:** Add println logs (`"➤ Executing..."`) inside the driver implementation to verify it's reached.

## 3. Playwright/Web Issues

### Issue: Selector works in Inspector but not in Test
**Cause:** Shadow DOM or dynamic ID visibility.
**Solution:**
- Use `page.locator()` methods which wait for visibility.
- Ensure `selector_to_playwright` produces valid CSS/XPath.
- For custom selectors (OCR/Image), ensure the helper returns coordinates properly.

## 4. Compilation Errors

### Issue: `method not found in ...`
**Cause:** Forgot to add method to `PlatformDriver` trait OR implement it in one of the drivers.
**Solution:** Check `src/driver/traits.rs` first. Then check implementations.

### Issue: `struct has missing field` in `build_selector` call
**Cause:** You updated `build_selector` signature but didn't update all call sites.
**Solution:** The compiler will point to every call site (TapOn, AssertVisible, etc.). You must update ALL of them.
