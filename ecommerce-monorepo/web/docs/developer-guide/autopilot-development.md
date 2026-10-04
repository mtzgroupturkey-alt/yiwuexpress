# Auto-Pilot Developer Guide & Extensibility

## 1. Adding a New Department Probe
To add a new probe (e.g. `procurement`):
1. Create `lib/autopilot/probes/procurement.ts` exporting `probeProcurement(snapshot): Promise<ProbeResult>`.
2. Register the probe dispatcher in `lib/autopilot/probes/index.ts`:
   ```typescript
   export const PROBE_DISPATCHERS = {
     ...
     procurement: probeProcurement,
   };
   ```
3. Add tests in `__tests__/autopilot/probes.test.ts`.

---

## 2. Adding a New Action to the Whitelist Registry
All executable actions must be registered in `lib/autopilot/actions/registry.ts`:
```typescript
export const ACTION_REGISTRY = {
  my_new_action: {
    key: 'my_new_action',
    name: 'My New Action',
    department: 'inventory',
    riskLevel: 'approve', // 'auto' | 'approve' | 'block'
    paramSchema: z.object({ id: z.string() }),
    handler: async (params) => { ... },
    rollback: async (params, result) => { ... },
  }
};
```

---

## 3. Testing Strategy
- Unit tests run via Vitest: `npm test` or `npx vitest run autopilot`.
- Type safety enforced via `npx tsc --noEmit`.
- Integration CLI scripts in `scripts/test-*.ts`.

---

## خلاصه راهنمای توسعه‌دهنده (Developer Summary in Persian)
برای افزودن کاوشگر (Probe) یا اقدام جدید (Action)، توسعه‌دهنده باید از الگوهای تایپ‌سیف موجود پیروی کرده، قوانین را در رجیستری ثبت نماید و تست‌های ویتست مربوطه را پیاده‌سازی کند.
