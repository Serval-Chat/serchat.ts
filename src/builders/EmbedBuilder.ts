import type { IEmbed, IEmbedAuthor, IEmbedFooter, IEmbedField } from '@/types/embed.js';

/**
 * Builder for constructing rich embed objects.
 *
 * @example
 * ```ts
 * const embed = new EmbedBuilder()
 *   .setTitle('Hello!')
 *   .setDescription('This is a rich embed.')
 *   .setColor(0x5865f2);
 *
 * await client.sendMessage(serverId, channelId, embed);
 * ```
 */
export class EmbedBuilder {
    private data: IEmbed;

    /**
     * @param data - Optional seed data to pre-populate the embed.
     *   Useful when editing an existing embed returned from the API.
     */
    constructor(data?: IEmbed) {
        this.data = data ?? { type: 'rich' };
    }

    /** Sets the embed title. */
    public setTitle(title: string): this {
        this.data.title = title;
        return this;
    }

    /** Sets the embed description (supports markdown). */
    public setDescription(description: string): this {
        this.data.description = description;
        return this;
    }

    /** Sets the URL the title links to. */
    public setURL(url: string): this {
        this.data.url = url;
        return this;
    }

    /** Sets the sidebar accent colour. */
    public setColor(color: number): this {
        this.data.color = color;
        return this;
    }

    /** Sets the embed timestamp. Defaults to now. */
    public setTimestamp(timestamp: string | number | Date = new Date()): this {
        if (timestamp instanceof Date) {
            this.data.timestamp = timestamp.toISOString();
        } else if (typeof timestamp === 'number') {
            this.data.timestamp = new Date(timestamp).toISOString();
        } else {
            this.data.timestamp = timestamp;
        }
        return this;
    }

    /** Sets the embed author. */
    public setAuthor(author: IEmbedAuthor | null): this {
        this.data.author = author ?? undefined;
        return this;
    }

    /** Sets the embed footer. */
    public setFooter(footer: IEmbedFooter | null): this {
        this.data.footer = footer ?? undefined;
        return this;
    }

    /** Sets the embed thumbnail. */
    public setThumbnail(url: string | null, width?: number, height?: number): this {
        this.data.thumbnail = url ? { url, width, height } : undefined;
        return this;
    }

    /** Sets the main embed image. */
    public setImage(url: string | null, width?: number, height?: number): this {
        this.data.image = url ? { url, width, height } : undefined;
        return this;
    }

    /** Appends fields to the embed. */
    public addFields(...fields: IEmbedField[]): this {
        if (!this.data.fields) this.data.fields = [];
        this.data.fields.push(...fields);
        return this;
    }

    /** Replaces all fields. */
    public setFields(...fields: IEmbedField[]): this {
        this.data.fields = fields;
        return this;
    }

    /** Serialises the embed to a plain JSON object. */
    public toJSON(): IEmbed {
        return { ...this.data };
    }
}
