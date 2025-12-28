import { Entity } from '../base/Entity';
import { TenantId } from '../value-objects/TenantId';

export interface Permission {
    resource: string;
    actions: ('create' | 'read' | 'update' | 'delete' | '*')[];
}

export interface RoleProps {
    id: string;
    tenantId: TenantId;
    name: string;
    description?: string;
    permissions: Permission[];
    isSystem: boolean;
}

/**
 * Role Entity
 * 
 * Represents a role with permissions in the system.
 * Each tenant can have its own set of roles.
 */
export class Role extends Entity<string> {
    private readonly _tenantId: TenantId;
    private _name: string;
    private _description: string;
    private _permissions: Permission[];
    private readonly _isSystem: boolean;

    private constructor(props: RoleProps) {
        super(props.id);
        this._tenantId = props.tenantId;
        this._name = props.name;
        this._description = props.description ?? '';
        this._permissions = [...props.permissions];
        this._isSystem = props.isSystem;
    }

    // Getters
    get tenantId(): TenantId {
        return this._tenantId;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get permissions(): Permission[] {
        return [...this._permissions];
    }

    get isSystem(): boolean {
        return this._isSystem;
    }

    // Factory Method
    public static create(props: Omit<RoleProps, 'id' | 'isSystem'>): Role {
        return new Role({
            id: crypto.randomUUID(),
            isSystem: false,
            ...props,
        });
    }

    // Create system role
    public static createSystemRole(props: Omit<RoleProps, 'id' | 'isSystem'>): Role {
        return new Role({
            id: crypto.randomUUID(),
            isSystem: true,
            ...props,
        });
    }

    // Reconstitution from persistence
    public static reconstitute(props: RoleProps): Role {
        return new Role(props);
    }

    // Domain Methods
    public updateName(name: string): void {
        if (this._isSystem) {
            throw new Error('Cannot modify system role name');
        }
        if (!name || name.trim().length < 2) {
            throw new Error('Role name must be at least 2 characters');
        }
        this._name = name.trim();
        this.touch();
    }

    public updateDescription(description: string): void {
        this._description = description;
        this.touch();
    }

    public addPermission(permission: Permission): void {
        if (this._isSystem) {
            throw new Error('Cannot modify system role permissions');
        }

        const existing = this._permissions.find((p) => p.resource === permission.resource);
        if (existing) {
            existing.actions = [...new Set([...existing.actions, ...permission.actions])];
        } else {
            this._permissions.push(permission);
        }
        this.touch();
    }

    public removePermission(resource: string): void {
        if (this._isSystem) {
            throw new Error('Cannot modify system role permissions');
        }

        this._permissions = this._permissions.filter((p) => p.resource !== resource);
        this.touch();
    }

    public hasPermission(resource: string, action: string): boolean {
        const permission = this._permissions.find((p) => p.resource === resource);
        if (!permission) return false;

        return permission.actions.includes('*') || permission.actions.includes(action as Permission['actions'][number]);
    }

    public canAccessResource(resource: string): boolean {
        return this._permissions.some((p) => p.resource === resource);
    }
}
