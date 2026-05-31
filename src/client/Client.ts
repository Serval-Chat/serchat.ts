import { EventEmitter } from 'events';
import { RESTClient, unwrap } from '@/client/RESTClient.js';
import { WebSocketManager } from '@/gateway/WebSocketManager.js';
import { ApplicationCommandManager } from '@/managers/ApplicationCommandManager.js';
import { StickerManager } from '@/managers/StickerManager.js';
import { WebhookManager } from '@/managers/WebhookManager.js';
import { EventBus } from '@/modules/EventBus.js';
import { ModuleManager } from '@/modules/ModuleManager.js';
import { Message } from '@/structures/Message.js';
import type { Interaction } from '@/structures/Interaction.js';
import type { ButtonInteraction } from '@/structures/ButtonInteraction.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';
import { MessageBuilder } from '@/builders/MessageBuilder.js';
import { PollBuilder } from '@/builders/PollBuilder.js';
import { UnauthorizedError } from '@/errors/APIError.js';
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
     * @defaultValue `'https://ser.chat/api/v1'`
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
    /** A user clicked a bot-authored embed button. */
    buttonInteractionCreate: [ButtonInteraction];
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
    /** The WebSocket connection successfully reconnected. */
    reconnected: [];
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
    off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
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
    /** Typed event bus used for SDK internals, modules, and public listeners. */
    public events: EventBus<ClientEvents>;
    /** Module registry for self-contained bot features. */
    public modules: ModuleManager;
    /** The authenticated bot user, populated after the `ready` event fires. */
    public user: ClientUser | null = null;
    /** Whether the client has emitted the ready event at least once. */
    public isReady: boolean = false;
    /** Resolved options for this client instance. */
    public options: ClientOptions;
    /** Logger instance used throughout the SDK. */
    public logger: Logger;
    private rest: RESTClient;
    private token: string | null = null;
    private clientCredentials: { clientId: string; clientSecret: string } | null = null;
    private refreshTimer: NodeJS.Timeout | null = null;
    private refreshPromise: Promise<string> | null = null;

    constructor(options: ClientOptions = {}) {
        super();
        this.options = {
            apiBaseUrl: 'https://ser.chat/api/v1',
            logLevel: LogLevel.INFO,
            ...options,
        };
        this.logger = new Logger(this.options.logLevel);
        this.rest = new RESTClient({
            baseURL: this.options.apiBaseUrl as string,
        });
        this.events = new EventBus<ClientEvents>({
            logger: this.logger,
            errorEvent: 'error',
        });

        this.ws = new WebSocketManager(this);
        this.commands = new ApplicationCommandManager(this.rest);
        this.stickers = new StickerManager(this.rest);
        this.webhooks = new WebhookManager(this.rest);
        this.modules = new ModuleManager(this);

        this.events.on('interactionCreate', (interaction) => {
            void this.commands.handleInteraction(interaction).catch(console.error);
        });

        this.rest.interceptors.error.push(async (error) => {
            if (!(error instanceof UnauthorizedError) || this.clientCredentials === null) {
                return error;
            }

            await this.refreshToken();
            return error;
        });
    }

    public override on<K extends keyof ClientEvents>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this {
        this.events.on(event, listener);
        return this;
    }

    public override once<K extends keyof ClientEvents>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this {
        this.events.once(event, listener);
        return this;
    }

    public override off<K extends keyof ClientEvents>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this {
        this.events.off(event, listener);
        return this;
    }

    public override emit<K extends keyof ClientEvents>(
        event: K,
        ...args: ClientEvents[K]
    ): boolean {
        return this.events.emit(event, ...args);
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

    /** Returns the origin of the API base URL (e.g. https://ser.chat). */
    public getApiOrigin(): string {
        try {
            return new URL(this.options.apiBaseUrl as string).origin;
        } catch {
            return this.options.apiBaseUrl as string;
        }
    }

    /** Authenticates the client and connects to the gateway. */
    public async login(token: string, callback?: () => Promise<void>): Promise<void> {
        this.logger.info('Logging in with token...');
        this.token = token;
        this.rest.setDefaultHeader('Authorization', `Bearer ${token}`);
        this.scheduleTokenRefresh(token);
        await this.connectWS();
        if (callback) {
            await callback();
        }
    }

    /** Exchanges client ID/secret for a token and logs in. */
    public async loginWithSecret(clientId: string, clientSecret: string): Promise<string> {
        this.clientCredentials = { clientId, clientSecret };
        const token = await this.fetchTokenWithSecret(clientId, clientSecret);
        await this.login(token);
        return token;
    }

    /** Re-exchanges stored client credentials for a fresh access token. */
    public async refreshToken(): Promise<string> {
        if (this.clientCredentials === null) {
            throw new Error('Cannot refresh token without client credentials.');
        }

        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = this.fetchTokenWithSecret(
            this.clientCredentials.clientId,
            this.clientCredentials.clientSecret,
        )
            .then((token) => {
                this.token = token;
                this.rest.setDefaultHeader('Authorization', `Bearer ${token}`);
                this.scheduleTokenRefresh(token);
                this.reconnectWS();
                return token;
            })
            .finally(() => {
                this.refreshPromise = null;
            });

        return this.refreshPromise;
    }

    private async fetchTokenWithSecret(clientId: string, clientSecret: string): Promise<string> {
        const response = await this.rest.post<{ token: string }>('/bots/token', {
            client_id: clientId,
            client_secret: clientSecret,
        });
        return unwrap(response).token;
    }

    private scheduleTokenRefresh(token: string): void {
        if (this.refreshTimer !== null) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        if (this.clientCredentials === null) return;

        const expiresAt = this.getJwtExpirationMs(token);
        if (expiresAt === null) return;

        const refreshAt = expiresAt - 5 * 60 * 1000;
        const delay = Math.max(refreshAt - Date.now(), 0);
        this.refreshTimer = setTimeout(() => {
            void this.refreshToken().catch((err) => {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.error(`Failed to refresh bot token: ${message}`);
            });
        }, delay);
        this.refreshTimer.unref();
    }

    private getJwtExpirationMs(token: string): number | null {
        const [, payload] = token.split('.');
        if (!payload) return null;

        try {
            const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')) as {
                exp?: number;
            };
            return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
        } catch {
            return null;
        }
    }

    private reconnectWS(): void {
        if (!this.ws.ws) return;
        this.ws.ws.close(4000, 'Refreshing authentication token');
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
            this.normalizeComponents(payload);
            if (payload.noEmbedsUrls) {
                payload.noEmbedsUrls = payload.noEmbedsUrls.slice(0, 25);
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

    /** Edits one of the bot's messages in a server channel. */
    public async editMessage(
        serverId: string,
        channelId: string,
        messageId: string,
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds | MessageBuilder,
    ): Promise<Message> {
        if (!this.token) throw new Error('Client is not logged in.');

        let payload: ISendMessageRequest;
        if (content instanceof EmbedBuilder) {
            payload = { embeds: [content.toJSON()] };
        } else if (content instanceof MessageBuilder) {
            payload = { content: content.build() };
        } else if (typeof content === 'string') {
            payload = { content };
        } else {
            payload = { ...(content as ISendMessageRequest) };
            if (payload.embeds) {
                payload.embeds = payload.embeds.map((e) =>
                    e instanceof EmbedBuilder ? e.toJSON() : e,
                );
            }
            this.normalizeComponents(payload);
        }

        const response = await this.rest.patch<IMessageServer>(
            `/servers/${serverId}/channels/${channelId}/messages/${messageId}`,
            payload as JsonValue,
        );
        return new Message(this, unwrap(response));
    }

    /**
     * Sends an ephemeral response for a bot interaction.
     *
     * The message is delivered only to the invoking user via a WebSocket event.
     * It is never persisted to the database and never broadcast to other channel members.
     *
     * You should call this via {@link Interaction.ephemeralReply} rather than
     * using this method directly.
     */
    public async sendEphemeralInteractionResponse(
        serverId: string,
        channelId: string,
        senderId: string,
        payload: ISendMessageRequest,
        invocationId?: string,
    ): Promise<void> {
        if (!this.token) throw new Error('Client is not logged in.');

        const text = payload.content ?? payload.text ?? '';

        await this.rest.post('/interactions/respond', {
            serverId,
            channelId,
            senderId,
            text,
            embeds: payload.embeds ?? [],
            components: payload.components ?? [],
            invocationId: invocationId ?? null,
            ephemeral: true,
        } as object as JsonValue);
    }

    private normalizeComponents(payload: ISendMessageRequest): void {
        if (!payload.components) return;
        payload.components = payload.components
            .slice(0, 8)
            .map((component) => ({ ...component, type: 'button' }));
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

    /** Retrieves a server's details. */
    public async getServer(serverId: string): Promise<Record<string, JsonValue>> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get<Record<string, JsonValue>>(`/servers/${serverId}`);
        return unwrap(response);
    }

    /** Retrieves channel statistics. */
    public async getChannelStats(
        serverId: string,
        channelId: string,
    ): Promise<{ messageCount: number; channelName: string }> {
        if (!this.token) throw new Error('Client is not logged in.');
        const response = await this.rest.get<{ messageCount: number; channelName: string }>(
            `/servers/${serverId}/channels/${channelId}/stats`,
        );
        return unwrap(response);
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

    /** Checks if a user has a specific permission in a server. */
    public async hasPermission(
        serverId: string,
        userId: string,
        permission: string,
    ): Promise<boolean> {
        try {
            const server = await this.getServer(serverId);
            if (server && (server.ownerId === userId || server._id === userId)) return true;

            const [memberResp, roles] = await Promise.all([
                this.rest.get<Record<string, JsonValue>>(`/servers/${serverId}/members/${userId}`),
                this.getRoles(serverId),
            ]);
            const memberObj = unwrap(memberResp);

            const memberRoleIds: string[] =
                memberObj && typeof memberObj === 'object' && 'roles' in memberObj
                    ? ((memberObj as Record<string, JsonValue>).roles as string[])
                    : memberObj && typeof memberObj === 'object' && 'member' in memberObj
                      ? ((
                            (memberObj as Record<string, JsonValue>).member as Record<
                                string,
                                JsonValue
                            >
                        ).roles as string[])
                      : [];

            if (!Array.isArray(memberRoleIds)) return false;

            const everyoneRole = roles.find((r) => r.name === '@everyone');
            const roleIdsSet = new Set(memberRoleIds);
            if (everyoneRole) roleIdsSet.add(everyoneRole.id || everyoneRole._id);

            const userRoles = roles
                .filter((r) => roleIdsSet.has(r.id || r._id))
                .sort((a, b) => a.position - b.position);

            for (const role of userRoles) {
                const perms =
                    typeof role.permissions === 'string'
                        ? JSON.parse(role.permissions)
                        : role.permissions;
                if (perms && perms.administrator === true) return true;
            }

            let hasPerm = false;
            for (const role of userRoles) {
                const perms =
                    typeof role.permissions === 'string'
                        ? JSON.parse(role.permissions)
                        : role.permissions;
                if (perms && typeof perms[permission] === 'boolean') {
                    hasPerm = perms[permission];
                }
            }

            return hasPerm;
        } catch (e) {
            this.logger.error(`Failed to check permission: ${e}`);
        }
        return false;
    }
}
