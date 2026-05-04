import type { InteractionOption } from './commands.js';

export interface Server {
    _id: string;
    id: string;
    name: string;
    ownerId: string;
    icon?: string;
    banner?: string;
}

export interface Channel {
    _id: string;
    id: string;
    name: string;
    type: string;
    serverId: string;
    categoryId?: string;
    position: number;
}

export interface Category {
    _id: string;
    id: string;
    name: string;
    serverId: string;
    position: number;
}

export interface Role {
    _id: string;
    id: string;
    name: string;
    color?: string;
    position: number;
    permissions: string;
}

export interface ServerMember {
    _id: string;
    userId: string;
    serverId: string;
    nickname?: string;
    roles: string[];
}

export interface MessageUpdatePayload {
    messageId: string;
    serverId: string;
    channelId: string;
    text: string;
    isEdited: boolean;
    editedAt: string;
}

export interface MessageDeletePayload {
    messageId: string;
    serverId: string;
    channelId: string;
    hard?: boolean;
}

export interface MessageBulkDeletePayload {
    messageIds: string[];
    serverId: string;
    channelId: string;
    hard?: boolean;
}

export interface ReactionPayload {
    messageId: string;
    userId: string;
    username: string;
    emoji: string;
    emojiType: 'unicode' | 'custom';
    emojiId?: string;
    messageType: 'dm' | 'server';
    serverId?: string;
    channelId?: string;
}

export interface MemberAddedPayload {
    serverId: string;
    userId: string;
    username: string;
}

export interface MemberRemovedPayload {
    serverId: string;
    userId: string;
}

export interface MemberUpdatedPayload {
    serverId: string;
    userId: string;
    member: ServerMember;
}

export interface ChannelCreatedPayload {
    serverId: string;
    channel: Channel;
}

export interface ChannelUpdatedPayload {
    serverId: string;
    channel: Channel;
}

export interface ChannelDeletedPayload {
    serverId: string;
    channelId: string;
}

export interface CategoryCreatedPayload {
    serverId: string;
    category: Category;
}

export interface CategoryUpdatedPayload {
    serverId: string;
    category: Category;
}

export interface CategoryDeletedPayload {
    serverId: string;
    categoryId: string;
}

export interface ServerUpdatedPayload {
    serverId: string;
    server: Partial<Server>;
    senderId: string;
}

export interface ServerDeletedPayload {
    serverId: string;
    senderId: string;
}

export interface RoleCreatedPayload {
    serverId: string;
    role: Role;
}

export interface RoleUpdatedPayload {
    serverId: string;
    role: Role;
}

export interface RoleDeletedPayload {
    serverId: string;
    roleId: string;
}

export interface InviteCreatedPayload {
    serverId: string;
    code: string;
    maxUses: number | null;
    expiresAt: string | null;
    senderId: string;
}

export interface InviteDeletedPayload {
    serverId: string;
    code: string;
    senderId: string;
}

import type { ServerPermissions } from './permissions.js';

export interface InteractionCreatePayload {
    command: string;
    options: InteractionOption[];
    serverId: string;
    channelId: string;
    senderId: string;
    senderUsername: string;
    senderPermissions?: ServerPermissions;
    user?: { id: string; username: string };
    invocationId?: string;
}

export interface ServerJoinedPayload {
    serverId: string;
    voiceStates?: Record<string, string[]>;
}

export interface PresenceSyncPayload {
    online: Array<{
        userId: string;
        username: string;
        status?: {
            text: string;
            emoji: string | null;
            expiresAt: string | null;
            updatedAt: string;
        } | null;
    }>;
}

export interface UserPresencePayload {
    userId: string;
    username: string;
    status?: {
        text: string;
        emoji: string | null;
        expiresAt: string | null;
        updatedAt: string;
    } | null;
}

export interface UserOfflinePayload {
    userId: string;
    username: string;
}

export interface UserUpdatedPayload {
    userId: string;
    username?: string;
    displayName?: string | null;
    profilePicture?: string | null;
    bio?: string | null;
    pronouns?: string | null;
    badges?: string[];
    oldUsername?: string;
    newUsername?: string;
    usernameFont?: string;
    usernameGradient?: {
        enabled: boolean;
        colors: string[];
        angle: number;
    };
    usernameGlow?: {
        enabled: boolean;
        color: string;
        intensity: number;
    };
    settings?: {
        muteNotifications?: boolean;
        useDiscordStyleMessages?: boolean;
        ownMessagesAlign?: 'left' | 'right';
        otherMessagesAlign?: 'left' | 'right';
        showYouLabel?: boolean;
        ownMessageColor?: string;
        otherMessageColor?: string;
        disableCustomUsernameFonts?: boolean;
        disableCustomUsernameColors?: boolean;
        disableCustomUsernameGlow?: boolean;
    };
    senderId?: string;
}

export interface MemberBannedPayload {
    serverId: string;
    userId: string;
}

export interface MemberUnbannedPayload {
    serverId: string;
    userId: string;
}

export interface OwnershipTransferredPayload {
    serverId: string;
    oldOwnerId: string;
    newOwnerId: string;
    senderId?: string;
}

export interface ChannelsReorderedPayload {
    serverId: string;
    channelPositions: { channelId: string; position: number }[];
    senderId?: string;
}

export interface CategoriesReorderedPayload {
    serverId: string;
    categoryPositions: { categoryId: string; position: number }[];
    senderId?: string;
}

export interface RolesReorderedPayload {
    serverId: string;
    rolePositions: { roleId: string; position: number }[];
    senderId?: string;
}

export interface ChannelPermissionsUpdatedPayload {
    serverId: string;
    channelId: string;
    permissions: Record<string, Record<string, boolean>>;
    senderId?: string;
}

export interface CategoryPermissionsUpdatedPayload {
    serverId: string;
    categoryId: string;
    permissions: Record<string, Record<string, boolean>>;
    senderId?: string;
}
