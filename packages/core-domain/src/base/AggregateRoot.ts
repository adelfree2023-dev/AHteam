import { Entity } from './Entity';

/**
 * Aggregate Root Class
 * 
 * An Aggregate Root is an Entity that is the entry point
 * to an aggregate - a cluster of domain objects.
 * 
 * All modifications to the aggregate must go through the root.
 */
export abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents: DomainEvent[] = [];

    get domainEvents(): DomainEvent[] {
        return [...this._domainEvents];
    }

    protected addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
        this.touch();
    }

    public clearDomainEvents(): void {
        this._domainEvents = [];
    }
}

/**
 * Domain Event Interface
 */
export interface DomainEvent {
    readonly occurredOn: Date;
    readonly eventType: string;
    readonly aggregateId: string;
}
