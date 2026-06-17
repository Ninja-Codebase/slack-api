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