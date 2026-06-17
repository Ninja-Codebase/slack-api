// src/config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

export interface SlackConfig {
  token: string;
  apiUrl?: string;
  timeout?: number;
}

export function getConfig(): SlackConfig {
  const token = process.env.SLACK_TOKEN || process.env.SLACK_BOT_TOKEN;
  
  if (!token) {
    throw new Error(
      'SLACK_TOKEN or SLACK_BOT_TOKEN environment variable is required\n' +
      'Please create a .env file with your Slack token'
    );
  }

  return {
    token,
    apiUrl: process.env.SLACK_API_URL || 'https://slack.com/api',
    timeout: parseInt(process.env.SLACK_TIMEOUT || '30000', 10),
  };
}