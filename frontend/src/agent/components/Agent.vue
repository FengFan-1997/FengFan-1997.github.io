<template>
  <div
    class="agent-container"
    :style="containerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @click="handleClick"
  >
    <Live2DWidget
      :is-talking="isTalking"
      :is-moving="isMoving"
      :is-hovered="isHovered"
      :is-dizzy="isDizzy"
      :is-happy="isHappy"
      :is-confused="isConfused"
      :is-angry="isAngry"
      :is-fainted="isFainted"
      :is-pouting="isPouting"
      :is-head-hit="isHeadHit"
      :message="message"
      :current-lang="currentLang"
      @toggle-chat="toggleChat"
    />

    <transition name="pop">
      <ChatWindow
        v-if="chatOpen"
        :messages="messages"
        :is-loading="isLoading"
        :placement="chatPlacement"
        :is-muted="isMuted"
        :agent-rect="{ x, y, width: 80, height: 80 }"
        :current-lang="currentLang"
        @close="toggleChat"
        @send="handleSendMessage"
        @toggle-mute="isMuted = !isMuted"
        @click.stop
      />
    </transition>

    <TaskDisplay :plan="plan" :placement="taskPlacement" />

    <ConnectionLine v-if="guideTargetRect" :start="lineStart" :end="lineEnd" />

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
import { useLanguageStore } from '../../stores/language';
import { storeToRefs } from 'pinia';
import Live2DWidget from './Live2DWidget.vue';
import ChatWindow from './ChatWindow.vue';
import GuideOverlay from './GuideOverlay.vue';
import TaskDisplay from './TaskDisplay.vue';
import ConnectionLine from './ConnectionLine.vue';
import { useTaskExecutor } from '../composables/useTaskExecutor';
import { useAuth } from '../composables/useAuth';
import { lerp, getRandomPosition } from '../utils/math';
import { resolveTarget } from '../utils/dom';
import { sendMessageToAI, getChatHistory } from '../services/aiService';
import type { Position, ChatMessage } from '../types';

const router = useRouter();
const { initAuth, isAuthenticated, currentUser } = useAuth();
const languageStore = useLanguageStore();
const { currentLang } = storeToRefs(languageStore);

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
const isTalking = ref(false);
const isAngry = ref(false);
const isFainted = ref(false); // New Fainted State
const isPouting = ref(false); // New Pouting State
const isHeadHit = ref(false); // New Head Hit State
const isMuted = ref(false);
const message = ref('Hello! I am Lumina!');

// Drag State
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// Interaction State
const clickCount = ref(0);
const lastClickTime = ref(0);
const accumulatedAngle = ref(0);
const lastMouseAngle = ref(0);

// Interaction Accumulator for AI Context
const interactionState = ref({
  clicks: 0,
  accumulatedAngle: 0,
  startTime: 0
});
let interactionTimer: ReturnType<typeof setTimeout> | null = null;
let singleClickTimer: ReturnType<typeof setTimeout> | null = null;

function resetInteractionTimer() {
  if (interactionTimer) clearTimeout(interactionTimer);
  interactionTimer = setTimeout(processInteraction, 1500); // 1.5s idle trigger
}

function processInteraction() {
  // If local states are active, we assume they handled the interaction
  if (isFainted.value || isAngry.value || isDizzy.value) {
    resetInteractionState();
    return;
  }

  // Check if there's significant interaction to report
  const { clicks, accumulatedAngle } = interactionState.value;

  // Single click handled by chat toggle?
  if (clicks === 1 && Math.abs(accumulatedAngle) < 360) {
    // Logic handled in handleAgentClick's timeout
    // But if we are here, it means 1.5s passed.
    // If single click happened, toggleChat() already ran 300ms after click.
    // So we don't need to report it to AI unless we want AI to know "User opened chat".
    // Let's skip reporting single clicks that opened chat.
    resetInteractionState();
    return;
  }

  if (clicks === 0 && Math.abs(accumulatedAngle) < 360) {
    return; // Noise
  }

  // Construct message
  let desc = '[System Event]: User interaction session ended. ';
  if (clicks > 0) desc += `User clicked you ${clicks} times. `;
  if (Math.abs(accumulatedAngle) > 360)
    desc += `User circled the mouse ${Math.round(accumulatedAngle)} degrees around you. `;

  desc += 'Decide how to react based on this combination.';

  // Send to AI
  console.log('Processing Interaction:', desc);
  handleSendMessage(desc);

  resetInteractionState();
}

