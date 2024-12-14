require('dotenv').config();
const { createClient } = require('@vercel/edge-config');

async function initializeEdgeConfig() {
  const edgeConfig = createClient(process.env.EDGE_CONFIG);

  try {
    // Initialize with empty matches array
    await edgeConfig.set('matches', []);
    console.log('✅ Edge Config initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Edge Config:', error);
  }
}

initializeEdgeConfig(); 