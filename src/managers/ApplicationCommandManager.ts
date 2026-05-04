import type { RESTClient } from '@/client/RESTClient.js';
import type { JsonValue } from '@/types/json.js';
import type { SlashCommandData } from '@/types/commands.js';
import type { Interaction } from '@/structures/Interaction.js';
import type { BotCommand } from '@/structures/BotCommand.js';

/**
 * Manages slash-command registration, deduplication, and dispatching for a bot.
 *
 * Accessed via {@link Client.commands} or {@link Client.application}.
 *
 * @example
 * ```ts
 * client.commands.register(new PingCommand());
 * await client.commands.sync(); // push commands to the API
 * ```
 */
export class ApplicationCommandManager {
    private rest: RESTClient;
    /** Map of command name → {@link BotCommand} instance. */
    private registeredCommands = new Map<string, BotCommand>();

    /**
     * @param rest - Authenticated REST client used to push commands to the API.
     */
    constructor(rest: RESTClient) {
        this.rest = rest;
    }

    /**
     * Registers a {@link BotCommand} locally so it can be dispatched when an
     * interaction arrives.
     *
     * @param command - The command to register.
     * @throws {Error} If a command with the same name is already registered.
     */
    public register(command: BotCommand): void {
        if (this.registeredCommands.has(command.name)) {
            throw new Error(`Command with name "${command.name}" is already registered.`);
        }
        this.registeredCommands.set(command.name, command);
    }

    /**
     * Handles an incoming interaction by looking up the matching registered
     * command and calling its `execute` method.
     *
     * @param interaction - The interaction to dispatch.
     */
    public async handleInteraction(interaction: Interaction): Promise<void> {
        const command = this.registeredCommands.get(interaction.command);
        if (command) {
            await command.execute(interaction);
        }
    }

    /**
     * Returns the JSON representation of all locally registered commands,
     * suitable for passing to {@link set}.
     *
     * @returns Array of {@link SlashCommandData} objects.
     */
    public getCommandsData(): SlashCommandData[] {
        return Array.from(this.registeredCommands.values()).map((cmd) => cmd.toJSON());
    }

    /**
     * Pushes all locally registered commands to the API, replacing the
     * current command list. Equivalent to calling
     * `set(this.getCommandsData())`.
     */
    public async sync(): Promise<void> {
        await this.set(this.getCommandsData());
    }

    /**
     * Replaces the bot's command list on the API with the provided commands.
     *
     * @param commands - Array of command definitions to upload.
     * @returns The updated list of commands as confirmed by the API.
     * @throws {Error} If `commands` contains duplicate command names.
     */
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
        } as JsonValue);
        return response.data;
    }
}
