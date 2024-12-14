import dotenv from 'dotenv';
import { createClient } from '@vercel/edge-config';
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';

// Make Headers and fetch available globally
global.Headers = Headers;
global.fetch = fetch;

// Load environment variables
dotenv.config();

const edgeConfig = createClient(process.env.EDGE_CONFIG);

async function testEdgeConfig() {
  try {
    console.log('Testing Edge Config connection...');
    
    console.log('EDGE_CONFIG value:', process.env.EDGE_CONFIG);
    
    // Test: Read employees
    console.log('\nTesting: Reading employees from Edge Config...');
    const employees = await edgeConfig.get('employees');
    console.log('Raw response:', employees);
    
    if (!employees) {
      throw new Error('No employees found in Edge Config');
    }
    
    console.log('\nRetrieved employees:', JSON.stringify(employees, null, 2));
    console.log(`\nFound ${employees.length} employees in the database`);
    console.log('✅ Read successful');
    
    console.log('\nAll tests passed! ✅');
  } catch (error) {
    console.error('\n❌ Error testing Edge Config:', error);
    process.exit(1);
  }
}

// Run the tests
testEdgeConfig(); 