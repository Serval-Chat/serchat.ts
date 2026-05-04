import type { JsonObject } from './json.js';
export enum SlashCommandOptionType {
    SUB_COMMAND = 1,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
}

export interface SlashCommandOption extends JsonObject {
    type: SlashCommandOptionType;
    name: string;
    description: string;
    required?: boolean;
}

export interface SlashCommandData extends JsonObject {
    name: string;
    description: string;
    options?: SlashCommandOption[];
    shouldReply?: boolean;
}

import type { InteractionValue } from './interactions.js';

export interface InteractionOption {
    name: string;
    value: InteractionValue;
    type?: SlashCommandOptionType;
}