function resetInteractionState() {
  interactionState.value = { clicks: 0, accumulatedAngle: 0, startTime: Date.now() };
}

// Handle Mouse Movement for Dizzy/Faint Detection
const handleMouseMove = (event: MouseEvent) => {
  if (isFainted.value) return;

  resetInteractionTimer();

  // Existing logic for eyes following mouse
  // const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect();
  // If we are not hovering the agent, we might still be circling it if we use global coordinates relative to agent center
  // But the event listener is on window (see onMounted), so this is fine.

  // We need the Agent's center position.
  // x, y are refs to the top-left corner.
  const centerX = x.value + AGENT_SIZE / 2;
  const centerY = y.value + AGENT_SIZE / 2;

  // Eye offset logic
  eyeOffset.value = {
    x: (event.clientX - centerX) / 20,
    y: (event.clientY - centerY) / 20
  };

  // Calculate Angle for Circling Detection
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  let delta = currentAngle - lastMouseAngle.value;
  // Normalize delta to -180 to 180
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  // Only accumulate if movement is significant but not a huge jump (teleport)
  if (Math.abs(delta) < 100) {
    accumulatedAngle.value += delta;
    interactionState.value.accumulatedAngle += delta;
  }

  lastMouseAngle.value = currentAngle;

  // Threshold: 3 full circles (1080 degrees)
  if (Math.abs(accumulatedAngle.value) > 1080) {
    triggerFaint();
    resetInteractionState(); // Clear AI accumulator if local triggers
  }
};

const triggerFaint = () => {
  isFainted.value = true;
  isDizzy.value = true;
  message.value = "I'm... spinning... @.@";
  accumulatedAngle.value = 0;

  // ASYNC MEMORY INJECTION: Notify AI context for future conversations
  // We add this to messages but do NOT call sendMessageToAI
  messages.value.push({
    role: 'user',
    text: '[System Event: User made you dizzy by circling the mouse around you rapidly.]'
  });

  setTimeout(() => {
    message.value = 'Zzz...';
    isDizzy.value = false; // Transition to full faint (sleeping)
  }, 1500);

  // Wake up after 5 seconds
  setTimeout(() => {
    isFainted.value = false;
    message.value = 'Ugh... what happened?';
  }, 6500);
};

// Handle Clicks for Angry Interaction
const handleAgentClick = () => {
  if (isFainted.value) return;

  const now = Date.now();

  // Clear pending single click action if any
  if (singleClickTimer) clearTimeout(singleClickTimer);

  if (now - lastClickTime.value < 500) {
    clickCount.value++;
  } else {
    clickCount.value = 1;
  }
  lastClickTime.value = now;

  interactionState.value.clicks++;
  resetInteractionTimer();

  // Single Click Logic: Wait 300ms to see if more clicks come
  if (clickCount.value === 1) {
    singleClickTimer = setTimeout(() => {
      // If we are here, no more clicks happened in 300ms
      toggleChat();
    }, 300);
  }

  if (clickCount.value >= 5) {
    isAngry.value = true;
    message.value = 'Stop poking me! Baka! 💢';
    clickCount.value = 0;

    resetInteractionState(); // Clear AI accumulator if local triggers

    // ASYNC MEMORY INJECTION: Notify AI context for future conversations
    messages.value.push({
      role: 'user',
      text: '[System Event: User poked you rapidly 5 times. You got angry and called them Baka.]'
    });
    // We also add the Agent's reaction to history so it knows it already responded
    messages.value.push({
      role: 'agent',
      text: 'Stop poking me! Baka! 💢'
    });

    setTimeout(() => (isAngry.value = false), 2000);
  }
};

