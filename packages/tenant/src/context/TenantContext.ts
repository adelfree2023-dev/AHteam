import { TenantId } from '@ahteam/core-domain';

export interface TenantContextData {
    tenantId: TenantId;
    tenantSlug: string;
    plan: string;
}

/**
 * TenantContext
 * 
 * Manages the current tenant context for the request.
 * All queries and operations should be scoped to this context.
 * 
 * IMPORTANT: Every API request MUST have a tenant context.
 */
export class TenantContext {
    private static currentContext: TenantContextData | null = null;

    /**
     * Set the current tenant context
     */
    public static set(context: TenantContextData): void {
        TenantContext.currentContext = context;
    }

    /**
     * Get the current tenant context
     * @throws Error if no context is set
     */
    public static get(): TenantContextData {
        if (!TenantContext.currentContext) {
            throw new Error('No tenant context set. Ensure tenant middleware is applied.');
        }
        return TenantContext.currentContext;
    }

    /**
     * Get tenant ID from current context
     */
    public static getTenantId(): TenantId {
        return TenantContext.get().tenantId;
    }

    /**
     * Check if tenant context is set
     */
    public static isSet(): boolean {
        return TenantContext.currentContext !== null;
    }

    /**
     * Clear the current context
     */
    public static clear(): void {
        TenantContext.currentContext = null;
    }

    /**
     * Run a function within a tenant context
     */
    public static async runWithContext<T>(
        context: TenantContextData,
        fn: () => Promise<T>
    ): Promise<T> {
        const previousContext = TenantContext.currentContext;
        try {
            TenantContext.set(context);
            return await fn();
        } finally {
            TenantContext.currentContext = previousContext;
        }
    }
}
