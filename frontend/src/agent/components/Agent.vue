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
      :is-thinking="isLoading || plan?.status === 'running'"
      :is-happy="isHappy"
      :is-confused="isConfused"
      :message="message"
      :eye-offset="eyeOffset"
    />

    <transition name="pop">
      <ChatWindow
        v-if="chatOpen"
        :messages="messages"
        :is-loading="isLoading"
        :placement="chatPlacement"
        @close="toggleChat"
        @send="handleSendMessage"
        @click.stop
      />
    </transition>

    <TaskDisplay :plan="plan" :placement="taskPlacement" />

    <GuideOverlay
      :visible="!!guideTarget"
      :target-rect="guideTargetRect"
      :label="guideLabel"
      :agent-position="{ x, y }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import AgentCharacter from './AgentCharacter.vue';
import ChatWindow from './ChatWindow.vue';
import GuideOverlay from './GuideOverlay.vue';
import TaskDisplay from './TaskDisplay.vue';
import { useTaskExecutor } from '../composables/useTaskExecutor';
import { useAuth } from '../composables/useAuth';
import { lerp, getRandomPosition } from '../utils/math';
import { sendMessageToAI, getChatHistory } from '../services/aiService';
import type { Position, ChatMessage } from '../types';

const router = useRouter();
const { initAuth, isAuthenticated, currentUser } = useAuth();

// --- State ---
const x = ref(window.innerWidth - 100);
const y = ref(window.innerHeight - 100);
const targetX = ref(x.value);
const targetY = ref(y.value);

const isMoving = ref(false);
const isHovered = ref(false);
const isDizzy = ref(false);
const isHappy = ref(false);
const isConfused = ref(false);
const message = ref('Hi! I am your AI Agent.');

// Chat State
const chatOpen = ref(false);
const messages = ref<ChatMessage[]>([{ role: 'agent', text: 'Hello! How can I help you today?' }]);
const isLoading = ref(false);

// Task Executor
const { plan, setPlan } = useTaskExecutor();

// Chat Placement Logic
const chatPlacement = computed(() => {
  // If agent is in the top 400px of the screen, show chat below
  return y.value < 400 ? 'bottom' : 'top';
});

const taskPlacement = computed(() => {
  // If agent is on the right half, show task on left
  return x.value > window.innerWidth / 2 ? 'left' : 'right';
});

// Eye Tracking State
const mouseX = ref(0);
const mouseY = ref(0);
const eyeOffset = ref<Position>({ x: 0, y: 0 });

// Guide/Highlight State (Module 4)
const guideTarget = ref<HTMLElement | null>(null);
const guideTargetRect = ref<DOMRect | null>(null);
const guideLabel = ref('');

// Dizziness Logic State
const mouseHistory: { x: number; y: number; time: number }[] = [];
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
    message.value = ''; // Clear bubble when chat opens
  }
};

const handleSendMessage = async (text: string) => {
  // Add user message
  messages.value.push({ role: 'user', text });
  isLoading.value = true;
  message.value = 'Hmm...'; // Thinking text

  // Call AI Service
  const response = await sendMessageToAI(text, messages.value);

  isLoading.value = false;
  message.value = ''; // Clear thinking text

  // Clean response for display (remove hidden commands)
  const displayResponse = response
    .replace(/highlight:\s*[^\s\n]+/g, '')
    .replace(/navigate:\s*[^\s\n]+/g, '')
    .replace(/click:\s*[^\s\n]+/g, '')
    .replace(/plan:\s*\[[\s\S]*?\]/g, '') // Hide JSON plan
    .trim();

  if (displayResponse) {
    messages.value.push({ role: 'agent', text: displayResponse });
  } else {
    messages.value.push({ role: 'agent', text: "I'm on it!" });
  }

  // Check for Task Plan
  const planMatch = response.match(/plan:\s*(\[[\s\S]*?\])/);
  if (planMatch) {
    try {
      const planJson = JSON.parse(planMatch[1]);
      if (Array.isArray(planJson)) {
        console.log('Executing Plan:', planJson);
        setPlan(planJson);
        // If we have a plan, maybe close the chat to show the action?
        // toggleChat();
      }
    } catch (e) {
      console.error('Failed to parse task plan:', e);
    }
  }

  // Check for Guide Commands (Single commands)
  // 1. Highlight: highlight: .selector
  const guideMatch = response.match(/highlight:\s*([^\s\n]+)/);
  if (guideMatch) {
    const selector = guideMatch[1];
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = 'Click here!';

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
    console.log('Navigating to:', path);
    router.push(path);
  }

  // 3. Click: click: .selector
  const clickMatch = response.match(/click:\s*([^\s\n]+)/);
  if (clickMatch) {
    const selector = clickMatch[1];
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      console.log('Agent clicking:', selector);

      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = 'Clicking this!';

      setTimeout(() => {
        el.click();
        el.focus(); // Ensure focus

        // Reset guide after short delay
        setTimeout(() => {
          guideTarget.value = null;
          guideTargetRect.value = null;
        }, 1000);
      }, 500); // Small delay to show the "Clicking this!" label
    }
  }
};

// --- Logic: Movement & Animation Loop ---
let animationFrameId: number;
let roamTimer: number | null = null;