// Add global mouse listener
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});

// Chat State
const chatOpen = ref(false);
const messages = ref<ChatMessage[]>([{ role: 'agent', text: 'Hello! How can I help you today?' }]);
const isLoading = ref(false);

// Task Executor
const { plan, isExecuting, executeTask, setPlan, stopTask } = useTaskExecutor();

const lineStart = computed(() => ({
  x: x.value + AGENT_SIZE / 2,
  y: y.value + AGENT_SIZE / 2
}));

const lineEnd = computed(() => {
  if (!guideTargetRect.value) return { x: 0, y: 0 };
  return {
    x: guideTargetRect.value.left + guideTargetRect.value.width / 2,
    y: guideTargetRect.value.top + guideTargetRect.value.height / 2
  };
});

// Update guideTargetRect loop to handle scrolling/movement
const updateGuideRect = () => {
  // Polling for guide target during execution if missing
  if (!guideTarget.value && plan.value?.status === 'running') {
    const activeStep = plan.value.steps.find((s) => s.status === 'running');
    if (activeStep?.target) {
      const el = resolveTarget(activeStep.target);
      if (el) {
        guideTarget.value = el;
        guideLabel.value = activeStep.description || 'Working...';
      }
    }
  }

  if (guideTarget.value) {
    if (!document.body.contains(guideTarget.value)) {
      guideTarget.value = null;
      guideTargetRect.value = null;
    } else {
      const rect = guideTarget.value.getBoundingClientRect();
      guideTargetRect.value = rect;
    }
  }
  requestAnimationFrame(updateGuideRect);
};
requestAnimationFrame(updateGuideRect);

// Sync with Plan Execution
watch(
  () => plan.value?.steps,
  (steps) => {
    if (!plan.value) {
      // Clear guide if plan is done/cancelled
      if (!guideLabel.value || guideLabel.value === 'Executing plan...') {
        // Only clear if we set it?
      }
      return;
    }
  },
  { deep: true }
);

watch(isExecuting, (newVal) => {
  if (!newVal) {
    guideTarget.value = null;
    guideTargetRect.value = null;
    guideLabel.value = '';
  }
});

// We need to know which step is active to update guideTarget
watch(
  () => plan.value?.steps,
  async (steps) => {
    if (!steps) return;
    const activeStep = steps.find((s) => s.status === 'running');
    if (activeStep && activeStep.target) {
      const el = resolveTarget(activeStep.target);
      if (el) {
        guideTarget.value = el;
        guideTargetRect.value = el.getBoundingClientRect();
        guideLabel.value = activeStep.description || 'Working...';
      }
    }
  },
  { deep: true }
);

// Celebrate when plan is completed
watch(
  () => plan.value?.status,
  (newStatus) => {
    if (newStatus === 'completed') {
      isHappy.value = true;
      message.value = 'Mission Accomplished!';
      guideLabel.value = 'Done!';
      setTimeout(() => {
        isHappy.value = false;
        if (message.value === 'Mission Accomplished!') message.value = '';
        if (guideLabel.value === 'Done!') guideLabel.value = '';
      }, 3000);
    } else if (newStatus === 'failed') {
      isConfused.value = true;
      message.value = 'Oops, something went wrong.';
      setTimeout(() => {
        isConfused.value = false;
        message.value = '';
      }, 3000);
    }
  }
);

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
const AGENT_SIZE = 400; // px - Increased to ensure full visibility
const MOVE_INTERVAL = 8000; // ms (for idle roaming)
const LERP_FACTOR = 0.05; // Smoothness factor
const MOUSE_FOLLOW_OFFSET = { x: 40, y: 40 };

