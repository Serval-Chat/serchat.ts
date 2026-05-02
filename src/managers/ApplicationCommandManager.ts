import type { AxiosInstance } from 'axios';
import type { SlashCommandData } from '@/types/commands.js';
import type { Interaction } from '@/structures/Interaction.js';
import type { BotCommand } from '@/structures/BotCommand.js';

export class ApplicationCommandManager {
    private rest: AxiosInstance;
    private registeredCommands = new Map<string, BotCommand>();

    constructor(rest: AxiosInstance) {
        this.rest = rest;
    }

    public register(command: BotCommand): void {
        if (this.registeredCommands.has(command.name)) {
            throw new Error(`Command with name "${command.name}" is already registered.`);
        }
        this.registeredCommands.set(command.name, command);
    }

    /**
     * Handle an interaction and route it to the correct command
     */
    public async handleInteraction(interaction: Interaction): Promise<void> {
        const command = this.registeredCommands.get(interaction.command);
        if (command) {
            await command.execute(interaction);
        }
    }

    public getCommandsData(): SlashCommandData[] {
        return Array.from(this.registeredCommands.values()).map((cmd) => cmd.toJSON());
    }

    public async sync(): Promise<void> {
        await this.set(this.getCommandsData());
    }

    public async set(commands: SlashCommandData[]): Promise<SlashCommandData[]> {
        const names = new Set<string>();
        for (const cmd of commands) {
            if (names.has(cmd.name)) {
                throw new Error(`Duplicate command name found in set(): "${cmd.name}"`);
            }
            names.add(cmd.name);
        }

        const response = await this.rest.put<SlashCommandData[]>('/applications/@me/commands', {
            commands,
        });
        return response.data;
    }
}
