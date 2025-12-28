# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-28

### Added

#### Core Domain Package (@ahteam/core-domain)
- Base `Entity` class with identity and timestamps
- Base `ValueObject` class for immutable objects
- Base `AggregateRoot` class with domain events
- Domain error classes: `ValidationError`, `NotFoundError`, `AuthorizationError`
- Value Objects: `TenantId`, `UserId`, `Email`, `Money`
- Entities: `Tenant`, `User`, `Role`, `Store`, `Product`, `Order`

#### Tenant Package (@ahteam/tenant)
- `TenantContext` for managing current tenant
- `TenantScope` for query scoping
- `TenantResolver` with multiple resolution strategies

#### Auth Package (@ahteam/auth)
- `PasswordService` for hashing and verification
- `AuthContext` for managing authenticated user
- `PermissionChecker` for access control

#### Shared Package (@ahteam/shared)
- `Result` type for functional error handling
- Pagination utilities
- ID generation utilities
- Async utilities (retry, timeout)

#### Infrastructure
- Monorepo structure with npm workspaces
- Strict TypeScript configuration
- ESLint with TypeScript rules
- Prettier for code formatting

---

> *We don't build fast. We build right — then fast.*