// --- Computed ---
const containerStyle = computed(() => ({
  transform: `translate(${x.value}px, ${y.value}px)`,
  width: `${AGENT_SIZE}px`,
  height: `${AGENT_SIZE}px`,
  // Disable transition when dragging for immediate response
  transition: isDragging.value
    ? 'none'
    : isHovered.value
      ? 'none'
      : 'transform 40s cubic-bezier(0.4, 0.0, 0.2, 1)',
  zIndex: 9999,
  position: 'fixed' as const,
  top: 0,
  left: 0,
  pointerEvents: 'auto' as const,
  overflow: 'visible' // Ensure popups/shadows aren't clipped
}));

// --- Logic: Chat ---
const toggleChat = () => {
  console.log('Agent: toggleChat received, new state:', !chatOpen.value);
  chatOpen.value = !chatOpen.value;
  if (chatOpen.value) {
    message.value = ''; // Clear bubble when chat opens
  }
};

const speak = (text: string) => {
  if (isMuted.value || !window.speechSynthesis) return;

  // Cancel current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.pitch = 1.2; // Slightly higher pitch for "cute" robot voice
  utterance.rate = 1.1; // Slightly faster

  utterance.onstart = () => {
    isTalking.value = true;
  };

  utterance.onend = () => {
    isTalking.value = false;
  };

  utterance.onerror = () => {
    isTalking.value = false;
  };

  window.speechSynthesis.speak(utterance);
};

