export const PERMISSION_KEYS = [
    'viewChannels',
    'sendMessages',
    'addReactions',
    'connect',
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
    'manageReactions',
    'exportChannelMessages',
    'bypassSlowmode',
    'pinMessages',
    'seeDeletedMessages',
    'moderateMembers',
    'manageStickers',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type ServerPermissions = Partial<Record<PermissionKey, boolean>>;
