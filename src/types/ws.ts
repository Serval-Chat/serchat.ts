import type { IMessageServer } from './message.js';
import type {
    MessageUpdatePayload,
    MessageDeletePayload,
    ReactionPayload,
    MemberAddedPayload,
    MemberRemovedPayload,
    MemberUpdatedPayload,
    ChannelCreatedPayload,
    ChannelUpdatedPayload,
    ChannelDeletedPayload,
    CategoryCreatedPayload,
    CategoryUpdatedPayload,
    CategoryDeletedPayload,
    ServerUpdatedPayload,
    ServerDeletedPayload,
    InviteCreatedPayload,
    InviteDeletedPayload,
    RoleCreatedPayload,
    RoleUpdatedPayload,
    RoleDeletedPayload,
    InteractionCreatePayload,
    ServerJoinedPayload,
    PresenceSyncPayload,
    UserPresencePayload,
    UserOfflinePayload,
    UserUpdatedPayload,
    MemberBannedPayload,
    MemberUnbannedPayload,
    OwnershipTransferredPayload,
    ChannelsReorderedPayload,
    CategoriesReorderedPayload,
    RolesReorderedPayload,
    ChannelPermissionsUpdatedPayload,
    CategoryPermissionsUpdatedPayload,
    PollVoteUpdatePayload,
} from './events.js';
import type { ClientUser } from './user.js';

export type WsErrorCode =
    | 'AUTHENTICATION_FAILED'
    | 'INTERNAL_ERROR'
    | 'MALFORMED_MESSAGE'
    | 'UNAUTHORIZED'
    | 'DUPLICATE_MESSAGE'
    | 'RATE_LIMIT'
    | 'TIMEOUT'
    | 'FORBIDDEN'
    | 'BAD_REQUEST'
    | 'NOT_FOUND'
    | 'CONFLICT';

export type WsEvent =
    | { type: 'authenticated'; payload: { user: ClientUser; instanceId: string } }
    | { type: 'error'; payload: { code: WsErrorCode; details?: string | Record<string, string> } }
    | { type: 'message_server'; payload: IMessageServer }
    | { type: 'interaction_create_server'; payload: InteractionCreatePayload }
    | {
          type: 'interaction_response_server';
          payload: {
              serverId: string;
              channelId: string;
              text: string;
              invocationId?: string;
              ephemeral?: boolean;
          };
      }
    | { type: 'message_server_edited'; payload: MessageUpdatePayload }
    | { type: 'message_server_deleted'; payload: MessageDeletePayload }
    | {
          type: 'messages_server_bulk_deleted';
          payload: { messageIds: string[]; serverId: string; channelId: string; hard?: boolean };
      }
    | { type: 'reaction_added'; payload: ReactionPayload }
    | { type: 'reaction_removed'; payload: ReactionPayload }
    | { type: 'poll_vote_updated_server'; payload: PollVoteUpdatePayload }
    | { type: 'poll_vote_updated_dm'; payload: PollVoteUpdatePayload }
    | { type: 'member_added'; payload: MemberAddedPayload }
    | { type: 'member_removed'; payload: MemberRemovedPayload }
    | { type: 'member_updated'; payload: MemberUpdatedPayload }
    | { type: 'channel_created'; payload: ChannelCreatedPayload }
    | { type: 'channel_updated'; payload: ChannelUpdatedPayload }
    | { type: 'channel_deleted'; payload: ChannelDeletedPayload }
    | { type: 'channels_reordered'; payload: ChannelsReorderedPayload }
    | { type: 'category_created'; payload: CategoryCreatedPayload }
    | { type: 'category_updated'; payload: CategoryUpdatedPayload }
    | { type: 'category_deleted'; payload: CategoryDeletedPayload }
    | { type: 'categories_reordered'; payload: CategoriesReorderedPayload }
    | { type: 'channel_permissions_updated'; payload: ChannelPermissionsUpdatedPayload }
    | { type: 'category_permissions_updated'; payload: CategoryPermissionsUpdatedPayload }
    | { type: 'server_updated'; payload: ServerUpdatedPayload }
    | { type: 'server_deleted'; payload: ServerDeletedPayload }
    | { type: 'server_icon_updated'; payload: { serverId: string; icon: string } }
    | {
          type: 'server_banner_updated';
          payload: { serverId: string; banner: { type: 'image'; value: string } };
      }
    | { type: 'role_created'; payload: RoleCreatedPayload }
    | { type: 'role_updated'; payload: RoleUpdatedPayload }
    | { type: 'role_deleted'; payload: RoleDeletedPayload }
    | { type: 'roles_reordered'; payload: RolesReorderedPayload }
    | { type: 'server_invite_created'; payload: InviteCreatedPayload }
    | { type: 'server_invite_deleted'; payload: InviteDeletedPayload }
    | { type: 'member_banned'; payload: MemberBannedPayload }
    | { type: 'member_unbanned'; payload: MemberUnbannedPayload }
    | { type: 'ownership_transferred'; payload: OwnershipTransferredPayload }
    | { type: 'server_joined'; payload: ServerJoinedPayload }
    | { type: 'presence_sync'; payload: PresenceSyncPayload }
    | { type: 'user_online'; payload: UserPresencePayload }
    | { type: 'user_offline'; payload: UserOfflinePayload }
    | { type: 'user_updated'; payload: UserUpdatedPayload }
    | { type: 'ping'; payload: Record<string, never> }
    | { type: 'pong'; payload: Record<string, never> };

export interface IWsIncomingMessage {
    id?: string;
    event?: WsEvent;
    meta?: {
        replyTo?: string;
    };
}
