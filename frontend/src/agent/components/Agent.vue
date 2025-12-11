<template>
  <div 
    class="agent-container" 
    :style="containerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <AgentCharacter 
      :is-moving="isMoving"
      :is-hovered="isHovered"
      :is-dizzy="isDizzy"
      :is-thinking="isLoading"
      :message="message"
      :eye-offset="eyeOffset"
    />
    
    <transition name="pop">
      <ChatWindow 
        v-if="chatOpen" 
        :messages="messages"
        :is-loading="isLoading"
        @close="toggleChat"
        @send="handleSendMessage"
        @click.stop
      />
    </transition>

    <GuideOverlay 
      :visible="!!guideTarget" 
      :target-rect="guideTargetRect"
      :label="guideLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import AgentCharacter from './AgentCharacter.vue';
import ChatWindow from './ChatWindow.vue';
import GuideOverlay from './GuideOverlay.vue';
import { lerp, getRandomPosition, calculateDistance } from '../utils/math';
import { sendMessageToAI, getUserProfile, updateUserProfile } from '../services/aiService';
import { getUserId } from '../utils/user';
import type { Position, ChatMessage } from '../types';

// ... State ---
const x = ref(window.innerWidth - 100);
const y = ref(window.innerHeight - 100);
const targetX = ref(x.value);
const targetY = ref(y.value);

const isMoving = ref(false);
const isHovered = ref(false);
const isDizzy = ref(false);
const message = ref('Hi! I am your AI Agent.');

// Chat State
const chatOpen = ref(false);
const messages = ref<ChatMessage[]>([
  { role: 'agent', text: 'Hello! How can I help you today?' }
]);
const isLoading = ref(false);

// Eye Tracking State
const mouseX = ref(0);
const mouseY = ref(0);
const eyeOffset = ref<Position>({ x: 0, y: 0 });

// Guide/Highlight State (Module 4)
const guideTarget = ref<HTMLElement | null>(null);
const guideTargetRect = ref<DOMRect | null>(null);
const guideLabel = ref('');

// Dizziness Logic State
const MOUSE_HISTORY_LIMIT = 20;
const mouseHistory: { x: number, y: number, time: number }[] = [];
let dizzyTimeout: number | null = null;

// --- Config ---
const AGENT_SIZE = 80; // px
const MOVE_INTERVAL = 5000; // ms (for idle roaming)
const LERP_FACTOR = 0.08; // Smoothness factor
const MOUSE_FOLLOW_OFFSET = { x: 40, y: 40 }; // Offset from cursor to center agent

