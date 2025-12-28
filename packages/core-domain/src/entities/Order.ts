import { AggregateRoot } from '../base/AggregateRoot';
import { TenantId } from '../value-objects/TenantId';
import { Money } from '../value-objects/Money';

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export interface OrderItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
}

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
}

export interface OrderProps {
    id: string;
    tenantId: TenantId;
    storeId: string;
    customerId: string;
    items: OrderItem[];
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingAddress: ShippingAddress;
    subtotal: Money;
    tax: Money;
    shipping: Money;
    total: Money;
    notes?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Order Entity (Aggregate Root)
 * 
 * Represents a customer order.
 * Contains order items, shipping info, and payment status.
 */
export class Order extends AggregateRoot<string> {
    private readonly _tenantId: TenantId;
    private readonly _storeId: string;
    private readonly _customerId: string;
    private _items: OrderItem[];
    private _status: OrderStatus;
    private _paymentStatus: PaymentStatus;
    private _shippingAddress: ShippingAddress;
    private readonly _subtotal: Money;
    private readonly _tax: Money;
    private readonly _shipping: Money;
    private readonly _total: Money;
    private _notes: string;
    private _metadata: Record<string, unknown>;

    private constructor(props: OrderProps) {
        super(props.id);
        this._tenantId = props.tenantId;
        this._storeId = props.storeId;
        this._customerId = props.customerId;
        this._items = props.items.map((item) => ({ ...item }));
        this._status = props.status;
        this._paymentStatus = props.paymentStatus;
        this._shippingAddress = { ...props.shippingAddress };
        this._subtotal = props.subtotal;
        this._tax = props.tax;
        this._shipping = props.shipping;
        this._total = props.total;
        this._notes = props.notes ?? '';
        this._metadata = props.metadata ?? {};
    }

    // Getters
    get tenantId(): TenantId {
        return this._tenantId;
    }

    get storeId(): string {
        return this._storeId;
    }

    get customerId(): string {
        return this._customerId;
    }

    get items(): OrderItem[] {
        return this._items.map((item) => ({ ...item }));
    }

    get status(): OrderStatus {
        return this._status;
    }

    get paymentStatus(): PaymentStatus {
        return this._paymentStatus;
    }

    get shippingAddress(): ShippingAddress {
        return { ...this._shippingAddress };
    }

    get subtotal(): Money {
        return this._subtotal;
    }

    get tax(): Money {
        return this._tax;
    }

    get shipping(): Money {
        return this._shipping;
    }

    get total(): Money {
        return this._total;
    }

    get notes(): string {
        return this._notes;
    }

    get itemCount(): number {
        return this._items.reduce((sum, item) => sum + item.quantity, 0);
    }

    get canBeCancelled(): boolean {
        return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this._status);
    }

    // Factory Method
    public static create(
        props: Omit<OrderProps, 'id' | 'status' | 'paymentStatus'>
    ): Order {
        const order = new Order({
            id: crypto.randomUUID(),
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            ...props,
        });

        order.addDomainEvent({
            eventType: 'OrderCreated',
            occurredOn: new Date(),
            aggregateId: order.id,
        });

        return order;
    }

    // Reconstitution from persistence
    public static reconstitute(props: OrderProps): Order {
        return new Order(props);
    }

    // Domain Methods - Status Transitions
    public confirm(): void {
        if (this._status !== OrderStatus.PENDING) {
            throw new Error('Only pending orders can be confirmed');
        }
        this._status = OrderStatus.CONFIRMED;
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderConfirmed',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public startProcessing(): void {
        if (this._status !== OrderStatus.CONFIRMED) {
            throw new Error('Only confirmed orders can start processing');
        }
        this._status = OrderStatus.PROCESSING;
        this.touch();
    }

    public ship(trackingNumber?: string): void {
        if (this._status !== OrderStatus.PROCESSING) {
            throw new Error('Only processing orders can be shipped');
        }
        this._status = OrderStatus.SHIPPED;
        if (trackingNumber) {
            this._metadata['trackingNumber'] = trackingNumber;
        }
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderShipped',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public deliver(): void {
        if (this._status !== OrderStatus.SHIPPED) {
            throw new Error('Only shipped orders can be delivered');
        }
        this._status = OrderStatus.DELIVERED;
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderDelivered',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public cancel(reason?: string): void {
        if (!this.canBeCancelled) {
            throw new Error('Order cannot be cancelled at this stage');
        }
        this._status = OrderStatus.CANCELLED;
        if (reason) {
            this._metadata['cancellationReason'] = reason;
        }
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderCancelled',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    // Payment Methods
    public markAsPaid(): void {
        this._paymentStatus = PaymentStatus.PAID;
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderPaid',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    public markPaymentFailed(): void {
        this._paymentStatus = PaymentStatus.FAILED;
        this.touch();
    }

    public refund(): void {
        if (this._paymentStatus !== PaymentStatus.PAID) {
            throw new Error('Only paid orders can be refunded');
        }
        this._paymentStatus = PaymentStatus.REFUNDED;
        this._status = OrderStatus.REFUNDED;
        this.touch();

        this.addDomainEvent({
            eventType: 'OrderRefunded',
            occurredOn: new Date(),
            aggregateId: this.id,
        });
    }

    // Other Methods
    public updateShippingAddress(address: ShippingAddress): void {
        if (this._status !== OrderStatus.PENDING) {
            throw new Error('Cannot update address after order is confirmed');
        }
        this._shippingAddress = { ...address };
        this.touch();
    }

    public addNote(note: string): void {
        this._notes = note;
        this.touch();
    }
}
