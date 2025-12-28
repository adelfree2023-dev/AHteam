import { ValueObject } from '../base/ValueObject';
import { ValidationError } from '../base/DomainError';

interface TenantIdProps {
    value: string;
}

/**
 * TenantId Value Object
 * 
 * Represents a unique identifier for a Tenant.
 * This is the foundation of multi-tenancy - every resource belongs to a tenant.
 */
export class TenantId extends ValueObject<TenantIdProps> {
    private constructor(props: TenantIdProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    public static create(id: string): TenantId {
        if (!id || id.trim().length === 0) {
            throw new ValidationError('TenantId cannot be empty', 'tenantId');
        }

        if (id.length < 3) {
            throw new ValidationError('TenantId must be at least 3 characters', 'tenantId');
        }

        return new TenantId({ value: id.trim() });
    }

    public static generate(): TenantId {
        const uuid = crypto.randomUUID();
        return new TenantId({ value: uuid });
    }

    public toString(): string {
        return this.props.value;
    }
}
