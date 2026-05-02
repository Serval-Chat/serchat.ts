import type { Client } from '@/client/Client.js';
import type { InteractionOption } from '@/types/commands.js';
import type { InteractionCreatePayload } from '@/types/events.js';
import type { ISendMessageRequest, IMessageWithEmbeds } from '@/types/message.js';
import type { Message } from './Message.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

import type { Permissions, PermissionKey } from '@/types/permissions.js';

export class Interaction {
    public command: string;
    public options: InteractionOption[];
    public serverId: string;
    public channelId: string;
    public senderId: string;
    public senderUsername: string;
    public permissions: Permissions;
    public invocationId?: string;

    private client: Client;

    constructor(client: Client, data: InteractionCreatePayload) {
        this.client = client;
        this.command = data.command;
        this.options = data.options;
        this.serverId = data.serverId;
        this.channelId = data.channelId;
        this.senderId = data.senderId;
        this.senderUsername = data.senderUsername;
        this.permissions = data.senderPermissions || {};
        this.invocationId = data.invocationId;
    }

    public getOption(name: string): InteractionOption | undefined {
        return this.options.find((opt) => opt.name === name);
    }

    public getString(name: string): string | undefined {
        const opt = this.getOption(name);
        return typeof opt?.value === 'string' ? opt.value : undefined;
    }

    public getInteger(name: string): number | undefined {
        const opt = this.getOption(name);
        return typeof opt?.value === 'number' ? opt.value : undefined;
    }

    public getBoolean(name: string): boolean | undefined {
        const opt = this.getOption(name);
        return typeof opt?.value === 'boolean' ? opt.value : undefined;
    }

    public getUser(name: string): string | undefined {
        return this.getString(name);
    }

    public getChannel(name: string): string | undefined {
        return this.getString(name);
    }

    public getRole(name: string): string | undefined {
        return this.getString(name);
    }

    public hasPermission(permission: PermissionKey): boolean {
        if (this.permissions.administrator) return true;
        return !!this.permissions[permission];
    }

    public async reply(
        content: string | ISendMessageRequest | EmbedBuilder | IMessageWithEmbeds,
    ): Promise<Message> {
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

        payload.interaction = {
            command: this.command,
            options: this.options.map((opt) => ({
                name: opt.name,
                value: opt.value,
            })),
            user: {
                id: this.senderId,
                username: this.senderUsername,
            },
        };

        return this.client.sendMessage(this.serverId, this.channelId, payload);
    }
}
