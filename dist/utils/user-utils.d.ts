import { SlackUser } from '../types/slack.types';
export declare class UserUtils {
    /**
     * Filter users by active status
     */
    static getActiveUsers(users: SlackUser[]): SlackUser[];
    /**
     * Filter users by role
     */
    static getUsersByRole(users: SlackUser[], role: 'admin' | 'owner' | 'member'): SlackUser[];
    /**
     * Group users by team
     */
    static groupUsersByTeam(users: SlackUser[]): Map<string, SlackUser[]>;
    /**
     * Search users by name or email
     */
    static searchUsers(users: SlackUser[], query: string): SlackUser[];
    /**
     * Get unique email domains from users
     */
    static getEmailDomains(users: SlackUser[]): string[];
    /**
     * Generate user report
     */
    static generateUserReport(users: SlackUser[]): string;
}
//# sourceMappingURL=user-utils.d.ts.map