<template>
  <section class="section projects-section" id="projects">
    <div class="content-wrapper">
      <div class="section-header">
        <h2 class="section-title">{{ t('projects.title') }}</h2>
        <div class="project-filter">
          <button 
            v-for="filter in filters" 
            :key="filter"
            class="filter-btn"
            :class="{ active: activeFilter === filter }"
            @click="setFilter(filter)"
          >
            {{ filter === 'All' ? t('projects.filters.all') : filter }}
          </button>
        </div>
      </div>
      
      <div class="projects-list">
        <div 
          v-for="(item, index) in filteredProjects" 
          :key="item.id"
          class="project-card"
          :class="{ 'reversed': index % 2 !== 0 }"
          ref="projectCardsRef"
          @mouseenter="onHover(index)"
          @mouseleave="onLeave(index)"
          @click="onCardClick(item.route)"
        >
          <div class="card-visual-container" :style="getCardStyle(index)">
            <div class="plain-image" :style="{ backgroundImage: `url(${item.image})` }"></div>
          </div>
          
          <div class="card-content">
            <div class="card-header">
              <span class="card-number">0{{ index + 1 }}</span>
              <div class="card-tags" v-if="item.tags">
                <span v-for="tag in item.tags" :key="tag" class="mini-tag">{{ tag }}</span>
              </div>
            </div>
            <h2 class="card-title">{{ item.title }}</h2>
            <p class="card-desc">{{ item.desc }}</p>
            <div class="card-action">
              <span>{{ t('projects.viewProject') }}</span>
              <span class="arrow-icon">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import gsap from 'gsap';
import { useLanguageStore } from '../stores/language';

const languageStore = useLanguageStore();
const { t } = languageStore;

const emit = defineEmits<{
  (e: 'hover-start'): void;
  (e: 'hover-end'): void;
  (e: 'navigate', route: string): void;
}>();

const projectCardsRef = ref<HTMLElement[]>([]);
const activeFilter = ref('All');
const filters = ['All', 'Vue 3', 'Three.js', 'WebGL', 'AI', 'SaaS', 'DeFi'];
const cardProgress = ref<number[]>([]); // Store scroll progress for each card

const navItems = computed(() => [
  { 
    id: 'ingredients',
    title: t('projects.items.ingredients.title'), 
    desc: t('projects.items.ingredients.desc'), 
    route: '/ingredient',
    icon: '🧬',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop', // Food/Ingredients (replaced)
    tags: ['Vue 3', 'AI', 'Automation']
  },
  { 
    id: 'gemini',
    title: t('projects.items.gemini.title'), 
    desc: t('projects.items.gemini.desc'), 
    route: '/gemini-chat',
    icon: '💬',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop', // AI/Tech
    tags: ['Vue 3', 'AI', 'NLP']
  },
  { 
    id: 'polyglot',
    title: t('projects.items.polyglot.title'), 
    desc: t('projects.items.polyglot.desc'), 
    route: '/translator',
    icon: '🌐',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', // Globe/Network
    tags: ['Vue 3', 'AI', 'Tools']
  },
  { 
    id: 'storyteller',
    title: t('projects.items.storyteller.title'), 
    desc: t('projects.items.storyteller.desc'), 
    route: '/storyteller',
    icon: '📖',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop', // Book/Fantasy
    tags: ['Vue 3', 'AI', 'Creative']
  },
  { 
    id: 'christmas',
    title: t('projects.items.christmas.title'), 
    desc: t('projects.items.christmas.desc'), 
    route: '/christmas-tree',
    icon: '🎄',
    image: 'https://images.unsplash.com/photo-1544084944-152696a63f72?q=80&w=800&auto=format&fit=crop', // Christmas/Lights
    tags: ['Three.js', 'Computer Vision', 'Interactive']
  },
  {
    id: 'nexus',
    title: t('projects.items.nexus.title'),
    desc: t('projects.items.nexus.desc'),
    route: '#',
    icon: '📊',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=800&auto=format&fit=crop', // Chart/Data
    tags: ['Vue 3', 'WebGL', 'FinTech']
  },
  {
    id: 'market',
    title: t('projects.items.market.title'),
    desc: t('projects.items.market.desc'),
    route: '#',
    icon: '💎',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop', // NFT/Blockchain (replaced)
    tags: ['Web3', 'Three.js', 'DeFi']
  }
]);

const filteredProjects = computed(() => {
  if (activeFilter.value === 'All') {
    return navItems.value;
  }
  return navItems.value.filter(item => item.tags.includes(activeFilter.value));
});

const setFilter = (filter: string) => {
  activeFilter.value = filter;
};

// Animation Loop for Scroll Effect
let animationFrameId: number;

