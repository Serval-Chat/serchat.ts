import { EventEmitter } from 'events';
import { RESTClient, unwrap } from '@/client/RESTClient.js';
import { WebSocketManager } from '@/gateway/WebSocketManager.js';
import { ApplicationCommandManager } from '@/managers/ApplicationCommandManager.js';
import { StickerManager } from '@/managers/StickerManager.js';
import { WebhookManager } from '@/managers/WebhookManager.js';
import { Message } from '@/structures/Message.js';
import type { Interaction } from '@/structures/Interaction.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';
import { MessageBuilder } from '@/builders/MessageBuilder.js';
import { PollBuilder } from '@/builders/PollBuilder.js';
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
    PollVoteUpdatePayload,
} from '@/types/events.js';
import type { JsonValue } from '@/types/json.js';
import type { IMessageWithEmbeds } from '@/types/message.js';

/**
 * Configuration options passed to the {@link Client} constructor.
 */
export interface ClientOptions {
    /**
     * Base URL of the Serchat REST API.
     * @defaultValue `'https://rolling.catfla.re/api/v1'`
     */
    apiBaseUrl?: string;
    /**
     * Minimum log severity to emit. Defaults to {@link LogLevel.INFO}.
     */
    logLevel?: LogLevel;
}

import type { ClientUser } from '@/types/user.js';
export type { ClientUser };

/**
 * Map of all events the {@link Client} can emit, keyed by event name with
 * a tuple of the listener argument types as the value.
 *
 * Use these with `client.on(event, listener)`.
 */
export interface ClientEvents {
    /** Fired once the bot has authenticated and is ready to receive events. */
    ready: [ClientUser];
    /** A new message was posted in a channel the bot can see. */
    messageCreate: [Message];
    /** An existing message was edited. */
    messageUpdate: [MessageUpdatePayload];
    /** A message was deleted. */
    messageDelete: [MessageDeletePayload];
    /** Multiple messages were deleted in bulk. */
    messageBulkDelete: [MessageBulkDeletePayload];
    /** A user invoked a slash command. */
    interactionCreate: [Interaction];
    /** A reaction was added to a message. */
    messageReactionAdd: [ReactionPayload];
    /** A reaction was removed from a message. */
    messageReactionRemove: [ReactionPayload];
    /** A poll vote was updated. */
    pollVoteUpdate: [PollVoteUpdatePayload];
    /** A member joined a server. */
    serverMemberAdd: [MemberAddedPayload];
    /** A member left or was removed from a server. */
    serverMemberRemove: [MemberRemovedPayload];
    /** A server member's profile (e.g. nickname, roles) was updated. */
    serverMemberUpdate: [MemberUpdatedPayload];
    /** A new channel was created. */
    channelCreate: [ChannelCreatedPayload];
    /** A channel's settings were updated. */
    channelUpdate: [ChannelUpdatedPayload];
    /** A channel was deleted. */
    channelDelete: [ChannelDeletedPayload];
    /** The channel order within a server was changed. */
    channelsReordered: [ChannelsReorderedPayload];
    /** A new category was created. */
    categoryCreate: [CategoryCreatedPayload];
    /** A category's settings were updated. */
    categoryUpdate: [CategoryUpdatedPayload];
    /** A category was deleted. */
    categoryDelete: [CategoryDeletedPayload];
    /** The category order within a server was changed. */
    categoriesReordered: [CategoriesReorderedPayload];
    /** Permission overrides for a channel were updated. */
    channelPermissionsUpdate: [ChannelPermissionsUpdatedPayload];
    /** Permission overrides for a category were updated. */
    categoryPermissionsUpdate: [CategoryPermissionsUpdatedPayload];
    /** Server-level settings were updated. */
    serverUpdate: [ServerUpdatedPayload];
    /** A server was deleted. */
    serverDelete: [ServerDeletedPayload];
    /** The server icon was changed. */
    serverIconUpdate: [{ serverId: string; icon: string }];
    /** The server banner was changed. */
    serverBannerUpdate: [{ serverId: string; banner: { type: 'image'; value: string } }];
    /** A new role was created. */
    roleCreate: [RoleCreatedPayload];
    /** An existing role was updated. */
    roleUpdate: [RoleUpdatedPayload];
    /** A role was deleted. */
    roleDelete: [RoleDeletedPayload];
    /** The role order within a server was changed. */
    rolesReordered: [RolesReorderedPayload];
    /** A new server invite was created. */
    inviteCreate: [InviteCreatedPayload];
    /** A server invite was deleted or expired. */
    inviteDelete: [InviteDeletedPayload];
    /** A member was banned from a server. */
    serverMemberBan: [MemberBannedPayload];
    /** A banned member was unbanned. */
    serverMemberUnban: [MemberUnbannedPayload];
    /** Server ownership was transferred to another member. */
    ownershipTransfer: [OwnershipTransferredPayload];
    /** A batch of online-presence data was received from the gateway. */
    presenceSync: [PresenceSyncPayload];
    /** A user came online. */
    userOnline: [UserPresencePayload];
    /** A user went offline. */
    userOffline: [UserOfflinePayload];
    /** A user's profile was updated. */
    userUpdate: [UserUpdatedPayload];
    /** An unhandled error occurred (mirrors Node's `EventEmitter` convention). */
    error: [Error];
    /** The WebSocket connection was closed. */
    disconnect: [];
}

