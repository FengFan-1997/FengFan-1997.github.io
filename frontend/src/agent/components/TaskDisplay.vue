<template>
  <div v-if="plan" class="task-display">
    <div class="task-header">
      <span class="title">Current Mission</span>
      <span class="status" :class="plan.status">{{ plan.status }}</span>
    </div>
    <div class="task-steps">
      <div 
        v-for="(step, index) in plan.steps" 
        :key="index"
        class="step-item"
        :class="step.status"
      >
        <div class="step-icon">
            <span v-if="step.status === 'completed'">✓</span>
            <span v-else-if="step.status === 'running'" class="spinner">↻</span>
            <span v-else>•</span>
        </div>
        <div class="step-desc">{{ step.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskPlan } from '../types/task';

defineProps<{
  plan: TaskPlan | null;
}>();
</script>

<style scoped>
.task-display {
  position: absolute;
  top: -10px; /* Position above agent/chat? Or maybe stick it to the side */
  left: 120%; /* Right side of the agent */
  width: 220px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-family: 'Segoe UI', sans-serif;
  transform: translateY(-50%);
  pointer-events: none; /* Let clicks pass through unless interactive */
  border: 1px solid rgba(0,0,0,0.05);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
}

.status {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: #eee;
}
.status.running { background: #e6f7ff; color: #1890ff; }
.status.completed { background: #f6ffed; color: #52c41a; }
.status.failed { background: #fff1f0; color: #f5222d; }

.task-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.step-item.running {
  background: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
}

.step-item.completed {
  color: #52c41a;
  text-decoration: line-through;
  opacity: 0.8;
}

.step-item.failed {
  color: #f5222d;
}

.step-icon {
  width: 16px;
  display: flex;
  justify-content: center;
  font-weight: bold;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
