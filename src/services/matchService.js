import edgeConfig from '../config/vercel';

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
}

export default new MatchService(); 