import { describe, it, expect, vi } from 'vitest';
import { ApplicationCommandManager } from '@/managers/ApplicationCommandManager.js';
import type { AxiosInstance } from 'axios';
import { BotCommand } from '@/structures/BotCommand.js';
import type { Interaction } from '@/structures/Interaction.js';

class MockCommand extends BotCommand {
    constructor(public name: string) {
        super();
    }
    description = 'test';
    async execute(_interaction: Interaction): Promise<void> {}
}

describe('ApplicationCommandManager', () => {
    const mockRest = {
        put: vi.fn().mockResolvedValue({ data: [] }),
    } as unknown as AxiosInstance;

    it('should throw an error when registering a duplicate command name', () => {
        const manager = new ApplicationCommandManager(mockRest);
        const cmd1 = new MockCommand('test');
        const cmd2 = new MockCommand('test');

        manager.register(cmd1);
        expect(() => manager.register(cmd2)).toThrow(
            'Command with name "test" is already registered.',
        );
    });

    it('should throw an error when set() is called with duplicate command names', async () => {
        const manager = new ApplicationCommandManager(mockRest);
        const commands = [
            { name: 'test', description: 'test' },
            { name: 'test', description: 'test2' },
        ];

        await expect(manager.set(commands as any)).rejects.toThrow(
            'Duplicate command name found in set(): "test"',
        );
    });

    it('should not throw when registering unique command names', () => {
        const manager = new ApplicationCommandManager(mockRest);
        const cmd1 = new MockCommand('test1');
        const cmd2 = new MockCommand('test2');

        expect(() => {
            manager.register(cmd1);
            manager.register(cmd2);
        }).not.toThrow();
    });

    it('should not throw when set() is called with unique command names', async () => {
        const manager = new ApplicationCommandManager(mockRest);
        const commands = [
            { name: 'test1', description: 'test' },
            { name: 'test2', description: 'test' },
        ];

        await expect(manager.set(commands as any)).resolves.toBeDefined();
    });
});
