import type { IEmbed } from './embed.js';
import type { InteractionValue } from './interactions.js';

export interface IMessageServer {
    messageId: string;
    _id?: string;
    serverId: string;
    channelId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    createdAt: string;
    replyToId?: string;
    repliedTo?: {
        messageId: string;
        senderId: string;
        senderUsername: string;
        text: string;
    };
    isEdited: boolean;
    isPinned: boolean;
    isSticky: boolean;
    isWebhook: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
    embeds?: IEmbed[];
    interaction?: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };
}

export interface ISendMessageRequest {
    content?: string;
    text?: string;
    replyToId?: string;
    embeds?: IEmbed[];
    interaction?: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };
}

export interface IMessageWithEmbeds {
    embeds?: (IEmbed | { toJSON(): IEmbed })[];
}

export interface IBulkDeleteMessagesRequest {
    messageIds: string[];
}
