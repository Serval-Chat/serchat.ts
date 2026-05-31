import type { Client } from '@/client/Client.js';
import type { ComponentInteractionCreatePayload } from '@/types/events.js';
import type { ISendMessageRequest, IMessageWithEmbeds } from '@/types/message.js';
import type { Message } from './Message.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';
import { MessageBuilder } from '@/builders/MessageBuilder.js';
import type { ServerPermissions, PermissionKey } from '@/types/permissions.js';

/** Represents a button click interaction received from the Serchat gateway. */
export class ButtonInteraction {
    public componentType: 'button';
    public customId: string;
    public messageId: string;
    public componentIndex: number;
    public serverId: string;
    public channelId: string;
    public senderId: string;
    public senderUsername: string;
    public permissions: ServerPermissions;
    public invocationId?: string;

    private client: Client;

    constructor(client: Client, data: ComponentInteractionCreatePayload) {
        this.client = client;
        this.componentType = data.componentType;
        this.customId = data.customId;
        this.messageId = data.messageId;
        this.componentIndex = data.componentIndex;
        this.serverId = data.serverId;
        this.channelId = data.channelId;
        this.senderId = data.senderId;
        this.senderUsername = data.senderUsername;
        this.permissions = data.senderPermissions || {};
        this.invocationId = data.invocationId;
    }

    public hasPermission(permission: PermissionKey): boolean {
        if (this.permissions.administrator) return true;
        return !!this.permissions[permission];
    }

    public async reply(
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds | MessageBuilder,
    ): Promise<Message> {
        const payload = this.normalizePayload(content);
        return this.client.sendMessage(this.serverId, this.channelId, payload);
    }

    public async ephemeralReply(
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds | MessageBuilder,
    ): Promise<void> {
        const payload = this.normalizePayload(content);
        await this.client.sendEphemeralInteractionResponse(
            this.serverId,
            this.channelId,
            this.senderId,
            payload,
            this.invocationId,
        );
    }

    public async editMessage(
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds | MessageBuilder,
    ): Promise<Message> {
        const payload = this.normalizePayload(content);
        return this.client.editMessage(this.serverId, this.channelId, this.messageId, payload);
    }

    private normalizePayload(
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds | MessageBuilder,
    ): ISendMessageRequest {
        if (content instanceof EmbedBuilder) {
            return { embeds: [content.toJSON()] };
        }
        if (content instanceof MessageBuilder) {
            return { content: content.build() };
        }
        if (typeof content === 'string') {
            return { content };
        }

        const payload = { ...(content as ISendMessageRequest) };
        if (payload.embeds) {
            payload.embeds = payload.embeds.map((e) =>
                e instanceof EmbedBuilder ? e.toJSON() : e,
            );
        }
        if (payload.components) {
            payload.components = payload.components
                .slice(0, 8)
                .map((component) => ({ ...component, type: 'button' }));
        }
        return payload;
    }
}
