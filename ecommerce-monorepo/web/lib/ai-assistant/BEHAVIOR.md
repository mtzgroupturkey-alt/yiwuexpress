# AI Assistant: Behavior Specification & Safety Guidelines

## 1. Core Principles

1. **Every Action Returns a Real Result:**
   - No mock or simulated responses. Every execution directly performs or queries against the database/services.
2. **No Success Claim Without Verification:**
   - An action cannot report success unless actual database operations succeeded.
   - If `rowsAffected === 0`, the UI and log must state that 0 rows were changed rather than claiming full success.
3. **No Fake / Sample Products:**
   - Reject fake product generator with hardcoded Unsplash images. Product creation requires real, validated parameters.
4. **No Slider / Banner Manipulation in Assistant:**
   - Sliders and homepage banners are managed via their dedicated Admin Slider tools, not conversational catalog AI.
5. **Write Actions Require Preview + Confirmation:**
   - Any state-altering action (`create`, `update`, `translate`) returns a structured `pendingAction` proposal.
   - Execution only takes place once the administrator explicitly confirms it via the UI or confirmed intent.
6. **Destructive Actions Require Explicit Typed Confirmation:**
   - Destructive operations (such as batch deletions or pruning empty categories) require a specific confirmation phrase (e.g., `DELETE-EMPTY`).
7. **Every Action Logged to `AssistantLog`:**
   - All executions record `userId`, `actionId`, `input`, `result`, `success`, `rowsAffected`, `errorMessage`, and `durationMs`.

---

## 2. Action Categories & Life Cycles

| Category | Execution Flow | Confirmation Required |
|---|---|---|
| **read** | Immediate Execution $\rightarrow$ Verify Result $\rightarrow$ Log $\rightarrow$ Display | None |
| **write** | Proposal Preview $\rightarrow$ Explicit User Confirm $\rightarrow$ DB Transaction $\rightarrow$ Verify `rowsAffected` $\rightarrow$ Log $\rightarrow$ Display | Click "Confirm & Apply" |
| **destructive** | Proposal Preview with Affected Count $\rightarrow$ Require Typed Phrase $\rightarrow$ DB Transaction $\rightarrow$ Log $\rightarrow$ Display | Typed confirmation string |

---

## 3. Failure & Edge Case Handling

- **Total Failure:**
  - Return `{ success: false, errorMessage, rowsAffected: 0 }`.
  - Display exact error to the administrator; never state "Operation completed".
- **Zero Rows Affected:**
  - Return `{ success: true, rowsAffected: 0 }`.
  - Assistant responds: `"Completed, but 0 items were changed."`
- **Partial Failure:**
  - Report exact counts: `"X succeeded, Y failed"`, along with specific error messages for failed items.
