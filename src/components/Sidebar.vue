<template>
  <nav class="sidebar-wrapper" :class="{ collapsed: isCollapsed }">
    <div class="glass-panel">
      <div class="toggle-area" @click="toggleSidebar">
        <span class="toggle-line"></span>
        <span class="toggle-line short"></span>
      </div>
      
      <div class="nav-list">
        <a 
          v-for="item in navItems" 
          :key="item.id"
          :href="item.target"
          class="nav-item"
          :class="{ active: activeSection === item.id }"
          @click.prevent="scrollTo(item.target)"
        >
          <div class="indicator-container">
            <div class="indicator-dot"></div>
            <div class="indicator-line"></div>
          </div>
          <span class="nav-label">
            {{ t(`nav.${item.id}`) }}
          </span>
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useLanguageStore } from '../stores/language';
import { storeToRefs } from 'pinia';

const languageStore = useLanguageStore();
const { t } = languageStore;

const isCollapsed = ref(false);
const activeSection = ref('hero');

const navItems = [
  { id: 'hero', target: '#hero' },
  { id: 'projects', target: '#projects' },
  { id: 'about', target: '#about' },
  { id: 'skills', target: '#skills' },
  { id: 'experience', target: '#experience' },
  { id: 'testimonials', target: '#testimonials' },
];

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
  let current = '';
  let minDistance = Infinity;

  navItems.forEach(item => {
    const element = document.querySelector(item.target);
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      // Check if element is in view
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
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkScroll);
});
</script>

<style scoped>
.sidebar-wrapper {
  position: fixed;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  /* Ensure it doesn't overlap bottom area too much */
  max-height: 80vh;
}

.glass-panel {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2rem 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 2rem;
  transition: all 0.6s ease;
}

.collapsed .glass-panel {
  padding: 2rem 0.75rem;
  background: rgba(15, 23, 42, 0.2);
}

.toggle-area {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0.5rem;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.toggle-area:hover {
  opacity: 1;
}

.toggle-line {
  width: 20px;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  transition: width 0.3s;
}

.toggle-line.short {
  width: 12px;
}

.collapsed .toggle-line {
  width: 16px;
}
.collapsed .toggle-line.short {
  width: 16px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s;
  position: relative;
  height: 32px;
}

.nav-item:hover, .nav-item.active {
  color: #fff;
}

.indicator-container {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-item.active .indicator-dot {
  transform: scale(1.5);
  box-shadow: 0 0 10px currentColor;
}

.nav-label {
  margin-left: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 1;
  transform: translateX(0);
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}

.collapsed .nav-label {
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
  width: 0;
  overflow: hidden;
  margin-left: 0;
}

/* Mobile Adaptation */
@media (max-width: 768px) {
  .sidebar-wrapper {
    left: 1rem;
    /* On mobile, maybe hide it or make it smaller? 
       User said "mobile adaptation... must be done well".
       Usually sidebars on mobile are bottom bars or hamburger menus.
       But for now let's keep it small.
    */
    transform: translateY(-50%) scale(0.9);
  }
  
  .glass-panel {
    padding: 1.5rem 0.5rem;
  }
  
  .nav-label {
    display: none; /* Always hide text on mobile to save space */
  }
}
</style>