/**
 * Typed augmentation of `EventEmitter` that constrains `on`, `once`, and
 * `emit` to the keys and argument tuples defined in {@link ClientEvents}.
 */
export interface Client extends EventEmitter {
    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    once<K extends keyof ClientEvents>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this;
    emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
}

/**
 * Main entry point for the Serchat bot SDK.
 *
 * Extends Node's `EventEmitter` with typed events (see {@link ClientEvents}).
 * Manages a REST client, a WebSocket gateway connection, and an
 * {@link ApplicationCommandManager} for slash commands.
 *
 * @example
 * ```ts
 * import { Client, LogLevel } from 'serchat.ts';
 *
 * const client = new Client({ logLevel: LogLevel.DEBUG });
 *
 * client.on('ready', (user) => console.log(`Logged in as ${user.username}`));
 * client.on('messageCreate', (msg) => {
 *   if (msg.text === '!ping') msg.reply('Pong!');
 * });
 *
 * await client.login(process.env.BOT_TOKEN!);
 * ```
 */
export class Client extends EventEmitter {
    /** The {@link WebSocketManager} handling the gateway connection. */
    public ws: WebSocketManager;
    /** Slash-command registry and dispatcher. */
    public commands: ApplicationCommandManager;
    /** Manager for sticker endpoints. */
    public stickers: StickerManager;
    /** Manager for webhook endpoints. */
    public webhooks: WebhookManager;
    /** The authenticated bot user, populated after the `ready` event fires. */
    public user: ClientUser | null = null;
    /** Resolved options for this client instance. */
    public options: ClientOptions;
    /** Logger instance used throughout the SDK. */
    public logger: Logger;
    private rest: RESTClient;
    private token: string | null = null;

    constructor(options: ClientOptions = {}) {
        super();
        this.options = {
            apiBaseUrl: 'https://rolling.catfla.re/api/v1',
            logLevel: LogLevel.INFO,
            ...options,
        };
        this.logger = new Logger(this.options.logLevel);
        this.rest = new RESTClient({
            baseURL: this.options.apiBaseUrl as string,
        });

        this.ws = new WebSocketManager(this);
        this.commands = new ApplicationCommandManager(this.rest);
        this.stickers = new StickerManager(this.rest);
        this.webhooks = new WebhookManager(this.rest);

        this.on('interactionCreate', (interaction) => {
            void this.commands.handleInteraction(interaction).catch(console.error);
        });
    }

    /** Accessor for the application command manager. */
    public get application(): { commands: ApplicationCommandManager } {
        return {
            commands: this.commands,
        };
    }

    /** Returns the bot token currently in use. */
    public getToken(): string | null {
        return this.token;
    }

    /** Returns the internal REST client. */
    public getRest(): RESTClient {
        return this.rest;
    }

    /** Authenticates the client and connects to the gateway. */
    public async login(token: string, callback?: () => Promise<void>): Promise<void> {
        this.logger.info('Logging in with token...');
        this.token = token;
        this.rest.setDefaultHeader('Authorization', `Bearer ${token}`);
        await this.connectWS();
        if (callback) {
            await callback();
        }
    }

    /** Exchanges client ID/secret for a token and logs in. */
    public async loginWithSecret(clientId: string, clientSecret: string): Promise<string> {
        const response = await this.rest.post<{ token: string }>('/bots/token', {
            client_id: clientId,
            client_secret: clientSecret,
        });
        const token = unwrap(response).token;
        await this.login(token);
        return token;
    }

