<template>
  <div 
    class="agent-body" 
    :class="{ 
      'is-moving': isMoving, 
      'is-hovered': isHovered,
      'is-dizzy': isDizzy,
      'is-thinking': isThinking
    }"
  >
    <div class="agent-head">
      <!-- Eyes with tracking logic -->
      <div class="agent-eye left" :style="eyeStyle"></div>
      <div class="agent-eye right" :style="eyeStyle"></div>
      
      <!-- Dizzy Effect (Stars/Swirls) -->
      <div v-if="isDizzy" class="dizzy-stars">
        <span>⭐</span><span>⭐</span><span>⭐</span>
      </div>

      <div class="agent-antenna">
        <div class="agent-antenna-ball"></div>
      </div>
    </div>
    <div class="agent-shadow"></div>
    
    <!-- Speech Bubble -->
    <transition name="fade">
      <div v-if="message" class="speech-bubble">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import type { Position } from '../types';

const props = defineProps<{
  isMoving: boolean;
  isHovered: boolean;
  isDizzy: boolean;
  isThinking?: boolean;
  message: string;
  eyeOffset: Position;
}>();

const { isMoving, isHovered, isDizzy, isThinking, message } = toRefs(props);

const eyeStyle = computed(() => {
  if (props.isThinking) {
    // Thinking pose: Look up-right
    return {
      transform: 'translate(4px, -4px)' 
    };
  }
  return {
    transform: `translate(${props.eyeOffset.x}px, ${props.eyeOffset.y}px)`
  };
});
</script>

<style scoped>
.agent-body {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0);
  border-radius: 50%;
  box-shadow: 
    0 10px 20px rgba(0,0,0,0.1),
    inset -5px -5px 15px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
  z-index: 2;
  cursor: pointer;
}

.agent-body.is-moving {
  animation: float 2s infinite ease-in-out;
}

.agent-body.is-hovered {
  transform: scale(1.1);
  box-shadow: 0 15px 30px rgba(64, 158, 255, 0.3);
}

.agent-body.is-dizzy {
  animation: shake 0.5s infinite;
  background: radial-gradient(circle at 30% 30%, #ffe0e0, #ffcccc);
}

.agent-body.is-thinking .agent-antenna-ball {
  animation: pulse-fast 0.5s infinite alternate;
  background: #faad14; /* Amber for thinking */
}

.agent-head {
  position: relative;
  width: 70%;
  height: 60%;
  background: #409eff;
  border-radius: 40% 40% 45% 45%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 5px 10px rgba(255,255,255,0.4);
  overflow: hidden;
}

.agent-eye {
  width: 12px;
  height: 12px;
  background: #333;
  border-radius: 50%;
  position: absolute;
  top: 40%;
  transition: transform 0.1s linear;
}

.agent-eye.left { left: 25%; }
.agent-eye.right { right: 25%; }

.is-dizzy .agent-eye {
  height: 4px; /* Squint/Closed eyes */
  border-radius: 2px;
}

.agent-antenna {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 15px;
  background: #666;
  z-index: -1;
}

.agent-antenna-ball {
  position: absolute;
  top: -8px;
  left: -4px;
  width: 12px;
  height: 12px;
  background: #ff4d4f;
  border-radius: 50%;
  animation: blink 2s infinite;
}

.agent-shadow {
  position: absolute;
  bottom: -20px;
  width: 60%;
  height: 10px;
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
  filter: blur(4px);
  z-index: 1;
}

.dizzy-stars {
  position: absolute;
  top: -20px;
  width: 100%;
  text-align: center;
  animation: spin 2s infinite linear;
}

.speech-bubble {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #333;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0;
  border-style: solid;
  border-color: white transparent transparent;
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-fast {
  from { transform: scale(1); box-shadow: 0 0 5px #faad14; }
  to { transform: scale(1.3); box-shadow: 0 0 15px #faad14; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
