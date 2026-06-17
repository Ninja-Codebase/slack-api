// src/index.ts
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import {
  SlackUsergroup,
  UsergroupListResponse,
  UsergroupUsersListResponse,
  FetchUsergroupOptions,
  UsergroupStats,
} from './types/slack.types';

dotenv.config();

export class SlackUsergroupFetcher {
  private client: WebClient;
  private token: string;

  constructor(token?: string) {
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
   * Fetch all user groups
   * Uses usergroups.list API method
   */
  async fetchAllUsergroups(options: FetchUsergroupOptions = {}): Promise<SlackUsergroup[]> {
    const {
      includeCount = true,
      includeDisabled = true,
      includeUsers = false,
      teamId,
    } = options;

    console.log('⏳ Starting to fetch user groups...');
    console.log(`📋 Options: includeCount=${includeCount}, includeDisabled=${includeDisabled}, includeUsers=${includeUsers}`);

    try {
      const response = await this.client.usergroups.list({
        include_count: includeCount,
        include_disabled: includeDisabled,
        include_users: includeUsers,
        team_id: teamId,
      }) as unknown as UsergroupListResponse;

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      const usergroups = response.usergroups || [];
      console.log(`✅ Successfully fetched ${usergroups.length} user groups`);
      return usergroups;

    } catch (error) {
      console.error('❌ Failed to fetch user groups:', error);
      throw error;
    }
  }

  /**
   * Fetch users for a specific user group
   * Uses usergroups.users.list API method
   */
  async fetchUsergroupUsers(usergroupId: string, includeDisabled: boolean = false): Promise<string[]> {
    try {
      const response = await this.client.usergroups.users.list({
        usergroup: usergroupId,
        include_disabled: includeDisabled,
      }) as unknown as UsergroupUsersListResponse;

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response.users || [];
    } catch (error) {
      console.error(`❌ Failed to fetch users for usergroup ${usergroupId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all user groups with full user lists
   * This makes an additional API call for each user group
   */
  async fetchAllUsergroupsWithUsers(options: FetchUsergroupOptions = {}): Promise<SlackUsergroup[]> {
    // First fetch all usergroups without users
    const usergroups = await this.fetchAllUsergroups({
      ...options,
      includeUsers: false,
    });

    console.log('⏳ Fetching users for each user group...');

    // For each usergroup, fetch its users
    for (const group of usergroups) {
      try {
        const users = await this.fetchUsergroupUsers(group.id, options.includeDisabled || false);
        group.users = users;
        console.log(`   ✅ Group "${group.name}": ${users.length} users`);
      } catch (error) {
        console.error(`   ❌ Failed to fetch users for group "${group.name}"`);
        group.users = [];
      }
    }

    console.log(`✅ Successfully fetched all user groups with user lists`);
    return usergroups;
  }

  /**
   * Get user group statistics
   */
  async getUsergroupStats(usergroups: SlackUsergroup[]): Promise<UsergroupStats> {
    const stats: UsergroupStats = {
      total: usergroups.length,
      disabled: 0,
      external: 0,
      autoGroups: 0,
      totalMembers: 0,
    };

    usergroups.forEach((group) => {
      // Check if disabled (date_delete > 0)
      if (group.date_delete > 0) {
        stats.disabled++;
      }
      if (group.is_external) {
        stats.external++;
      }
      if (group.auto_type !== null) {
        stats.autoGroups++;
      }
      
      // Add user count (parse string to number)
      const count = parseInt(group.user_count, 10);
      if (!isNaN(count)) {
        stats.totalMembers += count;
      }
    });

    return stats;
  }

  /**
   * Get groups by type
   */
  getGroupsByType(usergroups: SlackUsergroup[], type: 'all' | 'auto' | 'external' | 'disabled' | 'active'): SlackUsergroup[] {
    switch (type) {
      case 'auto':
        return usergroups.filter((g) => g.auto_type !== null);
      case 'external':
        return usergroups.filter((g) => g.is_external);
      case 'disabled':
        return usergroups.filter((g) => g.date_delete > 0);
      case 'active':
        return usergroups.filter((g) => g.date_delete === 0);
      case 'all':
      default:
        return usergroups;
    }
  }

  /**
   * Search user groups by name or description
   */
  searchUsergroups(usergroups: SlackUsergroup[], query: string): SlackUsergroup[] {
    const lowerQuery = query.toLowerCase();
    return usergroups.filter((group) => {
      const name = (group.name || '').toLowerCase();
      const description = (group.description || '').toLowerCase();
      const handle = (group.handle || '').toLowerCase();
      return name.includes(lowerQuery) || description.includes(lowerQuery) || handle.includes(lowerQuery);
    });
  }

  /**
   * Format user group for display
   */
  formatUsergroupForDisplay(group: SlackUsergroup): string {
    const status = group.date_delete > 0 ? '🔒 Disabled' : '✅ Active';
    const type = group.auto_type !== null ? `[${group.auto_type}]` : '';
    const external = group.is_external ? '🔗 External' : '';
    const users = group.users ? ` (${group.users.length} users)` : ` (${group.user_count} members)`;
    
    return `- ${type} ${status} ${external}: #${group.name}${users} (ID: ${group.id})`;
  }

  /**
   * Save user groups to JSON file
   */
  async saveUsergroupsToFile(usergroups: SlackUsergroup[], filename: string = 'usergroups.json'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const data = {
      fetchedAt: new Date().toISOString(),
      total: usergroups.length,
      usergroups: usergroups,
    };

    try {
      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 User groups saved to ${filename}`);
    } catch (error) {
      console.error('Failed to save user groups to file:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const fetcher = new SlackUsergroupFetcher();
    
    // Fetch all user groups with users
    const allUsergroups = await fetcher.fetchAllUsergroupsWithUsers({
      includeCount: true,
      includeDisabled: true,
      includeUsers: false, // We'll fetch users separately
    });

    // Get statistics
    const stats = await fetcher.getUsergroupStats(allUsergroups);

    console.log('\n📊 User Group Statistics:');
    console.log(`   Total groups: ${stats.total}`);
    console.log(`   Active groups: ${stats.total - stats.disabled}`);
    console.log(`   Disabled groups: ${stats.disabled}`);
    console.log(`   External groups: ${stats.external}`);
    console.log(`   Auto-created groups: ${stats.autoGroups}`);
    console.log(`   Total members across groups: ${stats.totalMembers}`);

    // Display first 5 groups
    console.log('\n📋 First 5 user groups:');
    allUsergroups.slice(0, 5).forEach((group) => {
      console.log(fetcher.formatUsergroupForDisplay(group));
    });

    // Example: Get only active groups
    const activeGroups = fetcher.getGroupsByType(allUsergroups, 'active');
    console.log(`\n✅ Active groups: ${activeGroups.length}`);

    // Example: Search groups
    const searchResults = fetcher.searchUsergroups(allUsergroups, 'admin');
    console.log(`\n🔍 Groups matching "admin": ${searchResults.length}`);

    // Save to file
    await fetcher.saveUsergroupsToFile(allUsergroups, 'slack-usergroups.json');

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

