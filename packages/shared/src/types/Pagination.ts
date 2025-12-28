/**
 * Pagination Types
 */

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Create pagination response
 */
export function createPaginatedResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / params.limit);

    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}

/**
 * Calculate offset for database query
 */
export function calculateOffset(params: PaginationParams): number {
    return (params.page - 1) * params.limit;
}

/**
 * Default pagination params
 */
export const DEFAULT_PAGINATION: PaginationParams = {
    page: 1,
    limit: 20,
    sortOrder: 'desc',
};
