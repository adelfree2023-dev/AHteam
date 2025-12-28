import { Entity } from '../base/Entity';
import { UserId } from '../value-objects/UserId';
import { TenantId } from '../value-objects/TenantId';
import { Email } from '../value-objects/Email';

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    BANNED = 'BANNED',
}

export interface UserProps {
    id: UserId;
    tenantId: TenantId;
    email: Email;
    name: string;
    passwordHash: string;
    status: UserStatus;
    roleIds: string[];
    metadata?: Record<string, unknown>;
}

/**
 * User Entity
 * 
 * Represents a user in the system.
 * Every user belongs to a Tenant (Multi-Tenant by Design).
 */
export class User extends Entity<string> {
    private readonly _tenantId: TenantId;
    private _email: Email;
    private _name: string;
    private _passwordHash: string;
    private _status: UserStatus;
    private _roleIds: string[];
    private _metadata: Record<string, unknown>;
    private _lastLoginAt?: Date;

    private constructor(props: UserProps) {
        super(props.id.value);
        this._tenantId = props.tenantId;
        this._email = props.email;
        this._name = props.name;
        this._passwordHash = props.passwordHash;
        this._status = props.status;
        this._roleIds = [...props.roleIds];
        this._metadata = props.metadata ?? {};
    }

    // Getters
    get tenantId(): TenantId {
        return this._tenantId;
    }

    get email(): Email {
        return this._email;
    }

    get name(): string {
        return this._name;
    }

    get passwordHash(): string {
        return this._passwordHash;
    }

    get status(): UserStatus {
        return this._status;
    }

    get roleIds(): string[] {
        return [...this._roleIds];
    }

    get isActive(): boolean {
        return this._status === UserStatus.ACTIVE;
    }

    get lastLoginAt(): Date | undefined {
        return this._lastLoginAt;
    }

    // Factory Method
    public static create(props: Omit<UserProps, 'id' | 'status'>): User {
        return new User({
            id: UserId.generate(),
            status: UserStatus.PENDING,
            ...props,
        });
    }

    // Reconstitution from persistence
    public static reconstitute(props: UserProps): User {
        return new User(props);
    }

    // Domain Methods
    public activate(): void {
        if (this._status === UserStatus.BANNED) {
            throw new Error('Cannot activate a banned user');
        }
        this._status = UserStatus.ACTIVE;
        this.touch();
    }

    public deactivate(): void {
        this._status = UserStatus.INACTIVE;
        this.touch();
    }

    public ban(reason?: string): void {
        this._status = UserStatus.BANNED;
        this._metadata['banReason'] = reason;
        this.touch();
    }

    public updatePassword(newPasswordHash: string): void {
        this._passwordHash = newPasswordHash;
        this.touch();
    }

    public updateEmail(email: Email): void {
        this._email = email;
        this.touch();
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        this._name = name.trim();
        this.touch();
    }

    public assignRole(roleId: string): void {
        if (!this._roleIds.includes(roleId)) {
            this._roleIds.push(roleId);
            this.touch();
        }
    }

    public removeRole(roleId: string): void {
        this._roleIds = this._roleIds.filter((id) => id !== roleId);
        this.touch();
    }

    public hasRole(roleId: string): boolean {
        return this._roleIds.includes(roleId);
    }

    public recordLogin(): void {
        this._lastLoginAt = new Date();
        this.touch();
    }
}
