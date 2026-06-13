import WebSocket from 'ws';
import crypto from 'node:crypto';
import type { Client } from '@/client/Client.js';

import { Message } from '@/structures/Message.js';
import { Interaction } from '@/structures/Interaction.js';
import { ButtonInteraction } from '@/structures/ButtonInteraction.js';
import type { IWsIncomingMessage } from '@/types/ws.js';
import type { JsonValue } from '@/types/json.js';

/** Manages the bot's WebSocket connection to the Serchat gateway. */
export class WebSocketManager {
    /** The underlying `ws` WebSocket instance, or `null` when disconnected. */
    public ws: WebSocket | null = null;
    /** Most recent heartbeat round-trip latency in milliseconds, or null before the first pong. */
    public latency: number | null = null;
    private client: Client;
    /** Correlates request IDs with their resolve/reject handlers. */
    private pendingRequests = new Map<
        string,
        { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
    >();

    /**
     * @param client - The owning {@link Client} instance.
     */
    constructor(client: Client) {
        this.client = client;
    }
    private reconnectAttempts = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private connectionPromise: Promise<void> | null = null;
    private connectionResolve: (() => void) | null = null;
    private connectionReject: ((err: Error) => void) | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private heartbeatTimeout: NodeJS.Timeout | null = null;
    private heartbeatRequestId: string | null = null;
    private heartbeatSentAt: number | null = null;
    private readonly heartbeatIntervalMs = 30000;
    private readonly heartbeatTimeoutMs = 10000;
    private lastConnectionError: Error | null = null;

    /** Establishes the WebSocket connection. */
    public async connect(): Promise<void> {
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.connectionResolve = resolve;
            this.connectionReject = reject;
            this._connect();
        });

