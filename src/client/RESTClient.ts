import {
    APIError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    InternalServerError,
} from '@/errors/APIError.js';
import type { JsonValue } from '@/types/json.js';

interface RESTOptions {
    baseURL: string;
    headers?: Record<string, string | undefined>;
}

export class RESTClient {
    private options: RESTOptions;
    public headers: Record<string, string | undefined>;

    constructor(options: RESTOptions) {
        this.options = options;
        this.headers = options.headers || {};
    }

    private async request<T>(path: string, options: RequestInit): Promise<T> {
        const url = `${this.options.baseURL}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(this.headers as Record<string, string>),
                ...(options.headers as Record<string, string>),
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => response.text());
            throw this.mapError(response.status, data, response);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return (await response.json()) as T;
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
            default:
                return new APIError(status, data, response);
        }
    }

    public async get<T = JsonValue>(
        path: string,
        config?: { params?: Record<string, JsonValue>; headers?: Record<string, string> },
    ): Promise<{ data: T }> {
        let urlPath = path;
        if (config?.params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(config.params)) {
                searchParams.append(key, String(value));
            }
            urlPath += `?${searchParams.toString()}`;
        }

        const data = await this.request<T>(urlPath, {
            method: 'GET',
            headers: config?.headers,
        });
        return { data };
    }

    public async post<T = JsonValue>(
        path: string,
        body?: JsonValue | FormData,
        config?: { headers?: Record<string, string | undefined> },
    ): Promise<{ data: T }> {
        const isFormData = body instanceof FormData;
        const data = await this.request<T>(path, {
            method: 'POST',
            headers: {
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                ...(config?.headers as Record<string, string>),
            },
            body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
        });
        return { data };
    }

    public async put<T = JsonValue>(
        path: string,
        body?: JsonValue,
        config?: { headers?: Record<string, string> },
    ): Promise<{ data: T }> {
        const data = await this.request<T>(path, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...config?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        return { data };
    }

    public async patch<T = JsonValue>(
        path: string,
        body?: JsonValue,
        config?: { headers?: Record<string, string> },
    ): Promise<{ data: T }> {
        const data = await this.request<T>(path, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...config?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        return { data };
    }

    public async delete<T = JsonValue>(
        path: string,
        config?: { data?: JsonValue; headers?: Record<string, string> },
    ): Promise<{ data: T }> {
        const data = await this.request<T>(path, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...config?.headers,
            },
            body: config?.data ? JSON.stringify(config.data) : undefined,
        });
        return { data };
    }
}
