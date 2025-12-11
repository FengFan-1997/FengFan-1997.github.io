<template>
  <div v-if="visible" class="guide-overlay" :style="style">
    <div class="guide-arrow" :class="placement"></div>
    <div class="guide-label" v-if="label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  targetRect: DOMRect | null;
  label?: string;
}>();

const placement = 'bottom'; // Could be dynamic based on screen position

const style = computed(() => {
  if (!props.targetRect) return {};
  
  const { top, left, width, height } = props.targetRect;
  const padding = 5;
  
  return {
    top: `${top - padding}px`,
    left: `${left - padding}px`,
    width: `${width + padding * 2}px`,
    height: `${height + padding * 2}px`,
  };
});
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  z-index: 9998; /* Below Agent (9999) */
  border: 3px solid #ff4757;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(255, 71, 87, 0.5);
  pointer-events: none; /* Let clicks pass through to target */
  animation: pulse 1.5s infinite;
}

.guide-label {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4757;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
}
</style>
