# Example Usage

## Scenario: Documenting a Flutter App

### 1. Analysis
The agent runs the analysis script:
```bash
python3 ../scripts/analyze_codebase.py . > analysis.md
```

### 2. Planning
The agent reads `analysis.md` and sees:
-   `lib/main.dart` (Entry point)
-   `lib/features/login/login_screen.dart`
-   `lib/features/home/home_screen.dart`

The agent creates `checklist.md`:
-   [ ] Overview: "A Flutter e-commerce app"
-   [ ] Architecture: Mermaid diagram of BLoC pattern.
-   [ ] Flow: Login -> Home.

### 3. Execution (Scaffold & Write)
The agent scaffolds the folder structure:
```bash
mkdir -p docs/flows docs/api
```

Then writes the documentation files:

#### `docs/architecture.md`
```markdown
# Architecture
## Diagram
\`\`\`mermaid
graph TD
    User -->|Enter Creds| LoginScreen
    LoginScreen -->|Submit| AuthService
    AuthService -->|Token| UserBox
\`\`\`
```

#### `docs/api/auth.md`
```markdown
# Auth API
## POST /login
- Request: `{email, password}`
- Response: `{token}`
```

#### `docs/flows/login_flow.md`
```markdown
# Login Flow
## Trigger
User clicks "Login" button.

## Sequence
\`\`\`mermaid
sequenceDiagram
    User->>App: Submits Creds
    App->>AuthService: validate()
    AuthService-->>App: Token
\`\`\`

## Logic Trace
1.  **Validate Input**: Check regex for email.
2.  **API Call**: POST /login.
3.  **State**: Store token in SecureStorage.
```

#### `docs/setup.md`
```markdown
# Setup
Run `flutter pub get`...
```
