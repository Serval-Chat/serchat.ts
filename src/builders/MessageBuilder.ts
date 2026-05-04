/** Callback used by {@link MessageBuilder.p} to build inline content. */
export type InlineCallback = (t: InlineBuilder) => InlineBuilder;

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
}
