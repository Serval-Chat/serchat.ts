export type InlineCallback = (t: InlineBuilder) => InlineBuilder;

export class InlineBuilder {
    protected content: string = '';

    constructor(initialContent: string = '') {
        this.content = initialContent;
    }

    public text(text: string): this {
        this.content += text;
        return this;
    }

    public italic(text: string): this {
        this.content += `*${text}*`;
        return this;
    }

    public bold(text: string): this {
        this.content += `**${text}**`;
        return this;
    }

    public boldItalic(text: string): this {
        this.content += `***${text}***`;
        return this;
    }

    public strikethrough(text: string): this {
        this.content += `~~${text}~~`;
        return this;
    }

    public underline(text: string): this {
        this.content += `__${text}__`;
        return this;
    }

    public spoiler(text: string): this {
        this.content += `||${text}||`;
        return this;
    }

    public inlineCode(text: string): this {
        this.content += `\`${text}\``;
        return this;
    }

    public inlineLatex(text: string): this {
        this.content += `$$${text}$$`;
        return this;
    }

    public link(text: string, url: string): this {
        this.content += `[${text}](${url})`;
        return this;
    }

    public userMention(userId: string): this {
        this.content += `<userid:'${userId}'>`;
        return this;
    }

    public roleMention(roleId: string): this {
        this.content += `<roleid:'${roleId}'>`;
        return this;
    }

    public channelMention(serverId: string, channelId: string): this {
        this.content += `https://catfla.re/chat/@server/${serverId}/channel/${channelId}`;
        return this;
    }

    public everyoneMention(): this {
        this.content += `<everyone>`;
        return this;
    }

    public build(): string {
        return this.content;
    }

    public toString(): string {
        return this.content;
    }
}

export class MessageBuilder extends InlineBuilder {
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

    public h1(text: string): this {
        this.content += `# ${text}\n`;
        return this;
    }

    public h2(text: string): this {
        this.content += `## ${text}\n`;
        return this;
    }

    public h3(text: string): this {
        this.content += `### ${text}\n`;
        return this;
    }

    public hr(): this {
        this.content += `---\n`;
        return this;
    }

    public codeBlock(language: string, text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        this.content += `\`\`\`${language}\n${text}\n\`\`\`\n`;
        return this;
    }

    public blockquote(text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        const lines = text.split('\n');
        this.content += lines.map((line) => `> ${line}`).join('\n') + '\n';
        return this;
    }

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

    public subtext(text: string): this {
        this.content += `-# ${text}\n`;
        return this;
    }

    public latexBlock(text: string, options?: { label?: string }): this {
        if (options?.label) {
            this.p(options.label);
        }
        this.content += `$\n${text}\n$\n`;
        return this;
    }

    public heading(level: 1 | 2 | 3, text: string): this {
        this.content += `${'#'.repeat(level)} ${text}\n`;
        return this;
    }

    public thematicBreak(): this {
        return this.hr();
    }

    public append(text: string): this {
        this.content += text;
        return this;
    }

    public appendLine(text: string = ''): this {
        this.content += text + '\n';
        return this;
    }
}
