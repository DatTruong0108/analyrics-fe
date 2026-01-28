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