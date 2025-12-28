import { AggregateRoot, DomainEvent } from '../base/AggregateRoot';
import { TenantId } from '../value-objects/TenantId';

export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TRIAL = 'TRIAL',
    CANCELLED = 'CANCELLED',
}

export interface TenantProps {
    id: TenantId;
    name: string;
    slug: string;
    status: TenantStatus;
    plan?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Tenant Entity (Aggregate Root)
 * 
 * The Tenant is the foundation of multi-tenancy.
 * Every resource in the system belongs to a Tenant.
 * 
 * This is an Aggregate Root - all access to tenant-related
 * data must go through this entity.
 */
export class Tenant extends AggregateRoot<string> {
    private _name: string;
    private _slug: string;
    private _status: TenantStatus;
    private _plan: string;
    private _metadata: Record<string, unknown>;

    private constructor(props: TenantProps) {
        super(props.id.value);
        this._name = props.name;
        this._slug = props.slug;
        this._status = props.status;
        this._plan = props.plan ?? 'free';
        this._metadata = props.metadata ?? {};
    }

    // Getters
    get name(): string {
        return this._name;
    }

    get slug(): string {
        return this._slug;
    }

    get status(): TenantStatus {
        return this._status;
    }

    get plan(): string {
        return this._plan;
    }

    get metadata(): Record<string, unknown> {
        return { ...this._metadata };
    }

    get isActive(): boolean {
        return this._status === TenantStatus.ACTIVE || this._status === TenantStatus.TRIAL;
    }

    // Factory Method
    public static create(props: Omit<TenantProps, 'id' | 'status'>): Tenant {
        const tenant = new Tenant({
            id: TenantId.generate(),
            status: TenantStatus.TRIAL,
            ...props,
        });

        tenant.addDomainEvent({
            eventType: 'TenantCreated',
            occurredOn: new Date(),
            aggregateId: tenant.id,
        });

        return tenant;
    }

    // Reconstitution from persistence
    public static reconstitute(props: TenantProps): Tenant {
        return new Tenant(props);
    }

    // Domain Methods
    public activate(): void {
        if (this._status === TenantStatus.CANCELLED) {
            throw new Error('Cannot activate a cancelled tenant');
        }

        this._status = TenantStatus.ACTIVE;
        this.touch();

        this.addDomainEvent({
            eventType: 'TenantActivated',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public suspend(reason?: string): void {
        this._status = TenantStatus.SUSPENDED;
        this._metadata['suspendReason'] = reason;
        this.touch();

        this.addDomainEvent({
            eventType: 'TenantSuspended',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public cancel(): void {
        this._status = TenantStatus.CANCELLED;
        this.touch();

        this.addDomainEvent({
            eventType: 'TenantCancelled',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public updatePlan(plan: string): void {
        const oldPlan = this._plan;
        this._plan = plan;
        this.touch();

        this.addDomainEvent({
            eventType: 'TenantPlanChanged',
            occurredOn: new Date(),
            aggregateId: this.id,
        } as DomainEvent & { oldPlan: string; newPlan: string });
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error('Tenant name must be at least 2 characters');
        }

        this._name = name.trim();
        this.touch();
    }
}
