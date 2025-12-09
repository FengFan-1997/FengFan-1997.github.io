<template>
  <nav class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="toggle-btn" @click="toggleSidebar">
      <i class="fas" :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
    </div>
    
    <div class="nav-track">
      <a 
        v-for="(item, index) in navItems" 
        :key="index"
        :href="item.target"
        class="nav-item"
        :class="{ active: activeSection === item.id }"
        @click.prevent="scrollTo(item.target)"
        :title="item.label"
      >
        <div class="icon-box">
          <span class="glyph">{{ item.icon }}</span>
        </div>
        <span class="label">{{ item.label }}</span>
      </a>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isCollapsed = ref(true);

const navItems = [
  { id: 'hero', target: '#hero', label: '首页', icon: '🏠' },
  { id: 'projects', target: '#projects', label: '项目', icon: '🧩' },
  { id: 'about', target: '#about', label: '关于', icon: '👤' },
  { id: 'skills', target: '#skills', label: '技能', icon: '🧠' },
  { id: 'experience', target: '#experience', label: '经历', icon: '💼' },
  { id: 'testimonials', target: '#testimonials', label: '评价', icon: '💬' },
];

const activeSection = ref('hero');

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const scrollTo = (target: string) => {
  const element = document.querySelector(target);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const checkScroll = () => {
  const viewportHeight = window.innerHeight;
  
  // Find the section closest to the middle of the viewport
  let current = '';
  let minDistance = Infinity;

  navItems.forEach(item => {
    const element = document.querySelector(item.target);
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2);
      if (distance < minDistance) {
        minDistance = distance;
        current = item.id;
      }
    }
  });
  
  if (current) {
    activeSection.value = current;
  }
};

onMounted(() => {
  const container = document.querySelector('.portfolio-container');
  if (container) {
    container.addEventListener('scroll', checkScroll);
  } else {
    window.addEventListener('scroll', checkScroll);
  }
  checkScroll();
});

onBeforeUnmount(() => {
  const container = document.querySelector('.portfolio-container');
  if (container) {
    container.removeEventListener('scroll', checkScroll);
  } else {
    window.removeEventListener('scroll', checkScroll);
  }
});
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 35%; /* Moved up from 50% to avoid blocking bottom icons */
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: rgba(5, 10, 20, 0.98); /* Almost opaque for better visibility */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.6); /* Brighter border */
  border-left: none;
  border-radius: 0 20px 20px 0;
  padding: 20px 10px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  width: 200px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.3); /* Stronger shadow + glow */
}

.sidebar.collapsed {
  transform: translateY(-50%) translateX(-100%);
}

.toggle-btn {
  position: absolute;
  right: -32px; /* Outside the sidebar */
  top: 50%;
  transform: translateY(-50%);
  width: 32px; /* Slightly wider */
  height: 64px; /* Taller */
  background: rgba(5, 10, 20, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.6);
  border-left: none;
  border-radius: 0 16px 16px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #38bdf8;
  font-size: 14px;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  z-index: 101;
}

.toggle-btn:hover {
  width: 36px;
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.nav-track {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #94a3b8;
  padding: 8px 10px;
  border-radius: 12px;
  transition: all 0.3s;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.icon-box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.glyph {
  font-size: 18px;
  line-height: 1;
}

.label {
  font-size: 14px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.3s;
}

.sidebar.collapsed .label {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #38bdf8;
  border-radius: 0 4px 4px 0;
}
</style>
