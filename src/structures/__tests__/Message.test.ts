import { describe, expect, it, vi } from 'vitest';

import { Message } from '@/structures/Message.js';
import type { Client } from '@/client/Client.js';
import type { IMessageServer } from '@/types/message.js';

const makeMessagePayload = (overrides: Partial<IMessageServer>): IMessageServer =>
    ({
        id: 'msg-1',
        serverId: 'server-1',
        channelId: 'channel-1',
        senderId: 'user-1',
        senderUsername: 'User',
        text: 'Hello',
        createdAt: '2026-06-04T21:25:23.469Z',
        isEdited: false,
        isPinned: false,
        isSticky: false,
        isWebhook: false,
        embeds: [],
        components: [],
        attachments: [],
        reactions: [],
        interaction: null,
        poll: null,
        stickerId: null,
        senderIsBot: false,
        ...overrides,
    }) as IMessageServer;

describe('Message', () => {
    it('uses id as the primary public message identifier', () => {
        const message = new Message({} as Client, makeMessagePayload({ id: 'msg-id' }));

        expect(message.id).toBe('msg-id');
        expect(message.messageId).toBe('msg-id');
    });

    it('keeps messageId as a compatibility alias when present', () => {
        const message = new Message(
            {} as Client,
            makeMessagePayload({ id: 'msg-id', messageId: 'legacy-msg-id' }),
        );

        expect(message.id).toBe('msg-id');
        expect(message.messageId).toBe('legacy-msg-id');
    });

    it('rejects payloads without id or compatibility messageId', () => {
        expect(
            () =>
                new Message(
                    {} as Client,
                    makeMessagePayload({
                        id: undefined as unknown as string,
                        messageId: undefined,
                    }),
                ),
        ).toThrow('Message payload is missing id');
    });

    describe('react/unreact', () => {
        it('delegates react() to client.reactToMessage with the resolved ids', async () => {
            const reactToMessage = vi.fn().mockResolvedValue(undefined);
            const client = { reactToMessage } as unknown as Client;
            const message = new Message(client, makeMessagePayload({}));

            await message.react('👍', { emojiId: 'custom-1' });

            expect(reactToMessage).toHaveBeenCalledWith('server-1', 'channel-1', 'msg-1', '👍', {
                emojiId: 'custom-1',
            });
        });

        it('delegates unreact() to client.removeReaction with the resolved ids', async () => {
            const removeReaction = vi.fn().mockResolvedValue(undefined);
            const client = { removeReaction } as unknown as Client;
            const message = new Message(client, makeMessagePayload({}));

            await message.unreact('👍', { scope: 'all' });

            expect(removeReaction).toHaveBeenCalledWith('server-1', 'channel-1', 'msg-1', '👍', {
                scope: 'all',
            });
        });
    });
});
