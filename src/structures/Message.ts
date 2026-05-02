import type { Client } from '@/client/Client.js';
import type { IMessageServer, ISendMessageRequest } from '@/types/message.js';
import type { IEmbed } from '@/types/embed.js';
import type { InteractionValue } from '@/types/interactions.js';

import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

export class Message implements IMessageServer {
    public messageId: string;
    public _id?: string;
    public serverId: string;
    public channelId: string;
    public senderId: string;
    public senderUsername: string;
    public text: string;
    public createdAt: string;
    public replyToId?: string;
    public repliedTo?: {
        messageId: string;
        senderId: string;
        senderUsername: string;
        text: string;
    };
    public isEdited: boolean;
    public isPinned: boolean;
    public isSticky: boolean;
    public isWebhook: boolean;
    public webhookUsername?: string;
    public webhookAvatarUrl?: string;
    public embeds?: IEmbed[];
    public interaction?: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };

    private client: Client;

    constructor(client: Client, data: IMessageServer) {
        this.client = client;
        const normalizedMessageId = data.messageId ?? data._id;
        if (!normalizedMessageId) {
            throw new Error('Message payload is missing both messageId and _id');
        }
        this.messageId = normalizedMessageId;
        this._id = data._id;
        this.serverId = data.serverId;
        this.channelId = data.channelId;
        this.senderId = data.senderId;
        this.senderUsername = data.senderUsername;
        this.text = data.text;
        this.createdAt = data.createdAt;
        this.replyToId = data.replyToId;
        this.repliedTo = data.repliedTo;
        this.isEdited = data.isEdited;
        this.isPinned = data.isPinned;
        this.isSticky = data.isSticky;
        this.isWebhook = data.isWebhook;
        this.webhookUsername = data.webhookUsername;
        this.webhookAvatarUrl = data.webhookAvatarUrl;
        this.embeds = data.embeds;
        this.interaction = data.interaction;
    }

    public async reply(content: string | ISendMessageRequest | EmbedBuilder): Promise<Message> {
        let payload: ISendMessageRequest;

        if (content instanceof EmbedBuilder) {
            payload = { embeds: [content.toJSON()], replyToId: this.messageId };
        } else if (typeof content === 'string') {
            payload = { content, replyToId: this.messageId };
        } else {
            payload = { ...content, replyToId: this.messageId };
        }

        return this.client.sendMessage(this.serverId, this.channelId, payload);
    }

    public async react(emoji: string): Promise<void> {
        return this.client.reactToMessage(this.serverId, this.channelId, this.messageId, emoji);
    }
}
