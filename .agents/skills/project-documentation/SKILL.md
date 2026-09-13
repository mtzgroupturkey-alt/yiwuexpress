---
name: project-documentation
description: Automatically generates comprehensive documentation (Overview, Architecture, Flows) for an existing project by analyzing code and identifying flows. Supports all languages (Python, JS/TS, Flutter, Swift, C++, Rust, etc.).
---

# Project Documentation Generation Skill

This skill allows you to reverse-engineer an existing codebase to create high-quality, comprehensive documentation. It supports **Multi-Language Analysis** (C++, Java, Kotlin, Swift, Dart, Go, Rust, etc.) using a custom Python script.

## When to Use This Skill

-   **Legacy Code**: Documenting undocumented projects.
-   **Onboarding**: Creating specific "Feature Guides" or "Architecture Overviews".
-   **Review**: Generating a "Current State" report before starting a refactor.

## Skill Structure
```text
.agent/skills/project-documentation/
├── SKILL.md                          # Main instructions
├── scripts/
│   └── analyze_codebase.py           # Analysis script (Python)
├── resources/
│   ├── standards.md                  # Documentation Standards (REQUIRED)
│   └── templates/
│       ├── flow.md                   # Template for Business Flows (Logic)
│       ├── feature_guide.md          # Template for UI/Screens
│       └── technical_reference.md    # Template for Backend/API
└── examples/
    └── example_usage.md              # Complete walkthrough
```

## Prerequisites

-   Python 3 installed.
-   Read access to the project root directory.
-   **REQUIRED**: Read the [Documentation Standards](./resources/standards.md) before writing any docs.
    ```bash
    view_file ./resources/standards.md
    ```

## How to Use

### Step 1: Run Analysis

Always run the script first to map the project.
```bash
# Run from the root of the project you want to document
# Note: The script is located in the skill's scripts directory
python3 ./scripts/analyze_codebase.py . > codebase_analysis.md
```

### Step 2: Create Checklist (Modular Plan)

You **MUST** create `documentation_checklist.md` assuming a modular structure:
-   [ ] **`docs/README.md`**: Index and Overview.
-   [ ] **`docs/setup.md`**: Installation instructions.
-   [ ] **`docs/architecture.md`**: System diagrams.
-   [ ] **`docs/flows/*.md`**: Business Logic Flows (CRITICAL).
-   [ ] **`docs/api/*.md`**: API Reference (Low-level).
-   [ ] **`docs/troubleshooting.md`**: Common issues.

### Step 3: Scaffold & Write

1.  Create the directory structure:
    ```bash
    mkdir -p docs/api docs/flows
    ```
2.  Write each file using the appropriate template from the Resources section.

## Workflows

### Workflow 1: Backend / General
*Best for: Server code (Go, Rust, Node.js), CLI tools.*
-   **Focus**: Endpoints, Database Schema, Data Models.
-   **Structure**:
    -   `docs/api/[module].md` (Use [Technical Reference](./resources/templates/technical_reference.md))
    -   `docs/flows/[flow_name].md` (Use [Flow Template](./resources/templates/flow.md))
    -   `docs/architecture.md` (Use [Architecture Template](./resources/templates/architecture.md))

### Workflow 2: Mobile App
*Best for: Flutter, Swift, Kotlin, React Native.*
-   **Focus**: User Flows, Navigation, State Logic.
-   **Structure**:
    -   `docs/flows/[feature].md` (Use [Flow Template](./resources/templates/flow.md))
    -   `docs/setup.md` (Use [Setup Template](./resources/templates/setup.md))

### Workflow 3: Embedded / Legacy
*Best for: C/C++, Java, Embedded Systems.*
-   **Focus**: Hardware Interactions, Memory Flows.
-   **Structure**:
    -   `docs/architecture.md` (Use [Architecture Template](./resources/templates/architecture.md))
    -   `docs/flows/[process].md` (Use [Flow Template](./resources/templates/flow.md))

## Examples

-   [Documenting a Flutter App](./examples/example_usage.md) - A complete walkthrough.

## Resources

-   [Standards & Guidelines](./resources/standards.md)
-   [Flow Template (Logic Traces)](./resources/templates/flow.md)
-   [Technical Reference Template](./resources/templates/technical_reference.md)
-   [Feature Guide Template](./resources/templates/feature_guide.md)

## Best Practices

-   **Visuals First**: Always draw the Flow/Architecture before writing text.
-   **Link to Code**: Use specific filenames from the analysis in your docs.
-   **Keep it Portable**: Use relative paths in your generated documentation where possible.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not found | Ensure you are running the `python3` command relative to the skill directory or copy the script to your project root. |
| Output is empty | Check if the language extension is supported. The script supports .py, .js, .ts, .rs, .go, .java, .kt, .swift, .c, .cpp, .dart. |
| Diagram Errors | Start with a simple graph. Complex mermaid often breaks markdown viewers. |
