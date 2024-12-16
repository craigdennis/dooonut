const config = {
    // List of employees with their Slack user IDs
    employees: [
        // Add your employees here in the format:
        // { id: 'U12345678', name: 'John Doe' },
        { id: 'U03K1C2RML6', name: 'Craig Dennis' },
        { id: 'U03JEPTK84T', name: 'Alex King' },
    ],
    
    // Timing configurations (in milliseconds)
    timing: {
        initialFollowUp: 2 * 24 * 60 * 60 * 1000, // 2 days
        meetingScheduledCheck: 7 * 24 * 60 * 60 * 1000, // 1 week
        meetingCompletionCheck: 14 * 24 * 60 * 60 * 1000, // 2 weeks
        matchExpiration: 180 * 24 * 60 * 60 * 1000, // 6 months in milliseconds
    },

    // Messages
    messages: {
        initial: "Hello! 👋 You've been matched for a coffee chat! Please find a time that works for both of you in the next week.",
        followUp: "Hey there! 👋 Just checking in - have you managed to set a date for your coffee chat?",
        scheduleCheck: "Hi! Have you scheduled your coffee chat? Let me know! 📅",
        completionCheck: "Hope you had a great chat! Did you complete your coffee meeting? Please let me know! ☕"
    },

    // Slack Bot Token (to be set via environment variable)
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN
};

export default config; 