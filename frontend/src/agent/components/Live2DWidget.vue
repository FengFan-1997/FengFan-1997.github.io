<template>
  <div class="live2d-widget-container" ref="container" :class="{ 'is-angry': isAngry, 'is-dizzy': isDizzy, 'is-head-hit': isHeadHit }">
    <!-- The widget script appends elements to body.
         We will move the #waifu element here after initialization. -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, toRefs } from 'vue';

const emit = defineEmits(['toggle-chat']);

const props = defineProps<{
  message?: string;
  isTalking?: boolean;
  isMoving?: boolean;
  isHovered?: boolean;
  isDizzy?: boolean;
  isHappy?: boolean;
  isConfused?: boolean;
  isAngry?: boolean;
  isFainted?: boolean;
  isPouting?: boolean;
  isHeadHit?: boolean;
}>();

const { isAngry, isDizzy, isHeadHit } = toRefs(props);

const container = ref<HTMLElement | null>(null);

// Expose toggleChat to window so it can be called from Live2D tools
const toggleChat = () => {
  console.log('Live2DWidget: toggleChat called');
  emit('toggle-chat');
};

// Make toggleChat available globally for the custom tool
(window as any).toggleChat = toggleChat;

// Watch for props changes to trigger Live2D expressions
watch(() => props.isAngry, (val) => {
  if (val) (window as any).loadRandModel?.(); // Just an example, ideally we load specific expression
});
// Note: waifu-tips.js usually handles random interactions.
// We can extend this to call specific motions if we reverse-engineer the model.js.
// For now, we trust the agent's message bubble to convey the emotion.

const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded to avoid duplicates
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

const initWidget = async () => {
  try {
    // Load the autoload script from public assets
    await loadScript('/live2d/dist/autoload.js');
    
    if ((window as any).initLive2DWidget) {
      // Initialize with configuration
      (window as any).initLive2DWidget({
        // Set basePath to point to public assets
        basePath: '/live2d/dist/',
        // Configuration options
        // We can customize modelId, tools, etc. here
        // Added 'chat' tool which we'll implement via CSS/JS injection if needed, 
        // or hijack an existing tool icon. 
        // For now, let's use 'info' as the chat trigger or add a custom one if the library supports it.
        // The library renders tools based on this array.
        // We will inject a custom button logic after init.
        tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
        // You can enable dragging if desired
        drag: true 
      });
      
      // Inject custom chat button logic and move widget
      injectChatButton();
    } else {
      console.error('initLive2DWidget is not defined on window');
    }
  } catch (error) {
    console.error('Error loading Live2D widget:', error);
  }
};

const injectChatButton = () => {
  // Wait for the widget to render the tool bar and waifu element
  const checkTools = setInterval(() => {
    const toolBar = document.getElementById('waifu-tool');
    const waifu = document.getElementById('waifu');
    
    if (toolBar && waifu) {
      clearInterval(checkTools);
      
      // Move waifu to container if container exists
      if (container.value) {
        container.value.appendChild(waifu);
        // Reset fixed positioning to allow absolute positioning within container
        waifu.style.position = 'absolute';
        waifu.style.bottom = '0';
        waifu.style.left = '0';
        waifu.style.transform = 'none'; // Remove default transform if needed, or adjust
      }

      // Create chat button
      const chatBtn = document.createElement('span');
      chatBtn.className = 'fa fa-lg fa-comment'; // FontAwesome comment icon
      chatBtn.style.cursor = 'pointer';
      chatBtn.title = 'Chat with Agent';
      chatBtn.onclick = () => {
        toggleChat();
      };
      
      // Insert as the first item or wherever preferred
      toolBar.insertBefore(chatBtn, toolBar.firstChild);
    }
  }, 500);
};

// Watch for messages from parent
watch(() => props.message, (newMsg) => {
  if (newMsg && (window as any).showMessage) {
    (window as any).showMessage(newMsg, 4000, 10);
  }
});

const cleanup = () => {
  // Remove the widget elements from DOM
  const waifu = document.getElementById('waifu');
  if (waifu) waifu.remove();
  
  const waifuToggle = document.getElementById('waifu-toggle');
  if (waifuToggle) waifuToggle.remove();
}

onMounted(() => {
  // Initialize widget when component mounts
  // Use a small timeout to ensure DOM is ready
  setTimeout(() => {
    initWidget();
  }, 100);
});

onUnmounted(() => {
  // Clean up when component unmounts (e.g. navigating away)
  cleanup();
});
</script>

<style scoped>
.live2d-widget-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Force overrides for waifu widget to ensure it stays inside our container */
:deep(#waifu) {
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  z-index: 1 !important;
  transform: none !important;
}

:deep(#waifu-tool) {
  top: 0 !important;
  right: -20px !important;
}

/* Add shake animation for angry state */
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}

.is-angry :deep(#waifu) {
  animation: shake 0.5s;
  animation-iteration-count: infinite; 
}

/* Add squash animation for head hit */
@keyframes squash {
  0% { transform: scale(1, 1) translateY(0); }
  50% { transform: scale(1.1, 0.8) translateY(20px); }
  100% { transform: scale(1, 1) translateY(0); }
}

.is-head-hit :deep(#waifu) {
  animation: squash 0.5s ease-out;
  animation-iteration-count: 1;
}
</style>
