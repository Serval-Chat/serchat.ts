import type { Interaction } from './Interaction.js';
import {
    SlashCommandOptionType,
    type SlashCommandData,
    type SlashCommandOption,
} from '@/types/commands.js';

export type CommandOptionType = 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role';

export interface CommandOption {
    type: CommandOptionType;
    description: string;
    required?: boolean;
}

export abstract class BotCommand {
    public abstract name: string;
    public abstract description: string;
    public options?: Record<string, CommandOption>;

    public abstract execute(interaction: Interaction): Promise<void>;

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
