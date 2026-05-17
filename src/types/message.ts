import type { IEmbed } from './embed.js';
import type { InteractionValue } from './interactions.js';

export interface IPollOption {
    id: string;
    text: string;
    emoji?: string;
    emojiType?: 'unicode' | 'custom';
    emojiId?: string;
    votes: string[]; // Array of User IDs
}

export interface IPoll {
    title: string;
    options: IPollOption[];
    multiSelect: boolean;
    expiresAt?: string;
}

export type MessageAttachmentType = 'image' | 'video' | 'audio' | 'text' | 'file';

export interface IMessageAttachment {
    attachmentId: string;
    type: MessageAttachmentType;
    mimeType: string;
    name: string;
    size: number;
    width?: number;
    height?: number;
    spoiler?: boolean;
}

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
    attachments?: IMessageAttachment[];
    interaction?: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };
    poll?: IPoll;
    stickerId?: string;
}

export interface IPollInput {
    title: string;
    options: {
        text: string;
        emoji?: string;
        emojiType?: 'unicode' | 'custom';
        emojiId?: string;
    }[];
    multiSelect?: boolean;
    expiresAt?: string;
}

export interface ISendMessageRequest {
    content?: string;
    text?: string;
    replyToId?: string;
    embeds?: IEmbed[];
    attachments?: IMessageAttachment[];
    interaction?: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };
    poll?: IPollInput | { toJSON(): IPollInput };
}

export interface IMessageWithEmbeds {
    embeds?: (IEmbed | { toJSON(): IEmbed })[];
}

export interface IBulkDeleteMessagesRequest {
    messageIds: string[];
}
