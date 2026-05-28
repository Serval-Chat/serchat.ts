import { describe, expect, it } from 'vitest';

import { MessageBuilder, type InlineBuilder } from '@/builders/MessageBuilder.js';

describe('MessageBuilder', () => {
    it('appends timestamps from Unix seconds', () => {
        const message = new MessageBuilder().text('Started ').timestamp(123456789, 'R').build();

        expect(message).toBe('Started <t:123456789:R>');
    });

    it('appends timestamps without a style', () => {
        const message = new MessageBuilder().timestamp(123456789).build();

        expect(message).toBe('<t:123456789>');
    });

    it('normalizes Date timestamps to Unix seconds', () => {
        const message = new MessageBuilder()
            .timestamp(new Date('1973-11-29T21:33:09.000Z'), 'F')
            .build();

        expect(message).toBe('<t:123456789:F>');
    });

    it('normalizes millisecond timestamps to Unix seconds', () => {
        const message = new MessageBuilder().timestamp(123456789000, 't').build();

        expect(message).toBe('<t:123456789:t>');
    });
});

describe('InlineBuilder', () => {
    it('supports timestamps in inline callbacks', () => {
        const message = new MessageBuilder()
            .p((t: InlineBuilder) => t.text('Due ').timestamp(123456789, 'D'))
            .build();

        expect(message).toBe('Due <t:123456789:D>\n');
    });
});
