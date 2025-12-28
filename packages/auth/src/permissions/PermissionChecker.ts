import { AuthContext } from '../context/AuthContext';

type Action = 'create' | 'read' | 'update' | 'delete' | '*';

interface Permission {
    resource: string;
    action: Action;
}

/**
 * PermissionChecker
 * 
 * Utility for checking user permissions.
 * Integrates with AuthContext to validate access.
 */
export class PermissionChecker {
    /**
     * Check if user has permission for a specific action on a resource
     */
    public static can(resource: string, action: Action): boolean {
        if (!AuthContext.isAuthenticated()) {
            return false;
        }

        const permissions = AuthContext.get().permissions;

        // Check for exact match
        const permissionKey = `${resource}:${action}`;
        if (permissions.includes(permissionKey)) {
            return true;
        }

        // Check for wildcard action
        const wildcardKey = `${resource}:*`;
        if (permissions.includes(wildcardKey)) {
            return true;
        }

        // Check for super admin (all permissions)
        if (permissions.includes('*:*')) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can read a resource
     */
    public static canRead(resource: string): boolean {
        return PermissionChecker.can(resource, 'read');
    }

    /**
     * Check if user can create a resource
     */
    public static canCreate(resource: string): boolean {
        return PermissionChecker.can(resource, 'create');
    }

    /**
     * Check if user can update a resource
     */
    public static canUpdate(resource: string): boolean {
        return PermissionChecker.can(resource, 'update');
    }

    /**
     * Check if user can delete a resource
     */
    public static canDelete(resource: string): boolean {
        return PermissionChecker.can(resource, 'delete');
    }

    /**
     * Assert permission (throws if not allowed)
     */
    public static assert(resource: string, action: Action): void {
        if (!PermissionChecker.can(resource, action)) {
            throw new Error(`Permission denied: ${action} on ${resource}`);
        }
    }

    /**
     * Check multiple permissions (all must pass)
     */
    public static canAll(permissions: Permission[]): boolean {
        return permissions.every((p) => PermissionChecker.can(p.resource, p.action));
    }

    /**
     * Check multiple permissions (any must pass)
     */
    public static canAny(permissions: Permission[]): boolean {
        return permissions.some((p) => PermissionChecker.can(p.resource, p.action));
    }
}
