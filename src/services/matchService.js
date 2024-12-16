import { edgeConfig } from '../../src/config/vercel.js';
import config from '../../config.js';

class MatchService {
  async createMatch(match) {
    const matches = await this.getAllMatches();
    matches.push({
      ...match,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    await edgeConfig.set('matches', matches);
    return match;
  }

  async getAllMatches() {
    const matches = await edgeConfig.get('matches') || [];
    return matches;
  }

  async getActiveMatches() {
    const matches = await this.getAllMatches();
    return matches.filter(match => match.status !== 'completed');
  }

  async updateMatch(channelId, updates) {
    const matches = await this.getAllMatches();
    const index = matches.findIndex(m => m.channelId === channelId);
    
    if (index !== -1) {
      matches[index] = { ...matches[index], ...updates };
      await edgeConfig.set('matches', matches);
      return matches[index];
    }
    return null;
  }

  async getPreviousMatches() {
    const matches = await edgeConfig.get('previousMatches') || [];
    return matches;
  }

  async addToPreviousMatches(pair) {
    const previousMatches = await this.getPreviousMatches();
    previousMatches.push({
      pair: [pair[0].id, pair[1].id],
      timestamp: Date.now()
    });
    await edgeConfig.set('previousMatches', previousMatches);
  }

  async cleanupExpiredMatches() {
    try {
        const previousMatches = await this.getPreviousMatches();
        const now = Date.now();
        
        console.log(`Starting cleanup of ${previousMatches.length} previous matches`);
        
        const validMatches = previousMatches.filter(match => {
            const isValid = now - match.timestamp < config.timing.matchExpiration;
            if (!isValid) {
                console.log(`Match expired: ${JSON.stringify(match)}`);
            }
            return isValid;
        });
        
        await edgeConfig.set('previousMatches', validMatches);
        const removedCount = previousMatches.length - validMatches.length;
        console.log(`Cleanup complete. Removed ${removedCount} expired matches`);
        
        return removedCount;
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
  }
}

export default new MatchService(); 