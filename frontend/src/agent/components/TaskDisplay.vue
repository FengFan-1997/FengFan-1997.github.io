<template>
  <transition name="task-fade">
    <div v-if="plan" class="task-display" :class="placement">
      <div class="task-header">
        <div class="header-icon">📋</div>
        <div class="header-info">
          <span class="title">Mission Log</span>
          <span class="status-badge" :class="plan.status">{{ plan.status }}</span>
        </div>
      </div>

      <div class="task-progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>

      <div class="task-steps">
        <div
          v-for="(step, index) in plan.steps"
          :key="index"
          class="step-item"
          :class="step.status"
        >
          <div class="step-icon">
            <span v-if="step.status === 'completed'" class="icon-success">✓</span>
            <span v-else-if="step.status === 'running'" class="spinner">↻</span>
            <span v-else-if="step.status === 'failed'" class="icon-fail">✕</span>
            <span v-else class="icon-dot">●</span>
          </div>
          <div class="step-desc">{{ step.description }}</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskPlan } from '../types/task';

const props = withDefaults(
  defineProps<{
    plan: TaskPlan | null;
    placement?: 'left' | 'right';
  }>(),
  {
    placement: 'right'
  }
);

const progressPercentage = computed(() => {
  if (!props.plan || props.plan.steps.length === 0) return 0;
  const completed = props.plan.steps.filter((s) => s.status === 'completed').length;
  return (completed / props.plan.steps.length) * 100;
});
</script>

<style scoped>
.task-display {
  position: absolute;
  top: 0;
  width: 240px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  font-family: 'Nunito', 'Segoe UI', sans-serif;
  transform: translateY(0);
  pointer-events: auto;
  z-index: 90;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-display.right {
  left: 130%;
}

.task-display.left {
  right: 130%;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.header-icon {
  font-size: 24px;
  background: #fff;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.header-info {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 14px;
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: -0.5px;
}

.status-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
}

.status-badge.running {
  color: #3498db;
}
.status-badge.completed {
  color: #2ecc71;
}
.status-badge.failed {
  color: #e74c3c;
}

.task-progress-bar {
  height: 4px;
  background: #f0f2f5;
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.5s ease;
}

.task-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #57606f;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.step-item.running {
  background: #fff;
  border-color: #3498db;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.15);
  transform: scale(1.02);
}

.step-item.completed {
  color: #a4b0be;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.icon-success {
  color: #2ecc71;
  font-weight: bold;
}
.icon-fail {
  color: #e74c3c;
  font-weight: bold;
}
.icon-dot {
  color: #ced6e0;
  font-size: 10px;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #3498db;
  font-weight: bold;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Transition */
.task-fade-enter-active,
.task-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-fade-enter-from,
.task-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
</style>
