import { AggregateRoot } from '../base/AggregateRoot';
import { TenantId } from '../value-objects/TenantId';

export enum StoreStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
}

export interface StoreSettings {
    currency: string;
    timezone: string;
    language: string;
    theme?: string;
}

export interface StoreProps {
    id: string;
    tenantId: TenantId;
    name: string;
    slug: string;
    description?: string;
    status: StoreStatus;
    settings: StoreSettings;
    metadata?: Record<string, unknown>;
}

/**
 * Store Entity (Aggregate Root)
 * 
 * Represents a store within a tenant.
 * A tenant can have multiple stores.
 */
export class Store extends AggregateRoot<string> {
    private readonly _tenantId: TenantId;
    private _name: string;
    private _slug: string;
    private _description: string;
    private _status: StoreStatus;
    private _settings: StoreSettings;
    private _metadata: Record<string, unknown>;

    private constructor(props: StoreProps) {
        super(props.id);
        this._tenantId = props.tenantId;
        this._name = props.name;
        this._slug = props.slug;
        this._description = props.description ?? '';
        this._status = props.status;
        this._settings = { ...props.settings };
        this._metadata = props.metadata ?? {};
    }

    // Getters
    get tenantId(): TenantId {
        return this._tenantId;
    }

    get name(): string {
        return this._name;
    }

    get slug(): string {
        return this._slug;
    }

    get description(): string {
        return this._description;
    }

    get status(): StoreStatus {
        return this._status;
    }

    get settings(): StoreSettings {
        return { ...this._settings };
    }

    get isActive(): boolean {
        return this._status === StoreStatus.ACTIVE;
    }

    // Factory Method
    public static create(
        props: Omit<StoreProps, 'id' | 'status'> & { status?: StoreStatus }
    ): Store {
        const store = new Store({
            id: crypto.randomUUID(),
            status: props.status ?? StoreStatus.ACTIVE,
            ...props,
        });

        store.addDomainEvent({
            eventType: 'StoreCreated',
            occurredOn: new Date(),
            aggregateId: store.id,
        });

        return store;
    }

    // Reconstitution from persistence
    public static reconstitute(props: StoreProps): Store {
        return new Store(props);
    }

    // Domain Methods
    public activate(): void {
        this._status = StoreStatus.ACTIVE;
        this.touch();

        this.addDomainEvent({
            eventType: 'StoreActivated',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public deactivate(): void {
        this._status = StoreStatus.INACTIVE;
        this.touch();
    }

    public enableMaintenance(): void {
        this._status = StoreStatus.MAINTENANCE;
        this.touch();
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error('Store name must be at least 2 characters');
        }
        this._name = name.trim();
        this.touch();
    }

    public updateDescription(description: string): void {
        this._description = description;
        this.touch();
    }

    public updateSettings(settings: Partial<StoreSettings>): void {
        this._settings = { ...this._settings, ...settings };
        this.touch();
    }

    public setCurrency(currency: string): void {
        this._settings.currency = currency.toUpperCase();
        this.touch();
    }

    public setTimezone(timezone: string): void {
        this._settings.timezone = timezone;
        this.touch();
    }
}
