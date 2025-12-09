<template>
  <section class="section skills-section">
    <div class="content-wrapper">
      <h2 class="section-title">TECHNICAL ARSENAL</h2>
      <div class="skills-grid">
        <div v-for="skill in skills.core" :key="skill.name" class="skill-circle" :style="{ '--percent': skill.percent }">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="skill-info">
            <span class="percent">{{ skill.percent }}%</span>
            <span class="name">{{ skill.name }}</span>
          </div>
        </div>
      </div>
      <div class="skills-tags">
        <span v-for="tech in skills.stack" :key="tech" class="tech-tag">{{ tech }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const skills = {
  core: [
    { name: 'Vue 3 / Nuxt', percent: 95 },
    { name: 'TypeScript', percent: 90 },
    { name: 'Three.js / WebGL', percent: 85 },
    { name: 'Node.js', percent: 80 }
  ],
  stack: ['Vite', 'Pinia', 'GSAP', 'Tailwind', 'Python', 'Docker', 'AWS', 'Figma']
};
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

.skills-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 60px;
}

.skill-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.circular-chart {
  width: 120px;
  height: 120px;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 2;
}

.circle {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: var(--percent), 100;
  transition: all 0.3s ease;
}

.skill-circle:hover .circle {
  animation: progress 1.5s ease-out forwards;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0, 100;
  }
  100% {
    stroke-dasharray: var(--percent), 100;
  }
}

.skill-info {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.skill-info .percent {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.skill-info .name {
  position: absolute;
  bottom: -30px;
  font-size: 1rem;
  color: #cbd5e1;
  text-align: center;
  width: 150%;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.tech-tag {
  padding: 10px 24px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 1rem;
  transition: all 0.2s;
}

.tech-tag:hover {
  color: #fff;
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

@media (max-width: 768px) {
  .section {
    padding: 80px 20px 40px;
  }

  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 50px 20px;
  }

  .circular-chart {
    width: 100px;
    height: 100px;
  }

  .skill-info .percent {
    font-size: 1.25rem;
  }
  
  .skill-info .name {
    font-size: 0.9rem;
  }
}
</style>
