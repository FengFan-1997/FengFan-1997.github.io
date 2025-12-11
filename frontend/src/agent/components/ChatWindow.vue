<template>
  <div 
    class="chat-window" 
    :class="placement"
    @mousemove="refreshActivity"
    @click="refreshActivity"
    @keydown="refreshActivity"
  >
    <div class="chat-header">
      <span class="title">AI Assistant</span>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        class="chat-message"
        :class="msg.role"
      >
        <div class="message-content" v-html="renderMessage(msg.text)"></div>
      </div>
      
      <div v-if="isLoading" class="chat-message agent loading">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <div class="chat-input-area">
      <input 
        v-model="inputMessage" 
        @keyup.enter="handleSend"
        placeholder="Ask me anything..."
        :disabled="isLoading"
      />
      <button 
        class="send-btn" 
        @click="handleSend" 
        :disabled="!inputMessage.trim() || isLoading"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { marked } from 'marked';
import type { ChatMessage } from '../types';

const props = defineProps<{
  messages: ChatMessage[];
  isLoading: boolean;
  placement?: 'top' | 'bottom';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'send', text: string): void;
}>();

const inputMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const lastActivityTime = ref(Date.now());
let activityTimer: number | null = null;

const renderMessage = (text: string) => {
  try {
    return marked.parse(text);
  } catch {
    return text;
  }
};

const handleSend = () => {
  if (!inputMessage.value.trim() || props.isLoading) return;
  emit('send', inputMessage.value);
  inputMessage.value = '';
  refreshActivity();
};

const refreshActivity = () => {
  lastActivityTime.value = Date.now();
};

const checkInactivity = () => {
  // Do not close if loading or if user has typed something
  if (props.isLoading || inputMessage.value.length > 0) {
    refreshActivity();
    return;
  }
  
  if (Date.now() - lastActivityTime.value > 5000) {
    emit('close');
  }
};

onMounted(() => {
  activityTimer = window.setInterval(checkInactivity, 1000);
});

onBeforeUnmount(() => {
  if (activityTimer) clearInterval(activityTimer);
});

// Auto-scroll to bottom when messages change
watch(() => props.messages.length, () => {
  refreshActivity(); // New message = activity
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.chat-window {
  position: absolute;
  /* bottom: 100px;  Removed default, handled by classes */
  right: 0;
  width: 300px;
  height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
  border: 1px solid rgba(0,0,0,0.05);
  /* Ensure it doesn't get cut off if agent is near edge */
  transform: translateX(-50%);
  left: 50%;
}

.chat-window.top {
  bottom: 100px;
  top: auto;
}

.chat-window.bottom {
  top: 100px;
  bottom: auto;
}

.chat-header {
  background: #409eff;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9f9f9;
}

.chat-message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-message.agent {
  align-self: flex-start;
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.chat-message.user {
  align-self: flex-end;
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-input-area {
  padding: 12px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
}

.chat-input-area input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input-area input:focus {
  border-color: #409eff;
}

.send-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  background: #66b1ff;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 2px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
