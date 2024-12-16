import dotenv from 'dotenv';
import { createClient } from '@vercel/edge-config';
dotenv.config();

const EDGE_CONFIG_URL = process.env.EDGE_CONFIG;
const EDGE_CONFIG_ID = EDGE_CONFIG_URL.match(/ecfg_[a-zA-Z0-9]+/)?.[0];
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

export const edgeConfig = {
  async get(key) {
    const client = createClient(process.env.EDGE_CONFIG);
    return client.get(key);
  },

  async set(key, value) {
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
}; 