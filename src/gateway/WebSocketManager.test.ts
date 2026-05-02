import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketManager } from './WebSocketManager.js';
import { Client } from '@/client/Client.js';
import { Interaction } from '@/structures/Interaction.js';
import WebSocket from 'ws';

vi.mock('ws');
vi.mock('@/structures/Message.js');

describe('WebSocketManager', () => {
    let client: Client;
    let manager: WebSocketManager;
    type MockWs = {
        on: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
        readyState: number;
    };
    let mockWs: MockWs;

    beforeEach(() => {
        client = new Client();
        manager = new WebSocketManager(client);
        mockWs = {
            on: vi.fn(),
            send: vi.fn(),
            readyState: 1, // OPEN
        };
        vi.mocked(WebSocket).mockImplementation(function () {
            return mockWs;
        });
        vi.spyOn(client, 'getToken').mockReturnValue('mock-token');
    });

    it('should emit messageReactionAdd when receiving reaction_added event', async () => {
        const connectPromise = manager.connect();

        const openCallback = mockWs.on.mock.calls.find(
            (c: unknown[]) => c[0] === 'open',
        )?.[1] as () => void;
        openCallback();

        const messageCallback = mockWs.on.mock.calls.find(
            (c: unknown[]) => c[0] === 'message',
        )?.[1] as (payload: string) => void;
        messageCallback(
            JSON.stringify({
                event: {
                    type: 'authenticated',
                    payload: { user: { id: 'bot-1', username: 'Bot' } },
                },
            }),
        );

        await connectPromise;

        const emitSpy = vi.spyOn(client, 'emit');

        const reactionPayload = {
            messageId: 'msg-1',
            userId: 'u1',
            username: 'user1',
            emoji: '👍',
            emojiType: 'unicode',
            messageType: 'server',
            serverId: 'server-1',
            channelId: 'channel-1',
        };

        messageCallback(
            JSON.stringify({
                event: {
                    type: 'reaction_added',
                    payload: reactionPayload,
                },
            }),
        );

        expect(emitSpy).toHaveBeenCalledWith('messageReactionAdd', reactionPayload);
    });

    const testCases: Record<string, string> = {
        message_server_edited: 'messageUpdate',
        message_server_deleted: 'messageDelete',
        member_added: 'serverMemberAdd',
        member_removed: 'serverMemberRemove',
        member_updated: 'serverMemberUpdate',
        channel_created: 'channelCreate',
        channel_updated: 'channelUpdate',
        channel_deleted: 'channelDelete',
        channels_reordered: 'channelsReordered',
        category_created: 'categoryCreate',
        category_updated: 'categoryUpdate',
        category_deleted: 'categoryDelete',
        categories_reordered: 'categoriesReordered',
        channel_permissions_updated: 'channelPermissionsUpdate',
        category_permissions_updated: 'categoryPermissionsUpdate',
        server_updated: 'serverUpdate',
        server_deleted: 'serverDelete',
        server_icon_updated: 'serverIconUpdate',
        server_banner_updated: 'serverBannerUpdate',
        role_created: 'roleCreate',
        role_updated: 'roleUpdate',
        role_deleted: 'roleDelete',
        roles_reordered: 'rolesReordered',
        server_invite_created: 'inviteCreate',
        server_invite_deleted: 'inviteDelete',
    };

    for (const [wsEvent, emitEvent] of Object.entries(testCases)) {
        it(`should emit ${emitEvent} when receiving ${wsEvent} event`, async () => {
            const connectPromise = manager.connect();
            const openCallback = mockWs.on.mock.calls.find(
                (c: unknown[]) => c[0] === 'open',
            )?.[1] as () => void;
            openCallback();

            const messageCallback = mockWs.on.mock.calls.find(
                (c: unknown[]) => c[0] === 'message',
            )?.[1] as (payload: string) => void;
            messageCallback(
                JSON.stringify({
                    event: {
                        type: 'authenticated',
                        payload: { user: { id: 'bot-1', username: 'Bot' } },
                    },
                }),
            );
            await connectPromise;

            const emitSpy = vi.spyOn(client, 'emit');
            const payload = { testData: 'mock' };

            messageCallback(
                JSON.stringify({
                    event: {
                        type: wsEvent,
                        payload,
                    },
                }),
            );

            expect(emitSpy).toHaveBeenCalledWith(emitEvent, payload);
        });
    }

    it('should emit interactionCreate when receiving interaction_create_server event', async () => {
        const connectPromise = manager.connect();
        const openCallback = mockWs.on.mock.calls.find(
            (c: unknown[]) => c[0] === 'open',
        )?.[1] as () => void;
        openCallback();

        const messageCallback = mockWs.on.mock.calls.find(
            (c: unknown[]) => c[0] === 'message',
        )?.[1] as (payload: string) => void;
        messageCallback(
            JSON.stringify({
                event: {
                    type: 'authenticated',
                    payload: { user: { id: 'bot-1', username: 'Bot' } },
                },
            }),
        );
        await connectPromise;

        const emitSpy = vi.spyOn(client, 'emit');
        const interactionPayload = {
            command: 'test',
            options: [],
            serverId: 'server-1',
            channelId: 'channel-1',
            senderId: 'user-1',
            senderUsername: 'user1',
            senderPermissions: { administrator: true },
        };

        messageCallback(
            JSON.stringify({
                event: {
                    type: 'interaction_create_server',
                    payload: interactionPayload,
                },
            }),
        );

        expect(emitSpy).toHaveBeenCalledWith('interactionCreate', expect.any(Interaction));
        const emittedInteraction = emitSpy.mock.calls.find(
            (c) => c[0] === 'interactionCreate',
        )?.[1] as Interaction;
        expect(emittedInteraction).toBeDefined();
        expect(emittedInteraction.permissions).toEqual({ administrator: true });
        expect(emittedInteraction.hasPermission('banMembers')).toBe(true);
    });
});
