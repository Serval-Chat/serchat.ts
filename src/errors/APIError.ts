import type { JsonValue } from '@/types/json.js';

/** Base class for all errors thrown by the Serchat SDK. */
export class SerchatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SerchatError';
    }
}

/** Represents an HTTP error response from the Serchat API.
 *
 * @example
 * ```ts
 * try {
 *   await client.sendMessage(serverId, channelId, 'Hello!');
 * } catch (err) {
 *   if (err instanceof APIError) {
 *     console.error(`API returned ${err.status}:`, err.data);
 *   }
 * }
 * ```
 */
export class APIError extends SerchatError {
    /** HTTP status code. */
    public status: number;
    /** Raw response body. */
    public data: JsonValue;
    /** Full fetch response object. */
    public response?: Response;

    constructor(status: number, data: JsonValue, response?: Response) {
        const message =
            typeof data === 'string'
                ? `"${data}"`
                : data && typeof data === 'object' && !Array.isArray(data) && 'message' in data
                  ? `"${(data as Record<string, JsonValue>).message}"`
                  : JSON.stringify(data);

        super(`Serchat API Error (${status}): ${message}`);
        this.status = status;
        this.data = data;
        this.response = response;
        this.name = 'APIError';
    }
}

/** Thrown when the API returns HTTP **400 Bad Request**. */
export class BadRequestError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(400, data, response);
        this.name = 'BadRequestError';
    }
}

/** Thrown when the API returns HTTP **401 Unauthorized** (invalid or missing token). */
export class UnauthorizedError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(401, data, response);
        this.name = 'UnauthorizedError';
    }
}

/** Thrown when the API returns HTTP **403 Forbidden** (insufficient permissions). */
export class ForbiddenError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(403, data, response);
        this.name = 'ForbiddenError';
    }
}

/** Thrown when the API returns HTTP **404 Not Found**. */
export class NotFoundError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(404, data, response);
        this.name = 'NotFoundError';
    }
}

/** Thrown when the API returns HTTP **429 Too Many Requests**. Back off and retry later. */
export class RateLimitError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(429, data, response);
        this.name = 'RateLimitError';
    }
}

/** Thrown when the API returns HTTP **500 Internal Server Error**. */
export class InternalServerError extends APIError {
    constructor(data: JsonValue, response?: Response) {
        super(500, data, response);
        this.name = 'InternalServerError';
    }
}
