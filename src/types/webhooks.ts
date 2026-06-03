import type { IEmbed } from './embed.js';

export interface IWebhook {
    id: string;
    serverId?: string;
    channelId?: string;
    name: string;
    token: string;
    avatarUrl?: string;
    createdBy: string;
    createdAt?: string;
}

export interface ICreateWebhookRequest {
    name: string;
    avatarUrl?: string;
}

export interface IExecuteWebhookRequest {
    content?: string;
    username?: string;
    avatarUrl?: string;
    noEmbedsUrls?: string[];
    embeds?: IEmbed[];
}

export interface IExecuteWebhookResponse {
    id: string;
    timestamp: string;
}

export interface IWebhookAvatarResponse {
    avatarUrl: string;
}
