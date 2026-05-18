import type { Interaction } from './Interaction.js';
import {
    SlashCommandOptionType,
    type SlashCommandData,
    type SlashCommandOption,
} from '@/types/commands.js';

/** Union of supported slash-command option value types. */
export type CommandOptionType = 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role';

/** Descriptor for a single slash-command option. */
export interface CommandOption {
    /** The type of value this option accepts. */
    type: CommandOptionType;
    /** Short description shown in the command picker UI. */
    description: string;
    /** Whether the user must provide this option. Defaults to `false`. */
    required?: boolean;
}

/**
 * Abstract base class for all bot slash commands.
 *
 * @example
 * ```ts
 * class PingCommand extends BotCommand {
 *   name = 'ping';
 *   description = 'Replies with Pong!';
 *
 *   async execute(interaction: Interaction) {
 *     await interaction.reply('Pong!');
 *   }
 * }
 * ```
 */
export abstract class BotCommand {
    /** The unique command ID populated after registration sync. */
    public id?: string;
    /** The command name as it appears in the slash-command picker (lowercase, no spaces). */
    public abstract name: string;
    /** Short description displayed in the command picker UI. */
    public abstract description: string;
    /** Optional map of option names to their descriptors. */
    public options?: Record<string, CommandOption>;

    /** Called when a user invokes this command. */
    public abstract execute(interaction: Interaction): Promise<void>;

    /** Serialises the command to the API payload format. */
    public toJSON(): SlashCommandData {
        const options: SlashCommandOption[] = [];

        if (this.options) {
            for (const [name, option] of Object.entries(this.options)) {
                options.push({
                    name,
                    description: option.description,
                    type: this.mapType(option.type),
                    required: option.required,
                });
            }
        }

        return {
            name: this.name,
            description: this.description,
            options: options.length > 0 ? options : undefined,
        };
    }

    private mapType(type: CommandOptionType): SlashCommandOptionType {
        switch (type) {
            case 'string':
                return SlashCommandOptionType.STRING;
            case 'integer':
                return SlashCommandOptionType.INTEGER;
            case 'boolean':
                return SlashCommandOptionType.BOOLEAN;
            case 'user':
                return SlashCommandOptionType.USER;
            case 'channel':
                return SlashCommandOptionType.CHANNEL;
            case 'role':
                return SlashCommandOptionType.ROLE;
            default:
                return SlashCommandOptionType.STRING;
        }
    }
}