async function handleSendMessage(text: string) {
  // Add user message
  messages.value.push({ role: 'user', text });
  isLoading.value = true;
  message.value = 'Hmm...'; // Thinking text

  // Call AI Service
  const rawResponse = await sendMessageToAI(text, messages.value);

  isLoading.value = false;

  // --- Emotion Parsing Logic ---
  let cleanResponse = rawResponse;

  // Reset emotions first
  isAngry.value = false;
  isPouting.value = false;

  // Detect angry keywords or tags
  if (
    rawResponse.includes('[ANGRY]') ||
    rawResponse.includes('Baka') ||
    rawResponse.includes('Hmph') ||
    rawResponse.includes('💢')
  ) {
    isAngry.value = true;
    cleanResponse = cleanResponse.replace('[ANGRY]', '');
  }

  // Detect shy/pouting tags
  if (rawResponse.includes('[POUT]') || rawResponse.includes('[SHY]')) {
    isPouting.value = true;
    cleanResponse = cleanResponse.replace('[POUT]', '').replace('[SHY]', '');
  }

  // Auto-reset emotions after a delay
  if (isAngry.value || isPouting.value) {
    setTimeout(() => {
      isAngry.value = false;
      isPouting.value = false;
    }, 4000);
  }

  // --- Clean hidden commands ---
  const displayResponse = cleanResponse
    .replace(/highlight:\s*[^\n]+/g, '')
    .replace(/navigate:\s*[^\n]+/g, '')
    .replace(/click:\s*[^\n]+/g, '')
    .replace(/hover:\s*[^\n]+/g, '')
    .replace(/scroll:\s*[^\n]+/g, '')
    .replace(/input:\s*[^\n]+/g, '')
    .replace(/press:\s*[^\n]+/g, '')
    .replace(/plan:\s*\[[\s\S]*?\]/g, '') // Hide JSON plan
    .trim();

  // Update Agent Bubble and Chat History
  if (displayResponse) {
    messages.value.push({ role: 'agent', text: displayResponse });
    message.value = displayResponse; // Show in bubble!
    speak(displayResponse);
  } else {
    const fallback = "I'm on it!";
    messages.value.push({ role: 'agent', text: fallback });
    message.value = fallback;
    speak(fallback);
  }

  // Use raw response for command parsing (commands might be stripped from display)
  const response = rawResponse;

  // Check for Task Plan
  const planMatch = response.match(/plan:\s*(\[[\s\S]*?\])/);
  if (planMatch) {
    try {
      const planJson = JSON.parse(planMatch[1]);
      if (Array.isArray(planJson)) {
        console.log('Executing Plan:', planJson);
        // Execute and wait for result
        const result = await setPlan(planJson);

        if (result.success) {
          // Success Emotion
          isHappy.value = true;
          const successMsg = 'Mission Complete! Praise me! [HAPPY]';
          messages.value.push({ role: 'agent', text: successMsg });
          message.value = 'Mission Complete! ✨';
          speak('Mission Complete! Praise me!');

          setTimeout(() => {
            isHappy.value = false;
          }, 4000);
        } else {
          // Fail Emotion
          isPouting.value = true;
          // Maybe use SHY if available, but Pouting is mapped
          const failMsg = `Oops... I failed: ${result.message || 'Unknown error'}. [SHY]`;
          messages.value.push({ role: 'agent', text: failMsg });
          message.value = 'Oops... failed... 😖';
          speak("Oops... I failed... don't look at me!");

          setTimeout(() => {
            isPouting.value = false;
          }, 4000);
        }
      }
    } catch (e) {
      console.error('Failed to parse task plan:', e);
    }
  }

  // Check for Guide Commands (Single commands)
  // 1. Highlight: highlight: selector
  const guideMatch = response.match(/highlight:\s*([^\n]+)/);
  if (guideMatch) {
    const selector = guideMatch[1].trim();
    const el = resolveTarget(selector);
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
    const path = navMatch[1].trim();
    console.log('Navigating to:', path);
    router.push(path);
  }

  // 3. Click: click: selector
  const clickMatch = response.match(/click:\s*([^\n]+)/);
  if (clickMatch) {
    const selector = clickMatch[1].trim();
    const el = resolveTarget(selector);
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

  // 4. Hover: hover: selector
  const hoverMatch = response.match(/hover:\s*([^\n]+)/);
  if (hoverMatch) {
    const selector = hoverMatch[1].trim();
    const el = resolveTarget(selector);
    if (el) {
      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = 'Hovering...';

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

        setTimeout(() => {
          guideTarget.value = null;
          guideTargetRect.value = null;
        }, 1500);
      }, 500);
    }
  }

  // 5. Scroll: scroll: direction_or_selector
  const scrollMatch = response.match(/scroll:\s*([^\n]+)/);
  if (scrollMatch) {
    const target = scrollMatch[1].trim();
    if (target === 'down') {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    } else if (target === 'up') {
      window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
    } else if (target === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = resolveTarget(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 6. Input: input: selector | value
  const inputMatch = response.match(/input:\s*([^|]+)\|\s*(.+)/);
  if (inputMatch) {
    const selector = inputMatch[1].trim();
    const value = inputMatch[2].trim();
    const el = resolveTarget(selector) as HTMLInputElement;
    if (el) {
      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = `Typing "${value}"...`;

      setTimeout(() => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        guideTarget.value = null;
      }, 1000);
    }
  }

  // 7. Press: press: key [on selector]
  const pressMatch = response.match(/press:\s*([^\s]+)(?:\s+on\s+(.+))?/);
  if (pressMatch) {
    const key = pressMatch[1].trim();
    const selector = pressMatch[2]?.trim();
    let el = document.activeElement as HTMLElement;

    if (selector) {
      const found = resolveTarget(selector);
      if (found) el = found;
    }

    if (el) {
      guideTarget.value = el;
      guideTargetRect.value = el.getBoundingClientRect();
      guideLabel.value = `Pressing ${key}...`;

      el.focus();
      setTimeout(() => {
        const options = { key, code: key, bubbles: true, cancelable: true, view: window };
        el.dispatchEvent(new KeyboardEvent('keydown', options));
        el.dispatchEvent(new KeyboardEvent('keypress', options));
        el.dispatchEvent(new KeyboardEvent('keyup', options));

        setTimeout(() => {
          guideTarget.value = null;
          guideTargetRect.value = null;
        }, 1000);
      }, 500);
    }
  }
}

// --- Logic: Dragging ---
const startDrag = (event: MouseEvent | TouchEvent) => {
  if (isFainted.value || isDizzy.value) return;

  // Prevent default to avoid selecting text etc.
  // event.preventDefault(); // Don't prevent default on touchstart as it might block scroll if not intended

  isDragging.value = true;
  isMoving.value = false; // Stop autonomous movement

  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

  dragOffset.value = {
    x: clientX - x.value,
    y: clientY - y.value
  };

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  event.preventDefault(); // Prevent scrolling while dragging

  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

  let newX = clientX - dragOffset.value.x;
  let newY = clientY - dragOffset.value.y;

  // Boundary checks during drag
  const maxX = window.innerWidth - AGENT_SIZE;
  const maxY = window.innerHeight - AGENT_SIZE;

  newX = Math.max(-100, Math.min(newX, maxX + 100)); // Allow slight overflow
  newY = Math.max(-50, Math.min(newY, maxY + 50));

  x.value = newX;
  y.value = newY;
};

const endDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchend', endDrag);

  // Snap back if out of bounds (more strict than drag limits)
  checkBoundaries();
};

