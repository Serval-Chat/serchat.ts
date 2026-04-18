import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ISendMessageRequest, IMessageServer } from '../types/message.js';
import { EmbedBuilder } from '../builders/EmbedBuilder.js';

export interface ClientOptions {
    apiBaseUrl?: string;
}

export class Client {
    private token: string | null = null;
    private rest: AxiosInstance;

    constructor(options?: ClientOptions) {
        this.rest = axios.create({
            baseURL: options?.apiBaseUrl ?? 'http://localhost:3000/api/v1',
        });
    }

    public login(token: string): void {
        this.token = token;
        this.rest.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Authenticates using Bot Client ID and Secret.
     */
    public async loginWithSecret(clientId: string, clientSecret: string): Promise<string> {
        const response = await this.rest.post<{ token: string }>('/bots/token', {
            client_id: clientId,
            client_secret: clientSecret,
        });

        const { token } = response.data;
        this.login(token);
        return token;
    }

    public async sendMessage(serverId: string, channelId: string, content: string | ISendMessageRequest | EmbedBuilder): Promise<IMessageServer> {
        if (!this.token) throw new Error('Client is not logged in.');

        let payload: ISendMessageRequest;

        if (content instanceof EmbedBuilder) {
            payload = { embeds: [content.toJSON()] };
        } else if (typeof content === 'string') {
            payload = { content };
        } else {
            payload = content;
        }

        const response = await this.rest.post<IMessageServer>(`/servers/${serverId}/channels/${channelId}/messages`, payload);
        return response.data;
    }
}
