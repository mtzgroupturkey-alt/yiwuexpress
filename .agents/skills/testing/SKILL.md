---
name: testing
description: Helps write and organize tests. Use when creating unit tests, integration tests, or E2E tests. Covers test patterns, mocking strategies, and test organization.
---

# Testing Skill

Comprehensive guide for writing effective tests across different testing levels.

## When to Use This Skill

- Writing unit tests for new functionality
- Creating integration tests for APIs
- Setting up E2E tests for user flows
- Improving test coverage
- Refactoring tests for better maintainability

## Decision Tree: Which Test Type?

```
What are you testing?
├── Single function/class in isolation
│   └── ✅ Unit Test
├── Multiple components working together
│   └── ✅ Integration Test
├── Complete user journey
│   └── ✅ E2E Test
└── Performance under load
    └── ✅ Load Test
```

## Test Structure: AAA Pattern

Always structure tests using **Arrange-Act-Assert**:

```javascript
describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    // Arrange - Set up test data
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act - Execute the code under test
    const result = calculator.add(a, b);

    // Assert - Verify the result
    expect(result).toBe(8);
  });
});
```

## Naming Conventions

### Test File Names
```
src/
├── services/
│   ├── UserService.js
│   └── UserService.test.js     # Unit tests
├── __tests__/
│   └── integration/
│       └── user-api.test.js    # Integration tests
└── e2e/
    └── user-flow.spec.js       # E2E tests
```

### Test Description Format
```javascript
// Pattern: should [expected behavior] when [condition]
it('should return null when user is not found', () => { });
it('should throw error when email is invalid', () => { });
it('should create user successfully when all fields are valid', () => { });
```

## Mocking Strategies

### When to Mock

| Mock | Don't Mock |
|------|------------|
| External APIs | Core business logic |
| Databases (unit tests) | Simple utility functions |
| File system | Pure functions |
| Time/Date | |
| Random values | |

### Mock Examples

```javascript
// Mock external service
jest.mock('../services/EmailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Mock time
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-15'));

// Mock database call
const mockUser = { id: 1, name: 'Test User' };
UserRepository.findById = jest.fn().mockResolvedValue(mockUser);
```

## Test Categories

### Unit Tests
- Fast, isolated, no external dependencies
- Test single function/method
- Use mocks for dependencies

```javascript
describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### Integration Tests
- Test multiple components together
- May use test database
- Slower than unit tests

```javascript
describe('POST /api/users', () => {
  it('should create user and send welcome email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

### E2E Tests
- Test complete user flows
- Use real browser/app
- Slowest, but most realistic

```javascript
describe('User Registration Flow', () => {
  it('should allow new user to register', async () => {
    await page.goto('/register');
    await page.fill('[name="email"]', 'new@user.com');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Test Coverage Guidelines

| Coverage Type | Recommended |
|--------------|-------------|
| Line Coverage | > 80% |
| Branch Coverage | > 70% |
| Function Coverage | > 90% |

> [!TIP]
> Focus on meaningful tests over coverage numbers. 100% coverage with poor tests is worse than 70% coverage with good tests.

## Best Practices

1. **One assertion per test** - Each test verifies one thing
2. **Independent tests** - Tests should not depend on each other
3. **Deterministic** - Same result every time
4. **Fast** - Unit tests should run in milliseconds
5. **Readable** - Tests are documentation
6. **Test edge cases** - Empty, null, boundary values

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Testing implementation details | Test behavior, not how it works |
| Flaky tests | Remove randomness, mock time |
| Slow test suite | More unit tests, fewer E2E |
| Testing framework code | Only test your own code |
| Copy-paste tests | Use test factories/builders |
