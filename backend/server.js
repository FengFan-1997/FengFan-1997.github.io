const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const API_KEY = 'AIzaSyATu5tyd5lMp-3FPzCgBmdSWgIuyUSAx2M';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const promptBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `API Error: ${response.status} - ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
