import type { RESTClient } from '@/client/RESTClient.js';
import { unwrap } from '@/client/RESTClient.js';
import type {
    ICreateWebhookRequest,
    IExecuteWebhookRequest,
    IExecuteWebhookResponse,
    IWebhook,
    IWebhookAvatarResponse,
} from '@/types/webhooks.js';
import type { IEmbed } from '@/types/embed.js';
import type { JsonObject } from '@/types/json.js';

export class WebhookManager {
    private rest: RESTClient;

    constructor(rest: RESTClient) {
        this.rest = rest;
    }

    private embedToJSON(embed: IEmbed): JsonObject {
        return {
            type: embed.type,
            color: embed.color,
            title: embed.title,
            url: embed.url,
            description: embed.description,
            timestamp: embed.timestamp,
            author: embed.author
                ? {
                      name: embed.author.name,
                      url: embed.author.url,
                      icon_url: embed.author.icon_url,
                  }
                : undefined,
            footer: embed.footer
                ? {
                      text: embed.footer.text,
                      icon_url: embed.footer.icon_url,
                  }
                : undefined,
            thumbnail: embed.thumbnail
                ? {
                      url: embed.thumbnail.url,
                      width: embed.thumbnail.width,
                      height: embed.thumbnail.height,
                  }
                : undefined,
            image: embed.image
                ? {
                      url: embed.image.url,
                      width: embed.image.width,
                      height: embed.image.height,
                  }
                : undefined,
            video: embed.video
                ? {
                      url: embed.video.url,
                      width: embed.video.width,
                      height: embed.video.height,
                  }
                : undefined,
            provider: embed.provider
                ? {
                      name: embed.provider.name,
                      url: embed.provider.url,
                  }
                : undefined,
            fields: embed.fields?.map((field) => ({
                name: field.name,
                value: field.value,
                inline: field.inline,
            })),
        };
    }

    /**
     * Gets webhooks for a channel.
     */
    public async getWebhooks(serverId: string, channelId: string): Promise<IWebhook[]> {
        const response = await this.rest.get<IWebhook[]>(
            `/servers/${serverId}/channels/${channelId}/webhooks`,
        );
        return unwrap(response);
    }

    /**
     * Creates a webhook for a channel.
     */
    public async createWebhook(
        serverId: string,
        channelId: string,
        data: ICreateWebhookRequest,
    ): Promise<IWebhook> {
        const payload: JsonObject = {
            name: data.name,
            avatarUrl: data.avatarUrl,
        };
        const response = await this.rest.post<IWebhook>(
            `/servers/${serverId}/channels/${channelId}/webhooks`,
            payload,
        );
        return unwrap(response);
    }

    /**
     * Deletes a webhook from a channel.
     */
    public async deleteWebhook(
        serverId: string,
        channelId: string,
        webhookId: string,
    ): Promise<void> {
        await this.rest.delete(`/servers/${serverId}/channels/${channelId}/webhooks/${webhookId}`);
    }

    /**
     * Uploads or replaces a webhook avatar.
     */
    public async uploadWebhookAvatar(
        serverId: string,
        channelId: string,
        webhookId: string,
        avatar: Blob,
    ): Promise<IWebhookAvatarResponse> {
        const formData = new FormData();
        formData.append('avatar', avatar);

        const response = await this.rest.post<IWebhookAvatarResponse>(
            `/servers/${serverId}/channels/${channelId}/webhooks/${webhookId}/avatar`,
            formData,
        );
        return unwrap(response);
    }

    /**
     * Executes a webhook using its public token.
     */
    public async executeWebhook(
        token: string,
        data: IExecuteWebhookRequest,
    ): Promise<IExecuteWebhookResponse> {
        const payload: JsonObject = {
            content: data.content,
            username: data.username,
            avatarUrl: data.avatarUrl,
            embeds: data.embeds?.map((embed) => this.embedToJSON(embed)),
        };
        const response = await this.rest.post<IExecuteWebhookResponse>(
            `/webhooks/${token}`,
            payload,
        );
        return unwrap(response);
    }

    /**
     * Edits a previously sent webhook message.
     */
    public async editWebhookMessage(
        token: string,
        messageId: string,
        data: IExecuteWebhookRequest,
    ): Promise<void> {
        const payload: JsonObject = {
            content: data.content,
            username: data.username,
            avatarUrl: data.avatarUrl,
            embeds: data.embeds?.map((embed) => this.embedToJSON(embed)),
        };
        await this.rest.patch(`/webhooks/${token}/messages/${messageId}`, payload);
    }

    /**
     * Deletes a previously sent webhook message.
     */
    public async deleteWebhookMessage(token: string, messageId: string): Promise<void> {
        await this.rest.delete(`/webhooks/${token}/messages/${messageId}`);
    }
}
