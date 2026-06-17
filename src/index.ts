// src/index.ts
import { WebClient, UsersListResponse } from '@slack/web-api';
import dotenv from 'dotenv';
import {
  SlackUser,
  FetchOptions,
  UserStats,
  PaginationResponse,
} from './types/slack.types';

// Load environment variables
dotenv.config();

class SlackUserFetcher {
  private client: WebClient;
  private token: string;

  constructor(token?: string) {
    // Use provided token or fallback to environment variable
    this.token = token || process.env.SLACK_TOKEN || process.env.SLACK_BOT_TOKEN || '';
    
    if (!this.token) {
      throw new Error(
        'Slack token is required. Set SLACK_TOKEN or SLACK_BOT_TOKEN in .env file'
      );
    }

    this.client = new WebClient(this.token);
    console.log('✅ Slack client initialized successfully');
  }

  /**
   * Fetch all users with pagination
   */
  async fetchAllUsers(options: FetchOptions = {}): Promise<SlackUser[]> {
    const {
      limit = 200,
      includeDeleted = false,
      includeBotUsers = true,
    } = options;

    const allUsers: SlackUser[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    console.log('⏳ Starting to fetch users...');
    console.log(`📋 Options: limit=${limit}, includeDeleted=${includeDeleted}, includeBots=${includeBotUsers}`);

    try {
      do {
        const response: UsersListResponse = await this.client.users.list({
          limit: limit,
          cursor: cursor,
          include_locale: true,
        });

        // Check for API errors
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
        }

        console.log(response.members);
        // Process members
        if (response.members) {
          const members = response.members as SlackUser[];
          
          // Filter users based on options
          let filteredMembers = members;
          
          if (!includeDeleted) {
            filteredMembers = filteredMembers.filter(user => !user.deleted);
          }
          
          if (!includeBotUsers) {
            filteredMembers = filteredMembers.filter(user => !user.is_bot);
          }

          allUsers.push(...filteredMembers);
          pageCount++;
          
          console.log(
            `📄 Page ${pageCount}: Fetched ${members.length} users, ` +
            `filtered to ${filteredMembers.length}`
          );
        }

        // Get next cursor
        cursor = response.response_metadata?.next_cursor;

      } while (cursor);

      console.log(`✅ Successfully fetched ${allUsers.length} users`);
      return allUsers;

    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Fetch users with pagination information
   */
  async fetchUsersWithPagination(
    options: FetchOptions = {}
  ): Promise<PaginationResponse> {
    const { limit = 200, cursor } = options;

    try {
      const response: UsersListResponse = await this.client.users.list({
        limit: limit,
        cursor: cursor,
        include_locale: true,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      return {
        members: (response.members as SlackUser[]) || [],
        next_cursor: response.response_metadata?.next_cursor,
        total_count: response.members?.length || 0,
      };
    } catch (error) {
      console.error('Failed to fetch users with pagination:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(users: SlackUser[]): Promise<UserStats> {
    const stats: UserStats = {
      total: users.length,
      active: 0,
      bots: 0,
      admins: 0,
      deleted: 0,
      restricted: 0,
    };

    users.forEach((user) => {
      if (user.deleted) stats.deleted++;
      if (user.is_bot) stats.bots++;
      if (user.is_admin) stats.admins++;
      if (user.is_restricted || user.is_ultra_restricted) stats.restricted++;
      if (!user.deleted && !user.is_bot) stats.active++;
    });

    return stats;
  }

  /**
   * Format user data for display
   */
  formatUserForDisplay(user: SlackUser): string {
    const name = user.profile?.real_name || user.real_name || user.name || 'Unknown';
    const email = user.profile?.email || 'No email';
    const role = user.is_admin ? '(Admin)' : user.is_owner ? '(Owner)' : '';
    const status = user.deleted ? '[Deleted]' : user.is_bot ? '[Bot]' : '[Active]';
    
    return `- ${name} ${role} ${status} (ID: ${user.id}, Email: ${email})`;
  }

  /**
   * Save users to JSON file
   */
  async saveUsersToFile(users: SlackUser[], filename: string = 'users.json'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const data = {
      fetchedAt: new Date().toISOString(),
      total: users.length,
      users: users,
    };

    try {
      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 Users saved to ${filename}`);
    } catch (error) {
      console.error('Failed to save users to file:', error);
      throw error;
    }
  }
}

// ============================================
// Main execution function
// ============================================
async function main() {
  try {
    // Initialize the fetcher
    const fetcher = new SlackUserFetcher();

    // Fetch all users
    const allUsers = await fetcher.fetchAllUsers({
      limit: 200, // Maximum recommended per page
      includeDeleted: false,
      includeBotUsers: true,
    });

    // Get statistics
    const stats = await fetcher.getUserStats(allUsers);

    // Display statistics
    console.log('\n📊 User Statistics:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Active users: ${stats.active}`);
    console.log(`   Bot users: ${stats.bots}`);
    console.log(`   Admin users: ${stats.admins}`);
    console.log(`   Deleted users: ${stats.deleted}`);
    console.log(`   Restricted users: ${stats.restricted}`);

    // Display first 5 users as examples
    console.log('\n👥 First 5 users:');
    allUsers.slice(0, 5).forEach((user) => {
      console.log(fetcher.formatUserForDisplay(user));
    });

    // Save to file
    await fetcher.saveUsersToFile(allUsers, 'slack-users.json');

    // Example: Find users by email domain
    const emailUsers = allUsers.filter(
      (user) => user.profile?.email?.includes('@company.com')
    );
    console.log(`\n📧 Users with @company.com emails: ${emailUsers.length}`);

    // Example: Get all admins
    const admins = allUsers.filter((user) => user.is_admin);
    console.log(`👑 Admin users: ${admins.map(u => u.profile?.real_name || u.name).join(', ')}`);

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

// Export for use as module
export { SlackUserFetcher, SlackUser, UserStats, FetchOptions, PaginationResponse };