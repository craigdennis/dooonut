import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import matchService from '../services/matchService.js';
import { edgeConfig } from '../config/edge-config.js';

// Make fetch and Headers available globally
global.Headers = Headers;
global.fetch = fetch;

dotenv.config();

async function testMatchStorage() {
    try {
        console.log('🧪 Testing match storage in Edge Config...');

        // 1. Get initial state
        const initialMatches = await edgeConfig.get('previousMatches');
        console.log(`Initial matches count: ${initialMatches?.length || 0}`);

        // 2. Create a test match
        const testPair = [
            { id: 'TEST_USER_1', name: 'Test User 1' },
            { id: 'TEST_USER_2', name: 'Test User 2' }
        ];

        // 3. Add to previous matches
        console.log('Storing match:', testPair);
        await matchService.addToPreviousMatches(testPair);
        console.log('✅ Added test match to database');

        // 4. Verify storage with null check
        const updatedMatches = await edgeConfig.get('previousMatches');
        console.log('Retrieved matches:', updatedMatches);

        if (!updatedMatches || !updatedMatches.length) {
            throw new Error('Failed to retrieve matches from Edge Config');
        }

        const lastMatch = updatedMatches[updatedMatches.length - 1];
        console.log('Latest stored match:', JSON.stringify(lastMatch, null, 2));

        if (!lastMatch) {
            throw new Error('Failed to retrieve last match from Edge Config');
        }

        // 5. Verify match data
        const isMatchValid = 
            lastMatch.pair[0] === 'TEST_USER_1' && 
            lastMatch.pair[1] === 'TEST_USER_2' &&
            lastMatch.timestamp;

        if (!isMatchValid) {
            throw new Error('Stored match data does not match test data');
        }

        // 6. Clean up test data
        const cleanMatches = updatedMatches.filter(match => 
            match.pair[0] !== 'TEST_USER_1' && match.pair[1] !== 'TEST_USER_2'
        );
        await edgeConfig.set('previousMatches', cleanMatches);
        console.log('🧹 Cleaned up test data');

        console.log('✅ Match storage test completed successfully!');
    } catch (error) {
        console.error('❌ Match storage test failed:', error);
        throw error;
    }
}

testMatchStorage(); 