const updateScrollEffect = () => {
  if (!projectCardsRef.value.length) return;

  const viewportHeight = window.innerHeight;
  const newProgress: number[] = [];

  projectCardsRef.value.forEach((card) => {
    if (!card) {
      newProgress.push(0);
      return;
    }
    const rect = card.getBoundingClientRect();
    
    // Calculate progress: 0 at center, 1 at bottom, -1 at top
    const center = rect.top + rect.height / 2;
    const distFromCenter = center - viewportHeight / 2;
    let progress = distFromCenter / (viewportHeight / 2);
    
    // Clamp
    progress = Math.max(-1, Math.min(1, progress));
    
    newProgress.push(progress);
  });

  cardProgress.value = newProgress;
  animationFrameId = requestAnimationFrame(updateScrollEffect);
};

const getCardStyle = (index: number) => {
  const progress = cardProgress.value[index] || 0;
  
  const enter = Math.max(0, progress);
  
  const rotation = enter * 25;
  const opacity = 1 - enter * 0.4;
  const scale = 0.9 + (1 - enter) * 0.1;
  const maskTop = `${enter * 35}%`;

  return {
    '--card-rotation': `${rotation}deg`,
    '--card-opacity': opacity,
    '--card-scale': scale,
    '--mask-top': maskTop
  };
};

// Watch for filter changes to re-animate
watch(activeFilter, () => {
  nextTick(() => {
    gsap.fromTo(projectCardsRef.value, 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  });
});

const onHover = (_index: number) => {
  emit('hover-start');
};

const onLeave = (_index: number) => {
  emit('hover-end');
};

const onCardClick = (route: string) => {
  emit('navigate', route);
};

onMounted(() => {
  // Start scroll loop
  updateScrollEffect();

  // Keep existing IntersectionObserver for fade-in
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  projectCardsRef.value.forEach(card => {
    observer.observe(card);
  });
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.section {
  min-height: 100vh;
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120px 20px 80px;
  box-sizing: border-box;
}

.content-wrapper {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 60px;
  text-align: center;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.projects-section {
  gap: 100px;
}

.section-header {
  margin-bottom: 80px;
  text-align: center;
}

.project-filter {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: -30px;
}

.filter-btn {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 8px 20px;
  border-radius: 100px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.filter-btn:hover, .filter-btn.active {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 120px;
}

.project-card {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  align-items: center;
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  cursor: pointer;
}

.project-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.project-card.reversed {
  grid-template-columns: 0.8fr 1.2fr;
  direction: rtl; /* Use direction to swap columns visually or just swap in grid */
}
/* Better reversed handling without RTL which messes up text */
.project-card.reversed .card-content {
  order: 2; /* Content right */
  text-align: right;
  align-items: flex-end;
}
.project-card.reversed .card-visual-container {
  order: 1; /* Visual left */
}

/* Wait, default is visual left, content right? 
   Original code:
   <div visual></div>
   <div content></div>
   So default: Visual (1), Content (2).
   
   If I want reversed: Content (1), Visual (2).
*/
.project-card.reversed {
  grid-template-columns: 0.8fr 1.2fr;
  direction: ltr; /* Reset */
}
.project-card.reversed .card-visual-container {
  order: 2;
}
.project-card.reversed .card-content {
  order: 1;
  text-align: right;
  align-items: flex-end;
}

.card-visual-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  border-radius: 20px;
  overflow: hidden;
  perspective: 1000px;
  transform-style: preserve-3d;
}

.plain-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transform: scale(var(--card-scale, 1));
  opacity: var(--card-opacity, 1);
  transition: transform 0.1s linear, opacity 0.1s linear;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
.project-card.reversed .card-header {
  flex-direction: row-reverse;
}

.card-number {
  font-family: 'Space Mono', monospace;
  font-size: 1.2rem;
  color: #38bdf8;
  opacity: 0.8;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.card-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: #f1f5f9;
}

.card-desc {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
  max-width: 500px;
}

.card-action {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #38bdf8;
  font-weight: 600;
  cursor: pointer;
  transition: gap 0.3s;
}
.project-card.reversed .card-action {
  flex-direction: row-reverse;
}

.card-action:hover {
  gap: 15px;
}

/* Mobile Adaptation */
@media (max-width: 900px) {
  .section {
    padding: 80px 16px 60px;
  }
  
  .section-title {
    font-size: 2rem;
    margin-bottom: 40px;
  }
  
  .projects-list {
    gap: 60px;
  }
  
  .project-card, .project-card.reversed {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .card-visual-container, .project-card.reversed .card-visual-container {
    order: 1; /* Always image first on mobile */
    aspect-ratio: 16/9;
  }
  
  .card-content, .project-card.reversed .card-content {
    order: 2; /* Always content second */
    text-align: left;
    align-items: flex-start;
  }
  
  .card-header, .project-card.reversed .card-header {
    flex-direction: row;
  }
  
  .card-action, .project-card.reversed .card-action {
    flex-direction: row;
  }
  
  .card-title {
    font-size: 1.8rem;
  }
  
  .card-desc {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .project-filter {
    gap: 8px;
  }
  .filter-btn {
    padding: 6px 14px;
    font-size: 0.8rem;
  }
}
</style>
