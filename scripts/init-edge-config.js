import 'dotenv/config';
import fetch from 'node-fetch';

async function initializeEdgeConfig() {
  if (!process.env.EDGE_CONFIG || !process.env.VERCEL_API_TOKEN) {
    console.error('❌ Missing required environment variables. Please set:');
    console.error('   - EDGE_CONFIG (Edge Config URL from Vercel)');
    console.error('   - VERCEL_API_TOKEN (API token from Vercel)');
    process.exit(1);
  }

  // Extract Edge Config ID from the URL
  const EDGE_CONFIG_URL = process.env.EDGE_CONFIG;
  const EDGE_CONFIG_ID = EDGE_CONFIG_URL.match(/ecfg_[a-zA-Z0-9]+/)?.[0];
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

  if (!EDGE_CONFIG_ID) {
    console.error('❌ Invalid Edge Config URL. Unable to extract config ID');
    process.exit(1);
  }

  console.log('Initializing Edge Config with ID:', EDGE_CONFIG_ID);

  async function set(key, value) {
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key,
            value
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set Edge Config: ${response.statusText}\n${errorText}`);
    }

    return response.json();
  }

  try {
    await set('matches', []);
    await set('previousMatches', []);
    console.log('✅ Edge Config initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Edge Config:', error);
    process.exit(1);
  }
}

initializeEdgeConfig(); 