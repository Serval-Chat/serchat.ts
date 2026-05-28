/** Callback used by {@link MessageBuilder.p} to build inline content. */
export type InlineCallback = (t: InlineBuilder) => InlineBuilder;

import { MermaidBuilder, type MermaidCallback } from './MermaidBuilder.js';

/** Discord-compatible timestamp display style. */
export type TimestampStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

/**
 * Builder for constructing inline Serchat markdown.
 *
 * Methods append text to a buffer and return `this` for chaining.
 * Call {@link build} to get the final string.
 *
 * @example
 * ```ts
 * const text = new InlineBuilder()
 *   .text('Hello, ')
 *   .bold('world')
 *   .text('!')
 *   .build();
 * // => 'Hello, **world**!'
 * ```
 */
export class InlineBuilder {
    protected content: string = '';

    /**
     * @param initialContent - Optional string to seed the builder with.
     */
    constructor(initialContent: string = '') {
        this.content = initialContent;
    }

    protected wrap(start: string, end: string, text: string): this {
        this.content += start + text + end;
        return this;
    }

    /** Appends plain text. */
    public text(text: string): this {
        this.content += text;
        return this;
    }

    /** Appends italic text. */
    public italic(text: string): this {
        return this.wrap('*', '*', text);
    }

    /** Appends bold text. */
    public bold(text: string): this {
        return this.wrap('**', '**', text);
    }

    /** Appends bold-italic text. */
    public boldItalic(text: string): this {
        return this.wrap('***', '***', text);
    }

    /** Appends strikethrough text. */
    public strikethrough(text: string): this {
        return this.wrap('~~', '~~', text);
    }

    /** Appends underlined text. */
    public underline(text: string): this {
        return this.wrap('__', '__', text);
    }

    /** Appends double-underlined text (`___text___`). */
    public doubleUnderline(text: string): this {
        return this.wrap('___', '___', text);
    }

    /** Appends curly-underlined text (`_~text~_`). */
    public curlyUnderline(text: string): this {
        return this.wrap('_~', '~_', text);
    }

    /** Appends jagged-underlined text (`_^text^_`). */
    public jaggedUnderline(text: string): this {
        return this.wrap('_^', '^_', text);
    }

    /** Appends doubly curly-underlined text (`_~~text~~_`). */
    public doubleCurlyUnderline(text: string): this {
        return this.wrap('_~~', '~~_', text);
    }

    /** Appends dashed-underlined text (`_-text-_`). */
    public dashedUnderline(text: string): this {
        return this.wrap('_-', '-_', text);
    }

    /** Appends dotted-underlined text (`_.text._`). */
    public dottedUnderline(text: string): this {
        return this.wrap('_.', '._', text);
    }

    /** Appends rhythm-underlined text (`_-.text.-_`). */
    public rhythmUnderline(text: string): this {
        return this.wrap('_-.', '.-_', text);
    }

    /** Appends spoiler text. */
    public spoiler(text: string): this {
        return this.wrap('||', '||', text);
    }

    /** Appends inline code. */
    public inlineCode(text: string): this {
        return this.wrap('`', '`', text);
    }

    /** Appends inline LaTeX. */
    public inlineLatex(text: string): this {
        return this.wrap('$$', '$$', text);
    }

    /**
     * Appends superscript text (`^text^`).
     *
     * @example `.superscript('2')` → `^2^`
     */
    public superscript(text: string): this {
        return this.wrap('^', '^', text);
    }

    /**
     * Appends subscript text (`~text~`).
     *
     * @example `.subscript('2')` → `~2~`
     */
    public subscript(text: string): this {
        return this.wrap('~', '~', text);
    }

    /**
     * Appends stacked superscript/subscript (`^sup|sub^`).
     *
     * @param sup - The text displayed above (superscript position).
     * @param sub - The text displayed below (subscript position).
     *
     * @example `.stackedScript('top', 'bottom')` → `^top|bottom^`
     */
    public stackedScript(sup: string, sub: string): this {
        this.content += `^${sup}|${sub}^`;
        return this;
    }

    /** Appends a hyperlink. */
    public link(text: string, url: string): this {
        this.content += `[${text}](${url})`;
        return this;
    }

    /** Appends a user mention. */
    public userMention(userId: string): this {
        this.content += `<userid:'${userId}'>`;
        return this;
    }

    /** Appends a role mention. */
    public roleMention(roleId: string): this {
        this.content += `<roleid:'${roleId}'>`;
        return this;
    }

    /** Appends a channel mention. */
    public channelMention(serverId: string, channelId: string): this {
        this.content += `https://catfla.re/chat/@server/${serverId}/channel/${channelId}`;
        return this;
    }

    /** Appends an \@everyone mention. */
    public everyoneMention(): this {
        this.content += `<everyone>`;
        return this;
    }

    /** Appends a server emoji. */
    public customEmoji(id: string): this {
        this.content += `<emoji:${id}>`;
        return this;
    }

