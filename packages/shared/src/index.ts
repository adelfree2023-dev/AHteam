/**
 * ============================================
 * AHteam - Newagant SaaS Platform
 * Shared Package
 * ============================================
 * 
 * Common utilities, types, and helpers used across packages.
 * ============================================
 */

// Types
export type { Result, Success, Failure } from './types/Result';
export type { PaginatedResult, PaginationParams } from './types/Pagination';

// Utilities
export { Result as ResultUtil } from './types/Result';
export { generateId } from './utils/id';
export { sleep, retry } from './utils/async';