const updateEyeTracking = () => {
  if (isDizzy.value) return;

  // Priority 1: Look at Guide Target if active
  if (guideTargetRect.value) {
    const agentCenterX = x.value + AGENT_SIZE / 2;
    const agentCenterY = y.value + AGENT_SIZE / 2;
    const targetCenterX = guideTargetRect.value.left + guideTargetRect.value.width / 2;
    const targetCenterY = guideTargetRect.value.top + guideTargetRect.value.height / 2;

    const dx = targetCenterX - agentCenterX;
    const dy = targetCenterY - agentCenterY;
    const angle = Math.atan2(dy, dx);
    const distance = 4; // Max look distance

    eyeOffset.value = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
    return;
  }

  // Priority 2: Look at Mouse
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
    const p1 = mouseHistory[i - 1];
    const p2 = mouseHistory[i];

    const a1 = Math.atan2(p1.y - agentCenterY, p1.x - agentCenterX);
    const a2 = Math.atan2(p2.y - agentCenterY, p2.x - agentCenterX);

    let diff = a2 - a1;
    // Normalize to -PI to PI
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    totalAngleChange += diff;
  }

  if (Math.abs(totalAngleChange) > (270 * Math.PI) / 180) {
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

    // Recovery Phase: Confused for a moment
    isConfused.value = true;
    message.value = 'Ugh... where am I?';

    setTimeout(() => {
      isConfused.value = false;
      message.value = "I'm okay now.";
      setTimeout(() => (message.value = ''), 2000);
    }, 2000);
  }, 3000);
};

// --- Event Handlers ---
const handleMouseEnter = () => {
  isHovered.value = true;
  isMoving.value = false; // Stop random movement animation
  if (!chatOpen.value) {
    message.value = 'Hello!';
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
  if (!chatOpen.value) {
    message.value = '';
  }
};

const handleClick = () => {
  if (isDizzy.value) return;

  // Happy reaction!
  isHappy.value = true;
  setTimeout(() => {
    isHappy.value = false;
    toggleChat();
  }, 500);
};

const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  // Ignore if focus is inside the agent itself (e.g. chat window input)
  if ((e.target as HTMLElement).closest('.agent-container')) return;

  const rect = target.getBoundingClientRect();
  avoidObstacle(rect);
};

const avoidObstacle = (obstacleRect: DOMRect) => {
  const agentSize = AGENT_SIZE;
  const agentRect = {
    left: x.value,
    top: y.value,
    right: x.value + agentSize,
    bottom: y.value + agentSize
  };

  // Simple AABB Collision Detection
  const isOverlapping =
    agentRect.left < obstacleRect.right &&
    agentRect.right > obstacleRect.left &&
    agentRect.top < obstacleRect.bottom &&
    agentRect.bottom > obstacleRect.top;

  if (isOverlapping) {
    // Determine direction to move
    // Default: Move to the opposite side of the screen horizontally
    const moveLeft = x.value > window.innerWidth / 2;

    const newX = moveLeft ? 50 : window.innerWidth - agentSize - 50;
    let newY = y.value; // Keep Y if possible

    // If Y is also overlapping significantly?
    // Let's just default to a safe corner to be sure.
    // If obstacle is top-heavy, go bottom.
    const moveDown = obstacleRect.top < window.innerHeight / 2;
    newY = moveDown ? window.innerHeight - agentSize - 50 : 50;

    targetX.value = newX;
    targetY.value = newY;

    // Animate move
    isMoving.value = true;
    x.value = newX; // Snap or Lerp? Snap for quick avoidance
    y.value = newY;

    message.value = 'Oops, excuse me!';

    // Resume normal behavior after a delay
    setTimeout(() => {
      isMoving.value = false;
      if (!chatOpen.value) message.value = '';
    }, 1500);
  }
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
  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('focusin', handleFocusIn);
  startLoop();
  startRoaming();

  // Initialize Auth
  await initAuth();
});

// Watch for User Login/Logout
watch(currentUser, async (user) => {
  if (user) {
    // User Logged In
    const name = user.name || user.username || 'Friend';
    const visits = user.visits || 0;

    if (visits > 1) {
      message.value = `Welcome back, ${name}!`;
      isHappy.value = true;
      setTimeout(() => (isHappy.value = false), 2000);
    } else {
      message.value = `Nice to meet you, ${name}!`;
    }

    // Load History
    try {
      const history = await getChatHistory(user.userId || user.id);
      if (history && history.length > 0) {
        messages.value = history.map((msg: any) => ({
          role: msg.role === 'model' ? 'agent' : 'user',
          text: msg.parts?.[0]?.text || msg.text || ''
        }));
        // Append a "welcome back" message
        messages.value.push({
          role: 'agent',
          text: `I've restored our previous chat history. What's on your mind?`
        });
      } else {
        messages.value = [{ role: 'agent', text: `Hello ${name}! How can I help you today?` }];
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  } else {
    // User Logged Out
    message.value = 'See you later!';
    messages.value = [{ role: 'agent', text: 'Hello! Please login to save our chats.' }];
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove);
  window.removeEventListener('focusin', handleFocusIn);
  cancelAnimationFrame(animationFrameId);
  if (roamTimer) clearInterval(roamTimer);
  if (dizzyTimeout) clearTimeout(dizzyTimeout);
});
</script>

<style scoped>
/* Container styles are handled in computed property for positioning */

/* Pop Animation for Chat Window */
.pop-enter-active,
.pop-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
