// src/index.ts
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import {
  SlackChannel,
  ConversationsListResponse,
  FetchChannelOptions,
  ChannelStats,
} from './types/slack.types';

dotenv.config();

export class SlackChannelFetcher {
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
   * Fetch all channels with pagination
   * Uses conversations.list API method [citation:9][citation:7]
   */
  async fetchAllChannels(options: FetchChannelOptions = {}): Promise<SlackChannel[]> {
    const {
      limit = 200,
      excludeArchived = false,
      types = 'public_channel,private_channel,mpim,im',
    } = options;

    const allChannels: SlackChannel[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    console.log('⏳ Starting to fetch channels...');
    console.log(`📋 Options: limit=${limit}, types=${types}, excludeArchived=${excludeArchived}`);

    try {
      do {
        const response = await this.client.conversations.list({
          limit: limit,
          cursor: cursor,
          types: types,
          exclude_archived: excludeArchived,
        }) as unknown as ConversationsListResponse;

        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
        }

        if (response.channels) {
          allChannels.push(...response.channels);
          pageCount++;
          
          console.log(
            `📄 Page ${pageCount}: Fetched ${response.channels.length} channels`
          );
        }

        cursor = response.response_metadata?.next_cursor;

      } while (cursor);

      console.log(`✅ Successfully fetched ${allChannels.length} channels`);
      return allChannels;

    } catch (error) {
      console.error('❌ Failed to fetch channels:', error);
      throw error;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(channels: SlackChannel[]): Promise<ChannelStats> {
    const stats: ChannelStats = {
      total: channels.length,
      public: 0,
      private: 0,
      archived: 0,
      shared: 0,
      mpim: 0,
      im: 0,
      memberCount: 0,
    };

    channels.forEach((channel) => {
      if (channel.is_archived) stats.archived++;
      if (channel.is_private) stats.private++;
      if (!channel.is_private && !channel.is_im && !channel.is_mpim) {
        stats.public++;
      }
      if (channel.is_shared) stats.shared++;
      if (channel.is_mpim) stats.mpim++;
      if (channel.is_im) stats.im++;
      if (channel.num_members) {
        stats.memberCount += channel.num_members;
      }
    });

    return stats;
  }

  /**
   * Get channels by type
   */
  getChannelsByType(channels: SlackChannel[], type: 'public' | 'private' | 'mpim' | 'im'): SlackChannel[] {
    switch (type) {
      case 'public':
        return channels.filter((c) => !c.is_private && !c.is_mpim && !c.is_im && !c.is_archived);
      case 'private':
        return channels.filter((c) => c.is_private && !c.is_archived);
      case 'mpim':
        return channels.filter((c) => c.is_mpim && !c.is_archived);
      case 'im':
        return channels.filter((c) => c.is_im && !c.is_archived);
      default:
        return [];
    }
  }

  /**
   * Search channels by name
   */
  searchChannels(channels: SlackChannel[], query: string): SlackChannel[] {
    const lowerQuery = query.toLowerCase();
    return channels.filter((channel) => {
      const name = (channel.name || channel.name_normalized || '').toLowerCase();
      return name.includes(lowerQuery);
    });
  }

  /**
   * Format channel for display
   */
  formatChannelForDisplay(channel: SlackChannel): string {
    const type = channel.is_private ? '🔒 Private' :
                 channel.is_mpim ? '👥 Group DM' :
                 channel.is_im ? '💬 DM' : '🌐 Public';
    const status = channel.is_archived ? ' [Archived]' : '';
    const members = channel.num_members ? ` (${channel.num_members} members)` : '';
    
    return `- ${type}: #${channel.name}${status}${members} (ID: ${channel.id})`;
  }

  /**
   * Save channels to JSON file
   */
  async saveChannelsToFile(channels: SlackChannel[], filename: string = 'channels.json'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const data = {
      fetchedAt: new Date().toISOString(),
      total: channels.length,
      channels: channels,
    };

    try {
      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 Channels saved to ${filename}`);
    } catch (error) {
      console.error('Failed to save channels to file:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const fetcher = new SlackChannelFetcher();
    
    // Fetch all channels
    const allChannels = await fetcher.fetchAllChannels({
      limit: 200,
      excludeArchived: false,
      types: 'public_channel,private_channel,mpim,im',
    });

    // Get statistics
    const stats = await fetcher.getChannelStats(allChannels);

    console.log('\n📊 Channel Statistics:');
    console.log(`   Total channels: ${stats.total}`);
    console.log(`   Public channels: ${stats.public}`);
    console.log(`   Private channels: ${stats.private}`);
    console.log(`   Group DMs: ${stats.mpim}`);
    console.log(`   Direct Messages: ${stats.im}`);
    console.log(`   Archived: ${stats.archived}`);
    console.log(`   Shared: ${stats.shared}`);
    console.log(`   Total members across channels: ${stats.memberCount}`);

    // Display first 5 channels
    console.log('\n📋 First 5 channels:');
    allChannels.slice(0, 5).forEach((channel) => {
      console.log(fetcher.formatChannelForDisplay(channel));
    });

    // Example: Get only public channels
    const publicChannels = fetcher.getChannelsByType(allChannels, 'public');
    console.log(`\n🌐 Public channels: ${publicChannels.length}`);

    // Example: Search channels
    const searchResults = fetcher.searchChannels(allChannels, 'general');
    console.log(`\n🔍 Channels matching "general": ${searchResults.length}`);

    // Save to file
    await fetcher.saveChannelsToFile(allChannels, 'slack-channels.json');

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
