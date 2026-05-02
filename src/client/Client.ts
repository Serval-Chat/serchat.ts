import { EventEmitter } from 'events';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { WebSocketManager } from '@/gateway/WebSocketManager.js';
import { ApplicationCommandManager } from '@/managers/ApplicationCommandManager.js';
import { Message } from '@/structures/Message.js';
import type { Interaction } from '@/structures/Interaction.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';
import type { IMessageServer, ISendMessageRequest } from '@/types/message.js';
import { Logger, LogLevel } from '@/util/Logger.js';
import type {
    MessageUpdatePayload,
    MessageDeletePayload,
    ReactionPayload,
    MemberAddedPayload,
    MemberRemovedPayload,
    MemberUpdatedPayload,
    ChannelCreatedPayload,
    ChannelUpdatedPayload,
    ChannelDeletedPayload,
    CategoryCreatedPayload,
    CategoryUpdatedPayload,
    CategoryDeletedPayload,
    ServerUpdatedPayload,
    ServerDeletedPayload,
    Role,
    RoleCreatedPayload,
    RoleUpdatedPayload,
    RoleDeletedPayload,
    InviteCreatedPayload,
    InviteDeletedPayload,
    UserPresencePayload,
    UserOfflinePayload,
    UserUpdatedPayload,
    MemberBannedPayload,
    MemberUnbannedPayload,
    OwnershipTransferredPayload,
    ChannelsReorderedPayload,
    CategoriesReorderedPayload,
    RolesReorderedPayload,
    ChannelPermissionsUpdatedPayload,
    CategoryPermissionsUpdatedPayload,
    PresenceSyncPayload,
    MessageBulkDeletePayload,
} from '@/types/events.js';
import type { JsonValue } from '@/types/json.js';
import type { IMessageWithEmbeds } from '@/types/message.js';

export interface ClientOptions {
    apiBaseUrl?: string;
    logLevel?: LogLevel;
}

import type { ClientUser } from '@/types/user.js';
export type { ClientUser };

export interface ClientEvents {
    ready: [ClientUser];
    messageCreate: [Message];
    messageUpdate: [MessageUpdatePayload];
    messageDelete: [MessageDeletePayload];
    messageBulkDelete: [MessageBulkDeletePayload];
    interactionCreate: [Interaction];
    messageReactionAdd: [ReactionPayload];
    messageReactionRemove: [ReactionPayload];
    serverMemberAdd: [MemberAddedPayload];
    serverMemberRemove: [MemberRemovedPayload];
    serverMemberUpdate: [MemberUpdatedPayload];
    channelCreate: [ChannelCreatedPayload];
    channelUpdate: [ChannelUpdatedPayload];
    channelDelete: [ChannelDeletedPayload];
    channelsReordered: [ChannelsReorderedPayload];
    categoryCreate: [CategoryCreatedPayload];
    categoryUpdate: [CategoryUpdatedPayload];
    categoryDelete: [CategoryDeletedPayload];
    categoriesReordered: [CategoriesReorderedPayload];
    channelPermissionsUpdate: [ChannelPermissionsUpdatedPayload];
    categoryPermissionsUpdate: [CategoryPermissionsUpdatedPayload];
    serverUpdate: [ServerUpdatedPayload];
    serverDelete: [ServerDeletedPayload];
    serverIconUpdate: [{ serverId: string; icon: string }];
    serverBannerUpdate: [{ serverId: string; banner: { type: 'image'; value: string } }];
    roleCreate: [RoleCreatedPayload];
    roleUpdate: [RoleUpdatedPayload];
    roleDelete: [RoleDeletedPayload];
    rolesReordered: [RolesReorderedPayload];
    inviteCreate: [InviteCreatedPayload];
    inviteDelete: [InviteDeletedPayload];
    serverMemberBan: [MemberBannedPayload];
    serverMemberUnban: [MemberUnbannedPayload];
    ownershipTransfer: [OwnershipTransferredPayload];
    presenceSync: [PresenceSyncPayload];
    userOnline: [UserPresencePayload];
    userOffline: [UserOfflinePayload];
    userUpdate: [UserUpdatedPayload];
    error: [Error];
    disconnect: [];
}

export interface Client extends EventEmitter {
    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    once<K extends keyof ClientEvents>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this;
    emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
}

export class Client extends EventEmitter {
    public ws: WebSocketManager;
    public commands: ApplicationCommandManager;
    public user: ClientUser | null = null;
    public options: ClientOptions;
    public logger: Logger;
    private rest: AxiosInstance;
    private token: string | null = null;

