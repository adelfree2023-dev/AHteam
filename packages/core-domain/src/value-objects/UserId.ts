import { ValueObject } from '../base/ValueObject';
import { ValidationError } from '../base/DomainError';

interface UserIdProps {
    value: string;
}

/**
 * UserId Value Object
 * 
 * Represents a unique identifier for a User.
 */
export class UserId extends ValueObject<UserIdProps> {
    private constructor(props: UserIdProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    public static create(id: string): UserId {
        if (!id || id.trim().length === 0) {
            throw new ValidationError('UserId cannot be empty', 'userId');
        }

        return new UserId({ value: id.trim() });
    }

    public static generate(): UserId {
        const uuid = crypto.randomUUID();
        return new UserId({ value: uuid });
    }

    public toString(): string {
        return this.props.value;
    }
}
