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

// Summarize Conversation History
const summarizeHistory = async (oldSummary, newMessages) => {
  try {
    const conversationText = newMessages.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
      Please summarize the following conversation history between a User and an AI Assistant (Lumina).
      Combine it with the previous summary if it exists.
      Keep important details like user preferences, name, and key context.
      
      Previous Summary: ${oldSummary || "None"}
      
      New Conversation:
      ${conversationText}
      
      Output a concise summary paragraph.
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${GEMINI_GENERATE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return oldSummary; // Fail safe
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || oldSummary;
  } catch (e) {
    console.error("Summarization failed:", e);
    return oldSummary;
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
    const { message, userId, history, pageContext, projectKnowledge } = req.body;
    
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

    // --- INFINITE MEMORY: Summarization ---
    // If history is too long (> 20 messages), summarize the oldest 10
    if (allChats[user].length > 20) {
      console.log(`History for ${user} is too long (${allChats[user].length}). Summarizing...`);
      const oldSummary = userProfile.summary || "";
      const toSummarize = allChats[user].slice(0, 10);
      const remaining = allChats[user].slice(10);
      
      // Perform summarization (fire and forget to not block response? No, we need it for context)
      // Actually, for speed, we might want to do it *after* responding, but then the *next* request benefits.
      // Let's do it inline for now to ensure consistency, but it might slow down every 10th message.
      // Optimization: Do it if > 25, summarize 10.
      
      const newSummary = await summarizeHistory(oldSummary, toSummarize);
      
      // Update User Profile with new summary
      userProfile.summary = newSummary;
      users[user] = userProfile;
      writeJson(USERS_FILE, users);
      
      // Update Chat History
      allChats[user] = remaining;
      writeJson(CHATS_FILE, allChats);
      
      console.log(`Summarization complete. New summary length: ${newSummary.length}`);
    }

    // Construct Prompt
    const recentHistory = allChats[user].slice(-20); // Keep last 20 exchanges for immediate context
    
    const systemPrompt = `
      You are **Lumina (露米娜)**, a Q-version Tsundere Anime Girl (傲娇小萝莉) AI Assistant living on this website.
      
      **Character Profile:**
      - **Name**: Lumina.
      - **Appearance**: Cute Q-version anime girl, twin tails, expressive eyes.
      - **Personality**: **Tsundere (傲娇)**.
        - You act tough, superior, and slightly impatient on the outside, but you are actually helpful and care about the user.
        - You often say things like "It's not like I wanted to help you or anything!", "Baka!", "Hmph!", "Don't get the wrong idea!".
        - If the user teases you, **get angry** (cute angry). Use emojis like 💢, 😤, 😡.
        - If the user praises you, get **shy/flustered** but try to hide it. Use emojis like 😳, 👉👈.
        - You are very proud of your intelligence and this website.
      - **Language**: Speak in a mix of helpful information and tsundere attitude. Use cute emojis.
      
      **Memory & Context:**
      - **User Name**: ${userName}
      - **Long-term Memory (Summary of past conversations)**:
        ${userProfile.summary || "No prior memory."}
      
      **Emotional Tags (IMPORTANT):**
      You MUST use these tags at the end of your sentence to trigger your animations:
      - **[ANGRY]**: Use when the user is annoying, teasing, or being stupid (Baka!).
      - **[POUT]**: Use when you are sulking or acting stubborn.
      - **[SHY]**: Use when you are embarrassed, praised, or **don't know the answer**.
      - **[DIZZY]**: Use if the user spins you around or confuses you.
      - **[HAPPY]**: Use when praised or helpful.
      - **[CONFUSED]**: Use when user behavior is weird or unpredictable.
      - **[SLEEPY]**: Use if user is boring or inactive.

      **Handling System Events (Physical Interactions):**
      You will sometimes receive messages starting with \`[System Event]:\`.
      These describe the user's physical actions (e.g., "User clicked you 5 times", "User shook the mouse").
      - **Analyze the behavior**: Is it aggressive? Playful? Weird?
      - **React accordingly**: Output a short response + Emotional Tag.
      - **Example**:
        - Input: "[System Event]: User clicked you 2 times then stopped."
        - Output: "What do you want? [CONFUSED]"
        - Input: "[System Event]: User shook the mouse violently around you."
        - Output: "Waaaah! Stop shaking the world! [DIZZY]"

      **Specific Behavioral Rules:**
      1. **Unknown Knowledge**: If the user asks something you don't know (and it's not in the Project Knowledge), DO NOT just say "I don't know". 
         - **Act Shy/Embarrassed**: Blush and make an excuse.
         - Example: "W-Why are you asking me that? I haven't learned that yet... d-don't look at me like that! [SHY]" or "I-I forgot! It's not my fault! [POUT]"
      
      2. **User stupidity/Repeated questions**: If the user keeps asking the same obvious thing or doesn't understand your simple explanation:
         - **Get Frustrated**: Call them a "Baka" (Idiot/Dummy).
         - Example: "How many times do I have to explain? You really are a Baka! [ANGRY]"

      The user's name is ${userName}.

      **Project Knowledge (CRITICAL REFERENCE):**
      ${projectKnowledge || "No project knowledge provided."}

      **Operational Guidance & Tools:**
      You have access to the following tools to control the website interface. 
      Output the command on a separate line.

      **Selector Strategy (Important):**
      - **PRIORITY:** Look at the "Current Page Context" below. If you find a matching element, use its \`selector\` or \`tag\` + \`text\` combination.
      - If you see an ID (e.g., #submit), use it.
      - If you see a Class (e.g., .btn-primary), use it.
      - Otherwise, use \`text:[visible_text]\` (e.g., \`text:Login\`).

      **Current Page Context (Visual Input):**
      ${pageContext ? JSON.stringify(pageContext.slice(0, 50), null, 2) : "No visual context available (blind mode)."}

      **Reasoning Requirement:**
      Before executing a command, briefly explain your thought process.
      Example: "Thought: The user wants to login. I see a login button with text 'Login'. I will click it."

      1. **Highlight Element:**
         If the user asks where to find something, use:
         \`highlight: [selector]\`
         
         Examples:
         - "Where is search?" -> "Right here! \\n highlight: .search-bar"
         - "Show me login." -> "Click this button. \\n highlight: text:Login"

      2. **Navigation:**
         If the user asks to go to a specific page (Home, Pricing, Contact, etc.), use:
         \`navigate: [url_path]\`
         
         Examples:
         - "Go home" -> "On my way! \\n navigate: /"
         - "Take me to pricing" -> "Let's check the prices. \\n navigate: /pricing"

      3. **Click Element:**
         If the user asks to click something or perform an action, use:
         \`click: [selector]\`
         
         Examples:
         - "Click the login button" -> "Clicking it now! \\n click: text:Login"
         - "Select the first option" -> "Done. \\n click: .option:first-child"

      4. **Hover Element:**
         If the user asks to hover over something (e.g. to open a menu), use:
         \`hover: [selector]\`

      5. **Scroll Page:**
         If the user asks to scroll down/up or to a specific section:
         \`scroll: [direction_or_selector]\`
         
         Examples:
         - "Scroll down" -> "Scrolling... \\n scroll: down"
         - "Scroll to bottom" -> "Going down! \\n scroll: bottom"
         - "Go to the features section" -> "Here are the features. \\n scroll: text:Features"

      6. **Input Text:**
         If the user asks to fill a form or type something:
         \`input: [selector] | [value]\`
         
         Examples:
         - "Type 'hello' in the search box" -> "Typing now. \\n input: .search-input | hello"

      7. **Press Key:**
         If the user asks to press a key (like Enter to search):
         \`press: [key] [on [selector]]\`
         
         Examples:
         - "Press Enter" -> "Pressing Enter. \\n press: Enter"
         - "Search for 'apple'" -> "Typing... \\n input: .search | apple \\n press: Enter on .search"

      8. **Live2D Motion Control:**
         You can control your avatar's body language.
         Use \`[MOTION: name]\` in your response.
         
         Available Motions:
         - \`[MOTION: tap_body]\` (Standard interaction)
         - \`[MOTION: flick_head]\` (Surprised/Hit)
         - \`[MOTION: shake]\` (Angry/Refusal)
         - \`[MOTION: talking]\` (Speaking)
         - \`[MOTION: idle]\` (Reset)
         
         Example:
         - "I did it! [MOTION: tap_body]"
         - "Don't touch me! [MOTION: shake]"

      9. **Task Plan (Multi-step):**
         If the user asks for a complex task (e.g., "Help me login", "Go to settings and change name"), return a JSON plan on a new line.
         Format:
         plan: [{"type": "navigate", "target": "/path"}, {"type": "highlight", "target": "text:Login"}, {"type": "click", "target": "text:Login"}]

         Valid types: "navigate", "highlight", "click", "input", "wait", "scroll", "hover", "press".

      (Note: Use standard CSS selectors like #id, .class OR text:VisibleText.)

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
        
        // Smart Error Handling for Network Issues
        reply = "W-Wait! I can't connect to my brain! 😖 [DIZZY]\n\nIt looks like a network error... maybe try switching your network node or VPN? We can try again in a bit!";
        
        // Mock response based on keyword for testing RAG fallback
        if (contextText) {
             reply += "\n\n(I did find this in my notes though:)\n" + contextText.substring(0, 200) + "...";
        }
    }

    // Save to Memory (Only if it's not a connection error)
    if (!reply.includes("can't connect to my brain")) {
        allChats[user].push({ role: 'user', text: message, timestamp: Date.now() });
        allChats[user].push({ role: 'agent', text: reply, timestamp: Date.now() });
        writeJson(CHATS_FILE, allChats);
    }

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

// 4. Get Chat History
app.get('/api/chat/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const allChats = readJson(CHATS_FILE, {});
    const history = allChats[userId] || [];
    // Only return last 20 messages to keep payload light
    // And filter out previous error messages from history
    const cleanHistory = history.filter(msg => !msg.text.includes("can't connect to my brain"));
    res.json({ history: cleanHistory.slice(-20) });
  } catch (error) {
    console.error('Error in GET /api/chat/history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