    constructor(options: ClientOptions = {}) {
        super();
        this.options = {
            apiBaseUrl: 'http://localhost:3000/api/v1',
            logLevel: LogLevel.INFO,
            ...options,
        };
        this.logger = new Logger(this.options.logLevel);
        this.rest = axios.create({
            baseURL: this.options.apiBaseUrl,
        });

        this.rest.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.data) {
                    const serverMessage = error.response.data.message || error.response.data;
                    const apiError = new Error(
                        `Serchat API Error (${error.response.status}): ${JSON.stringify(serverMessage)}`,
                    );
                    (
                        apiError as Error & {
                            response?: { status: number; data: string | Record<string, string> };
                        }
                    ).response = error.response;
                    return Promise.reject(apiError);
                }
                return Promise.reject(error);
            },
        );

        this.ws = new WebSocketManager(this);
        this.commands = new ApplicationCommandManager(this.rest);

        this.on('interactionCreate', (interaction) => {
            void this.commands.handleInteraction(interaction).catch(console.error);
        });
    }

    public get application(): { commands: ApplicationCommandManager } {
        return {
            commands: this.commands,
        };
    }

    public getToken(): string | null {
        return this.token;
    }

    public getRest(): AxiosInstance {
        return this.rest;
    }

    public async login(token: string, callback?: () => Promise<void>): Promise<void> {
        this.logger.info('Logging in with token...');
        this.token = token;
        this.rest.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await this.connectWS();
        if (callback) {
            await callback();
        }
    }

    public async loginWithSecret(clientId: string, clientSecret: string): Promise<string> {
        const response = await this.rest.post('/bots/token', {
            client_id: clientId,
            client_secret: clientSecret,
        });
        const token = response.data.token;
        await this.login(token);
        return token;
    }

    public async connectWS(): Promise<void> {
        await this.ws.connect();
    }

    public async sendMessage(
        serverId: string,
        channelId: string,
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds,
    ): Promise<Message> {
        if (!this.token) throw new Error('Client is not logged in.');

        let payload: ISendMessageRequest;
        if (content instanceof EmbedBuilder) {
            payload = { embeds: [content.toJSON()] };
        } else if (typeof content === 'string') {
            payload = { content };
        } else {
            payload = { ...(content as ISendMessageRequest) };
            if (payload.embeds) {
                payload.embeds = payload.embeds.map((e) =>
                    e instanceof EmbedBuilder ? e.toJSON() : e,
                );
            }
        }

        const response = await this.rest.post(
            `/servers/${serverId}/channels/${channelId}/messages`,
            payload,
        );
        return new Message(this, response.data);
    }

    public async getMessages(
        serverId: string,
        channelId: string,
        limit: number = 50,
    ): Promise<Message[]> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get(
            `/servers/${serverId}/channels/${channelId}/messages`,
            {
                params: { limit },
            },
        );
        return response.data.map((m: IMessageServer) => new Message(this, m));
    }

    public async bulkDeleteMessages(
        serverId: string,
        channelId: string,
        messageIds: string[],
    ): Promise<number> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.post(
            `/servers/${serverId}/channels/${channelId}/messages/bulk-delete`,
            {
                messageIds,
            },
        );
        return response.data.deletedCount;
    }

    public async reactToMessage(
        serverId: string,
        channelId: string,
        messageId: string,
        emoji: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(
            `/servers/${serverId}/channels/${channelId}/messages/${messageId}/reactions`,
            { emoji },
        );
    }

    public async deleteMessage(
        serverId: string,
        channelId: string,
        messageId: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/channels/${channelId}/messages/${messageId}`);
    }

    public async banMember(
        serverId: string,
        userId: string,
        reason?: string,
        deleteMessageDays: number = 0,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(`/servers/${serverId}/bans`, { userId, reason, deleteMessageDays });
    }

    public async unbanMember(serverId: string, userId: string, reason?: string): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/bans/${userId}`, { data: { reason } });
    }

    public async kickMember(serverId: string, userId: string, reason?: string): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/members/${userId}`, { data: { reason } });
    }

    public async timeoutMember(
        serverId: string,
        userId: string,
        duration: number,
        reason?: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(`/servers/${serverId}/members/${userId}/timeout`, {
            duration,
            reason,
        });
    }

    public async updateChannel(
        serverId: string,
        channelId: string,
        data: Record<string, JsonValue>,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.patch(`/servers/${serverId}/channels/${channelId}`, data);
    }

    public async getServerStats(
        serverId: string,
    ): Promise<{ totalCount: number; onlineCount: number }> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get(`/servers/${serverId}/stats`);
        return response.data;
    }

    public async getRoles(serverId: string): Promise<Role[]> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get(`/servers/${serverId}/roles`);
        return response.data;
    }
}
