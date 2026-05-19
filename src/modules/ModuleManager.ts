import type { Client } from '@/client/Client.js';
import type { ClientModule } from '@/modules/Module.js';

export class ModuleManager {
    private client: Client;
    private registeredModules = new Map<string, ClientModule>();

    constructor(client: Client) {
        this.client = client;
    }

    public async register(module: ClientModule): Promise<void> {
        if (this.registeredModules.has(module.name)) {
            throw new Error(`Module with name "${module.name}" is already registered.`);
        }

        if (module.register) {
            await module.register(this.client);
        }

        this.client.events.register(module);
        this.registeredModules.set(module.name, module);
    }
}
