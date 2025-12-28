# Contributing to AHteam - Newagant

## 🧠 Engineering Doctrine

Before contributing, understand and follow our engineering doctrine:

### Non-Negotiable Rules

1. **TypeScript Only** - No raw JavaScript files
2. **Clean Architecture** - Domain first, then infrastructure
3. **Multi-Tenant by Design** - Every API requires Tenant Context
4. **Security First** - Every endpoint protected
5. **Tests Required** - No feature without tests

### Code Style

- Use ESLint and Prettier
- Follow strict TypeScript configuration
- No `any` types allowed
- Explicit return types required

### Git Workflow

1. Create feature branch from `main`
2. Write code with tests
3. Run linting: `npm run lint`
4. Submit PR for review
5. Address all feedback
6. Merge only after approval

### Commit Messages

Follow conventional commits:

```
feat: add user authentication
fix: resolve tenant scoping issue
docs: update API documentation
test: add unit tests for Order entity
refactor: improve password hashing
```

### Pull Request Requirements

- [ ] All tests pass
- [ ] No linting errors
- [ ] TypeScript compiles without errors
- [ ] Code reviewed by at least one team member
- [ ] Documentation updated if needed

## 🚦 Current Phase: Core Domain

We are only accepting contributions for:
- Tenant
- User
- Role
- Store
- Product
- Order

**Do NOT submit PRs for:**
- UI components
- Billing
- Subscriptions
- Plugins

---

> *We don't build fast. We build right — then fast.*
