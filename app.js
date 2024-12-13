require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const { WebClient } = require('@slack/web-api');
const matchingUtils = require('./utils');
const config = require('./config');

const app = express();
app.use(express.json());

// Test Slack connection on startup
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function testSlackConnection() {
    try {
        const auth = await slack.auth.test();
        console.log('✅ Successfully connected to Slack as:', auth.user);
        console.log('Bot ID:', auth.user_id);
        console.log('Team:', auth.team);
        
        // Check required scopes
        const requiredScopes = ['mpim:write', 'chat:write', 'im:write', 'users:read'];
        const missingScopes = requiredScopes.filter(scope => 
            !auth.response_metadata?.scopes?.includes(scope)
        );
        
        if (missingScopes.length > 0) {
            console.error('❌ Missing required scopes:', missingScopes);
            console.error('Please add these scopes in your Slack App settings at https://api.slack.com/apps');
            process.exit(1);
        } else {
            console.log('✅ All required scopes are present');
        }
    } catch (error) {
        console.error('❌ Failed to connect to Slack:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
        process.exit(1);
    }
}

// Store active matches and their status
const activeMatches = new Map();

// Create new matches and initiate conversations
async function initiateMatches() {
    try {
        console.log('🔄 Starting to generate matches...');
        const matches = matchingUtils.generateMatches();
        
        if (matches.length === 0) {
            console.log('⚠️ No matches generated - not enough employees available');
            return;
        }
        
        console.log(`✨ Generated ${matches.length} matches`);
        
        for (const match of matches) {
            try {
                console.log(`👥 Creating group DM for: ${match.pair.map(p => p.name).join(' and ')}`);
                const channelId = await matchingUtils.createGroupDM(match);
                console.log(`✅ Created group DM with channel ID: ${channelId}`);
                activeMatches.set(channelId, {
                    ...match,
                    channelId,
                    lastChecked: Date.now()
                });
            } catch (error) {
                console.error(`❌ Error creating group DM for match:`, match, error);
            }
        }
    } catch (error) {
        console.error('❌ Error in initiateMatches:', error);
        throw error;
    }
}

// Check and send follow-ups for active matches
async function checkAndFollowUp() {
    const now = Date.now();
    console.log(`Checking follow-ups for ${activeMatches.size} active matches`);

    for (const [channelId, match] of activeMatches.entries()) {
        try {
            const timeSinceStart = now - match.timestamp;

            // Initial follow-up after 2 days
            if (timeSinceStart >= config.timing.initialFollowUp && match.status === 'pending') {
                console.log(`Checking initial follow-up for channel ${channelId}`);
                const hasResponse = await matchingUtils.checkForResponse(channelId, match.timestamp / 1000);
                if (!hasResponse) {
                    await matchingUtils.sendFollowUp(channelId, 'followUp');
                    match.status = 'followed_up';
                    console.log(`Sent initial follow-up to channel ${channelId}`);
                }
            }

            // Check if meeting is scheduled after 1 week
            if (timeSinceStart >= config.timing.meetingScheduledCheck && match.status !== 'scheduled') {
                console.log(`Sending schedule check to channel ${channelId}`);
                await matchingUtils.sendFollowUp(channelId, 'scheduleCheck');
                match.status = 'schedule_checked';
            }

            // Check if meeting is completed after 2 weeks
            if (timeSinceStart >= config.timing.meetingCompletionCheck && match.status !== 'completed') {
                console.log(`Sending completion check to channel ${channelId}`);
                await matchingUtils.sendFollowUp(channelId, 'completionCheck');
                match.status = 'completion_checked';
            }

            // Update the match in our storage
            activeMatches.set(channelId, match);
        } catch (error) {
            console.error(`Error processing follow-up for channel ${channelId}:`, error);
        }
    }
}

// Schedule weekly matches (Monday at 9 AM)
try {
    cron.schedule('0 9 * * 1', () => {
        console.log('Initiating weekly matches...');
        initiateMatches().catch(error => {
            console.error('Error in weekly matches cron job:', error);
        });
    });

    // Check for follow-ups every 6 hours
    cron.schedule('0 */6 * * *', () => {
        console.log('Checking for follow-ups...');
        checkAndFollowUp().catch(error => {
            console.error('Error in follow-up cron job:', error);
        });
    });
} catch (error) {
    console.error('Error setting up cron jobs:', error);
}

// Endpoint to manually trigger matches
app.post('/api/trigger-matches', async (req, res) => {
    try {
        console.log('🎯 Manually triggering matches...');
        await initiateMatches();
        res.json({
            success: true, 
            message: 'Matches initiated successfully'
        });
    } catch (error) {
        console.error('❌ Error in trigger-matches endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate matches',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        activeMatches: activeMatches.size,
        uptime: process.uptime(),
        slackConnected: slack ? true : false
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
    await testSlackConnection();
}); 