        return this.connectionPromise;
    }

    /**
     * Internal method that creates and configures the raw WebSocket instance.
     * Called by {@link connect} and by the reconnect scheduler.
     */
    private _connect(): void {
        if (!this.client.getToken()) {
            const err = new Error('Client is not logged in.');
            if (this.connectionReject) {
                this.connectionReject(err);
                this.connectionPromise = null;
                this.connectionResolve = null;
                this.connectionReject = null;
            }
            return;
        }

        const baseUrl = this.client.options.apiBaseUrl || 'https://ser.chat/api/v1';
        const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws');

        this.client.logger.info(`Connecting to WebSocket at ${wsUrl}...`);

        if (this.ws) {
            this.stopHeartbeat();
            this.ws.removeAllListeners();
            this.ws.close();
        }

        this.lastConnectionError = null;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            const id = crypto.randomUUID();
            this.ws!.send(
                JSON.stringify({
                    id,
                    event: {
                        type: 'authenticate',
                        payload: { token: this.client.getToken() },
                    },
                }),
            );
        });

        this.ws.on('message', (data) => {
            let msg: IWsIncomingMessage;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            if (msg.event?.type === 'authenticated' && msg.event.payload) {
                this.client.user = msg.event.payload.user;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                if (this.connectionResolve) {
                    this.connectionResolve();
                    this.connectionResolve = null;
                    this.connectionReject = null;
                }
                this.client.logger.info(
                    `Authenticated as ${msg.event.payload.user.username} (${msg.event.payload.user.id})`,
                );

                if (!this.client.isReady) {
                    this.client.isReady = true;
                    this.client.emit('ready', msg.event.payload.user);
                } else {
                    this.client.emit('reconnected');
                }
            }

            if (msg.event?.type === 'pong') {
                this.handleHeartbeatPong(msg);
            }

            if (msg.meta?.replyTo && this.pendingRequests.has(msg.meta.replyTo)) {
                const req = this.pendingRequests.get(msg.meta.replyTo)!;
                this.pendingRequests.delete(msg.meta.replyTo);
                clearTimeout(req.timeout);

                if (msg.event?.type === 'error' && msg.event.payload) {
                    const details = msg.event.payload.details as { message?: string } | undefined;
                    req.reject(
                        new Error(
                            `WebSocket Error [${(msg.event.payload as Record<string, JsonValue>).code}]: ${details?.message}`,
                        ),
                    );
                } else if (msg.event?.payload) {
                    req.resolve(msg.event.payload);
                }
            }

            const event = msg.event;
            if (!event) return;

            switch (event.type) {
                case 'message_server':
                    this.client.emit('messageCreate', new Message(this.client, event.payload));
                    break;
                case 'interaction_create_server':
                    this.client.emit(
                        'interactionCreate',
                        new Interaction(this.client, event.payload),
                    );
                    break;
                case 'component_interaction_create_server':
                    this.client.emit(
                        'buttonInteractionCreate',
                        new ButtonInteraction(this.client, event.payload),
                    );
                    break;
                case 'message_server_edited':
                    this.client.emit('messageUpdate', event.payload);
                    break;
                case 'message_server_deleted':
                    this.client.emit('messageDelete', event.payload);
                    break;
                case 'messages_server_bulk_deleted':
                    this.client.emit('messageBulkDelete', event.payload);
                    break;
                case 'reaction_added':
                    this.client.emit('messageReactionAdd', event.payload);
                    break;
                case 'reaction_removed':
                    this.client.emit('messageReactionRemove', event.payload);
                    break;
                case 'poll_vote_updated_server':
                case 'poll_vote_updated_dm':
                    this.client.emit('pollVoteUpdate', event.payload);
                    break;
                case 'member_added':
                    this.client.emit('serverMemberAdd', event.payload);
                    break;
                case 'member_removed':
                    this.client.emit('serverMemberRemove', event.payload);
                    break;
                case 'member_updated':
                    this.client.emit('serverMemberUpdate', event.payload);
                    break;
                case 'channel_created':
                    this.client.emit('channelCreate', event.payload);
                    break;
                case 'channel_updated':
                    this.client.emit('channelUpdate', event.payload);
                    break;
                case 'channel_deleted':
                    this.client.emit('channelDelete', event.payload);
                    break;
                case 'channels_reordered':
                    this.client.emit('channelsReordered', event.payload);
                    break;
                case 'category_created':
                    this.client.emit('categoryCreate', event.payload);
                    break;
                case 'category_updated':
                    this.client.emit('categoryUpdate', event.payload);
                    break;
                case 'category_deleted':
                    this.client.emit('categoryDelete', event.payload);
                    break;
                case 'categories_reordered':
                    this.client.emit('categoriesReordered', event.payload);
                    break;
                case 'channel_permissions_updated':
                    this.client.emit('channelPermissionsUpdate', event.payload);
                    break;
                case 'category_permissions_updated':
                    this.client.emit('categoryPermissionsUpdate', event.payload);
                    break;
                case 'server_updated':
                    this.client.emit('serverUpdate', event.payload);
                    break;
                case 'server_deleted':
                    this.client.emit('serverDelete', event.payload);
                    break;
                case 'server_icon_updated':
                    this.client.emit('serverIconUpdate', event.payload);
                    break;
                case 'server_banner_updated':
                    this.client.emit('serverBannerUpdate', event.payload);
                    break;
                case 'role_created':
                    this.client.emit('roleCreate', event.payload);
                    break;
                case 'role_updated':
                    this.client.emit('roleUpdate', event.payload);
                    break;
                case 'role_deleted':
                    this.client.emit('roleDelete', event.payload);
                    break;
                case 'roles_reordered':
                    this.client.emit('rolesReordered', event.payload);
                    break;
                case 'server_invite_created':
                    this.client.emit('inviteCreate', event.payload);
                    break;
                case 'server_invite_deleted':
                    this.client.emit('inviteDelete', event.payload);
                    break;
                case 'member_banned':
                    this.client.emit('serverMemberBan', event.payload);
                    break;
                case 'member_unbanned':
                    this.client.emit('serverMemberUnban', event.payload);
                    break;
                case 'ownership_transferred':
                    this.client.emit('ownershipTransfer', event.payload);
                    break;
                case 'presence_sync':
                    this.client.emit('presenceSync', event.payload);
                    break;
                case 'user_online':
                    this.client.emit('userOnline', event.payload);
                    break;
                case 'user_offline':
                    this.client.emit('userOffline', event.payload);
                    break;
                case 'user_updated':
                    this.client.emit('userUpdate', event.payload);
                    break;
                case 'error':
                case 'ping':
                case 'pong':
                case 'authenticated':
                case 'server_joined':
                case 'interaction_response_server':
                    break;
            }
        });

        this.ws.on('error', (err) => {
            this.client.logger.error(`WebSocket error: ${err.message}`);
            this.stopHeartbeat();
            this.lastConnectionError = err;
        });

        this.ws.on('close', (code, reason) => {
            this.stopHeartbeat();
            this.client.logger.warn(
                `WebSocket connection closed. Code: ${code}, Reason: ${reason ? reason.toString() : 'None'}`,
            );
            this.client.emit('disconnect');
            if (this.connectionReject && this.lastConnectionError === null) {
                this.connectionReject(
                    new Error(
                        `WebSocket closed before authentication. Code: ${code}, Reason: ${reason ? reason.toString() : 'None'}`,
                    ),
                );
                this.connectionPromise = null;
                this.connectionResolve = null;
                this.connectionReject = null;
            }
            this.lastConnectionError = null;
            this.scheduleReconnect();
        });
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.heartbeatIntervalMs);
        this.heartbeatInterval.unref();
        this.sendHeartbeat();
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval !== null) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.heartbeatTimeout !== null) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
        this.heartbeatRequestId = null;
        this.heartbeatSentAt = null;
    }

    private sendHeartbeat(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (this.heartbeatRequestId !== null) return;

        const id = crypto.randomUUID();
        this.heartbeatRequestId = id;
        this.heartbeatSentAt = Date.now();
        this.ws.send(
            JSON.stringify({
                id,
                event: {
                    type: 'ping',
                    payload: {},
                },
            }),
        );

        this.heartbeatTimeout = setTimeout(() => {
            this.client.logger.warn('WebSocket heartbeat timed out; reconnecting...');
            this.heartbeatTimeout = null;
            this.heartbeatRequestId = null;
            this.ws?.terminate();
        }, this.heartbeatTimeoutMs);
        this.heartbeatTimeout.unref();
    }

    private handleHeartbeatPong(msg: IWsIncomingMessage): void {
        if (this.heartbeatRequestId === null) return;
        if (msg.meta?.replyTo !== this.heartbeatRequestId) return;

        this.heartbeatRequestId = null;
        this.latency = this.heartbeatSentAt === null ? null : Date.now() - this.heartbeatSentAt;
        this.heartbeatSentAt = null;
        if (this.heartbeatTimeout !== null) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /** Reconnects with exponential backoff. */
    private scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.client.logger.info(
            `Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`,
        );
        this.reconnectAttempts++;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this._connect();
        }, delay);
    }

    /** Sends a join_server event and waits for confirmation. */
    public async joinServer(serverId: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected.');
        }

        const id = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error('Request timeout'));
            }, 5000);

            this.pendingRequests.set(id, { resolve, reject, timeout });

            this.ws!.send(
                JSON.stringify({
                    id,
                    event: {
                        type: 'join_server',
                        payload: { serverId },
                    },
                }),
            );
        });
    }
}
