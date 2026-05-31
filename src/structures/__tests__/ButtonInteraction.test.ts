import { describe, it, expect, vi } from 'vitest';
import { ButtonInteraction } from '@/structures/ButtonInteraction.js';
import { Client } from '@/client/Client.js';
import type { ComponentInteractionCreatePayload } from '@/types/events.js';

vi.mock('@/client/Client.js');

describe('ButtonInteraction', () => {
    const mockClient = new Client();
    const sendEphemeralSpy = vi.spyOn(mockClient, 'sendEphemeralInteractionResponse');
    const editMessageSpy = vi.spyOn(mockClient, 'editMessage');

    const payload: ComponentInteractionCreatePayload = {
        componentType: 'button',
        customId: 'cool',
        messageId: 'message-1',
        componentIndex: 0,
        serverId: 'server-1',
        channelId: 'channel-1',
        senderId: 'user-1',
        senderUsername: 'alice',
        senderPermissions: { sendMessages: true },
        invocationId: 'invoke-1',
    };

    it('should initialize from component payload', () => {
        const interaction = new ButtonInteraction(mockClient, payload);

        expect(interaction.customId).toBe('cool');
        expect(interaction.messageId).toBe('message-1');
        expect(interaction.componentIndex).toBe(0);
        expect(interaction.senderId).toBe('user-1');
        expect(interaction.hasPermission('sendMessages')).toBe(true);
    });

    it('should send ephemeral replies through the interaction response endpoint', async () => {
        const interaction = new ButtonInteraction(mockClient, payload);
        sendEphemeralSpy.mockResolvedValue(undefined);

        await interaction.ephemeralReply('Cool! You can click it');

        expect(mockClient.sendEphemeralInteractionResponse).toHaveBeenCalledWith(
            'server-1',
            'channel-1',
            'user-1',
            { content: 'Cool! You can click it' },
            'invoke-1',
        );
    });

    it('should edit the source message', async () => {
        const interaction = new ButtonInteraction(mockClient, payload);
        editMessageSpy.mockResolvedValue({ messageId: 'message-1' } as never);

        await interaction.editMessage({ content: 'updated' });

        expect(mockClient.editMessage).toHaveBeenCalledWith('server-1', 'channel-1', 'message-1', {
            content: 'updated',
        });
    });
});
