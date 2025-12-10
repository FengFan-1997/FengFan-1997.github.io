<template>
  <section class="section about-section" id="about">
    <div class="content-wrapper">
      <h2 class="section-title">{{ t('about.title') }}</h2>
      <div class="about-content">
        <div class="about-text">
          <p class="bio">
            {{ t('about.bio') }}
          </p>
          
          <div class="tech-stack">
            <div class="stack-category">
              <h3>{{ t('about.proficient') }}</h3>
              <p>HTML5 / CSS3 / JS (ES6+), React / Vue3, Webpack / Vite, 性能优化</p>
            </div>
            <div class="stack-category">
              <h3>{{ t('about.familiar') }}</h3>
              <p>TypeScript, UniApp, Node.js 基础</p>
            </div>
          </div>

          <div class="philosophy">
            <p>{{ t('about.philosophy') }}</p>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">3+</span>
            <span class="stat-label">{{ t('about.stats.years') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">30+</span>
            <span class="stat-label">{{ t('about.stats.projects') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">10+</span>
            <span class="stat-label">{{ t('about.stats.awards') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useLanguageStore } from '../stores/language';
const { t } = useLanguageStore();
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

.about-section {
  background: linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.5));
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.bio {
  font-size: 1.25rem;
  line-height: 1.8;
  color: #e2e8f0;
  margin-bottom: 40px;
}

.tech-stack {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.stack-category h3 {
  font-size: 1.1rem;
  color: #38bdf8;
  margin-bottom: 12px;
}

.stack-category p {
  color: #94a3b8;
  line-height: 1.6;
}

.philosophy {
  padding: 24px;
  background: rgba(30, 41, 59, 0.3);
  border-left: 4px solid #38bdf8;
  border-radius: 4px;
}

.philosophy p {
  color: #cbd5e1;
  font-style: italic;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.stat-item {
  background: rgba(30, 41, 59, 0.3);
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  transition: transform 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item:hover {
  transform: translateY(-5px);
  background: rgba(30, 41, 59, 0.5);
}

.stat-number {
  display: block;
  font-size: 3rem;
  font-weight: 800;
  color: #38bdf8;
  margin-bottom: 8px;
  font-family: 'Space Mono', monospace;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@media (max-width: 900px) {
  .about-content {
    grid-template-columns: 1fr;
    gap: 60px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .tech-stack {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
