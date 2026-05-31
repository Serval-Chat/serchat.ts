import { describe, expect, it } from 'vitest';
import { ButtonBuilder, ComponentsBuilder } from '@/builders/ComponentsBuilder.js';

describe('ComponentsBuilder', () => {
    it('builds buttons with ButtonBuilder', () => {
        const components = new ComponentsBuilder()
            .addButton(new ButtonBuilder('primary').setLabel('Click me').setCustomId('click'))
            .addButton(new ButtonBuilder('link').setLabel('Docs').setURL('https://ser.chat'))
            .toJSON();

        expect(components).toEqual([
            {
                type: 'button',
                style: 'primary',
                label: 'Click me',
                custom_id: 'click',
            },
            {
                type: 'button',
                style: 'link',
                label: 'Docs',
                url: 'https://ser.chat',
            },
        ]);
    });

    it('caps component count at 8', () => {
        const builder = new ComponentsBuilder();
        for (let i = 0; i < 10; i += 1) {
            builder.addButton(
                new ButtonBuilder('secondary').setLabel(`Button ${i}`).setCustomId(`id-${i}`),
            );
        }

        expect(builder.toJSON()).toHaveLength(8);
    });
});
