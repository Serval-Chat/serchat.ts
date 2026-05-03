import type { JsonValue } from '@/types/json.js';
import type { AxiosResponse } from 'axios';

export class SerchatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SerchatError';
    }
}

export class APIError extends SerchatError {
    public status: number;
    public data: JsonValue;
    public response?: AxiosResponse<JsonValue>;

    constructor(status: number, data: JsonValue, response?: AxiosResponse<JsonValue>) {
        let message: string;
        if (typeof data === 'string') {
            message = `"${data}"`;
        } else if (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            typeof data.message === 'string'
        ) {
            message = `"${data.message}"`;
        } else {
            message = JSON.stringify(data);
        }

        super(`Serchat API Error (${status}): ${message}`);
        this.status = status;
        this.data = data;
        this.response = response;
        this.name = 'APIError';
    }
}

export class BadRequestError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(400, data, response);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(401, data, response);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(403, data, response);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(404, data, response);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(429, data, response);
        this.name = 'RateLimitError';
    }
}

export class InternalServerError extends APIError {
    constructor(data: JsonValue, response?: AxiosResponse<JsonValue>) {
        super(500, data, response);
        this.name = 'InternalServerError';
    }
}
