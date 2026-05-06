/** Callback used by {@link MermaidBuilder.subgraph} to build nested content. */
export type MermaidCallback = (b: MermaidBuilder) => MermaidBuilder;

/**
 * Builder for constructing Mermaid diagrams.
 *
 * @example
 * ```ts
 * const diagram = new MermaidBuilder('graph TD')
 *   .node('A', 'Start')
 *   .node('B', 'Stop')
 *   .edge('A', 'B', 'Go to')
 *   .build();
 * ```
 */
export class MermaidBuilder {
    private content: string = '';
    private indentation: number = 0;

    /**
     * @param header - The diagram type header (e.g., 'graph TD', 'sequenceDiagram').
     */
    constructor(header: string = 'graph TD') {
        this.content = header + '\n';
    }

    private get indent(): string {
        return '  '.repeat(this.indentation);
    }

    /**
     * Adds a raw line to the diagram.
     */
    public add(line: string): this {
        this.content += `${this.indent}${line}\n`;
        return this;
    }

    /**
     * Adds a node to the diagram.
     *
     * @param id - The node ID.
     * @param text - Optional display text.
     * @param shape - Optional shape: 'box', 'round', 'stadium', 'subroutine', 'cylindrical', 'circle', 'asymmetric', 'rhombus', 'hexagon'.
     */
    public node(
        id: string,
        text?: string,
        shape:
            | 'box'
            | 'round'
            | 'stadium'
            | 'subroutine'
            | 'cylindrical'
            | 'circle'
            | 'asymmetric'
            | 'rhombus'
            | 'hexagon' = 'box',
    ): this {
        if (!text) {
            this.add(id);
            return this;
        }

        const brackets = {
            box: ['[', ']'],
            round: ['(', ')'],
            stadium: ['([', '])'],
            subroutine: ['[[', ']]'],
            cylindrical: ['[(', ')]'],
            circle: ['((', '))'],
            asymmetric: ['>', ']'],
            rhombus: ['{', '}'],
            hexagon: ['{{', '}}'],
        };

        const [start, end] = brackets[shape] || brackets.box;
        this.add(`${id}${start}"${text}"${end}`);
        return this;
    }

    /**
     * Adds an edge between two nodes.
     *
     * @param from - Starting node ID.
     * @param to - Ending node ID.
     * @param text - Optional label text.
     * @param type - Edge style: 'arrow' (-->), 'line' (---), 'dotted' (-.->), 'thick' (==>).
     */
    public edge(
        from: string,
        to: string,
        text?: string,
        type: 'arrow' | 'line' | 'dotted' | 'thick' = 'arrow',
    ): this {
        const styles = {
            arrow: '-->',
            line: '---',
            dotted: '-.->',
            thick: '==>',
        };

        const style = styles[type] || styles.arrow;
        if (text) {
            this.add(`${from} ${style}|"${text}"| ${to}`);
        } else {
            this.add(`${from} ${style} ${to}`);
        }
        return this;
    }

    /**
     * Adds a subgraph.
     *
     * @param name - Subgraph display name.
     * @param callback - Function to build subgraph content.
     */
    public subgraph(name: string, callback: MermaidCallback): this {
        this.add(`subgraph "${name}"`);
        this.indentation++;
        callback(this);
        this.indentation--;
        this.add('end');
        return this;
    }

    /**
     * Sets a style for a node or class.
     */
    public style(id: string, style: string): this {
        this.add(`style ${id} ${style}`);
        return this;
    }

    /**
     * Adds a comment.
     */
    public comment(text: string): this {
        this.add(`%% ${text}`);
        return this;
    }

    /**
     * Returns the final Mermaid string.
     */
    public build(): string {
        return this.content.trim();
    }

    /**
     * Alias of {@link build}.
     */
    public toString(): string {
        return this.build();
    }
}
