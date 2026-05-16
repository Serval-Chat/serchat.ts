import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RESTClient } from '@/client/RESTClient.js';
import { WebhookManager } from '@/managers/WebhookManager.js';

describe('WebhookManager', () => {
    let mockFetch: ReturnType<typeof vi.fn>;
    let manager: WebhookManager;

    const createMockResponse = (json: object = {}, status = 200): Response =>
        ({
            ok: status < 400,
            status,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: vi.fn().mockResolvedValue(json),
            text: vi.fn().mockResolvedValue(JSON.stringify(json)),
        }) as unknown as Response;

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
        const rest = new RESTClient({ baseURL: 'https://api.example.com/api/v1' });
        manager = new WebhookManager(rest);
    });

    it('gets channel webhooks', async () => {
        mockFetch.mockResolvedValueOnce(
            createMockResponse([
                {
                    _id: 'webhook-1',
                    name: 'Deploys',
                    token: 'token',
                    createdBy: 'user-1',
                    createdAt: '2026-05-16T00:00:00.000Z',
                },
            ]),
        );

        const webhooks = await manager.getWebhooks('server-1', 'channel-1');

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/api/v1/servers/server-1/channels/channel-1/webhooks',
            expect.objectContaining({ method: 'GET' }),
        );
        expect(webhooks[0].name).toBe('Deploys');
    });

    it('creates a webhook', async () => {
        mockFetch.mockResolvedValueOnce(
            createMockResponse({
                _id: 'webhook-1',
                name: 'Deploys',
                token: 'token',
                avatarUrl: 'https://example.com/avatar.png',
                createdBy: 'user-1',
            }),
        );

        const webhook = await manager.createWebhook('server-1', 'channel-1', {
            name: 'Deploys',
            avatarUrl: 'https://example.com/avatar.png',
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/api/v1/servers/server-1/channels/channel-1/webhooks',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    name: 'Deploys',
                    avatarUrl: 'https://example.com/avatar.png',
                }),
            }),
        );
        expect(webhook._id).toBe('webhook-1');
    });

    it('deletes a webhook', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Webhook deleted' }));

        await manager.deleteWebhook('server-1', 'channel-1', 'webhook-1');

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/api/v1/servers/server-1/channels/channel-1/webhooks/webhook-1',
            expect.objectContaining({ method: 'DELETE' }),
        );
    });

    it('uploads a webhook avatar as multipart form data', async () => {
        mockFetch.mockResolvedValueOnce(
            createMockResponse({ avatarUrl: '/api/v1/webhooks/avatar/webhook-1.png' }),
        );

        const avatar = new Blob(['avatar'], { type: 'image/png' });
        const response = await manager.uploadWebhookAvatar(
            'server-1',
            'channel-1',
            'webhook-1',
            avatar,
        );

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/api/v1/servers/server-1/channels/channel-1/webhooks/webhook-1/avatar',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
            }),
        );
        expect(response.avatarUrl).toBe('/api/v1/webhooks/avatar/webhook-1.png');
    });

    it('executes a webhook by token', async () => {
        mockFetch.mockResolvedValueOnce(
            createMockResponse({
                id: 'message-1',
                timestamp: '2026-05-16T00:00:00.000Z',
            }),
        );

        const response = await manager.executeWebhook('token', {
            content: 'Build finished',
            username: 'CI',
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.example.com/api/v1/webhooks/token',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    content: 'Build finished',
                    username: 'CI',
                }),
            }),
        );
        expect(response.id).toBe('message-1');
    });
});
