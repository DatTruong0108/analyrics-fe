export interface IBaseApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
    hasMore?: boolean;
}

export interface IErrorResponse {
    statusCode: number;
    message: string;
}

/* Mirrors the backend's `IPaginatedResult`, the `data` payload of /analysis/search. */
export interface IPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
