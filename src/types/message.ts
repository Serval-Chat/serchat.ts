import type { IEmbed } from './embed.js';

export interface IMessageServer {
    messageId: string;
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
}

export interface ISendMessageRequest {
    content?: string;
    text?: string;
    replyToId?: string;
    embeds?: IEmbed[];
}
