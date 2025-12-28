import { ValueObject } from '../base/ValueObject';
import { ValidationError } from '../base/DomainError';

interface MoneyProps {
    amount: number;
    currency: string;
}

/**
 * Money Value Object
 * 
 * Represents a monetary value with currency.
 * Uses integer cents to avoid floating point issues.
 */
export class Money extends ValueObject<MoneyProps> {
    private static readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP'];

    private constructor(props: MoneyProps) {
        super(props);
    }

    get amount(): number {
        return this.props.amount;
    }

    get currency(): string {
        return this.props.currency;
    }

    /**
     * Create Money from cents (integer)
     */
    public static fromCents(cents: number, currency: string): Money {
        if (!Number.isInteger(cents)) {
            throw new ValidationError('Amount must be in cents (integer)', 'amount');
        }

        if (cents < 0) {
            throw new ValidationError('Amount cannot be negative', 'amount');
        }

        const normalizedCurrency = currency.toUpperCase();

        if (!Money.VALID_CURRENCIES.includes(normalizedCurrency)) {
            throw new ValidationError(
                `Invalid currency. Supported: ${Money.VALID_CURRENCIES.join(', ')}`,
                'currency'
            );
        }

        return new Money({ amount: cents, currency: normalizedCurrency });
    }

    /**
     * Create Money from decimal amount
     */
    public static fromDecimal(amount: number, currency: string): Money {
        const cents = Math.round(amount * 100);
        return Money.fromCents(cents, currency);
    }

    /**
     * Get amount as decimal
     */
    public toDecimal(): number {
        return this.props.amount / 100;
    }

    /**
     * Add two Money values
     */
    public add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new ValidationError('Cannot add Money with different currencies', 'currency');
        }

        return Money.fromCents(this.amount + other.amount, this.currency);
    }

    /**
     * Subtract Money value
     */
    public subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new ValidationError('Cannot subtract Money with different currencies', 'currency');
        }

        const result = this.amount - other.amount;
        if (result < 0) {
            throw new ValidationError('Result cannot be negative', 'amount');
        }

        return Money.fromCents(result, this.currency);
    }

    /**
     * Multiply by a factor
     */
    public multiply(factor: number): Money {
        const result = Math.round(this.amount * factor);
        return Money.fromCents(result, this.currency);
    }

    /**
     * Format as string
     */
    public toString(): string {
        return `${this.toDecimal().toFixed(2)} ${this.currency}`;
    }
}
