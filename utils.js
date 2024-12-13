const { WebClient } = require('@slack/web-api');
const config = require('./config');

class MatchingUtils {
    constructor() {
        this.slack = new WebClient(config.SLACK_BOT_TOKEN);
        this.activeMatches = new Map();
    }

    // Generate random pairs from the employee list
    generateMatches() {
        const available = [...config.employees];
        const matches = [];
        
        while (available.length >= 2) {
            const index1 = Math.floor(Math.random() * available.length);
            const person1 = available.splice(index1, 1)[0];
            
            const index2 = Math.floor(Math.random() * available.length);
            const person2 = available.splice(index2, 1)[0];
            
            matches.push({
                pair: [person1, person2],
                status: 'pending',
                timestamp: Date.now()
            });
        }

        console.log('Generated matches:', JSON.stringify(matches, null, 2));
        return matches;
    }

    // Create a Slack group DM with the matched pair
    async createGroupDM(match) {
        try {
            console.log('Creating group DM for match:', JSON.stringify(match, null, 2));
            const users = match.pair.map(p => p.id).join(',');
            console.log('Opening conversation with users:', users);
            
            const conversation = await this.slack.conversations.open({
                users: users,
                return_im: false
            });

            console.log('Conversation response:', JSON.stringify(conversation, null, 2));

            if (conversation.ok) {
                const channel = conversation.channel.id;
                console.log('Sending initial message to channel:', channel);
                
                const messageResponse = await this.slack.chat.postMessage({
                    channel: channel,
                    text: config.messages.initial
                });

                console.log('Message response:', JSON.stringify(messageResponse, null, 2));

                this.activeMatches.set(channel, {
                    ...match,
                    channelId: channel
                });

                return channel;
            } else {
                throw new Error(`Conversation not ok: ${JSON.stringify(conversation)}`);
            }
        } catch (error) {
            console.error('Detailed error in createGroupDM:', {
                error: error.message,
                data: error.data,
                stack: error.stack
            });
            throw error;
        }
    }

    // Send follow-up messages
    async sendFollowUp(channelId, messageType) {
        try {
            let message;
            switch (messageType) {
                case 'followUp':
                    message = config.messages.followUp;
                    break;
                case 'scheduleCheck':
                    message = config.messages.scheduleCheck;
                    break;
                case 'completionCheck':
                    message = config.messages.completionCheck;
                    break;
                default:
                    message = config.messages.followUp;
            }

            await this.slack.chat.postMessage({
                channel: channelId,
                text: message
            });
        } catch (error) {
            console.error('Error sending follow-up:', error);
            throw error;
        }
    }

    // Check message history to see if there's been a response
    async checkForResponse(channelId, since) {
        try {
            const history = await this.slack.conversations.history({
                channel: channelId,
                oldest: since
            });

            return history.messages.some(msg => 
                !msg.bot_id && msg.text && msg.text.toLowerCase().includes('yes')
            );
        } catch (error) {
            console.error('Error checking message history:', error);
            throw error;
        }
    }
}

module.exports = new MatchingUtils(); 