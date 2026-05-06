import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RESTClient } from '@/client/RESTClient.js';
import * as Errors from '@/errors/APIError.js';

describe('RESTClient', () => {
    let mockFetch: any;
    let client: RESTClient;

    const createMockResponse = (options: {
        status?: number;
        ok?: boolean;
        json?: any;
        text?: string;
        headers?: Record<string, string>;
    }): Response => {
        const mockResponse = {
            status: options.status ?? 200,
            ok: options.ok ?? (options.status === undefined ? true : options.status < 400),
            headers: new Headers(options.headers),
            json: vi.fn().mockResolvedValue(options.json ?? {}),
            text: vi.fn().mockResolvedValue(options.text ?? ''),
        } as any;
        return mockResponse;
    };

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
        client = new RESTClient({ baseURL: 'https://api.example.com/' });
    });

    describe('request methods', () => {
        it('should perform GET request', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    json: { foo: 'bar' },
                }),
            );

            const response = await client.get('/test');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({
                    method: 'GET',
                }),
            );
            expect(response.data).toEqual({ foo: 'bar' });
        });

        it('should handle array query parameters in GET', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await client.get('/test', { params: { ids: [1, 2] } });
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test?ids=1&ids=2',
                expect.any(Object),
            );
        });

        it('should handle nested query parameters in GET', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await client.get('/test', { params: { a: { b: 1 } } });
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test?a%5Bb%5D=1',
                expect.any(Object),
            );
        });

        it('should perform POST request with body', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    status: 201,
                    json: { id: 1 },
                }),
            );

            const body = { name: 'test' };
            const response = await client.post('/test', body);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
            expect(response.data).toEqual({ id: 1 });
        });

        it('should handle 204 No Content by returning null', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    status: 204,
                    text: '',
                }),
            );

            const response = await client.delete('/test');
            expect(response.data).toBeNull();
        });
    });

    describe('URL safety', () => {
        it('should prevent path traversal', async () => {
            mockFetch.mockResolvedValue(createMockResponse({}));

            await client.get('../../evil');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/evil',
                expect.any(Object),
            );
        });

        it('should throw error for invalid baseURL', () => {
            expect(() => new RESTClient({ baseURL: 'invalid' })).toThrow();
        });
    });

    describe('timeout and AbortSignal', () => {
        it('should support timeout', async () => {
            vi.useFakeTimers();
            mockFetch.mockImplementation(
                (_url: string, options: any) =>
                    new Promise((_resolve, reject) => {
                        if (options.signal) {
                            options.signal.addEventListener('abort', () => {
                                reject(new Error('Aborted'));
                            });
                        }
                    }),
            );

            const promise = client.get('/slow', { timeout: 100 });

            vi.advanceTimersByTime(150);

            await expect(promise).rejects.toThrow('Aborted');
            vi.useRealTimers();
        });

        it('should combine external signal and timeout using AbortSignal.any', async () => {
            vi.useFakeTimers();
            const externalController = new AbortController();

            mockFetch.mockImplementation(
                (_url: string, options: any) =>
                    new Promise((_resolve, reject) => {
                        if (options.signal) {
                            options.signal.addEventListener('abort', () => {
                                reject(new Error('Aborted'));
                            });
                        }
                    }),
            );

            const promise = client.get('/slow', {
                signal: externalController.signal,
                timeout: 500,
            });

            externalController.abort();

            await expect(promise).rejects.toThrow('Aborted');
            vi.useRealTimers();
        });
    });

    describe('CSRF and Cookies', () => {
        it('should use robust regex for getCookie', async () => {
            const csrfClient = new RESTClient({
                baseURL: 'https://api.example.com',
                csrfCookieName: 'csrf-token',
                csrfHeaderName: 'X-CSRF-Token',
            });

            vi.stubGlobal('document', {
                cookie: 'other=val; csrf-token=secret-token; another=val',
            });

            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await csrfClient.post('/test', {});
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-CSRF-Token': 'secret-token',
                    }),
                }),
            );
        });

        it('should handle special characters in cookies', async () => {
            const csrfClient = new RESTClient({
                baseURL: 'https://api.example.com',
                csrfCookieName: 'csrf.token',
                csrfHeaderName: 'X-CSRF-Token',
            });

            vi.stubGlobal('document', {
                cookie: 'csrf.token=secret%2Btoken',
            });

            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await csrfClient.post('/test', {});
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-CSRF-Token': 'secret+token',
                    }),
                }),
            );
        });

        it('should NOT include CSRF token for GET requests', async () => {
            const csrfClient = new RESTClient({
                baseURL: 'https://api.example.com',
                csrfCookieName: 'csrf-token',
                csrfHeaderName: 'X-CSRF-Token',
            });

            vi.stubGlobal('document', {
                cookie: 'csrf-token=secret',
            });

            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await csrfClient.get('/test');
            const callHeaders = mockFetch.mock.calls[0][1].headers;
            expect(callHeaders['X-CSRF-Token']).toBeUndefined();
        });
    });

    describe('error handling', () => {
        const errorCases = [
            { status: 400, expectedError: Errors.BadRequestError },
            { status: 401, expectedError: Errors.UnauthorizedError },
            { status: 403, expectedError: Errors.ForbiddenError },
            { status: 404, expectedError: Errors.NotFoundError },
            { status: 429, expectedError: Errors.RateLimitError },
            { status: 500, expectedError: Errors.InternalServerError },
            { status: 418, expectedError: Errors.APIError },
        ];

        it.each(errorCases)(
            'should throw $expectedError.name for status $status',
            async ({ status, expectedError }) => {
                mockFetch.mockResolvedValueOnce(
                    createMockResponse({
                        ok: false,
                        status,
                        json: { message: 'error' },
                    }),
                );

                await expect(client.get('/error')).rejects.toThrow(expectedError);
            },
        );

        it('should handle non-JSON error responses by wrapping them', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    ok: false,
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' },
                    text: 'Internal Server Error',
                }),
            );

            try {
                await client.get('/error');
                expect.unreachable();
            } catch (err: any) {
                expect(err.data).toEqual({
                    error: 'Non-JSON response',
                    message: 'Internal Server Error',
                });
            }
        });

        it('should sanitize headers in APIError', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    ok: false,
                    status: 401,
                    headers: {
                        'Set-Cookie': 'secret=123',
                        'Content-Type': 'application/json',
                    },
                    json: {},
                }),
            );

            try {
                await client.get('/error');
                expect.unreachable();
            } catch (err: any) {
                expect(err.headers['set-cookie']).toBe('[REDACTED]');
                expect(err.headers['content-type']).toBe('application/json');
            }
        });
    });

    describe('headers and options', () => {
        it('should NOT include Content-Type for empty mutation body', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await client.post('/test');
            const callHeaders = mockFetch.mock.calls[0][1].headers;
            expect(callHeaders['Content-Type']).toBeUndefined();
        });

        it('should include default headers via setDefaultHeader', async () => {
            client.setDefaultHeader('Authorization', 'Bearer token');
            mockFetch.mockResolvedValueOnce(createMockResponse({}));

            await client.get('/test');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer token',
                    }),
                }),
            );
        });

        it('should support transformResponse', async () => {
            const customClient = new RESTClient({
                baseURL: 'https://api.example.com',
                transformResponse: (data: unknown) => ({
                    ...(data as Record<string, unknown>),
                    transformed: true,
                }),
            });

            mockFetch.mockResolvedValueOnce(
                createMockResponse({
                    json: { foo: 'bar' },
                }),
            );

            const response = await customClient.get('/test');
            expect(response.data).toEqual({ foo: 'bar', transformed: true });
        });
    });
});
