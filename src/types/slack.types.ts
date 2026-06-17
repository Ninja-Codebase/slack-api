// src/types/slack.types.ts
import { UsersListResponse } from '@slack/web-api';

export interface SlackUser {
  id: string;
  name: string;
  profile?: {
    real_name?: string;
    display_name?: string;
    email?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
  };
  is_bot?: boolean;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  deleted?: boolean;
  color?: string;
  real_name?: string;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  team_id?: string;
  updated?: number;
}

export interface PaginationResponse {
  members: SlackUser[];
  next_cursor?: string;
  total_count?: number;
}

export interface FetchOptions {
  limit?: number;
  cursor?: string;
  includeDeleted?: boolean;
  includeBotUsers?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  bots: number;
  admins: number;
  deleted: number;
  restricted: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  name_normalized?: string;
  created?: number;
  creator?: string;
  is_archived?: boolean;
  is_general?: boolean;
  is_private?: boolean;
  is_mpim?: boolean;
  is_im?: boolean;
  is_org_shared?: boolean;
  is_pending_ext_shared?: boolean;
  is_shared?: boolean;
  is_channel?: boolean;
  is_group?: boolean;
  is_member?: boolean;
  is_ext_shared?: boolean;
  num_members?: number;
  members?: string[];
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names?: string[];
  priority?: number;
}

export interface ConversationsListResponse {
  ok: boolean;
  channels?: SlackChannel[];
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
}

export interface FetchChannelOptions {
  limit?: number;
  cursor?: string;
  excludeArchived?: boolean;
  types?: string; // 'public_channel', 'private_channel', 'mpim', 'im'
}

export interface ChannelStats {
  total: number;
  public: number;
  private: number;
  archived: number;
  shared: number;
  mpim: number;
  im: number;
  memberCount: number;
}

export interface SlackUsergroup {
  id: string;
  team_id: string;
  is_usergroup: boolean;
  name: string;
  description?: string;
  handle: string;
  is_external: boolean;
  date_create: number;
  date_update: number;
  date_delete: number;
  auto_type: string | null;
  created_by: string;
  updated_by: string;
  deleted_by: string | null;
  prefs: {
    channels: string[];
    groups: string[];
  };
  user_count: string; // Number of users in the group
  users?: string[]; // Populated when include_users is true
}

export interface UsergroupListResponse {
  ok: boolean;
  usergroups?: SlackUsergroup[];
  error?: string;
}

export interface UsergroupUsersListResponse {
  ok: boolean;
  users?: string[];
  error?: string;
}

export interface FetchUsergroupOptions {
  includeCount?: boolean;
  includeDisabled?: boolean;
  includeUsers?: boolean;
  teamId?: string;
}

export interface UsergroupStats {
  total: number;
  disabled: number;
  external: number;
  autoGroups: number;
  totalMembers: number;
}