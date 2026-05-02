import { describe, it, expect, vi } from 'vitest';
import { Interaction } from './Interaction.js';
import type { Message } from './Message.js';
import { Client } from '@/client/Client.js';
import type { InteractionCreatePayload } from '@/types/events.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

vi.mock('@/client/Client.js');

describe('Interaction', () => {
    const mockClient = new Client();
    const sendMessageSpy = vi.spyOn(mockClient, 'sendMessage');

    const basePayload: InteractionCreatePayload = {
        command: 'test',
        options: [{ name: 'opt', value: 'val' }],
        serverId: 'server-1',
        channelId: 'channel-1',
        senderId: 'user-1',
        senderUsername: 'user1',
        senderPermissions: {
            sendMessages: true,
            manageMessages: false,
        },
        invocationId: 'msg-1',
    };

    it('should initialize correctly from payload', () => {
        const interaction = new Interaction(mockClient, basePayload);

        expect(interaction.command).toBe('test');
        expect(interaction.options).toEqual(basePayload.options);
        expect(interaction.serverId).toBe('server-1');
        expect(interaction.channelId).toBe('channel-1');
        expect(interaction.senderId).toBe('user-1');
        expect(interaction.senderUsername).toBe('user1');
        expect(interaction.permissions).toEqual(basePayload.senderPermissions);
        expect(interaction.invocationId).toBe('msg-1');
    });

    describe('hasPermission', () => {
        it('should return true for granted permission', () => {
            const interaction = new Interaction(mockClient, basePayload);
            expect(interaction.hasPermission('sendMessages')).toBe(true);
        });

        it('should return false for denied permission', () => {
            const interaction = new Interaction(mockClient, basePayload);
            expect(interaction.hasPermission('manageMessages')).toBe(false);
        });

        it('should return false for missing permission in payload', () => {
            const interaction = new Interaction(mockClient, basePayload);
            expect(interaction.hasPermission('administrator')).toBe(false);
        });

        it('should return true for any permission if administrator is true', () => {
            const adminPayload = {
                ...basePayload,
                senderPermissions: { administrator: true },
            };
            const interaction = new Interaction(mockClient, adminPayload);
            expect(interaction.hasPermission('banMembers')).toBe(true);
            expect(interaction.hasPermission('manageServer')).toBe(true);
        });

        it('should handle missing permissions object in payload', () => {
            const missingPermsPayload = { ...basePayload };
            delete missingPermsPayload.senderPermissions;

            const interaction = new Interaction(mockClient, missingPermsPayload);
            expect(interaction.hasPermission('sendMessages')).toBe(false);
        });
    });

    describe('reply', () => {
        it('should call sendMessage with correct payload and interaction metadata', async () => {
            const interaction = new Interaction(mockClient, basePayload);
            sendMessageSpy.mockResolvedValue({ messageId: 'reply-1' } as Message);

            await interaction.reply('hello');

            expect(mockClient.sendMessage).toHaveBeenCalledWith('server-1', 'channel-1', {
                content: 'hello',
                interaction: {
                    command: 'test',
                    options: [{ name: 'opt', value: 'val' }],
                    user: { id: 'user-1', username: 'user1' },
                },
            });
        });

        it('should handle EmbedBuilder in reply', async () => {
            const interaction = new Interaction(mockClient, basePayload);
            const embed = new EmbedBuilder().setTitle('Reply Embed');
            sendMessageSpy.mockResolvedValue({ messageId: 'reply-1' } as Message);

            await interaction.reply(embed);

            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                'server-1',
                'channel-1',
                expect.objectContaining({
                    embeds: [{ type: 'rich', title: 'Reply Embed' }],
                }),
            );
        });

        it('should handle raw message object in reply', async () => {
            const interaction = new Interaction(mockClient, basePayload);
            sendMessageSpy.mockResolvedValue({ messageId: 'reply-1' } as Message);

            await interaction.reply({ content: 'raw', replyToId: 'msg-prev' });

            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                'server-1',
                'channel-1',
                expect.objectContaining({
                    content: 'raw',
                    replyToId: 'msg-prev',
                }),
            );
        });
    });
});
