const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { readJson, writeJson, VECTORS_FILE, CHATS_FILE, USERS_FILE } = require('./utils/storage');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const API_KEY = 'AIzaSyATu5tyd5lMp-3FPzCgBmdSWgIuyUSAx2M';
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

// --- Helpers ---

// Calculate Cosine Similarity
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// Generate Embedding for a text
const getEmbedding = async (text) => {
  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${GEMINI_EMBED_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Embedding API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
};

// --- Endpoints ---

// 1. Embed Document (Admin/Setup)
app.post('/api/embed', async (req, res) => {
  try {
    const { documents } = req.body; // Array of { id, text, metadata }
    
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents array is required' });
    }

    const vectors = readJson(VECTORS_FILE, []);
    let addedCount = 0;

    for (const doc of documents) {
      // Check if already exists (simple check by ID)
      // if (vectors.find(v => v.id === doc.id)) continue;

      const embedding = await getEmbedding(doc.text);
      
      // Save document even if embedding fails (fallback to keyword search)
      vectors.push({
        id: doc.id || Date.now().toString(),
        text: doc.text,
        metadata: doc.metadata || {},
        embedding: embedding || null
      });
      addedCount++;
    }

    writeJson(VECTORS_FILE, vectors);
    res.json({ message: `Successfully embedded ${addedCount} documents.` });
  } catch (error) {
    console.error('Error in /api/embed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. User Profile Management & Authentication

// Helper to generate simple token (mock)
const generateToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = readJson(USERS_FILE, {});
    
    // Check if username already exists
    const existingUser = Object.values(users).find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const userId = 'user_' + Date.now();
    const newUser = {
      id: userId,
      username,
      password, // In a real app, HASH this!
      name: name || username,
      visits: 0,
      preferences: {},
      createdAt: Date.now()
    };

    users[userId] = newUser;
    writeJson(USERS_FILE, users);

    res.json({ 
      userId: newUser.id, 
      name: newUser.name,
      token: generateToken() 
    });

  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = readJson(USERS_FILE, {});
    
    // Find user by username
    const user = Object.values(users).find(u => u.username === username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      userId: user.id, 
      name: user.name,
      token: generateToken() 
    });

  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const users = readJson(USERS_FILE, {});
    const userProfile = users[userId] || { id: userId, visits: 0, preferences: {} };
    res.json(userProfile);
  } catch (error) {
    console.error('Error in GET /api/user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/user', (req, res) => {
  try {
    const { userId, profile } = req.body;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });
    
    const users = readJson(USERS_FILE, {});
    // Merge existing profile with updates
    users[userId] = { 
      ...users[userId], 
      ...profile, 
      id: userId,
      lastSeen: Date.now() 
    };
    
    writeJson(USERS_FILE, users);
    res.json(users[userId]);
  } catch (error) {
    console.error('Error in POST /api/user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Chat with RAG & Memory
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, history } = req.body;
    
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const user = userId || 'anonymous';

    // Get User Profile
    const users = readJson(USERS_FILE, {});
    const userProfile = users[user] || { name: 'Friend' };
    const userName = userProfile.name || 'Friend';

    // A. RAG: Retrieve relevant context
    const queryEmbedding = await getEmbedding(message);
    let contextText = "";
    const vectors = readJson(VECTORS_FILE, []);
    let topDocs = [];
    
    if (queryEmbedding) {
      // Calculate similarity
      const scoredDocs = vectors
        .filter(v => v.embedding) // Only use docs with embeddings
        .map(vec => ({
          ...vec,
          score: cosineSimilarity(queryEmbedding, vec.embedding)
        }));
      
      // Sort and take top 3
      scoredDocs.sort((a, b) => b.score - a.score);
      topDocs = scoredDocs.slice(0, 3).filter(d => d.score > 0.5); // Threshold
    }
    
    // Fallback: Keyword Search (if vector search failed or returned nothing)
    if (topDocs.length === 0) {
      console.log("Vector search yielded no results or failed. Using keyword search.");
      const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      const scoredDocs = vectors.map(vec => {
        const textLower = vec.text.toLowerCase();
        let score = 0;
        keywords.forEach(word => {
          if (textLower.includes(word)) score += 1;
        });
        return { ...vec, score };
      });
      
      scoredDocs.sort((a, b) => b.score - a.score);
      topDocs = scoredDocs.slice(0, 3).filter(d => d.score > 0);
    }
      
    if (topDocs.length > 0) {
      contextText = "Here is some relevant information from the website knowledge base:\n" + 
        topDocs.map(d => `- ${d.text}`).join('\n');
    }

    // B. Memory: Load/Save Chat History
    const allChats = readJson(CHATS_FILE, {});
    if (!allChats[user]) allChats[user] = [];
    
    // Construct Prompt
    const recentHistory = allChats[user].slice(-10); // Last 10 exchanges
    
    const systemPrompt = `
      You are a helpful, cute, and witty AI Assistant living on a website.
      Your personality is fun and slightly quirky. You love helping people!
      The user's name is ${userName}.

      **Operational Guidance & Tools:**
      You have access to the following tools to control the website interface. 
      Output the command on a separate line.

      1. **Highlight Element:**
         If the user asks where to find something, use:
         \`highlight: <css_selector>\`
         
         Examples:
         - "Where is search?" -> "Right here! \n highlight: .search-bar"
         - "Show me login." -> "Click this button. \n highlight: #login-btn"

      2. **Navigation:**
         If the user asks to go to a specific page (Home, Pricing, Contact, etc.), use:
         \`navigate: <url_path>\`
         
         Examples:
         - "Go home" -> "On my way! \n navigate: /"
         - "Take me to pricing" -> "Let's check the prices. \n navigate: /pricing"

      3. **Click Element:**
         If the user asks to click something or perform an action, use:
         \`click: <css_selector>\`
         
         Examples:
         - "Click the login button" -> "Clicking it now! \n click: #login-btn"
         - "Select the first option" -> "Done. \n click: .option:first-child"

      4. **Task Plan (Multi-step):**
         If the user asks for a complex task (e.g., "Help me login", "Go to settings and change name"), return a JSON plan on a new line.
         Format:
         plan: [{"type": "navigate", "target": "/path"}, {"type": "highlight", "target": ".selector"}, {"type": "click", "target": ".selector"}, {"type": "input", "target": ".selector", "value": "text"}]

         Valid types: "navigate", "highlight", "click", "input", "wait".

      (Note: Use standard CSS selectors like #id, .class. Guess if unsure.)

      ${contextText ? `\nContext Information:\n${contextText}\n` : ''}
      
      Use the context above to answer the user's question if relevant. 
      If the context doesn't help, answer from your general knowledge but mention you aren't sure about specific website details.
    `;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...recentHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Call Gemini
    let reply = "";
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for generation

        const response = await fetch(`${GEMINI_GENERATE_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm speechless!";
    } catch (apiError) {
        console.error("Gemini API Failed:", apiError.message);
        reply = "I'm having trouble reaching my brain (Google API) right now. 🧠\n\nBut I can still remember our chat! (Offline Mode)";
        
        // Mock response based on keyword for testing RAG fallback
        if (contextText) {
             reply += "\n\nI found this in the docs though:\n" + contextText.substring(0, 200) + "...";
        }
    }

    // Save to Memory
    allChats[user].push({ role: 'user', text: message, timestamp: Date.now() });
    allChats[user].push({ role: 'agent', text: reply, timestamp: Date.now() });
    writeJson(CHATS_FILE, allChats);

    res.json({ reply });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Keep the old endpoint for backward compatibility (or testing)
app.post('/api/generate', async (req, res) => {
   // ... (Keep existing implementation if needed, or redirect)
   res.status(404).json({ error: 'Deprecated. Use /api/chat' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