    /**
     * Appends a timestamp (`<t:unix:style>`).
     *
     * @param timestamp - Unix timestamp in seconds, a millisecond timestamp, or a Date.
     * @param style - Optional display style: short/long time, date, date-time, or relative.
     *
     * @example `.timestamp(123456789, 'R')` → `<t:123456789:R>`
     */
    public timestamp(timestamp: number | Date, style?: TimestampStyle): this {
        const unixTimestamp =
            timestamp instanceof Date
                ? Math.floor(timestamp.getTime() / 1000)
                : timestamp > 10_000_000_000
                  ? Math.floor(timestamp / 1000)
                  : Math.floor(timestamp);

        this.content += `<t:${unixTimestamp}${style ? `:${style}` : ''}>`;
        return this;
    }

    /**
     * Returns the accumulated markdown string.
     *
     * @returns The final formatted string.
     */
    public build(): string {
        return this.content;
    }

    /**
     * Alias of {@link build} - allows the builder to be used directly in
     * template literals.
     *
     * @returns The final formatted string.
     */
    public toString(): string {
        return this.content;
    }
}

/** Builder for constructing full chat messages with block elements.
 *
 * @example
 * ```ts
 * const msg = new MessageBuilder()
 *   .h1('Release Notes')
 *   .p('Version 1.0 is here!')
 *   .codeBlock('ts', 'console.log("hello")')
 *   .build();
 *
 * await client.sendMessage(serverId, channelId, msg);
 * ```
 */
export class MessageBuilder extends InlineBuilder {
    /** Appends a paragraph or inline content. */
    public p(content: string | InlineCallback): this {
        if (typeof content === 'string') {
            this.content += content + '\n';
        } else {
            const inline = new InlineBuilder();
            content(inline);
            this.content += inline.build() + '\n';
        }
        return this;
    }

    /** Appends an H1 heading. */
    public h1(text: string): this {
        this.content += `# ${text}\n`;
        return this;
    }

    /** Appends an H2 heading. */
    public h2(text: string): this {
        this.content += `## ${text}\n`;
        return this;
    }

    /** Appends an H3 heading. */
    public h3(text: string): this {
        this.content += `### ${text}\n`;
        return this;
    }

    /** Appends a horizontal rule. */
    public hr(): this {
        this.content += `---\n`;
        return this;
    }

    /** Appends a code block. */
    public codeBlock(language: string, text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        this.content += `\`\`\`${language}\n${text}\n\`\`\`\n`;
        return this;
    }

    /** Appends a blockquote. */
    public blockquote(text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        const lines = text.split('\n');
        this.content += lines.map((line) => `> ${line}`).join('\n') + '\n';
        return this;
    }

    /** Appends an admonition block. */
    public admonition(
        type: string,
        text: string,
        options?: { label?: string; title?: string },
    ): this {
        if (options?.label) {
            this.p(options.label);
        }
        const titleStr = options?.title ? ` ${options.title}` : '';
        this.content += `:::${type}${titleStr}\n${text}\n:::\n`;
        return this;
    }

    /** Appends subtext. */
    public subtext(text: string): this {
        this.content += `-# ${text}\n`;
        return this;
    }

    /** Appends a LaTeX block. */
    public latexBlock(text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        this.content += `$\n${text}\n$\n`;
        return this;
    }

    /** Appends a heading at the given level. */
    public heading(level: 1 | 2 | 3, text: string): this {
        this.content += `${'#'.repeat(level)} ${text}\n`;
        return this;
    }

    /** Alias of {@link hr}. */
    public thematicBreak(): this {
        return this.hr();
    }

    /** Appends raw text. */
    public append(text: string): this {
        this.content += text;
        return this;
    }

    /** Appends text with a newline. */
    public appendLine(text: string = ''): this {
        this.content += text + '\n';
        return this;
    }

    /** Appends an unordered list. */
    public unorderedList(items: string[], depth: number = 0): this {
        const indent = '  '.repeat(depth);
        for (const item of items) {
            this.content += `${indent}- ${item}\n`;
        }
        return this;
    }

    /** Appends an ordered list. */
    public orderedList(items: string[], depth: number = 0): this {
        const indent = '  '.repeat(depth);
        for (let i = 0; i < items.length; i++) {
            this.content += `${indent}${i + 1}. ${items[i]}\n`;
        }
        return this;
    }

    /** Appends a checklist. */
    public checklist(items: { text: string; checked: boolean }[], depth: number = 0): this {
        const indent = '  '.repeat(depth);
        for (const item of items) {
            this.content += `${indent}- [${item.checked ? 'x' : ' '}] ${item.text}\n`;
        }
        return this;
    }

    /** Appends a table. */
    public table(headers: string[], rows: string[][]): this {
        this.content += `| ${headers.join(' | ')} |\n`;
        this.content += `| ${headers.map(() => '---').join(' | ')} |\n`;
        for (const row of rows) {
            this.content += `| ${row.join(' | ')} |\n`;
        }
        return this;
    }

    /** Appends a mermaid diagram. */
    public mermaid(content: string | MermaidBuilder | MermaidCallback): this {
        if (typeof content === 'string') {
            return this.codeBlock('mermaid', content);
        } else if (content instanceof MermaidBuilder) {
            return this.codeBlock('mermaid', content.build());
        } else {
            const builder = new MermaidBuilder();
            content(builder);
            return this.codeBlock('mermaid', builder.build());
        }
    }

    /** Appends a file. */
    public file(url: string): this {
        this.content += `[%file%](${url})\n`;
        return this;
    }
}
