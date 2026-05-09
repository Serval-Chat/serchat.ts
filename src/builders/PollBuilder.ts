import type { IPollInput } from '@/types/message.js';

export interface PollOptionBuilderData {
    text: string;
    emoji?: string;
    emojiType?: 'unicode' | 'custom';
    emojiId?: string;
}

/**
 * Builder for constructing Serchat polls.
 *
 * Use this to define poll questions, options, and settings.
 *
 * @example
 * ```ts
 * const poll = new PollBuilder()
 *   .setTitle('What is your favorite food?')
 *   .addOption('Pizza', '🍕')
 *   .addOption('Sushi', '🍣')
 *   .setMultiSelect(true);
 * ```
 */
export class PollBuilder {
    private title: string = '';
    private options: PollOptionBuilderData[] = [];
    private multiSelect: boolean = false;
    private expiresAt?: string;

    /**
     * Sets the title of the poll.
     * @param title - The question or title to display.
     */
    public setTitle(title: string): this {
        this.title = title;
        return this;
    }

    /**
     * Adds an option to the poll.
     * @param text - The text of the option.
     * @param emoji - Optional emoji to display next to the option.
     */
    public addOption(text: string, emoji?: string): this {
        this.options.push({ text, emoji, emojiType: emoji ? 'unicode' : undefined });
        return this;
    }

    /**
     * Adds a custom emoji option to the poll.
     * @param text - The text of the option.
     * @param emojiId - The ID of the custom emoji.
     */
    public addCustomEmojiOption(text: string, emojiId: string): this {
        this.options.push({ text, emojiId, emojiType: 'custom' });
        return this;
    }

    /**
     * Sets whether the poll allows multiple selections.
     * @param multiSelect - True if multiple options can be selected.
     */
    public setMultiSelect(multiSelect: boolean): this {
        this.multiSelect = multiSelect;
        return this;
    }

    /**
     * Sets the expiration date of the poll.
     * @param date - The date when the poll expires.
     */
    public setExpiresAt(date: Date | string): this {
        this.expiresAt = typeof date === 'string' ? date : date.toISOString();
        return this;
    }

    /**
     * Converts the builder to a plain object for API transmission.
     * @internal
     */
    public toJSON(): IPollInput {
        return {
            title: this.title,
            options: this.options,
            multiSelect: this.multiSelect,
            expiresAt: this.expiresAt,
        };
    }
}
