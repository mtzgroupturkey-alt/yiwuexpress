# Code Review Checklist

Quick reference checklist for reviewing Pull Requests.

## Before Starting
- [ ] Read PR description
- [ ] Understand the context/issue
- [ ] Check PR size (consider asking to split if > 400 lines)

## Functionality
- [ ] Code does what description says
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] No obvious bugs
- [ ] Backward compatible (or breaking changes documented)

## Code Quality
- [ ] Readable and clear
- [ ] Single responsibility principle
- [ ] No code duplication
- [ ] Descriptive naming
- [ ] Complex logic commented

## Testing
- [ ] New functionality has tests
- [ ] Edge cases tested
- [ ] Existing tests pass
- [ ] Test names are descriptive

## Security
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No injection vulnerabilities
- [ ] Auth/authz correct

## Performance
- [ ] No N+1 queries
- [ ] Appropriate data structures
- [ ] No unnecessary loops
- [ ] Resources released

## Documentation
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed

## Final Check
- [ ] All comments addressed
- [ ] CI/CD passes
- [ ] No merge conflicts
