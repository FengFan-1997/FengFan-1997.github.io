<template>
  <div class="page-container">
    <div class="chat-container">
      <header class="header">
        <h1 class="title">Gemini Chat</h1>
        <router-link to="/portfolio-home" class="back-link">
          <i class="fas fa-arrow-left"></i> Back
        </router-link>
      </header>

      <div class="messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="message-content">
            <div class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="text" v-html="formatMessage(msg.text)"></div>
          </div>
        </div>
        <div v-if="isLoading" class="message ai">
          <div class="message-content">
            <div class="avatar">🤖</div>
            <div class="text loading">Thinking...</div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <textarea 
          v-model="userInput" 
          @keydown.enter.prevent="sendMessage"
          placeholder="Ask me anything..."
          rows="1"
          ref="textarea"
        ></textarea>
        <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { generateContent } from '../services/aiService';

const userInput = ref('');
const messages = ref<{ role: 'user' | 'ai'; text: string }[]>([
  { role: 'ai', text: 'Hello! I am Gemini. How can I help you today?' }
]);
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const formatMessage = (text: string) => {
  // Simple line break handling
  return text.replace(/\n/g, '<br>');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const text = userInput.value;
  messages.value.push({ role: 'user', text });
  userInput.value = '';
  isLoading.value = true;
  scrollToBottom();

  const response = await generateContent(text);
  
  if (response.error) {
    messages.value.push({ role: 'ai', text: `Error: ${response.error}` });
  } else {
    messages.value.push({ role: 'ai', text: response.text });
  }
  
  isLoading.value = false;
  scrollToBottom();
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #0f172a;
  background-image: radial-gradient(circle at 50% 50%, #2e2b5b 0%, #0f172a 100%);
  color: #f1f5f9;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  padding-left: 100px; /* Avoid sidebar overlap */
  font-family: 'Inter', system-ui, sans-serif;
  box-sizing: border-box;
}

.chat-container {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1); /* Brighter glass */
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  height: 85vh;
}

.header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #38bdf8, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.back-link {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link:hover {
  color: #38bdf8;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.ai {
  align-self: flex-start;
}

.message-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.message.user .message-content {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.text {
  padding: 16px 20px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 1rem;
}

.message.user .text {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
}

.message.ai .text {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  border-bottom-left-radius: 4px;
}

.input-area {
  padding: 24px 30px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f1f5f9;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  outline: none;
  transition: all 0.3s;
}

textarea:focus {
  border-color: #38bdf8;
  background: rgba(0, 0, 0, 0.3);
}

button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

button:hover:not(:disabled) {
  background: linear-gradient(135deg, #7dd3fc, #a5b4fc);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar */
.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: transparent;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

@media (max-width: 979px) {
  .page-container {
    padding: 0; /* Remove padding to avoid overflow */
    padding-left: 0;
    height: 100dvh; /* Use dynamic viewport height */
    min-height: 100dvh;
    align-items: stretch; /* Stretch to fill */
  }

  .chat-container {
    height: 100%;
    border-radius: 0;
    border: none;
    max-width: none;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 16px 20px;
    flex-shrink: 0;
  }

  .messages {
    padding: 20px;
    flex: 1;
  }

  .message {
    max-width: 90%;
  }
  
  .input-area {
    padding: 16px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(10px);
    flex-shrink: 0;
  }
}
</style>
