export const PERMISSION_KEYS = [
    'sendMessages',
    'manageMessages',
    'deleteMessagesOfOthers',
    'manageChannels',
    'manageRoles',
    'banMembers',
    'kickMembers',
    'manageInvites',
    'manageServer',
    'administrator',
    'manageWebhooks',
    'pingRolesAndEveryone',
    'addReactions',
    'manageReactions',
    'export_channel_messages',
    'viewChannels',
    'bypassSlowmode',
    'pinMessages',
    'seeDeletedMessages',
    'moderateMembers',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type ServerPermissions = Partial<Record<PermissionKey, boolean>>;
