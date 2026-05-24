import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@/client/Client.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

function jwtWithExp(exp: number): string {
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    return `header.${payload}.signature`;
}

describe('Client', () => {
    let mockFetch: any;

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
    });

    it('should create client with default base URL', () => {
        const client = new Client();
        expect(client.options.apiBaseUrl).toBe('https://ser.chat/api/v1');
    });

    it('should create client with custom base URL', () => {
        const client = new Client({ apiBaseUrl: 'https://api.example.com' });
        expect(client.options.apiBaseUrl).toBe('https://api.example.com');
    });

    it('should expose a webhook manager', () => {
        const client = new Client();
        expect(client.webhooks).toBeDefined();
    });

    describe('login', () => {
        it('should set Authorization header in REST client', async () => {
            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('test-token');
            expect(client.getRest().headers['Authorization']).toBe('Bearer test-token');
        });
    });

    describe('loginWithSecret', () => {
        it('should fetch token and call login', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ token: 'mock-token' }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            const token = await client.loginWithSecret('client-id', 'client-secret');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/bots/token',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        client_id: 'client-id',
                        client_secret: 'client-secret',
                    }),
                }),
            );
            expect(token).toBe('mock-token');
            expect(client.getRest().headers['Authorization']).toBe('Bearer mock-token');
        });

        it('should refresh the token and retry once when a REST request returns 401', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({ token: jwtWithExp(Math.floor(Date.now() / 1000) + 3600) }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                    json: async () => ({ error: 'Invalid token' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        token: jwtWithExp(Math.floor(Date.now() / 1000) + 7200),
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({ onlineCount: 1, totalCount: 2 }),
                });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.loginWithSecret('client-id', 'client-secret');

            const stats = await client.getServerStats('server-1');

            expect(stats).toEqual({ onlineCount: 1, totalCount: 2 });
            expect(mockFetch).toHaveBeenNthCalledWith(
                3,
                'https://ser.chat/api/v1/bots/token',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        client_id: 'client-id',
                        client_secret: 'client-secret',
                    }),
                }),
            );
            expect(mockFetch).toHaveBeenNthCalledWith(
                4,
                'https://ser.chat/api/v1/servers/server-1/stats',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Authorization: expect.stringContaining('Bearer header.'),
                    }),
                }),
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
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ messageId: 'msg-1', text: 'Hello' }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const result = await client.sendMessage('server-1', 'channel-1', 'Hello');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        content: 'Hello',
                    }),
                }),
            );
            expect(result.text).toBe('Hello');
            expect(result.messageId).toBe('msg-1');
        });

        it('should send EmbedBuilder correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ messageId: 'msg-1' }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const embed = new EmbedBuilder().setTitle('Test Embed');
            const result = await client.sendMessage('server-1', 'channel-1', embed);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        embeds: [{ type: 'rich', title: 'Test Embed' }],
                    }),
                }),
            );
            expect(result.messageId).toBe('msg-1');
        });

        it('should send raw payload object correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ messageId: 'msg-1' }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            const result = await client.sendMessage('server-1', 'channel-1', {
                content: 'Custom Payload',
                replyToId: 'msg-2',
                noEmbedsUrls: Array.from(
                    { length: 26 },
                    (_, index) => `https://example.com/${index}`,
                ),
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        content: 'Custom Payload',
                        replyToId: 'msg-2',
                        noEmbedsUrls: Array.from(
                            { length: 25 },
                            (_, index) => `https://example.com/${index}`,
                        ),
                    }),
                }),
            );
            expect(result.messageId).toBe('msg-1');
        });
    });

    describe('error mapping', () => {
        it('should reject with mapped Error when API returns 400', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                headers: new Headers({ 'Content-Type': 'application/json' }),
                json: async () => ({ message: 'Custom server error' }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            try {
                await client.getServerStats('server-1');
            } catch (err: unknown) {
                const e = err as any;
                expect(e.status).toBe(400);
                expect(e.message).toBe('Serchat API Error (400): "Custom server error"');
            }
        });

        it('should fallback mapped Error if message key is absent', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Headers({ 'Content-Type': 'text/plain' }),
                json: async () => 'Plain text failure',
                text: async () => 'Plain text failure',
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            try {
                await client.getServerStats('server-1');
            } catch (err: unknown) {
                const e = err as any;
                expect(e.message).toBe('Serchat API Error (500): "Plain text failure"');
            }
        });
    });
});
