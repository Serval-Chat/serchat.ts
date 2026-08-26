import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@/client/Client.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

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
                json: async () => ({ id: 'msg-1', text: 'Hello' }),
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
            expect(result.id).toBe('msg-1');
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

    describe('reactToMessage', () => {
        it('sends emojiType: unicode by default', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ reactions: [] }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            await client.reactToMessage('server-1', 'channel-1', 'msg-1', '👍');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages/msg-1/reactions',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ emoji: '👍', emojiType: 'unicode' }),
                }),
            );
        });

        it('sends emojiType: custom with emojiId when provided', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ reactions: [] }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            await client.reactToMessage('server-1', 'channel-1', 'msg-1', 'party_blob', {
                emojiId: 'emoji-1',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages/msg-1/reactions',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        emoji: 'party_blob',
                        emojiType: 'custom',
                        emojiId: 'emoji-1',
                    }),
                }),
            );
        });
    });

    describe('removeReaction', () => {
        it('sends only emoji by default', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ reactions: [] }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            await client.removeReaction('server-1', 'channel-1', 'msg-1', '👍');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages/msg-1/reactions',
                expect.objectContaining({
                    method: 'DELETE',
                    body: JSON.stringify({ emoji: '👍' }),
                }),
            );
        });

        it('includes scope when removing all reactions for an emoji', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ reactions: [] }),
            });

            const client = new Client();
            vi.spyOn(client, 'connectWS').mockResolvedValue();
            await client.login('token');

            await client.removeReaction('server-1', 'channel-1', 'msg-1', '👍', {
                scope: 'all',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://ser.chat/api/v1/servers/server-1/channels/channel-1/messages/msg-1/reactions',
                expect.objectContaining({
                    method: 'DELETE',
                    body: JSON.stringify({ emoji: '👍', scope: 'all' }),
                }),
            );
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
