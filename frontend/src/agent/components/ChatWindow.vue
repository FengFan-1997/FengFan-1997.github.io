<template>
  <div
    class="chat-window"
    :class="placement"
    :style="windowStyle"
    ref="chatWindowRef"
    @mousemove="refreshActivity"
    @click="refreshActivity"
    @keydown="refreshActivity"
  >
    <div class="chat-header">
      <div class="header-left">
        <span class="title">✨ AI Assistant</span>
      </div>
      <div class="header-right">
        <button
          class="icon-btn user-btn"
          @click="toggleView"
          :title="isAuthenticated ? 'Profile' : 'Login'"
        >
          {{ isAuthenticated ? '👤' : '🔑' }}
        </button>
        <button class="icon-btn close-btn" @click="$emit('close')">×</button>
      </div>
    </div>

    <!-- Chat View -->
    <transition name="fade" mode="out-in">
      <div v-if="currentView === 'chat'" class="view-content chat-view">
        <div class="chat-messages" ref="messagesContainer">
          <transition-group name="message">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="chat-message"
              :class="msg.role"
            >
              <div class="message-content" v-html="renderMessage(msg.text)"></div>
            </div>
          </transition-group>

          <div v-if="isLoading" class="chat-message agent loading">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
          </div>
        </div>

        <div class="chat-input-area">
          <input
            v-model="inputMessage"
            @keyup.enter="handleSend"
            placeholder="Type a message..."
            :disabled="isLoading"
          />
          <button
            class="send-btn"
            @click="handleSend"
            :disabled="!inputMessage.trim() || isLoading"
          >
            <span v-if="isLoading">...</span>
            <span v-else>➤</span>
          </button>
        </div>
      </div>

      <!-- Auth/Profile View -->
      <div v-else class="view-content auth-view">
        <div class="auth-container">
          <div v-if="isAuthenticated" class="profile-view">
            <div class="avatar-large">
              <img src="/ai-icon.svg" alt="User" v-if="false" />
              <span v-else>👤</span>
            </div>
            <h3>{{ currentUser?.name || currentUser?.username }}</h3>
            <p class="user-id">ID: {{ currentUser?.userId || currentUser?.id }}</p>

            <div class="stats">
              <div class="stat-item">
                <span class="stat-val">{{ currentUser?.visits || 1 }}</span>
                <span class="stat-label">Visits</span>
              </div>
            </div>

            <button class="logout-btn" @click="handleLogout">Logout</button>
            <button class="back-btn" @click="currentView = 'chat'">Back to Chat</button>
          </div>

          <AuthForm
            v-else
            :mode="authMode"
            @switch-mode="(m) => (authMode = m)"
            @success="handleAuthSuccess"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { marked } from 'marked';
import type { ChatMessage } from '../types';
import { useAuth } from '../composables/useAuth';
import AuthForm from './AuthForm.vue';

const props = defineProps<{
  messages: ChatMessage[];
  isLoading: boolean;
  placement?: 'top' | 'bottom';
  agentRect?: Partial<DOMRect>; // Changed to Partial to avoid strict type issues
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'send', text: string): void;
}>();

const { isAuthenticated, currentUser, logout } = useAuth();
const chatWindowRef = ref<HTMLElement | null>(null);

const inputMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const lastActivityTime = ref(Date.now());
let activityTimer: number | null = null;

// Smart Positioning State
const windowStyle = computed(() => {
  const style: any = {};

  // Basic boundary detection to prevent overflow
  // This is a simplified version; real implementation would need actual window measurements
  if (props.agentRect) {
    const x = props.agentRect.x || 0;
    // Check Right Edge
    if (x > window.innerWidth - 360) {
      // 340 width + 20 margin
      style.right = '100%';
      style.left = 'auto';
      style.transform = 'translateX(0)';
      style.marginRight = '20px';
    }
    // Check Left Edge
    else if (x < 180) {
      style.left = '100%';
      style.right = 'auto';
      style.transform = 'translateX(0)';
      style.marginLeft = '20px';
    }
  }

  return style;
});

// View State
const currentView = ref<'chat' | 'auth'>('chat');
const authMode = ref<'login' | 'register'>('login');

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
  // Do not close if loading or if user has typed something or if in auth view
  if (props.isLoading || inputMessage.value.length > 0 || currentView.value === 'auth') {
    refreshActivity();
    return;
  }

  if (Date.now() - lastActivityTime.value > 5000) {
    emit('close');
  }
};

const toggleView = () => {
  currentView.value = currentView.value === 'chat' ? 'auth' : 'chat';
  refreshActivity();
};

const handleAuthSuccess = () => {
  currentView.value = 'chat';
  refreshActivity();
};

const handleLogout = () => {
  logout();
  // Keep in profile view to show login form
  authMode.value = 'login';
};

onMounted(() => {
  activityTimer = window.setInterval(checkInactivity, 1000);
});

onBeforeUnmount(() => {
  if (activityTimer) clearInterval(activityTimer);
});

// Auto-scroll to bottom when messages change
watch(
  () => props.messages.length,
  () => {
    if (currentView.value === 'chat') {
      refreshActivity();
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }
  }
);
</script>

<style scoped>
/* CSS Glassmorphism & Animations */
.chat-window {
  position: absolute;
  right: 0;
  width: 340px;
  height: 500px;
  background: rgba(255, 255, 255, 0.85); /* Glass effect */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
  transform: translateX(-50%);
  left: 50%;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.chat-window.top {
  bottom: 100px;
  top: auto;
  transform-origin: bottom center;
}

.chat-window.bottom {
  top: 100px;
  bottom: auto;
  transform-origin: top center;
}

.chat-header {
  background: rgba(64, 158, 255, 0.9);
  background: linear-gradient(135deg, #409eff 0%, #36d1dc 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.2);
}

.view-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: transparent;
  scroll-behavior: smooth;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.chat-message {
  max-width: 85%;
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message.agent {
  align-self: flex-start;
  background: white;
  color: #2c3e50;
  border-bottom-left-radius: 4px;
}

.chat-message.user {
  align-self: flex-end;
  background: #409eff;
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

/* Input Area */
.chat-input-area {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input-area input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  background: rgba(245, 247, 250, 0.8);
  transition: all 0.2s;
}

.chat-input-area input:focus {
  background: white;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.send-btn {
  background: #409eff;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.2s,
    background 0.2s;
  font-size: 16px;
}

.send-btn:hover:not(:disabled) {
  background: #66b1ff;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}
.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.message-leave-to {
  opacity: 0;
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
  background: #b0b0b0;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Profile View Styles */
.profile-view {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #333;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.avatar-large {
  font-size: 64px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stats {
  display: flex;
  gap: 30px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-val {
  font-size: 24px;
  font-weight: 800;
  color: #409eff;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.back-btn {
  background: none;
  border: none;
  color: #909399;
  cursor: pointer;
  font-size: 14px;
}
.back-btn:hover {
  color: #606266;
  text-decoration: underline;
}
</style>