// --- Computed ---
const containerStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px)`,
  width: `${AGENT_SIZE}px`,
  height: `${AGENT_SIZE}px`,
  transition: isHovered.value ? 'none' : 'transform 2s cubic-bezier(0.4, 0.0, 0.2, 1)',
  zIndex: 9999,
  position: 'fixed' as const,
  top: 0,
  left: 0,
  pointerEvents: 'auto' as const
}));

// --- Logic: Chat ---
const toggleChat = () => {
  chatOpen.value = !chatOpen.value;
  if (chatOpen.value) {
    message.value = ""; // Clear bubble when chat opens
  }
};

const handleSendMessage = async (text: string) => {
  // Add user message
  messages.value.push({ role: 'user', text });
  isLoading.value = true;
  
  // Call AI Service
  const response = await sendMessageToAI(text, messages.value);
  
  isLoading.value = false;
  messages.value.push({ role: 'agent', text: response });
  
  // Check for Guide Commands
  // 1. Highlight: highlight: .selector
  const guideMatch = response.match(/highlight:\s*([^\s\n]+)/);
  if (guideMatch) {
    const selector = guideMatch[1];
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = "Click here!";
      
      // Auto clear after 5s
      setTimeout(() => {
        guideTarget.value = null;
        guideTargetRect.value = null;
      }, 5000);
    }
  }

  // 2. Navigate: navigate: /path
  const navMatch = response.match(/navigate:\s*([^\s\n]+)/);
  if (navMatch) {
    const path = navMatch[1];
    // In a real router app: router.push(path)
    // For now, we'll just log it or simulate it if we had a router.
    // Since this is likely a single page demo or simple HTML, we can try:
    console.log("Navigating to:", path);
    window.location.href = path; // Warning: this will reload the page!
  }
};

// --- Logic: Movement & Animation Loop ---
let animationFrameId: number;
let roamTimer: number | null = null;

const updateEyeTracking = () => {
  if (isDizzy.value) return;

  const agentCenterX = x.value + AGENT_SIZE / 2;
  const agentCenterY = y.value + AGENT_SIZE / 2;

  const dx = mouseX.value - agentCenterX;
  const dy = mouseY.value - agentCenterY;
  const angle = Math.atan2(dy, dx);
  
  // Limit eye movement radius
  const distance = Math.min(3, Math.sqrt(dx * dx + dy * dy) / 20);
  
  eyeOffset.value = {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
};

const startLoop = () => {
  const loop = () => {
    if (isDizzy.value) {
      // If dizzy, maybe drift slightly?
    } else if (isHovered.value && !chatOpen.value) { 
      // Only follow mouse if chat is closed (to avoid moving away while typing)
      
      // --- Mouse Follow Mode (Lerp) ---
      targetX.value = mouseX.value - MOUSE_FOLLOW_OFFSET.x;
      targetY.value = mouseY.value - MOUSE_FOLLOW_OFFSET.y;
      
      x.value = lerp(x.value, targetX.value, LERP_FACTOR);
      y.value = lerp(y.value, targetY.value, LERP_FACTOR);
    } 
    
    updateEyeTracking();
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);
};

// --- Logic: Random Roaming (Idle Mode) ---
const startRoaming = () => {
  moveRandomly();
  roamTimer = window.setInterval(() => {
    if (!isHovered.value && !isDizzy.value && !chatOpen.value) {
      moveRandomly();
    }
  }, MOVE_INTERVAL);
};

const moveRandomly = () => {
  const newPos = getRandomPosition(window.innerWidth, window.innerHeight, AGENT_SIZE);
  isMoving.value = true;
  x.value = newPos.x;
  y.value = newPos.y;

  // Stop "moving" state after animation finishes
  setTimeout(() => {
    isMoving.value = false;
  }, 2000);
};

// --- Logic: Dizziness Detection ---
const checkDizziness = (newX: number, newY: number) => {
  if (chatOpen.value) return; // Disable dizzy check when chat is open

  const now = Date.now();
  mouseHistory.push({ x: newX, y: newY, time: now });
  
  // Keep only recent history (last 500ms)
  while (mouseHistory.length > 0 && now - mouseHistory[0].time > 500) {
    mouseHistory.shift();
  }

  if (mouseHistory.length < 10) return;

  const agentCenterX = x.value + AGENT_SIZE / 2;
  const agentCenterY = y.value + AGENT_SIZE / 2;
  
  let totalAngleChange = 0;
  for (let i = 1; i < mouseHistory.length; i++) {
    const p1 = mouseHistory[i-1];
    const p2 = mouseHistory[i];
    
    const a1 = Math.atan2(p1.y - agentCenterY, p1.x - agentCenterX);
    const a2 = Math.atan2(p2.y - agentCenterY, p2.x - agentCenterX);
    
    let diff = a2 - a1;
    // Normalize to -PI to PI
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    
    totalAngleChange += diff;
  }
  
  if (Math.abs(totalAngleChange) > (270 * Math.PI / 180)) {
    triggerDizzy();
  }
};

const triggerDizzy = () => {
  if (isDizzy.value) return;
  isDizzy.value = true;
  message.value = "Whoa! I'm dizzy...";
  
  if (dizzyTimeout) clearTimeout(dizzyTimeout);
  
  dizzyTimeout = window.setTimeout(() => {
    isDizzy.value = false;
    message.value = "I'm okay now.";
    setTimeout(() => message.value = "", 2000);
  }, 3000);
};

// --- Event Handlers ---
const handleMouseEnter = () => {
  isHovered.value = true;
  isMoving.value = false; // Stop random movement animation
  if (!chatOpen.value) {
    message.value = "Hello!";
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
  if (!chatOpen.value) {
    message.value = "";
  }
};

const handleClick = () => {
  if (isDizzy.value) return;
  toggleChat();
};

const handleGlobalMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
  
  if (isHovered.value) {
    checkDizziness(e.clientX, e.clientY);
  }
};

// --- Lifecycle ---
onMounted(async () => {
  // Check user history for personalization
  
  try {
    const profile = await getUserProfile();
    
    if (profile && profile.visits > 0) {
      message.value = "Welcome back! Missed me?";
      messages.value = [{ 
        role: 'agent', 
        text: `Welcome back${profile.name && profile.name !== 'Friend' ? ', ' + profile.name : ''}! Need any help continuing where we left off?` 
      }];
      
      // Update visit count
      await updateUserProfile({ visits: (profile.visits || 0) + 1 });
    } else {
      message.value = "Hi! I'm new here.";
      messages.value = [{ role: 'agent', text: 'Hello! I am your personal AI Agent. I can help you navigate this website. Try asking me anything!' }];
      
      // Create new profile
      await updateUserProfile({ visits: 1, name: 'Friend' });
    }
  } catch (e) {
    console.error("Failed to load profile", e);
    // Fallback
    message.value = "Hello!";
  }

  window.addEventListener('mousemove', handleGlobalMouseMove);
  startLoop();
  startRoaming();
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  cancelAnimationFrame(animationFrameId);
  if (roamTimer) clearInterval(roamTimer);
  if (dizzyTimeout) clearTimeout(dizzyTimeout);
});
</script>

<style scoped>
/* Container styles are handled in computed property for positioning */

/* Pop Animation for Chat Window */
.pop-enter-active, .pop-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from, .pop-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