const checkBoundaries = () => {
  const maxX = window.innerWidth - AGENT_SIZE;
  const maxY = window.innerHeight - AGENT_SIZE;

  // Smooth return if out of bounds
  let targetX = x.value;
  let targetY = y.value;

  if (x.value < 0) targetX = 0;
  if (x.value > maxX) targetX = maxX;
  if (y.value < 0) targetY = 0;
  if (y.value > maxY) targetY = maxY;

  // Head hit logic
  if (y.value <= 10) {
    triggerHeadHit();
    targetY = 60;
  }

  // Apply corrections
  if (targetX !== x.value || targetY !== y.value) {
    x.value = targetX;
    y.value = targetY;
  }
};

const triggerHeadHit = () => {
  if (isHeadHit.value || isFainted.value) return;

  isHeadHit.value = true;
  message.value = 'Ouch! My head! >_<';
  isMoving.value = false; // Stop moving

  // Reset after 2s
  setTimeout(() => {
    isHeadHit.value = false;
    if (message.value === 'Ouch! My head! >_<') message.value = '';
  }, 2000);
};

// --- Logic: Movement & Animation Loop ---
let animationFrameId: number;
let roamTimer: number | null = null;

const updateEyeTracking = () => {
  if (isDizzy.value || isFainted.value || isHeadHit.value) return; // Don't track eyes if dizzy/fainted/hurt

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

  // Priority 2: Look at Mouse (only if not Fainted)
  const agentCenterX = x.value + AGENT_SIZE / 2;
  const agentCenterY = y.value + AGENT_SIZE / 2;

  // Use the last known mouse position from global listener
  // We can just rely on the eyeOffset set in handleMouseMove actually,
  // but handleMouseMove sets it based on event.
  // Here we want to smooth it or keep it updated.
  // Actually handleMouseMove updates eyeOffset directly.
  // So we might not need this unless we want to look at something else.
  // But wait, handleMouseMove updates eyeOffset.value.
};

const startLoop = () => {
  const loop = () => {
    checkBoundaries(); // Check boundaries every frame

    if (isDizzy.value || isFainted.value || isHeadHit.value) {
      // If dizzy/fainted/hurt, no movement
    } else if (isHovered.value && !chatOpen.value) {
      // Mouse Follow Logic (Lerp) - Only if not chatting
      // ... existing logic ...
    }

    // Decay accumulated angle slowly if not circling
    if (accumulatedAngle.value > 0) {
      accumulatedAngle.value = Math.max(0, accumulatedAngle.value - 5);
    } else if (accumulatedAngle.value < 0) {
      accumulatedAngle.value = Math.min(0, accumulatedAngle.value + 5);
    }

    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);
};

// --- Logic: Random Roaming (Idle Mode) ---
const startRoaming = () => {
  moveRandomly();
  roamTimer = window.setInterval(() => {
    if (
      !isHovered.value &&
      !isDizzy.value &&
      !isFainted.value &&
      !isHeadHit.value &&
      !chatOpen.value
    ) {
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

// --- Lifecycle ---
onMounted(async () => {
  // handleMouseMove is added in the other onMounted block
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
  // handleMouseMove removal is in the other onBeforeUnmount block
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
