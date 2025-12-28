import { UserId } from '@ahteam/core-domain';

export interface AuthContextData {
    userId: UserId;
    email: string;
    roles: string[];
    permissions: string[];
}

/**
 * AuthContext
 * 
 * Manages the current authenticated user context.
 */
export class AuthContext {
    private static currentContext: AuthContextData | null = null;

    /**
     * Set the current auth context
     */
    public static set(context: AuthContextData): void {
        AuthContext.currentContext = context;
    }

    /**
     * Get the current auth context
     */
    public static get(): AuthContextData {
        if (!AuthContext.currentContext) {
            throw new Error('No auth context set. User is not authenticated.');
        }
        return AuthContext.currentContext;
    }

    /**
     * Get current user ID
     */
    public static getUserId(): UserId {
        return AuthContext.get().userId;
    }

    /**
     * Check if user is authenticated
     */
    public static isAuthenticated(): boolean {
        return AuthContext.currentContext !== null;
    }

    /**
     * Clear the current context
     */
    public static clear(): void {
        AuthContext.currentContext = null;
    }

    /**
     * Check if user has a specific role
     */
    public static hasRole(role: string): boolean {
        if (!AuthContext.currentContext) return false;
        return AuthContext.currentContext.roles.includes(role);
    }

    /**
     * Check if user has a specific permission
     */
    public static hasPermission(permission: string): boolean {
        if (!AuthContext.currentContext) return false;
        return AuthContext.currentContext.permissions.includes(permission);
    }

    /**
     * Run a function within an auth context
     */
    public static async runWithContext<T>(
        context: AuthContextData,
        fn: () => Promise<T>
    ): Promise<T> {
        const previousContext = AuthContext.currentContext;
        try {
            AuthContext.set(context);
            return await fn();
        } finally {
            AuthContext.currentContext = previousContext;
        }
    }
}
