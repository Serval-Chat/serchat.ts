import { describe, it, expect } from 'vitest';
import { EmbedBuilder } from './EmbedBuilder.js';

describe('EmbedBuilder', () => {
    it('should initialize with default rich type', () => {
        const embed = new EmbedBuilder();
        expect(embed.toJSON()).toEqual({ type: 'rich' });
    });

    it('should set title', () => {
        const embed = new EmbedBuilder().setTitle('Test Title');
        expect(embed.toJSON()).toEqual({ type: 'rich', title: 'Test Title' });
    });

    it('should set description', () => {
        const embed = new EmbedBuilder().setDescription('Test Description');
        expect(embed.toJSON()).toEqual({ type: 'rich', description: 'Test Description' });
    });

    it('should set url', () => {
        const embed = new EmbedBuilder().setURL('https://example.com');
        expect(embed.toJSON()).toEqual({ type: 'rich', url: 'https://example.com' });
    });

    it('should set color', () => {
        const embed = new EmbedBuilder().setColor(0xff0000);
        expect(embed.toJSON()).toEqual({ type: 'rich', color: 0xff0000 });
    });

    it('should set timestamp with Date object', () => {
        const date = new Date('2024-01-01T00:00:00.000Z');
        const embed = new EmbedBuilder().setTimestamp(date);
        expect(embed.toJSON()).toEqual({ type: 'rich', timestamp: '2024-01-01T00:00:00.000Z' });
    });

    it('should set timestamp with number', () => {
        const embed = new EmbedBuilder().setTimestamp(1704067200000);
        expect(embed.toJSON()).toEqual({ type: 'rich', timestamp: '2024-01-01T00:00:00.000Z' });
    });

    it('should set timestamp with ISO string', () => {
        const embed = new EmbedBuilder().setTimestamp('2024-01-01T00:00:00.000Z');
        expect(embed.toJSON()).toEqual({ type: 'rich', timestamp: '2024-01-01T00:00:00.000Z' });
    });

    it('should set author', () => {
        const embed = new EmbedBuilder().setAuthor({
            name: 'Author Name',
            url: 'https://author.com',
        });
        expect(embed.toJSON()).toEqual({
            type: 'rich',
            author: { name: 'Author Name', url: 'https://author.com' },
        });
    });

    it('should clear author when passing null', () => {
        const embed = new EmbedBuilder().setAuthor({ name: 'Author Name' }).setAuthor(null);
        expect(embed.toJSON()).toEqual({ type: 'rich', author: undefined });
    });

    it('should set footer', () => {
        const embed = new EmbedBuilder().setFooter({ text: 'Footer Text', icon_url: 'icon.png' });
        expect(embed.toJSON()).toEqual({
            type: 'rich',
            footer: { text: 'Footer Text', icon_url: 'icon.png' },
        });
    });

    it('should clear footer when passing null', () => {
        const embed = new EmbedBuilder().setFooter({ text: 'Footer Text' }).setFooter(null);
        expect(embed.toJSON()).toEqual({ type: 'rich', footer: undefined });
    });

    it('should set thumbnail', () => {
        const embed = new EmbedBuilder().setThumbnail('thumbnail.png');
        expect(embed.toJSON()).toEqual({ type: 'rich', thumbnail: { url: 'thumbnail.png' } });
    });

    it('should set image', () => {
        const embed = new EmbedBuilder().setImage('image.png');
        expect(embed.toJSON()).toEqual({ type: 'rich', image: { url: 'image.png' } });
    });

    it('should add fields', () => {
        const embed = new EmbedBuilder().addFields(
            { name: 'Field 1', value: 'Value 1' },
            { name: 'Field 2', value: 'Value 2', inline: true },
        );
        expect(embed.toJSON()).toEqual({
            type: 'rich',
            fields: [
                { name: 'Field 1', value: 'Value 1' },
                { name: 'Field 2', value: 'Value 2', inline: true },
            ],
        });
    });

    it('should set fields completely replacing existing ones', () => {
        const embed = new EmbedBuilder()
            .addFields({ name: 'Old', value: 'Old Value' })
            .setFields({ name: 'New', value: 'New Value' });

        expect(embed.toJSON()).toEqual({
            type: 'rich',
            fields: [{ name: 'New', value: 'New Value' }],
        });
    });

    it('should chain all methods', () => {
        const embed = new EmbedBuilder()
            .setTitle('Title')
            .setDescription('Desc')
            .setColor(0x00ff00)
            .toJSON();

        expect(embed).toEqual({
            type: 'rich',
            title: 'Title',
            description: 'Desc',
            color: 0x00ff00,
        });
    });
});
