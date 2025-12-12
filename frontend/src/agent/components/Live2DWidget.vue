<template>
  <div
    class="live2d-widget-container"
    ref="container"
    :class="{ 'is-angry': isAngry, 'is-dizzy': isDizzy, 'is-head-hit': isHeadHit }"
  >
    <!-- Widget will be injected here -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, toRefs } from 'vue';
import { initWidget, showMessage } from '../live2d-widget/widget';
import type { ModelManager } from '../services/Live2DModelManager';

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
const modelMgr = ref<ModelManager | null>(null);

// Expose toggleChat to window so it can be called from Live2D tools
const toggleChat = () => {
  console.log('Live2DWidget: toggleChat called');
  emit('toggle-chat');
};

// --- Watchers for Agent Integration ---

watch(
  () => props.message,
  (newMsg) => {
    if (newMsg) {
      showMessage(newMsg, 4000, 10);
      // Trigger talking motion if available
      if (modelMgr.value) {
        modelMgr.value.startMotion('talking');
        // If 'talking' motion doesn't exist, it might just ignore or we can map to a random motion
        // modelMgr.value.startMotion('tap_body');
      }
    }
  }
);

watch(
  () => props.isAngry,
  (val) => {
    if (val && modelMgr.value) {
      modelMgr.value.setExpression('f03'); // Assuming f03 is angry
      modelMgr.value.startMotion('shake');
    } else if (!val && modelMgr.value) {
      modelMgr.value.setExpression('f01'); // Reset to normal
    }
  }
);

watch(
  () => props.isHappy,
  (val) => {
    if (val && modelMgr.value) {
      modelMgr.value.setExpression('f02'); // Assuming f02 is happy
    } else if (!val && modelMgr.value) {
      modelMgr.value.setExpression('f01');
    }
  }
);

watch(
  () => props.isPouting,
  (val) => {
    if (val && modelMgr.value) {
      modelMgr.value.setExpression('f05'); // Assuming f05 is pout/sad
    } else if (!val && modelMgr.value) {
      modelMgr.value.setExpression('f01');
    }
  }
);

watch(
  () => props.isConfused,
  (val) => {
    if (val && modelMgr.value) {
      modelMgr.value.setExpression('f06');
    } else if (!val && modelMgr.value) {
      modelMgr.value.setExpression('f01');
    }
  }
);

watch(
  () => props.isDizzy,
  (val) => {
    if (val && modelMgr.value) {
      modelMgr.value.setExpression('f07');
    } else if (!val && modelMgr.value) {
      modelMgr.value.setExpression('f01');
    }
  }
);

const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
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

const initLive2D = async () => {
  try {
    // 1. Load Core SDK
    await loadScript('/live2d/core/live2d.min.js');

    // 2. Initialize Widget
    if (container.value) {
      modelMgr.value = await initWidget(
        {
          waifuPath: '/live2d/waifu-tips.json',
          cdnPath: '/live2d/',
          cubism2Path: '/live2d/core/live2d.min.js',
          // Updated tools list: Chat (Agent), Quote (Hitokoto), Model, Texture, Photo
          tools: ['chat', 'hitokoto', 'switch-model', 'switch-texture', 'photo'],
          drag: true,
          logLevel: 'none',
          onChat: toggleChat
        },
        container.value
      );
    }
  } catch (error) {
    console.error('Error loading Live2D widget:', error);
  }
};

const cleanup = () => {
  // ModelManager handles cleanup if we call destroy, but currently we just remove DOM
  // Ideally we should add a destroy method to ModelManager
  const waifu = document.getElementById('waifu');
  if (waifu) waifu.remove();
};

onMounted(() => {
  setTimeout(() => {
    initLive2D();
  }, 100);
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.live2d-widget-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Deep styles for the widget elements */
:deep(#waifu) {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  transform: translateY(0);
  transition:
    transform 0.3s ease-in-out,
    bottom 3s ease-in-out;
}

:deep(#waifu-tips) {
  animation: waifu-shake 50s ease-in-out 5s infinite;
  background-color: rgba(236, 217, 188, 0.5);
  border: 1px solid rgba(224, 186, 140, 0.62);
  border-radius: 12px;
  box-shadow: 0 3px 15px 2px rgba(191, 158, 118, 0.2);
  font-size: 14px;
  line-height: 24px;
  margin: -30px 20px;
  min-height: 70px;
  opacity: 0;
  overflow: hidden;
  padding: 5px 10px;
  position: absolute;
  text-overflow: ellipsis;
  transition: opacity 1s;
  width: 250px;
  word-break: break-all;
  pointer-events: none; /* Let clicks pass through */
}

:deep(#waifu-tips.waifu-tips-active) {
  opacity: 1;
  transition: opacity 0.2s;
}

:deep(#waifu-tool) {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
  opacity: 0;
  position: absolute;
  right: -20px; /* Adjust for better positioning */
  top: 70px;
  transition: opacity 1s;
}

:deep(#waifu:hover #waifu-tool) {
  opacity: 1;
}

:deep(#waifu-tool svg) {
  cursor: pointer;
  display: block;
  fill: #7b8c9d;
  height: 25px;
  width: 25px;
  transition: fill 0.3s;
}

:deep(#waifu-tool svg:hover) {
  fill: #0684bd;
}

:deep(#live2d) {
  cursor: grab;
  /* width and height are set by canvas attributes but CSS can override */
  width: 300px;
  height: 300px;
}

:deep(#live2d:active) {
  cursor: grabbing;
}

@keyframes waifu-shake {
  2% {
    transform: translate(0.5px, -1.5px) rotate(-0.5deg);
  }
  4% {
    transform: translate(0.5px, 1.5px) rotate(1.5deg);
  }
  6% {
    transform: translate(1.5px, 1.5px) rotate(1.5deg);
  }
  8% {
    transform: translate(2.5px, 1.5px) rotate(0.5deg);
  }
  10% {
    transform: translate(0.5px, 2.5px) rotate(0.5deg);
  }
  /* ... simplified shake ... */
  50% {
    transform: translate(-1.5px, 1.5px) rotate(0.5deg);
  }
  100% {
    transform: translate(0, 0) rotate(0);
  }
}

/* Angry shake override */
.is-angry :deep(#waifu) {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0% {
    transform: translate(1px, 1px) rotate(0deg);
  }
  10% {
    transform: translate(-1px, -2px) rotate(-1deg);
  }
  20% {
    transform: translate(-3px, 0px) rotate(1deg);
  }
  30% {
    transform: translate(3px, 2px) rotate(0deg);
  }
  40% {
    transform: translate(1px, -1px) rotate(1deg);
  }
  50% {
    transform: translate(-1px, 2px) rotate(-1deg);
  }
  60% {
    transform: translate(-3px, 1px) rotate(0deg);
  }
  70% {
    transform: translate(3px, 1px) rotate(-1deg);
  }
  80% {
    transform: translate(-1px, -1px) rotate(1deg);
  }
  90% {
    transform: translate(1px, 2px) rotate(0deg);
  }
  100% {
    transform: translate(1px, -2px) rotate(-1deg);
  }
}

/* Head hit squash */
.is-head-hit :deep(#waifu) {
  animation: squash 0.5s ease-out;
}

@keyframes squash {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  50% {
    transform: scale(1.1, 0.9) translateY(5px);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
</style>
