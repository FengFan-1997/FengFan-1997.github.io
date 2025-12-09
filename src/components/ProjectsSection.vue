<template>
  <section class="section projects-section" id="projects">
    <div class="content-wrapper">
      <div class="section-header">
        <h2 class="section-title">SELECTED WORKS</h2>
        <div class="project-filter">
          <button 
            v-for="filter in filters" 
            :key="filter"
            class="filter-btn"
            :class="{ active: activeFilter === filter }"
            @click="setFilter(filter)"
          >
            {{ filter }}
          </button>
        </div>
      </div>
      
      <div class="projects-list">
        <div 
          v-for="(item, index) in filteredProjects" 
          :key="item.title"
          class="project-card"
          :class="{ 'reversed': index % 2 !== 0 }"
          ref="projectCardsRef"
          @mouseenter="onHover(index)"
          @mouseleave="onLeave(index)"
          @click="onCardClick(item.route)"
        >
          <div class="card-visual-container">
            <!-- Chromatic Aberration Layers -->
            <div class="chromatic-layers" :style="getCardStyle(index)">
              <div class="layer layer-r" :style="{ backgroundImage: `url(${item.image})` }"></div>
              <div class="layer layer-g" :style="{ backgroundImage: `url(${item.image})` }"></div>
              <div class="layer layer-b" :style="{ backgroundImage: `url(${item.image})` }"></div>
            </div>
            
            <!-- Original Overlay Content -->
            <div class="visual-content">
              <span class="visual-icon">{{ item.icon }}</span>
            </div>
            <div class="visual-glow"></div>
            <div class="visual-overlay"></div>
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
              <span>View Project</span>
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

const emit = defineEmits<{
  (e: 'hover-start'): void;
  (e: 'hover-end'): void;
  (e: 'navigate', route: string): void;
}>();

const projectCardsRef = ref<HTMLElement[]>([]);
const activeFilter = ref('All');
const filters = ['All', 'Vue 3', 'Three.js', 'WebGL', 'AI', 'SaaS', 'DeFi'];
const cardProgress = ref<number[]>([]); // Store scroll progress for each card

const navItems = [
  { 
    title: 'AI INGREDIENTS', 
    desc: 'Intelligent Label Generation powered by Gemini. Transform simple text into FDA-compliant nutrition facts and ingredient lists with one click.', 
    route: '/ingredient',
    icon: '🧬',
    image: 'https://images.unsplash.com/photo-1615486511484-92e0043be555?q=80&w=800&auto=format&fit=crop', // Abstract DNA/Science
    tags: ['Vue 3', 'AI', 'Automation']
  },
  { 
    title: 'GEMINI CHAT', 
    desc: 'Advanced conversational interface powered by Gemini 2.5 Flash. Features real-time streaming responses and context-aware interactions.', 
    route: '/gemini-chat',
    icon: '💬',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop', // AI/Tech
    tags: ['Vue 3', 'AI', 'NLP']
  },
  { 
    title: 'AI POLYGLOT', 
    desc: 'Smart translation and text polishing tool. Supports multiple languages and tone adjustments (Professional, Casual, Creative).', 
    route: '/translator',
    icon: '🌐',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', // Globe/Network
    tags: ['Vue 3', 'AI', 'Tools']
  },
  { 
    title: 'STORYTELLER', 
    desc: 'Interactive AI story generator. Create immersive narratives based on genre, theme, and character inputs.', 
    route: '/storyteller',
    icon: '📖',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop', // Book/Fantasy
    tags: ['Vue 3', 'AI', 'Creative']
  },
  { 
    title: 'CHRISTMAS MAGIC', 
    desc: 'An immersive 3D experience controlled by hand gestures. Uses MediaPipe for tracking and Three.js for rendering a magical interactive scene.', 
    route: '/christmas-tree',
    icon: '🎄',
    image: 'https://images.unsplash.com/photo-1544084944-152696a63f72?q=80&w=800&auto=format&fit=crop', // Christmas/Lights
    tags: ['Three.js', 'Computer Vision', 'Interactive']
  },
  {
    title: 'NEXUS DASHBOARD',
    desc: 'Next-gen analytics platform for high-frequency trading. Features real-time WebGL charting, sub-millisecond data updates, and customizable workspaces.',
    route: '#',
    icon: '📊',
    image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=800&auto=format&fit=crop', // Chart/Data
    tags: ['Vue 3', 'WebGL', 'FinTech']
  },
  {
    title: 'AETHER MARKET',
    desc: 'Decentralized NFT marketplace with 3D immersive gallery mode. Built on Ethereum with IPFS integration and custom smart contracts.',
    route: '#',
    icon: '💎',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?q=80&w=800&auto=format&fit=crop', // Blockchain/Crystal
    tags: ['Web3', 'Three.js', 'DeFi']
  }
];

