import WebSocket from 'ws';
import crypto from 'node:crypto';
import type { Client } from '@/client/Client.js';

import { Message } from '@/structures/Message.js';
import { Interaction } from '@/structures/Interaction.js';
import type { IWsIncomingMessage } from '@/types/ws.js';

export class WebSocketManager {
    public ws: WebSocket | null = null;
    private client: Client;
    private pendingRequests = new Map<
        string,
        { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
    >();

    constructor(client: Client) {
        this.client = client;
    }

    public async connect(): Promise<void> {
        if (!this.client.getToken()) throw new Error('Client is not logged in.');
        const baseUrl = this.client.getRest().defaults.baseURL || 'http://localhost:3000/api/v1';
        const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws');

        return new Promise((resolve, reject) => {
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
                    this.client.emit('ready', msg.event.payload.user);
                    resolve();
                }

                if (msg.meta?.replyTo && this.pendingRequests.has(msg.meta.replyTo)) {
                    const req = this.pendingRequests.get(msg.meta.replyTo)!;
                    this.pendingRequests.delete(msg.meta.replyTo);
                    clearTimeout(req.timeout);

                    if (msg.event?.type === 'error' && msg.event.payload) {
                        const details = msg.event.payload.details as
                            | { message?: string }
                            | undefined;
                        req.reject(
                            new Error(
                                `WebSocket Error [${msg.event.payload.code}]: ${details?.message}`,
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
                    case 'authenticated':
                    case 'ping':
                    case 'pong':
                    case 'server_joined':
                        break;
                }
            });

            this.ws.on('error', (err) => {
                this.client.emit('error', err);
                reject(err);
            });

            this.ws.on('close', () => {
                this.client.emit('disconnect');
            });
        });
    }

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
