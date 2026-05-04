import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RESTClient } from '@/client/RESTClient.js';
import * as Errors from '@/errors/APIError.js';

describe('RESTClient', () => {
    let mockFetch: any;
    let client: RESTClient;

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
        client = new RESTClient({ baseURL: 'https://api.example.com' });
    });

    describe('request methods', () => {
        it('should perform GET request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ foo: 'bar' }),
            });

            const response = await client.get('/test');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                expect.objectContaining({
                    method: 'GET',
                }),
            );
            expect(response.data).toEqual({ foo: 'bar' });
        });

        it('should handle query parameters in GET', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await client.get('/test', { params: { a: 1, b: 'two' } });
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/test?a=1&b=two',
                expect.any(Object),
            );
        });

        it('should perform POST request with body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: async () => ({ id: 1 }),
            });

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

        it('should perform PUT request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await client.put('/test', { foo: 'bar' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'PUT' }),
            );
        });

        it('should perform PATCH request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await client.patch('/test', { foo: 'bar' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'PATCH' }),
            );
        });

        it('should perform DELETE request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
                text: async () => '',
            });

            await client.delete('/test');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'DELETE' }),
            );
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
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status,
                    json: async () => ({ message: 'error' }),
                });

                await expect(client.get('/error')).rejects.toThrow(expectedError);
            },
        );

        it('should handle non-JSON error responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.reject(new Error('not json')),
                text: async () => 'Internal Server Error',
            });

            try {
                await client.get('/error');
            } catch (err: any) {
                expect(err.message).toContain('Internal Server Error');
            }
        });
    });

    describe('headers', () => {
        it('should include Authorization header if set', async () => {
            client.headers['Authorization'] = 'Bearer token';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

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

        it('should allow overriding headers per request', async () => {
            client.headers['X-Custom'] = 'default';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({}),
            });

            await client.get('/test', { headers: { 'X-Custom': 'override' } });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Custom': 'override',
                    }),
                }),
            );
        });
    });
});
