import {
    APIError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    InternalServerError,
    BadGatewayError,
    ServiceUnavailableError,
    GatewayTimeoutError,
} from '@/errors/APIError.js';
import type { JsonValue, JsonObject } from '@/types/json.js';

export type Primitive = string | number | boolean | null | undefined;
export type SerializableParamValue =
    | Primitive
    | SerializableParamValue[]
    | { [key: string]: SerializableParamValue };

export interface Interceptors {
    request: Array<(config: RequestInit & { url: string }) => RequestInit & { url: string }>;
    response: Array<(response: Response) => Response | Promise<Response>>;
    /**
     * Interceptors called when a request fails.
     *
     * NOTE: Error interceptors can transform or replace the error, or throw a new one.
     * They cannot "recover" from an error to return a successful response data.
     */
    error: Array<(error: APIError) => APIError | Promise<never>>;
}

export type APIResponse<T> = { data: T };
export type EmptyResponse = { data: null };

/**
 * Utility to unwrap an API response, throwing if the data is null (e.g. 204 No Content).
 */
export function unwrap<T>({ data }: APIResponse<T> | EmptyResponse): T {
    if (data === null) {
        throw new Error('Expected data but received empty response (204)');
    }
    return data;
}

/**
 * Options for initializing a {@link RESTClient}.
 */
export interface RESTOptions {
    /** The base URL for all API requests. */
    baseURL: string;
    /** Default headers to include in every request. */
    headers?: Record<string, string | undefined>;
    /** Credentials mode for fetch requests. */
    credentials?: RequestCredentials;
    /** Default timeout in milliseconds for requests. */
    timeout?: number;
    /** Optional hook to transform response data. */
    transformResponse?: (data: JsonValue, response: Response) => JsonValue;
    /** Cookie name to read CSRF token from. */
    csrfCookieName?: string;
    /** Header name to use for CSRF token. */
    csrfHeaderName?: string;
    /** Controls redirect behaviour. Defaults to 'error' to prevent
     *  credential leakage to unexpected origins. */
    redirect?: RequestRedirect;
    /** If set, responses whose body exceeds this value (in bytes) are rejected
     *  mid-stream regardless of whether a Content-Length header is present. */
    maxResponseBytes?: number;
    /** Retry configuration for transient failures. */
    retry?: {
        /** Total number of attempts including the first. Defaults to 1 (no retry). */
        maxAttempts: number;
        retryOn?: number[];
        backoff?: (attempt: number) => number;
    };
}

/**
 * A wrapper around the Fetch API for interacting with the Serchat REST API.
 *
 * Handles JSON serialization, error mapping, and authentication headers.
 * Supports standard HTTP methods (GET, POST, PUT, PATCH, DELETE).
 */
export class RESTClient {
    private options: RESTOptions;
    /**
     * Default headers applied to every request sent by this client.
     */
    private _headers: Record<string, string | undefined>;
    private _pending: Set<AbortController>;
    public readonly interceptors: Interceptors = { request: [], response: [], error: [] };

    constructor(options: RESTOptions, pending?: Set<AbortController>) {
        const trimmed = options.baseURL.trim();
        if (trimmed !== options.baseURL) {
            console.warn('RESTClient: baseURL contains leading/trailing whitespace');
        }

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            throw new Error('baseURL must be an absolute URL starting with http:// or https://');
        }

