import type { EmbedButtonStyle, IEmbedButton, IEmbedButtonEmoji } from '@/types/embed.js';

const MAX_COMPONENTS = 8;

export class ButtonBuilder {
    private data: IEmbedButton;

    constructor(style: EmbedButtonStyle = 'primary') {
        this.data = { type: 'button', style };
    }

    public setStyle(style: EmbedButtonStyle): this {
        this.data.style = style;
        return this;
    }

    public setLabel(label: string): this {
        this.data.label = label;
        return this;
    }

    public setEmoji(emoji: IEmbedButtonEmoji): this {
        this.data.emoji = emoji;
        return this;
    }

    public setCustomId(customId: string): this {
        this.data.custom_id = customId;
        return this;
    }

    public setURL(url: string): this {
        this.data.url = url;
        return this;
    }

    public setDisabled(disabled: boolean = true): this {
        this.data.disabled = disabled;
        return this;
    }

    public toJSON(): IEmbedButton {
        return { ...this.data, type: 'button' };
    }
}

export class ComponentsBuilder {
    private components: IEmbedButton[] = [];

    public addButton(button: IEmbedButton | ButtonBuilder): this {
        if (this.components.length >= MAX_COMPONENTS) return this;
        const resolved = button instanceof ButtonBuilder ? button.toJSON() : button;
        this.components.push({ ...resolved, type: 'button' });
        return this;
    }

    public setButtons(buttons: (IEmbedButton | ButtonBuilder)[]): this {
        this.components = buttons
            .slice(0, MAX_COMPONENTS)
            .map((button) =>
                button instanceof ButtonBuilder ? button.toJSON() : { ...button, type: 'button' },
            );
        return this;
    }

    public clear(): this {
        this.components = [];
        return this;
    }

    public toJSON(): IEmbedButton[] {
        return this.components.map((component) => ({ ...component, type: 'button' }));
    }
}