const filteredProjects = computed(() => {
  if (activeFilter.value === 'All') {
    return navItems;
  }
  return navItems.filter(item => item.tags.includes(activeFilter.value));
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
  
  // Chromatic Aberration
  const shift = progress * 10; 
  
  // Lift Up Effect
  // When at bottom (progress > 0), rotateX is positive (tilted back)
  // When at center (progress 0), rotateX is 0
  // When at top (progress < 0), keep 0 or slight negative?
  // User wants "lifted from below", so mainly entering effect.
  
  const rotation = Math.max(0, progress * 60); // 0 to 60 degrees
  const opacity = 1 - Math.max(0, progress * 0.5); // Fade in as it lifts
  const scale = 0.8 + (1 - Math.max(0, progress)) * 0.2; // Scale up from 0.8 to 1
  const maskBottom = `${Math.max(0, progress * 35)}%`; // Reveal from bottom on enter

  return {
    '--shift-r': `${-shift}px`,
    '--shift-b': `${shift}px`,
    '--card-rotation': `${rotation}deg`,
    '--card-opacity': opacity,
    '--card-scale': scale,
    '--mask-bottom': maskBottom
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

const onHover = (index: number) => {
  emit('hover-start');
  
  // Specific card glow effect
  if (projectCardsRef.value[index]) {
    const glow = projectCardsRef.value[index].querySelector('.visual-glow');
    if (glow) {
      gsap.to(glow, { opacity: 0.8, duration: 0.3 });
    }
  }
};

const onLeave = (index: number) => {
  emit('hover-end');
  
  // Reset specific card glow effect
  if (projectCardsRef.value[index]) {
    const glow = projectCardsRef.value[index].querySelector('.visual-glow');
    if (glow) {
      gsap.to(glow, { opacity: 0.5, duration: 0.3 });
    }
  }
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
  transition: all 0.3s ease;
  font-family: inherit;
  font-size: 0.9rem;
}

.filter-btn:hover, .filter-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}

.project-card {
  display: flex;
  align-items: center;
  gap: 80px;
  width: 100%;
  opacity: 0;
  transform: translateY(60px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  margin-bottom: 120px;
}

.project-card:last-child {
  margin-bottom: 0;
}

.project-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.project-card.reversed {
  flex-direction: row-reverse;
}

.card-visual-container {
  flex: 1;
  height: 400px;
  background: #000;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  transition: transform 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  
  clip-path: inset(0% 0% var(--mask-bottom, 0%) 0% round 24px);
  transform: perspective(1000px) rotateX(var(--card-rotation, 0deg)) scale(var(--card-scale, 1));
  opacity: var(--card-opacity, 1);
  transform-origin: 50% 100%; /* Pivot from bottom center */
  will-change: transform, opacity;
}

.chromatic-layers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  mix-blend-mode: screen;
  will-change: transform;
}

.layer-r {
  background-color: #ff0000;
  background-blend-mode: multiply;
  transform: translateX(var(--shift-r, 0px));
}

.layer-g {
  background-color: #00ff00;
  background-blend-mode: multiply;
}

.layer-b {
  background-color: #0000ff;
  background-blend-mode: multiply;
  transform: translateX(var(--shift-b, 0px));
}

.visual-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7)); /* Darker overlay to make text pop */
  pointer-events: none;
  z-index: 2;
}

.project-card:hover .card-visual-container {
  transform: scale(1.02);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
}

.visual-content {
  position: relative;
  z-index: 3;
  font-size: 4rem;
  opacity: 0.8;
  transform: scale(0.8);
  transition: all 0.5s ease;
}

.project-card:hover .visual-content {
  opacity: 1;
  transform: scale(1);
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

.visual-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
  transition: opacity 0.3s;
  opacity: 0.3;
}

.project-card:hover .visual-glow {
  opacity: 0.8;
}

.card-content {
  flex: 0.8;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.card-number {
  font-family: monospace;
  color: #38bdf8;
  font-size: 1.1rem;
  opacity: 0.8;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-tag {
  font-size: 0.75rem;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-title {
  font-size: 3rem;
  margin: 0 0 24px 0;
  font-weight: 700;
  line-height: 1.1;
  color: #f1f5f9;
}

.card-desc {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #94a3b8;
  margin-bottom: 40px;
  max-width: 500px;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #38bdf8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9rem;
  transition: gap 0.3s ease;
}

.project-card:hover .card-action {
  gap: 20px;
}

.arrow-icon {
  transition: transform 0.3s;
}

.project-card:hover .arrow-icon {
  transform: translateX(5px);
}

/* Mobile Adaptation */
@media (max-width: 768px) {
  .section {
    padding: 80px 20px 40px;
  }
  
  .section-title {
    font-size: 2rem;
    margin-bottom: 40px;
  }
  
  .project-card {
    flex-direction: column !important; /* Force column layout */
    gap: 40px;
    margin-bottom: 80px;
  }
  
  .card-visual-container {
    width: 100%;
    height: 250px;
  }
  
  .card-content {
    width: 100%;
    padding: 0;
    text-align: left;
  }
  
  .card-title {
    font-size: 2rem;
  }
  
  .card-desc {
    font-size: 1rem;
  }
}
</style>
