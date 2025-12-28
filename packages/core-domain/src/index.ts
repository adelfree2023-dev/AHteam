/**
 * ============================================
 * AHteam - Newagant SaaS Platform
 * Core Domain Package
 * ============================================
 * 
 * This package contains the core domain entities,
 * value objects, and business rules.
 * 
 * Architecture: Domain-Driven Design (DDD)
 * ============================================
 */

// Base Classes
export { Entity } from './base/Entity';
export { ValueObject } from './base/ValueObject';
export { AggregateRoot } from './base/AggregateRoot';
export { DomainError } from './base/DomainError';

// Domain Entities
export { Tenant } from './entities/Tenant';
export { User } from './entities/User';
export { Role } from './entities/Role';
export { Store } from './entities/Store';
export { Product } from './entities/Product';
export { Order } from './entities/Order';

// Value Objects
export { TenantId } from './value-objects/TenantId';
export { UserId } from './value-objects/UserId';
export { Email } from './value-objects/Email';
export { Money } from './value-objects/Money';
