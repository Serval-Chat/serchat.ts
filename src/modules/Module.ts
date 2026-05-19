import type { Client } from '@/client/Client.js';
import type { ClientUser } from '@/types/user.js';
import type { Message } from '@/structures/Message.js';
import type { Interaction } from '@/structures/Interaction.js';
import type {
    MessageUpdatePayload,
    MessageDeletePayload,
    MessageBulkDeletePayload,
    ReactionPayload,
    PollVoteUpdatePayload,
    MemberAddedPayload,
    MemberRemovedPayload,
    MemberUpdatedPayload,
    ChannelCreatedPayload,
    ChannelUpdatedPayload,
    ChannelDeletedPayload,
    ChannelsReorderedPayload,
    CategoryCreatedPayload,
    CategoryUpdatedPayload,
    CategoryDeletedPayload,
    CategoriesReorderedPayload,
    ChannelPermissionsUpdatedPayload,
    CategoryPermissionsUpdatedPayload,
    ServerUpdatedPayload,
    ServerDeletedPayload,
    RoleCreatedPayload,
    RoleUpdatedPayload,
    RoleDeletedPayload,
    RolesReorderedPayload,
    InviteCreatedPayload,
    InviteDeletedPayload,
    MemberBannedPayload,
    MemberUnbannedPayload,
    OwnershipTransferredPayload,
    PresenceSyncPayload,
    UserPresencePayload,
    UserOfflinePayload,
    UserUpdatedPayload,
} from '@/types/events.js';

export interface ClientModule {
    name: string;
    register?(client: Client): void | Promise<void>;

    onReady?(user: ClientUser): void | Promise<void>;
    onMessage?(message: Message): void | Promise<void>;
    onMessageCreate?(message: Message): void | Promise<void>;
    onMessageUpdate?(payload: MessageUpdatePayload): void | Promise<void>;
    onMessageDelete?(payload: MessageDeletePayload): void | Promise<void>;
    onMessageBulkDelete?(payload: MessageBulkDeletePayload): void | Promise<void>;
    onInteraction?(interaction: Interaction): void | Promise<void>;
    onInteractionCreate?(interaction: Interaction): void | Promise<void>;
    onMessageReactionAdd?(payload: ReactionPayload): void | Promise<void>;
    onMessageReactionRemove?(payload: ReactionPayload): void | Promise<void>;
    onPollVoteUpdate?(payload: PollVoteUpdatePayload): void | Promise<void>;
    onServerMemberAdd?(payload: MemberAddedPayload): void | Promise<void>;
    onServerMemberRemove?(payload: MemberRemovedPayload): void | Promise<void>;
    onServerMemberUpdate?(payload: MemberUpdatedPayload): void | Promise<void>;
    onChannelCreate?(payload: ChannelCreatedPayload): void | Promise<void>;
    onChannelUpdate?(payload: ChannelUpdatedPayload): void | Promise<void>;
    onChannelDelete?(payload: ChannelDeletedPayload): void | Promise<void>;
    onChannelsReordered?(payload: ChannelsReorderedPayload): void | Promise<void>;
    onCategoryCreate?(payload: CategoryCreatedPayload): void | Promise<void>;
    onCategoryUpdate?(payload: CategoryUpdatedPayload): void | Promise<void>;
    onCategoryDelete?(payload: CategoryDeletedPayload): void | Promise<void>;
    onCategoriesReordered?(payload: CategoriesReorderedPayload): void | Promise<void>;
    onChannelPermissionsUpdate?(payload: ChannelPermissionsUpdatedPayload): void | Promise<void>;
    onCategoryPermissionsUpdate?(payload: CategoryPermissionsUpdatedPayload): void | Promise<void>;
    onServerUpdate?(payload: ServerUpdatedPayload): void | Promise<void>;
    onServerDelete?(payload: ServerDeletedPayload): void | Promise<void>;
    onServerIconUpdate?(payload: { serverId: string; icon: string }): void | Promise<void>;
    onServerBannerUpdate?(payload: {
        serverId: string;
        banner: { type: 'image'; value: string };
    }): void | Promise<void>;
    onRoleCreate?(payload: RoleCreatedPayload): void | Promise<void>;
    onRoleUpdate?(payload: RoleUpdatedPayload): void | Promise<void>;
    onRoleDelete?(payload: RoleDeletedPayload): void | Promise<void>;
    onRolesReordered?(payload: RolesReorderedPayload): void | Promise<void>;
    onInviteCreate?(payload: InviteCreatedPayload): void | Promise<void>;
    onInviteDelete?(payload: InviteDeletedPayload): void | Promise<void>;
    onServerMemberBan?(payload: MemberBannedPayload): void | Promise<void>;
    onServerMemberUnban?(payload: MemberUnbannedPayload): void | Promise<void>;
    onOwnershipTransfer?(payload: OwnershipTransferredPayload): void | Promise<void>;
    onPresenceSync?(payload: PresenceSyncPayload): void | Promise<void>;
    onUserOnline?(payload: UserPresencePayload): void | Promise<void>;
    onUserOffline?(payload: UserOfflinePayload): void | Promise<void>;
    onUserUpdate?(payload: UserUpdatedPayload): void | Promise<void>;
    onError?(error: Error): void | Promise<void>;
    onDisconnect?(): void | Promise<void>;
    onReconnected?(): void | Promise<void>;
}
