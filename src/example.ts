// src/example.ts
import { SlackUserFetcher } from './index';
import { UserUtils } from './utils/user-utils';
import dotenv from 'dotenv';

dotenv.config();

async function example() {
  const fetcher = new SlackUserFetcher();
  
  // Fetch all users
  const users = await fetcher.fetchAllUsers({
    limit: 200,
    includeDeleted: false,
    includeBotUsers: true,
  });

  console.log('\n📊 User Analysis:');
  
  // Get active users
  const activeUsers = UserUtils.getActiveUsers(users);
  console.log(`Active users: ${activeUsers.length}`);
  
  // Get admins
  const admins = UserUtils.getUsersByRole(users, 'admin');
  console.log(`Admins: ${admins.map(u => u.profile?.real_name || u.name).join(', ')}`);
  
  // Search for specific users
  const searchResults = UserUtils.searchUsers(users, 'john');
  console.log(`\n🔍 Users matching "john": ${searchResults.length}`);
  
  // Get email domains
  const domains = UserUtils.getEmailDomains(users);
  console.log(`\n📧 Email domains: ${domains.join(', ')}`);
  
  // Generate report
  console.log('\n📋 Report:');
  console.log(UserUtils.generateUserReport(users));
}

example().catch(console.error);