    /** Connects to the WebSocket gateway. */
    public async connectWS(): Promise<void> {
        await this.ws.connect();
    }

    /** Sends a message to a channel. */
    public async sendMessage(
        serverId: string,
        channelId: string,
        content:
            | string
            | ISendMessageRequest
            | EmbedBuilder
            | IMessageWithEmbeds
            | MessageBuilder
            | PollBuilder,
    ): Promise<Message> {
        if (!this.token) throw new Error('Client is not logged in.');

        let payload: ISendMessageRequest;
        if (content instanceof EmbedBuilder) {
            payload = { embeds: [content.toJSON()] };
        } else if (content instanceof MessageBuilder) {
            payload = { content: content.build() };
        } else if (content instanceof PollBuilder) {
            payload = { poll: content.toJSON() };
        } else if (typeof content === 'string') {
            payload = { content };
        } else {
            payload = { ...(content as ISendMessageRequest) };
            if (payload.embeds) {
                payload.embeds = payload.embeds.map((e) =>
                    e instanceof EmbedBuilder ? e.toJSON() : e,
                );
            }
            if (payload.poll && 'toJSON' in payload.poll) {
                payload.poll = payload.poll.toJSON();
            }
        }

        const response = await this.rest.post<IMessageServer>(
            `/servers/${serverId}/channels/${channelId}/messages`,
            payload as JsonValue,
        );
        return new Message(this, unwrap(response));
    }

    /** Votes on a poll option. */
    public async votePoll(
        serverId: string,
        channelId: string,
        messageId: string,
        optionId: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(
            `/servers/${serverId}/channels/${channelId}/messages/${messageId}/poll/vote`,
            { id: optionId },
        );
    }

    /** Fetches recent messages from a channel. */
    public async getMessages(
        serverId: string,
        channelId: string,
        limit: number = 50,
    ): Promise<Message[]> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get<IMessageServer[]>(
            `/servers/${serverId}/channels/${channelId}/messages`,
            {
                params: { limit } as Record<string, JsonValue>,
            },
        );
        return unwrap(response).map((m: IMessageServer) => new Message(this, m));
    }

    /** Deletes multiple messages in a single request. */
    public async bulkDeleteMessages(
        serverId: string,
        channelId: string,
        messageIds: string[],
    ): Promise<number> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.post<{ deletedCount: number }>(
            `/servers/${serverId}/channels/${channelId}/messages/bulk-delete`,
            {
                messageIds,
            } as JsonValue,
        );
        return unwrap(response).deletedCount;
    }

    /** Adds a reaction to a message. */
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

    /** Deletes a single message. */
    public async deleteMessage(
        serverId: string,
        channelId: string,
        messageId: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/channels/${channelId}/messages/${messageId}`);
    }

    /** Bans a member from a server. */
    public async banMember(
        serverId: string,
        userId: string,
        reason?: string,
        deleteMessageDays: number = 0,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(`/servers/${serverId}/bans`, {
            userId,
            reason: reason ?? null,
            deleteMessageDays,
        } as JsonValue);
    }

    /** Lifts a ban from a user. */
    public async unbanMember(serverId: string, userId: string, reason?: string): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/bans/${userId}`, {
            data: { reason: reason ?? null } as JsonValue,
        });
    }

    /** Kicks a member from a server. */
    public async kickMember(serverId: string, userId: string, reason?: string): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.delete(`/servers/${serverId}/members/${userId}`, {
            data: { reason: reason ?? null } as JsonValue,
        });
    }

    /** Times out a member. */
    public async timeoutMember(
        serverId: string,
        userId: string,
        duration: number,
        reason?: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.post(`/servers/${serverId}/members/${userId}/timeout`, {
            duration,
            reason: reason ?? null,
        } as JsonValue);
    }

    /** Updates a channel's properties. */
    public async updateChannel(
        serverId: string,
        channelId: string,
        data: Record<string, JsonValue>,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');
        await this.rest.patch(`/servers/${serverId}/channels/${channelId}`, data);
    }

    /** Retrieves server statistics. */
    public async getServerStats(
        serverId: string,
    ): Promise<{ totalCount: number; onlineCount: number }> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get<{ totalCount: number; onlineCount: number }>(
            `/servers/${serverId}/stats`,
        );
        return unwrap(response);
    }

    /** Fetches all roles in a server. */
    public async getRoles(serverId: string): Promise<Role[]> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get<Role[]>(`/servers/${serverId}/roles`);
        return unwrap(response);
    }
}
