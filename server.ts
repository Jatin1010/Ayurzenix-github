import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import OpenAI from 'openai';

dotenv.config();

export const app = express();

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function setupApp() {
  app.use(express.json());

  // OpenAI Endpoint
  app.post('/api/openai/chat', async (req, res) => {
    try {
      const { messages, model = 'gpt-4o' } = req.body;
      const openai = getOpenAI();
      
      const completion = await openai.chat.completions.create({
        model,
        messages,
      });

      res.json(completion);
    } catch (error: any) {
      console.error('OpenAI Error:', error.message);
      res.status(500).json({ error: error.message || 'Failed to call OpenAI API' });
    }
  });

  // Instamojo Configuration
  const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY || 'ca69899ef7d6e2cc8590253fe6e8dea7';
  const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN || '98fba9336675322b844177f7eb28ff77';
  const INSTAMOJO_URL = (process.env.INSTAMOJO_URL || 'https://api.instamojo.com/v1.1').replace(/\/$/, '');

  // API Routes
  app.post('/api/instamojo/pay', async (req, res) => {
    try {
      const { amount, userId, email, name } = req.body;
      
      const params = new URLSearchParams();
      params.append('amount', Number(amount).toFixed(2));
      params.append('purpose', 'Ayurzenix Wallet Recharge');
      params.append('buyer_name', name || 'User');
      params.append('email', email || 'test@example.com');
      params.append('phone', '9999999999'); // Phone is often required by Instamojo
      params.append('redirect_url', `${req.headers.origin}/wallet`);
      params.append('allow_repeated_payments', 'false');
      params.append('send_email', 'false');
      params.append('send_sms', 'false');

      console.log('Initiating Instamojo Payment:', { amount, userId, email });

      const response = await axios.post(`${INSTAMOJO_URL}/payment-requests/`, params, {
        headers: {
          'X-Api-Key': INSTAMOJO_API_KEY,
          'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Instamojo API Response:', response.status, typeof response.data);

      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Instamojo API returned an HTML error page. Please check your credentials and API URL.');
      }

      if (response.data.success) {
        res.json({ url: response.data.payment_request.longurl });
      } else {
        throw new Error(response.data.message || 'Instamojo payment initiation failed');
      }
    } catch (error: any) {
      console.error('Instamojo Pay Error:', error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data?.message || 'Failed to initiate Instamojo payment' });
    }
  });

  // Verify Payment Status
  app.get('/api/instamojo/status/:paymentId', async (req, res) => {
    try {
      const { paymentId } = req.params;
      const response = await axios.get(`${INSTAMOJO_URL}/payments/${paymentId}/`, {
        headers: {
          'X-Api-Key': INSTAMOJO_API_KEY,
          'X-Auth-Token': INSTAMOJO_AUTH_TOKEN
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Instamojo Status Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to check payment status' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.NETLIFY) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
  setupApp().then(() => {
    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
