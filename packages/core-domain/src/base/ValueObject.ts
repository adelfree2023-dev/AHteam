/**
 * Base Value Object Class
 * 
 * Value Objects are immutable and compared by their properties.
 * They don't have identity - two VOs with same properties are equal.
 */
export abstract class ValueObject<T> {
    protected readonly props: T;

    constructor(props: T) {
        this.props = Object.freeze(props);
    }

    public equals(vo?: ValueObject<T>): boolean {
        if (vo === null || vo === undefined) {
            return false;
        }

        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }

    /**
     * Clone the value object with new properties
     */
    protected clone(newProps: Partial<T>): ValueObject<T> {
        const Constructor = this.constructor as new (props: T) => ValueObject<T>;
        return new Constructor({ ...this.props, ...newProps });
    }
}
