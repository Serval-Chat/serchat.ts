import type { IEmbed, IEmbedAuthor, IEmbedFooter, IEmbedField } from '../types/embed.js';

/**
 * Fluent builder for creating Serchat embeds.
 */
export class EmbedBuilder {
    private data: IEmbed;

    constructor(data?: IEmbed) {
        this.data = data ?? { type: 'rich' };
    }

    public setTitle(title: string): this {
        this.data.title = title;
        return this;
    }

    public setDescription(description: string): this {
        this.data.description = description;
        return this;
    }

    public setURL(url: string): this {
        this.data.url = url;
        return this;
    }

    public setColor(color: number): this {
        this.data.color = color;
        return this;
    }

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

    public setAuthor(author: IEmbedAuthor | null): this {
        this.data.author = author ?? undefined;
        return this;
    }

    public setFooter(footer: IEmbedFooter | null): this {
        this.data.footer = footer ?? undefined;
        return this;
    }

    public setThumbnail(url: string | null): this {
        this.data.thumbnail = url ? { url } : undefined;
        return this;
    }

    public setImage(url: string | null): this {
        this.data.image = url ? { url } : undefined;
        return this;
    }

    public addFields(...fields: IEmbedField[]): this {
        if (!this.data.fields) this.data.fields = [];
        this.data.fields.push(...fields);
        return this;
    }

    public setFields(...fields: IEmbedField[]): this {
        this.data.fields = fields;
        return this;
    }

    public toJSON(): IEmbed {
        return { ...this.data };
    }
}
