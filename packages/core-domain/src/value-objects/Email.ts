import { ValueObject } from '../base/ValueObject';
import { ValidationError } from '../base/DomainError';

interface EmailProps {
    value: string;
}

/**
 * Email Value Object
 * 
 * Represents a validated email address.
 */
export class Email extends ValueObject<EmailProps> {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    private constructor(props: EmailProps) {
        super(props);
    }

    get value(): string {
        return this.props.value;
    }

    public static create(email: string): Email {
        if (!email || email.trim().length === 0) {
            throw new ValidationError('Email cannot be empty', 'email');
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!Email.EMAIL_REGEX.test(normalizedEmail)) {
            throw new ValidationError('Invalid email format', 'email');
        }

        return new Email({ value: normalizedEmail });
    }

    public toString(): string {
        return this.props.value;
    }

    public getDomain(): string {
        return this.props.value.split('@')[1] ?? '';
    }
}
