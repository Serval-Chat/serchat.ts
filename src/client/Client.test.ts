import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Client } from './Client.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

vi.mock('axios');

interface MockAxios {
    post: ReturnType<typeof vi.fn>;
    defaults: { headers: { common: Record<string, string> } };
    interceptors: { response: { use: ReturnType<typeof vi.fn> } };
}

describe('Client', () => {
    let mockAxiosInstance: MockAxios;

    beforeEach(() => {
        mockAxiosInstance = {
            post: vi.fn(),
            defaults: {
                headers: {
                    common: {},
                },
            },
            interceptors: {
                response: {
                    use: vi.fn(),
                },
            },
        };

        (axios.create as ReturnType<typeof vi.fn>).mockReturnValue(mockAxiosInstance);
    });

    it('should create client with default base URL', () => {
        new Client();
        expect(axios.create).toHaveBeenCalledWith({
            baseURL: 'http://localhost:3000/api/v1',
        });
    });

    it('should create client with custom base URL', () => {
        new Client({ apiBaseUrl: 'https://api.example.com' });
        expect(axios.create).toHaveBeenCalledWith({
            baseURL: 'https://api.example.com',
        });
    });

    describe('login', () => {
        it('should set token in defaults headers', async () => {
            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('test-token');
            expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(
                'Bearer test-token',
            );
        });
    });

    describe('loginWithSecret', () => {
        it('should fetch token and call login', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: { token: 'mock-token' } });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            const token = await client.loginWithSecret('client-id', 'client-secret');

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/bots/token', {
                client_id: 'client-id',
                client_secret: 'client-secret',
            });
            expect(token).toBe('mock-token');
            expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe(
                'Bearer mock-token',
            );
        });
    });

    describe('sendMessage', () => {
        it('should throw if not logged in', async () => {
            const client = new Client();
            await expect(client.sendMessage('server-1', 'channel-1', 'test')).rejects.toThrow(
                'Client is not logged in.',
            );
        });

        it('should send content string correctly', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({
                data: { messageId: 'msg-1', text: 'Hello' },
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const result = await client.sendMessage('server-1', 'channel-1', 'Hello');

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/servers/server-1/channels/channel-1/messages',
                {
                    content: 'Hello',
                },
            );
            expect(result.text).toBe('Hello');
            expect(result.messageId).toBe('msg-1');
        });

        it('should send EmbedBuilder correctly', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: { messageId: 'msg-1' } });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const embed = new EmbedBuilder().setTitle('Test Embed');
            const result = await client.sendMessage('server-1', 'channel-1', embed);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/servers/server-1/channels/channel-1/messages',
                {
                    embeds: [{ type: 'rich', title: 'Test Embed' }],
                },
            );
            expect(result.messageId).toBe('msg-1');
        });

        it('should send raw payload object correctly', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: { messageId: 'msg-1' } });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const result = await client.sendMessage('server-1', 'channel-1', {
                content: 'Custom Payload',
                replyToId: 'msg-2',
            });

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/servers/server-1/channels/channel-1/messages',
                {
                    content: 'Custom Payload',
                    replyToId: 'msg-2',
                },
            );
            expect(result.messageId).toBe('msg-1');
        });
    });

    describe('interceptors', () => {
        it('should reject with mapped Error when interceptor picks up server payload', async () => {
            new Client();
            const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

            const mockError = {
                response: {
                    status: 400,
                    data: {
                        message: 'Custom server error',
                    },
                },
            };

            try {
                await errorCallback(mockError);
            } catch (err: unknown) {
                const e = err as Error & { response?: unknown };
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toBe('Serchat API Error (400): "Custom server error"');
                expect(e.response).toBe(mockError.response);
            }
        });

        it('should fallback mapped Error if message key is absent', async () => {
            new Client();
            const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

            const mockError = {
                response: {
                    status: 500,
                    data: 'Plain text failure',
                },
            };

            try {
                await errorCallback(mockError);
            } catch (err: unknown) {
                const e = err as Error;
                expect(e.message).toBe('Serchat API Error (500): "Plain text failure"');
            }
        });

        it('should just reject with original error if missing response data entirely', async () => {
            new Client();
            const errorCallback = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

            const genericError = new Error('Network error');
            try {
                await errorCallback(genericError);
            } catch (err: unknown) {
                expect(err).toBe(genericError);
            }
        });
    });
});
