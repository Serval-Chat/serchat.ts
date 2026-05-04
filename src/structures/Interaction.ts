import type { Client } from '@/client/Client.js';
import type { InteractionOption } from '@/types/commands.js';
import type { InteractionCreatePayload } from '@/types/events.js';
import type { ISendMessageRequest, IMessageWithEmbeds } from '@/types/message.js';
import type { Message } from './Message.js';
import { EmbedBuilder } from '@/builders/EmbedBuilder.js';

import type { ServerPermissions, PermissionKey } from '@/types/permissions.js';

/**
 * Represents a slash-command interaction received from the Serchat gateway.
 *
 * Provides typed accessors for each option type and a {@link reply} method
 * for responding to the interaction in the originating channel.
 */
export class Interaction {
    /** Name of the slash command that was invoked (e.g. `"ping"`). */
    public command: string;
    /** Raw list of option values provided by the user. */
    public options: InteractionOption[];
    /** ID of the server where the interaction occurred. */
    public serverId: string;
    /** ID of the channel where the interaction occurred. */
    public channelId: string;
    /** ID of the user who triggered the interaction. */
    public senderId: string;
    /** Display name of the user who triggered the interaction. */
    public senderUsername: string;
    /** Permission set of the invoking user at the time of the interaction. */
    public permissions: ServerPermissions;
    /** Unique ID for correlating this invocation across events, if provided. */
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

    /** Retrieves a raw option by name. */
    public getOption(name: string): InteractionOption | undefined {
        return this.options.find((opt) => opt.name === name);
    }

    private getTypedOption<T>(name: string, type: string): T | undefined {
        const option = this.getOption(name);
        return typeof option?.value === type ? (option?.value as T) : undefined;
    }

    /** Returns the string value of a named option. */
    public getString(name: string): string | undefined {
        return this.getTypedOption(name, 'string');
    }

    /** Returns the integer value of a named option. */
    public getInteger(name: string): number | undefined {
        return this.getTypedOption(name, 'number');
    }

    /** Returns the boolean value of a named option. */
    public getBoolean(name: string): boolean | undefined {
        return this.getTypedOption(name, 'boolean');
    }

    /** Returns the user ID value of a named user option. */
    public getUser(name: string): string | undefined {
        return this.getString(name);
    }

    /** Returns the channel ID value of a named channel option. */
    public getChannel(name: string): string | undefined {
        return this.getString(name);
    }

    /** Returns the role ID value of a named role option. */
    public getRole(name: string): string | undefined {
        return this.getString(name);
    }

    /** Checks if the user has a specific permission. */
    public hasPermission(permission: PermissionKey): boolean {
        if (this.permissions.administrator) return true;
        return !!this.permissions[permission];
    }

    /** Sends a reply to this interaction. */
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
