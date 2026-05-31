import type { Client } from '@/client/Client.js';
import type {
    IMessageAttachment,
    IMessageServer,
    ISendMessageRequest,
    IPoll,
    MessageAttachmentType,
    MessageReaction,
} from '@/types/message.js';
import type { IEmbed, IEmbedButton } from '@/types/embed.js';
import type { InteractionValue } from '@/types/interactions.js';

import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

/**
 * Represents a message received from the Serchat server.
 *
 * Wraps the raw API payload and exposes helper methods for common actions
 * like replying, reacting, and deleting.
 */
export class Message implements IMessageServer {
    /** Primary message identifier. Normalised from either `messageId` or `_id`. */
    public messageId: string;
    /** MongoDB `_id` field. */
    public _id: string;
    /** ID of the server this message belongs to. */
    public serverId: string;
    /** ID of the channel this message was posted in. */
    public channelId: string;
    /** ID of the user who sent the message. */
    public senderId: string;
    /** Display name of the user who sent the message. */
    public senderUsername: string;
    /** Plain text content of the message. */
    public text: string;
    /** ISO 8601 timestamp of when the message was created. */
    public createdAt: string;
    /** ID of the message this message is replying to, if any. */
    public replyToId?: string;
    /** Partial snapshot of the message being replied to, if any. */
    public repliedTo?: {
        messageId: string;
        senderId: string;
        senderUsername: string;
        text: string;
    };
    /** Whether the message has been edited since it was first sent. */
    public isEdited: boolean;
    /** Whether the message is pinned in its channel. */
    public isPinned: boolean;
    /** Whether the message is stickied at the top of the channel. */
    public isSticky: boolean;
    /** Whether the message was sent via a webhook integration. */
    public isWebhook: boolean;
    /** Display name override for webhook messages. */
    public webhookUsername?: string;
    /** Avatar URL override for webhook messages. */
    public webhookAvatarUrl?: string;
    /** Rich embed objects attached to this message. */
    public embeds: IEmbed[];
    /** Interactive message components attached to this message. */
    public components: IEmbedButton[];
    /** Structured file attachments on this message. */
    public attachments: IMessageAttachment[];
    /** Aggregated reaction data on this message. */
    public reactions: MessageReaction[];
    /** Interaction metadata if this message was sent in response to a slash command. */
    public interaction: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    } | null;
    /** Poll attached to this message, if any. */
    public poll: IPoll | null;
    /** Sticker attached to this message, if any. */
    public stickerId: string | null;
    /** Whether the message sender is a bot account. */
    public senderIsBot: boolean;

    private client: Client;

    constructor(client: Client, data: IMessageServer) {
        this.client = client;
        const normalizedMessageId = data.messageId ?? data._id;
        if (!normalizedMessageId) {
            throw new Error('Message payload is missing both messageId and _id');
        }
        this.messageId = normalizedMessageId;
        this._id = data._id ?? normalizedMessageId;
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
        this.embeds = data.embeds ?? [];
        this.components = data.components ?? [];
        this.attachments = data.attachments ?? [];
        this.reactions = data.reactions ?? [];
        this.interaction = data.interaction ?? null;
        this.poll = data.poll ?? null;
        this.stickerId = data.stickerId ?? null;
        this.senderIsBot = data.senderIsBot ?? false;
    }

    /** Sends a reply to this message. */
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

    /** Adds a reaction to this message. */
    public async react(emoji: string): Promise<void> {
        return this.client.reactToMessage(this.serverId, this.channelId, this.messageId, emoji);
    }

    /** Deletes this message. */
    public async delete(): Promise<void> {
        return this.client.deleteMessage(this.serverId, this.channelId, this.messageId);
    }

    /** Votes on a poll option in this message. */
    public async vote(optionId: string): Promise<void> {
        return this.client.votePoll(this.serverId, this.channelId, this.messageId, optionId);
    }

    /** Checks if this message has any attachments. */
    public hasAttachments(): boolean {
        return Array.isArray(this.attachments) && this.attachments.length > 0;
    }

    /** Resolves the full public download URL of the given attachment. */
    public getAttachmentUrl(attachment: IMessageAttachment): string {
        return `${this.client.getApiOrigin()}/api/v1/files/download/${encodeURIComponent(attachment.attachmentId)}`;
    }

    /** Filters and returns attachments belonging to a specific file/media type. */
    public getAttachmentsByType(type: MessageAttachmentType): IMessageAttachment[] {
        return this.attachments.filter((att) => att.type === type);
    }

    /** Returns whether the message plain text is empty or consists only of whitespace. */
    public get isEmpty(): boolean {
        return !this.text.trim();
    }

    /** Checks if this message was sent by the currently authenticated client user. */
    public get isOwnMessage(): boolean {
        return this.client.user?.id === this.senderId;
    }

    /** Checks if this message was sent by any bot account (including this client). */
    public get isFromBot(): boolean {
        return this.senderIsBot || this.isOwnMessage;
    }
}