        const base = trimmed.endsWith('/') ? trimmed : trimmed + '/';
        this.options = { ...options, baseURL: base };
        this._headers = Object.fromEntries(
            Object.entries(options.headers ?? {}).filter(([, v]) => v !== undefined),
        );
        this._pending = pending || new Set<AbortController>();
    }

    /**
     * Gets the current default headers.
     */
    public get headers(): Readonly<Record<string, string>> {
        return Object.fromEntries(
            Object.entries(this._headers).filter((e): e is [string, string] => e[1] !== undefined),
        );
    }

    /**
     * Sets a default header to be included in every request.
     * @param key - The header name.
     * @param value - The header value, or undefined to remove it.
     */
    public setDefaultHeader(key: string, value: string | undefined): void {
        if (value === undefined) {
            delete this._headers[key];
        } else {
            this._headers[key] = value;
        }
    }

    /**
     * Creates a new scoped client that inherits configuration, headers, and interceptors
     * but adds a path prefix.
     *
     * NOTE: Both request tracking (_pending) AND interceptors are shared
     * between the parent and scoped instances. Mutations to either propagate
     * in both directions. If you need an independent interceptor chain, call
     * `.interceptors.request = [...parent.interceptors.request]` on the child
     * after scoping.
     */
    public scoped(pathPrefix: string): RESTClient {
        const client = new RESTClient(
            {
                ...this.options,
                headers: { ...this._headers },
                baseURL: this.buildURL(pathPrefix) + '/',
            },
            this._pending,
        );
        client.interceptors.request = this.interceptors.request;
        client.interceptors.response = this.interceptors.response;
        client.interceptors.error = this.interceptors.error;
        return client;
    }

    /**
     * Aborts all in-flight requests initiated by this client instance (and shared scoped instances).
     */
    public abortAll(): void {
        for (const ctrl of this._pending) ctrl.abort();
        this._pending.clear();
    }

    private buildURL(path: string): string {
        const url = new URL(path.replace(/^\/+/, ''), this.options.baseURL);
        if (!url.href.startsWith(this.options.baseURL)) {
            throw new Error(`Path "${path}" escapes baseURL`);
        }
        return url.href;
    }

    private combineSignals(signals: AbortSignal[]): AbortSignal {
        // Fallback for environments without AbortSignal.any
        if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
            return AbortSignal.any(signals);
        }

        const controller = new AbortController();
        const cleanup: Array<() => void> = [];

        controller.signal.addEventListener(
            'abort',
            () => {
                for (const fn of cleanup) fn();
            },
            { once: true },
        );

        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                break;
            }
            const handler = (): void => controller.abort(signal.reason);
            signal.addEventListener('abort', handler, { once: true });
            cleanup.push(() => signal.removeEventListener('abort', handler));
        }

        return controller.signal;
    }

    private escapeRegExp(s: string): string {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private limitResponseBody(response: Response, maxBytes: number): Response {
        if (!response.body) return response;
        let received = 0;
        const limit = maxBytes;
        const originalResponse = response;
        const stream = response.body.pipeThrough(
            new TransformStream({
                transform(chunk, controller) {
                    received += chunk.byteLength;
                    if (received > limit) {
                        controller.error(
                            new APIError(
                                413,
                                {
                                    error: 'Response too large',
                                    message: `Body exceeded limit of ${limit} bytes`,
                                },
                                originalResponse,
                            ),
                        );
                    } else {
                        controller.enqueue(chunk);
                    }
                },
            }),
        );
        return new Response(stream, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    }

    private async request<T>(
        path: string,
        options: Omit<RequestInit, 'headers'> & {
            headers?: Record<string, string | undefined>;
            timeout?: number;
        },
    ): Promise<T | null> {
        // Ensure synchronous errors in buildURL are caught in the promise chain
        let url: string;
        try {
            url = this.buildURL(path);
        } catch (e) {
            return Promise.reject(e);
        }

        let requestInit: RequestInit & { url: string } = {
            ...options,
            url,
            headers: {},
        };

        const mergedHeaders: Record<string, string> = {};
        const addHeaders = (h?: Record<string, string | undefined>): void => {
            if (!h) return;
            for (const [key, value] of Object.entries(h)) {
                if (value !== undefined) {
                    mergedHeaders[key] = value;
                } else {
                    delete mergedHeaders[key];
                }
            }
        };

        addHeaders(this._headers);
        addHeaders(options.headers);

        // CSRF handling - only for state-changing methods AND same origin
        const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
            options.method || 'GET',
        );
        const isSameOrigin =
            new URL(url).origin ===
            (typeof window !== 'undefined'
                ? window.location.origin
                : new URL(this.options.baseURL).origin);
        if (
            isStateChanging &&
            isSameOrigin &&
            this.options.csrfCookieName &&
            this.options.csrfHeaderName
        ) {
            const csrfToken = this.getCookie(this.options.csrfCookieName);
            if (csrfToken) {
                mergedHeaders[this.options.csrfHeaderName] = csrfToken;
            }
        }

        requestInit.headers = mergedHeaders;

        // Apply request interceptors
        for (const interceptor of this.interceptors.request) {
            requestInit = interceptor(requestInit);
        }

        const execute = async (attempt: number): Promise<T | null> => {
            const timeout = options.timeout ?? this.options.timeout;
            const controller = new AbortController();
            this._pending.add(controller);

            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            if (timeout) {
                timeoutId = setTimeout(() => {
                    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
                }, timeout);
            }

            const signal = requestInit.signal
                ? this.combineSignals([requestInit.signal, controller.signal])
                : controller.signal;

            try {
                let response = await fetch(requestInit.url, {
                    ...requestInit,
                    credentials: this.options.credentials || 'same-origin',
                    redirect: this.options.redirect ?? 'error',
                    signal,
                });

                // Apply response interceptors
                for (const interceptor of this.interceptors.response) {
                    response = await interceptor(response);
                }

                if (this.options.maxResponseBytes !== undefined) {
                    response = this.limitResponseBody(response, this.options.maxResponseBytes);
                }

                if (!response.ok) {
                    let errorData: JsonValue;
                    const contentType = response.headers.get('Content-Type');
                    if (contentType?.includes('application/json')) {
                        try {
                            errorData = await response.json();
                        } catch {
                            errorData = await response.text();
                        }
                    } else {
                        errorData = await response.text();
                    }

                    const payload: JsonObject =
                        typeof errorData === 'string'
                            ? { error: 'Non-JSON response', message: errorData }
                            : (errorData as JsonObject);

                    const error = this.mapError(response.status, payload, response);

                    // Retry logic
                    const retryConfig = this.options.retry;
                    if (retryConfig && attempt < retryConfig.maxAttempts) {
                        const retryOn = retryConfig.retryOn || [429, 500, 502, 503, 504];
                        if (retryOn.includes(response.status)) {
                            const delay = retryConfig.backoff
                                ? retryConfig.backoff(attempt)
                                : 1000 * Math.pow(2, attempt - 1);

                            await new Promise<void>((resolve, reject) => {
                                const id = setTimeout(resolve, delay);
                                controller.signal.addEventListener(
                                    'abort',
                                    () => {
                                        clearTimeout(id);
                                        reject(controller.signal.reason);
                                    },
                                    { once: true },
                                );
                            });

                            if (controller.signal.aborted) throw controller.signal.reason;
                            return await execute(attempt + 1);
                        }
                    }

                    // Apply error interceptors
                    let finalError: APIError = error;
                    for (const interceptor of this.interceptors.error) {
                        finalError = await interceptor(finalError);
                    }
                    if (!(finalError instanceof APIError)) {
                        // An interceptor returned a non-APIError; wrap it defensively.
                        finalError = new APIError(
                            error.status ?? 0,
                            { error: 'Interceptor returned invalid error type' },
                            error.response,
                        );
                    }
                    throw finalError;
                }

                if (response.status === 204) {
                    return null;
                }

                let rawData: JsonValue;
                try {
                    rawData = await response.json();
                } catch {
                    throw new APIError(
                        response.status,
                        { error: 'Invalid JSON in response' },
                        response,
                    );
                }

                return (
                    this.options.transformResponse
                        ? this.options.transformResponse(rawData, response)
                        : rawData
                ) as T;
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
                this._pending.delete(controller);
            }
        };

        return execute(1);
    }

    private getCookie(name: string): string | undefined {
        if (typeof document === 'undefined') return undefined;
        const match = document.cookie.match(
            new RegExp(`(?:^|;\\s*)${this.escapeRegExp(name)}=([^;]*)`),
        );
        return match ? decodeURIComponent(match[1]) : undefined;
    }

    private serializeParams(params: Record<string, SerializableParamValue>, prefix = ''): string {
        const parts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            const partKey = prefix ? `${prefix}[${key}]` : key;
            if (value === null || value === undefined) continue;
            if (Array.isArray(value)) {
                for (const [i, item] of value.entries()) {
                    if (item !== null && typeof item === 'object') {
                        const nested = this.serializeParams(
                            item as Record<string, SerializableParamValue>,
                            `${partKey}[${i}]`,
                        );
                        if (nested) parts.push(nested);
                    } else {
                        parts.push(
                            `${encodeURIComponent(partKey)}=${encodeURIComponent(String(item))}`,
                        );
                    }
                }
            } else if (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value) &&
                (Object.getPrototypeOf(value) === Object.prototype ||
                    Object.getPrototypeOf(value) === null)
            ) {
                const nested = this.serializeParams(
                    value as Record<string, SerializableParamValue>,
                    partKey,
                );
                if (nested) parts.push(nested);
            } else {
                parts.push(`${encodeURIComponent(partKey)}=${encodeURIComponent(String(value))}`);
            }
        }
        return parts.join('&');
    }

    private mapError(status: number, data: JsonValue, response: Response): APIError {
        switch (status) {
            case 400:
                return new BadRequestError(data, response);
            case 401:
                return new UnauthorizedError(data, response);
            case 403:
                return new ForbiddenError(data, response);
            case 404:
                return new NotFoundError(data, response);
            case 429:
                return new RateLimitError(data, response);
            case 500:
                return new InternalServerError(data, response);
            case 502:
                return new BadGatewayError(data, response);
            case 503:
                return new ServiceUnavailableError(data, response);
            case 504:
                return new GatewayTimeoutError(data, response);
            default:
                return new APIError(status, data, response);
        }
    }

    /**
     * Performs a GET request.
     *
     * @param path - The API endpoint path.
     * @param config - Optional query parameters and additional headers.
     * @returns The parsed response data.
     */
    public async get<T = JsonValue>(
        path: string,
        config?: {
            params?: Record<string, SerializableParamValue>;
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        let urlPath = path;
        if (config?.params) {
            const queryString = this.serializeParams(config.params);
            if (queryString) {
                urlPath += (urlPath.includes('?') ? '&' : '?') + queryString;
            }
        }

        const data = await this.request<T>(urlPath, {
            method: 'GET',
            headers: config?.headers,
            signal: config?.signal,
            timeout: config?.timeout,
        });
        return { data } as APIResponse<T> | EmptyResponse;
    }

    private async mutate<T>(
        method: string,
        path: string,
        body?: JsonValue | FormData | Blob | ArrayBuffer | ReadableStream,
        config?: {
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        const isFormData = body instanceof FormData;
        const isBinary =
            body instanceof Blob ||
            body instanceof ArrayBuffer ||
            (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream);
        const hasJsonBody = body !== undefined && !isFormData && !isBinary;

        const data = await this.request<T>(path, {
            method,
            headers: {
                ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
                ...config?.headers,
            },
            body:
                isFormData || isBinary
                    ? (body as FormData | Blob | ArrayBuffer | ReadableStream)
                    : body !== undefined
                      ? JSON.stringify(body)
                      : undefined,
            signal: config?.signal,
            timeout: config?.timeout,
        });
        return { data } as APIResponse<T> | EmptyResponse;
    }

    /**
     * Performs a POST request.
     *
     * @param path - The API endpoint path.
     * @param body - The request body (JSON, FormData, Blob, ArrayBuffer, or ReadableStream).
     * @param config - Additional headers.
     * @returns The parsed response data.
     */
    public async post<T = JsonValue>(
        path: string,
        body?: JsonValue | FormData | Blob | ArrayBuffer | ReadableStream,
        config?: {
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        return this.mutate<T>('POST', path, body, config);
    }

    /**
     * Performs a PUT request.
     *
     * @param path - The API endpoint path.
     * @param body - The request body (JSON, FormData, Blob, ArrayBuffer, or ReadableStream).
     * @param config - Additional headers.
     * @returns The parsed response data.
     */
    public async put<T = JsonValue>(
        path: string,
        body?: JsonValue | FormData | Blob | ArrayBuffer | ReadableStream,
        config?: {
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        return this.mutate<T>('PUT', path, body, config);
    }

    /**
     * Performs a PATCH request.
     *
     * @param path - The API endpoint path.
     * @param body - The request body (JSON, FormData, Blob, ArrayBuffer, or ReadableStream).
     * @param config - Additional headers.
     * @returns The parsed response data.
     */
    public async patch<T = JsonValue>(
        path: string,
        body?: JsonValue | FormData | Blob | ArrayBuffer | ReadableStream,
        config?: {
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        return this.mutate<T>('PATCH', path, body, config);
    }

    /**
     * Performs a DELETE request.
     *
     * @param path - The API endpoint path.
     * @param body - Optional body (JSON, FormData, Blob, ArrayBuffer, or ReadableStream).
     * @param config - Additional headers.
     * @returns The parsed response data.
     */
    public async delete<T = JsonValue>(
        path: string,
        body?: JsonValue | FormData | Blob | ArrayBuffer | ReadableStream,
        config?: {
            headers?: Record<string, string | undefined>;
            signal?: AbortSignal;
            timeout?: number;
        },
    ): Promise<APIResponse<T> | EmptyResponse> {
        return this.mutate<T>('DELETE', path, body, config);
    }
}
