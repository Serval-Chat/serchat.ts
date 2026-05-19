import { describe, expect, it, vi } from 'vitest';
import { Client } from '@/client/Client.js';
import { ModuleManager } from '@/modules/ModuleManager.js';
import type { ClientModule } from '@/modules/Module.js';

describe('ModuleManager', () => {
    it('calls module register with the client', async () => {
        const client = new Client();
        const manager = new ModuleManager(client);
        const module: ClientModule = {
            name: 'test-module',
            register: vi.fn(),
        };

        await manager.register(module);

        expect(module.register).toHaveBeenCalledWith(client);
    });

    it('throws when registering duplicate module names', async () => {
        const client = new Client();
        const manager = new ModuleManager(client);
        const firstModule: ClientModule = {
            name: 'test-module',
            register: vi.fn(),
        };
        const duplicateModule: ClientModule = {
            name: 'test-module',
            register: vi.fn(),
        };

        await manager.register(firstModule);

        await expect(manager.register(duplicateModule)).rejects.toThrow(
            'Module with name "test-module" is already registered.',
        );
    });
});
