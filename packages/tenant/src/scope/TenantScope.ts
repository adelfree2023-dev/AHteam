import { TenantContext } from '../context/TenantContext';

/**
 * TenantScope
 * 
 * Utility for scoping database queries to the current tenant.
 * Ensures data isolation between tenants.
 */
export class TenantScope {
    /**
     * Get the WHERE clause for tenant scoping
     */
    public static getWhereClause(): { tenantId: string } {
        const tenantId = TenantContext.getTenantId();
        return { tenantId: tenantId.value };
    }

    /**
     * Apply tenant scope to a query object
     */
    public static applyToQuery<T extends Record<string, unknown>>(
        query: T
    ): T & { tenantId: string } {
        const tenantId = TenantContext.getTenantId();
        return {
            ...query,
            tenantId: tenantId.value,
        };
    }

    /**
     * Validate that a resource belongs to the current tenant
     */
    public static validateOwnership(resourceTenantId: string): void {
        const currentTenantId = TenantContext.getTenantId().value;
        if (resourceTenantId !== currentTenantId) {
            throw new Error('Access denied: Resource belongs to different tenant');
        }
    }

    /**
     * Check if a resource belongs to the current tenant
     */
    public static belongsToCurrentTenant(resourceTenantId: string): boolean {
        try {
            const currentTenantId = TenantContext.getTenantId().value;
            return resourceTenantId === currentTenantId;
        } catch {
            return false;
        }
    }
}
