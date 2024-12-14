import dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
import { createClient } from '@vercel/edge-config';
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';

// Make fetch and Headers available globally
global.Headers = Headers;
global.fetch = fetch;

dotenv.config();

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const edgeConfig = createClient(process.env.EDGE_CONFIG);

async function testMatchingAndDM() {
  try {
    console.log('🔄 Testing matching and DM creation...');

    // 1. Get employees from Edge Config
    const employees = await edgeConfig.get('employees');
    console.log('📋 Found employees:', employees);

    if (!employees || employees.length < 2) {
      throw new Error('Need at least 2 employees for testing');
    }

    // 2. Create a test match
    const testMatch = {
      pair: [employees[0], employees[1]],
      status: 'pending',
      timestamp: Date.now()
    };

    console.log('👥 Creating test match:', testMatch);

    // 3. Create group DM
    const users = testMatch.pair.map(p => p.id).join(',');
    const conversation = await slack.conversations.open({
      users: users,
      return_im: false
    });

    if (!conversation.ok) {
      throw new Error('Failed to create conversation');
    }

    const channelId = conversation.channel.id;
    console.log('✅ Created group DM with channel ID:', channelId);

    // 4. Send test message
    const message = await slack.chat.postMessage({
      channel: channelId,
      text: "🧪 This is a test message for the coffee chat matching system. You can ignore this message."
    });

    console.log('✅ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testMatchingAndDM(); 