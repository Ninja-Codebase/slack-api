// src/utils/user-utils.ts
import { SlackUser } from '../types/slack.types';

export class UserUtils {
  /**
   * Filter users by active status
   */
  static getActiveUsers(users: SlackUser[]): SlackUser[] {
    return users.filter((user) => !user.deleted && !user.is_bot);
  }

  /**
   * Filter users by role
   */
  static getUsersByRole(users: SlackUser[], role: 'admin' | 'owner' | 'member'): SlackUser[] {
    switch (role) {
      case 'admin':
        return users.filter((user) => user.is_admin);
      case 'owner':
        return users.filter((user) => user.is_owner);
      case 'member':
        return users.filter(
          (user) => !user.is_admin && !user.is_owner && !user.is_bot && !user.deleted
        );
      default:
        return [];
    }
  }

  /**
   * Group users by team
   */
  static groupUsersByTeam(users: SlackUser[]): Map<string, SlackUser[]> {
    const teamMap = new Map<string, SlackUser[]>();
    
    users.forEach((user) => {
      if (user.team_id) {
        if (!teamMap.has(user.team_id)) {
          teamMap.set(user.team_id, []);
        }
        teamMap.get(user.team_id)!.push(user);
      }
    });
    
    return teamMap;
  }

  /**
   * Search users by name or email
   */
  static searchUsers(users: SlackUser[], query: string): SlackUser[] {
    const lowerQuery = query.toLowerCase();
    
    return users.filter((user) => {
      const name = (user.profile?.real_name || user.real_name || user.name || '').toLowerCase();
      const email = (user.profile?.email || '').toLowerCase();
      const displayName = (user.profile?.display_name || '').toLowerCase();
      
      return name.includes(lowerQuery) || 
             email.includes(lowerQuery) || 
             displayName.includes(lowerQuery);
    });
  }

  /**
   * Get unique email domains from users
   */
  static getEmailDomains(users: SlackUser[]): string[] {
    const domains = new Set<string>();
    
    users.forEach((user) => {
      if (user.profile?.email) {
        const domain = user.profile.email.split('@')[1];
        if (domain) {
          domains.add(domain);
        }
      }
    });
    
    return Array.from(domains);
  }

  /**
   * Generate user report
   */
  static generateUserReport(users: SlackUser[]): string {
    const total = users.length;
    const active = UserUtils.getActiveUsers(users).length;
    const admins = UserUtils.getUsersByRole(users, 'admin').length;
    const owners = UserUtils.getUsersByRole(users, 'owner').length;
    const bots = users.filter((u) => u.is_bot).length;
    const deleted = users.filter((u) => u.deleted).length;
    
    return `
Slack Workspace User Report
============================
Total Users: ${total}
Active Users: ${active}
Admins: ${admins}
Owners: ${owners}
Bots: ${bots}
Deleted: ${deleted}
Active Rate: ${((active / total) * 100).toFixed(1)}%
    `.trim();
  }
}