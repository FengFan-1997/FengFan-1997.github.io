<template>
  <div class="nexus-dashboard">
    <div class="sidebar">
      <div class="logo">NEXUS <span class="ai-badge">AI</span></div>
      <nav>
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'dashboard' }"
          @click="activeTab = 'dashboard'"
        >
          <span class="icon">📊</span> Dashboard
        </div>
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'prediction' }"
          @click="activeTab = 'prediction'"
        >
          <span class="icon">🧠</span> AI Prediction
        </div>
        <div 
          class="nav-item" 
          :class="{ active: activeTab === 'hft' }"
          @click="activeTab = 'hft'"
        >
          <span class="icon">⚡</span> HFT Status
        </div>
        <div class="nav-item">
          <span class="icon">⚙️</span> Settings
        </div>
      </nav>
      <div class="system-status">
        <div class="status-row">
          <span>Latency</span>
          <span class="value success">{{ latency }}ms</span>
        </div>
        <div class="status-row">
          <span>AI Model</span>
          <span class="value">v4.2.0</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <header>
        <h1>{{ pageTitle }}</h1>
        <div class="header-actions">
          <button class="action-btn" @click="runAnalysis" :disabled="isAnalyzing">
            <span v-if="!isAnalyzing">Run AI Scan</span>
            <span v-else>Scanning...</span>
          </button>
          <div class="live-indicator">
            <span class="dot"></span> LIVE
          </div>
        </div>
      </header>

      <!-- Dashboard View -->
      <div v-if="activeTab === 'dashboard'" class="dashboard-grid">
        <!-- Main Chart Area -->
        <div class="card chart-card">
          <div class="card-header">
            <h3>BTC/USD Real-time Sentiment</h3>
            <div class="confidence">AI Confidence: <span class="highlight">{{ confidence }}%</span></div>
          </div>
          <div class="chart-visual">
            <svg viewBox="0 0 800 300" class="line-chart">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(56, 189, 248, 0.5)" />
                  <stop offset="100%" stop-color="rgba(56, 189, 248, 0)" />
                </linearGradient>
              </defs>
              <path class="area" :d="chartPathArea" fill="url(#chartGradient)" />
              <path class="line" :d="chartPathLine" fill="none" stroke="#38bdf8" stroke-width="3" />
              <!-- AI Prediction Line -->
              <path class="line prediction" d="M800,50 Q900,20 1000,40" fill="none" stroke="#a855f7" stroke-width="3" stroke-dasharray="5,5" />
            </svg>
            <div class="prediction-label">AI PREDICTION: BULLISH BREAKOUT</div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="card insights-card">
          <div class="card-header">
             <h3>AI Insights</h3>
             <span class="refresh-icon" @click="refreshInsights">↻</span>
          </div>
          <div class="insight-list">
            <div class="insight-item" v-for="(insight, index) in insights" :key="index">
              <div class="insight-icon">{{ insight.icon }}</div>
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-desc">{{ insight.desc }}</div>
              </div>
              <div class="insight-score" :class="insight.scoreClass">{{ insight.score }}</div>
            </div>
          </div>
        </div>

        <!-- Order Book / Data Stream -->
        <div class="card data-card">
          <h3>High-Frequency Data Stream</h3>
          <div class="data-rows">
            <div class="data-row header">
              <span>Time</span>
              <span>Type</span>
              <span>Volume</span>
              <span>AI Signal</span>
            </div>
            <div class="data-row" v-for="(row, i) in dataStream" :key="i">
              <span class="mono">{{ row.time }}</span>
              <span :class="row.type === 'BUY' ? 'text-green' : 'text-red'">{{ row.type }}</span>
              <span class="mono">{{ row.volume }} BTC</span>
              <span class="ai-tag">{{ row.signal }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Prediction View -->
      <div v-else-if="activeTab === 'prediction'" class="prediction-view">
        <div class="chat-container">
           <div class="chat-messages" ref="chatContainer">
             <div v-for="(msg, idx) in chatMessages" :key="idx" class="message" :class="msg.role">
               <div class="message-role">{{ msg.role === 'ai' ? 'NEXUS AI' : 'YOU' }}</div>
               <div class="message-content">{{ msg.content }}</div>
             </div>
             <div v-if="isTyping" class="message ai typing">
               NEXUS AI is analyzing market vectors...
             </div>
           </div>
           <div class="chat-input">
             <input 
               v-model="userQuery" 
               @keyup.enter="sendMessage"
               placeholder="Ask Nexus about market trends, specific tokens, or risk analysis..." 
             />
             <button @click="sendMessage">SEND</button>
           </div>
        </div>
      </div>

      <!-- HFT Status View -->
      <div v-else-if="activeTab === 'hft'" class="hft-view">
        <div class="terminal-window">
          <div class="terminal-header">
            <div class="dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span>nexus_node_v4.exe</span>
          </div>
          <div class="terminal-content">
            <div v-for="(log, idx) in hftLogs" :key="idx" class="log-line">
              <span class="log-time">[{{ log.time }}]</span>
              <span class="log-level" :class="log.level">{{ log.level }}</span>
              <span class="log-msg">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';

const activeTab = ref('dashboard');
const isAnalyzing = ref(false);
const confidence = ref(98.4);
const latency = ref(0.4);

const pageTitle = computed(() => {
  if (activeTab.value === 'dashboard') return 'Market Anomaly Detection';
  if (activeTab.value === 'prediction') return 'Neural Predictive Engine';
  return 'HFT Node Status';
});

// --- Dashboard Logic ---
const chartPathArea = ref("M0,250 Q100,200 200,230 T400,150 T600,100 T800,50 V300 H0 Z");
const chartPathLine = ref("M0,250 Q100,200 200,230 T400,150 T600,100 T800,50");

const insights = ref([
  {
    icon: '🚀',
    title: 'Momentum Shift',
    desc: 'Volume spike detected in Asian session.',
    score: '+8.2',
    scoreClass: 'positive'
  },
  {
    icon: '⚠️',
    title: 'Volatility Warning',
    desc: 'Bollinger bands expansion predicted.',
    score: 'High',
    scoreClass: 'warning'
  },
  {
    icon: '🐋',
    title: 'Whale Activity',
    desc: 'Large wallet movement tracking.',
    score: 'Alert',
    scoreClass: 'neutral'
  }
]);

const dataStream = ref([
  { time: '15:59:07', type: 'SELL', volume: '1.7140', signal: 'DISTRIBUTE' },
  { time: '15:59:06', type: 'BUY', volume: '7.7418', signal: 'ACCUMULATE' },
  { time: '15:59:05', type: 'SELL', volume: '6.0762', signal: 'DISTRIBUTE' },
  { time: '15:59:04', type: 'BUY', volume: '5.5712', signal: 'ACCUMULATE' },
  { time: '15:59:03', type: 'SELL', volume: '9.5612', signal: 'DISTRIBUTE' },
]);

const runAnalysis = () => {
  isAnalyzing.value = true;
  setTimeout(() => {
    isAnalyzing.value = false;
    confidence.value = +(Math.random() * 5 + 94).toFixed(1);
    insights.value.unshift({
      icon: '⚡',
      title: 'New Anomaly',
      desc: 'Flash crash pattern detected in derivative markets.',
      score: 'CRITICAL',
      scoreClass: 'warning'
    });
    if (insights.value.length > 4) insights.value.pop();
  }, 1500);
};

const refreshInsights = () => {
  insights.value = insights.value.sort(() => Math.random() - 0.5);
};

// --- Chat Logic ---
const userQuery = ref('');
const isTyping = ref(false);
const chatMessages = ref([
  { role: 'ai', content: 'Hello. I am NEXUS, your advanced market analyst. I can predict price movements, analyze sentiment, and audit smart contracts. How can I assist you today?' }
]);
const chatContainer = ref<HTMLElement | null>(null);

const sendMessage = () => {
  if (!userQuery.value.trim()) return;
  
  chatMessages.value.push({ role: 'user', content: userQuery.value });
  const query = userQuery.value;
  userQuery.value = '';
  isTyping.value = true;

  nextTick(() => {
     if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });

  setTimeout(() => {
    isTyping.value = false;
    let response = "I've analyzed the current market vectors. ";
    if (query.toLowerCase().includes('btc') || query.toLowerCase().includes('bitcoin')) {
      response += "Bitcoin shows strong accumulation patterns in the $65k-$68k range. On-chain metrics suggest a supply shock is imminent.";
    } else if (query.toLowerCase().includes('eth') || query.toLowerCase().includes('ethereum')) {
      response += "Ethereum gas fees are stabilizing. Layer 2 volume has increased by 40% in the last 24h, indicating a bullish divergence.";
    } else {
      response += "My neural networks detect high volatility incoming. I recommend adjusting your leverage and monitoring the HFT status tab for real-time liquidity changes.";
    }
    chatMessages.value.push({ role: 'ai', content: response });
    nextTick(() => {
       if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    });
  }, 1500);
};

// --- HFT Logic ---
const hftLogs = ref([
  { time: '16:00:01', level: 'INFO', message: 'Connected to Exchange A WebSocket feed.' },
  { time: '16:00:02', level: 'SUCCESS', message: 'Arbitrage opportunity found: ETH/USDT (0.4% spread).' },
  { time: '16:00:02', level: 'WARN', message: 'High network congestion detected. Increasing gas priority.' },
]);

let timer: number;

onMounted(() => {
  // Simulate live data updates
  timer = window.setInterval(() => {
    // Update latency
    latency.value = +(0.3 + Math.random() * 0.4).toFixed(1);
    
    // Update data stream
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    dataStream.value.unshift({
      time: new Date().toLocaleTimeString(),
      type,
      volume: (Math.random() * 10).toFixed(4),
      signal: type === 'BUY' ? 'ACCUMULATE' : 'DISTRIBUTE'
    });
    if (dataStream.value.length > 8) dataStream.value.pop();

    // Update HFT logs if on tab
    if (activeTab.value === 'hft') {
      const msgs = [
        'Micro-structure analysis complete.',
        'Order book depth updated.',
        'Slippage protection activated.',
        'Neural weights optimized.',
        'Executing triangular arbitrage...'
      ];
      hftLogs.value.push({
        time: new Date().toLocaleTimeString(),
        level: Math.random() > 0.8 ? 'WARN' : 'INFO',
        message: msgs[Math.floor(Math.random() * msgs.length)]
      });
      if (hftLogs.value.length > 20) hftLogs.value.shift();
    }
  }, 2000);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.nexus-dashboard {
  display: flex;
  min-height: 100vh; /* Changed from height: 100vh to allow scrolling */
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  /* overflow: hidden; Removed to fix scrolling issues */ 
}

.sidebar {
  width: 250px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: sticky; /* Make sidebar sticky */
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .nexus-dashboard {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid #334155;
  }
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-badge {
  font-size: 0.8rem;
  background: #38bdf8;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
}

.nav-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  transition: all 0.3s;
}

.nav-item.active, .nav-item:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.system-status {
  margin-top: auto;
  background: #0f172a;
  padding: 16px;
  border-radius: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 8px;
  color: #64748b;
}

.value {
  color: #e2e8f0;
  font-family: 'JetBrains Mono', monospace;
}

.value.success {
  color: #4ade80;
}

.main-content {
  flex: 1;
  padding: 30px;
  /* overflow-y: auto; Removed to allow natural document scroll */
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-btn {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-weight: 600;
  font-size: 0.9rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
}

.chart-card {
  grid-column: 1 / -1; /* Full width */
}

@media (min-width: 1200px) {
  .chart-card {
    grid-column: 1 / 3;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-icon {
  cursor: pointer;
  font-size: 1.2rem;
  color: #64748b;
  transition: color 0.3s;
}
.refresh-icon:hover { color: #38bdf8; }

.highlight {
  color: #38bdf8;
  font-weight: 700;
}

.chart-visual {
  position: relative;
  height: 300px;
  width: 100%;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  overflow: hidden;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.prediction-label {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #0f172a;
  border-radius: 12px;
  margin-bottom: 12px;
}

.insight-icon {
  font-size: 1.5rem;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.insight-desc {
  font-size: 0.8rem;
  color: #94a3b8;
}

.insight-score {
  font-weight: 700;
  font-size: 0.9rem;
}

.positive { color: #4ade80; }
.warning { color: #facc15; }
.neutral { color: #38bdf8; }

.data-rows {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
}

.data-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 12px;
  border-bottom: 1px solid #334155;
  gap: 10px;
}

.data-row.header {
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.text-green { color: #4ade80; }
.text-red { color: #ef4444; }
.ai-tag {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
  font-size: 0.7rem;
  width: fit-content;
}

/* Prediction View Styles */
.prediction-view {
  height: 600px;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.message.ai {
  align-self: flex-start;
  background: #0f172a;
  border: 1px solid #334155;
  color: #cbd5e1;
}

.message.user {
  align-self: flex-end;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.message-role {
  font-size: 0.7rem;
  margin-bottom: 4px;
  opacity: 0.7;
  font-weight: 700;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #334155;
  display: flex;
  gap: 10px;
  background: #1e293b;
}

.chat-input input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  padding: 12px;
  border-radius: 8px;
  color: #fff;
  outline: none;
}

.chat-input input:focus {
  border-color: #38bdf8;
}

.chat-input button {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

/* HFT View Styles */
.hft-view {
  height: 600px;
}

.terminal-window {
  background: #000;
  border-radius: 8px;
  height: 100%;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
}

.terminal-header {
  background: #1a1a1a;
  padding: 10px 16px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 8px 8px 0 0;
}

.dots {
  display: flex;
  gap: 6px;
}

.dots .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.terminal-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  color: #33ff00;
  font-size: 0.9rem;
}

.log-line {
  margin-bottom: 4px;
}

.log-time { color: #666; margin-right: 10px; }
.log-level { margin-right: 10px; font-weight: bold; }
.log-level.INFO { color: #38bdf8; }
.log-level.WARN { color: #facc15; }
.log-level.SUCCESS { color: #4ade80; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>
