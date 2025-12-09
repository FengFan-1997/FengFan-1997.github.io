<template>
  <section class="section hero-section">
    <div class="hero-content">
      <h1 class="logo-text" ref="logoRef">NEBULA<span class="highlight">.DESIGN</span></h1>
      <p class="subtitle" ref="subtitleRef">打造智能与沉浸并存的数字体验</p>
      <p class="value-prop">AI 驱动 · 交互创新 · 极致性能</p>
      <div class="hero-tags">
        <span class="tag">WebGL</span>
        <span class="tag">AI Native</span>
        <span class="tag">Interactive</span>
      </div>
    </div>
    <div class="scroll-hint">
      <span>SCROLL TO EXPLORE</span>
      <div class="line"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import gsap from 'gsap';

const logoRef = ref<HTMLElement | null>(null);
const subtitleRef = ref<HTMLElement | null>(null);

onMounted(() => {
  // Hero Animations
  gsap.fromTo(logoRef.value, 
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out', delay: 0.5 }
  );
  
  gsap.fromTo(subtitleRef.value, 
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out', delay: 0.8 }
  );

  gsap.fromTo('.hero-tags .tag',
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out', delay: 1.2 }
  );
  
  gsap.fromTo('.scroll-hint',
    { opacity: 0 },
    { opacity: 1, duration: 1, delay: 2 }
  );
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

.hero-section {
  text-align: center;
  position: relative;
}

.hero-content {
  /* margin-top: auto; */
  margin-bottom: auto;
}

.logo-text {
  font-size: 5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
  color: #fff;
  text-shadow: 0 0 40px rgba(56, 189, 248, 0.2);
}

.highlight {
  color: #38bdf8;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
}

.subtitle {
  font-size: 1.8rem;
  color: #cbd5e1;
  margin-top: 24px;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.value-prop {
  font-size: 1.2rem;
  color: #94a3b8;
  margin-top: 12px;
  font-weight: 300;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-tags {
  margin-top: 40px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .section {
    padding: 100px 20px 60px;
  }

  .logo-text {
    font-size: 3rem;
    text-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  }

  .subtitle {
    font-size: 1.1rem;
    margin-top: 16px;
  }

  .hero-tags {
    margin-top: 30px;
    flex-wrap: wrap;
  }
}

.tag {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #e2e8f0;
  transition: all 0.3s ease;
}

.tag:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  border-color: #38bdf8;
}

.scroll-hint {
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  font-size: 0.75rem;
  letter-spacing: 0.2rem;
  color: #64748b;
  opacity: 0.8;
}

.line {
  width: 1px;
  height: 60px;
  background: linear-gradient(to bottom, #64748b, transparent);
  animation: scrollAnim 2s infinite;
}

@keyframes scrollAnim {
  0% { transform: scaleY(0); transform-origin: top; }
  50% { transform: scaleY(1); transform-origin: top; }
  51% { transform: scaleY(1); transform-origin: bottom; }
  100% { transform: scaleY(0); transform-origin: bottom; }
}
</style>
