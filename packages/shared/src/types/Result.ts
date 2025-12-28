/**
 * Result Type for Error Handling
 * 
 * Use this instead of throwing exceptions for expected failures.
 * Forces explicit error handling at compile time.
 */

export interface Success<T> {
    success: true;
    data: T;
}

export interface Failure<E = Error> {
    success: false;
    error: E;
}

export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Result utility functions
 */
export const Result = {
    ok<T>(data: T): Success<T> {
        return { success: true, data };
    },

    fail<E = Error>(error: E): Failure<E> {
        return { success: false, error };
    },

    isOk<T, E>(result: Result<T, E>): result is Success<T> {
        return result.success === true;
    },

    isFail<T, E>(result: Result<T, E>): result is Failure<E> {
        return result.success === false;
    },

    unwrap<T, E>(result: Result<T, E>): T {
        if (result.success) {
            return result.data;
        }
        throw result.error;
    },

    unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
        if (result.success) {
            return result.data;
        }
        return defaultValue;
    },

    map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
        if (result.success) {
            return Result.ok(fn(result.data));
        }
        return result;
    },

    flatMap<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> {
        if (result.success) {
            return fn(result.data);
        }
        return result;
    },
};
