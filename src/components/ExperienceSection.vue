<template>
  <section class="section experience-section">
    <div class="content-wrapper">
      <h2 class="section-title">JOURNEY</h2>
      <div class="timeline">
        <div v-for="(exp, index) in experience" :key="index" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="period">{{ exp.period }}</span>
            <h3 class="role">{{ exp.role }}</h3>
            <h4 class="company">{{ exp.company }}</h4>
            <p class="desc">{{ exp.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const experience = [
  {
    period: '2023 - PRESENT',
    role: 'Senior Frontend Engineer',
    company: 'Tech Visionary Inc.',
    desc: 'Leading the frontend architecture for next-gen SaaS products. Improved core web vitals by 40%.'
  },
  {
    period: '2021 - 2023',
    role: 'Creative Developer',
    company: 'Digital Art Studio',
    desc: 'Developed award-winning interactive websites using WebGL and GSAP. Collaborated with top-tier brands.'
  },
  {
    period: '2019 - 2021',
    role: 'Full Stack Developer',
    company: 'StartUp One',
    desc: 'Built and scaled MVP to 100k+ users. Handled both frontend (Vue) and backend (Node.js) development.'
  }
];
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

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, #38bdf8, rgba(56, 189, 248, 0.1));
}

.timeline-item {
  position: relative;
  padding-left: 50px;
  margin-bottom: 60px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -4px;
  top: 0;
  width: 10px;
  height: 10px;
  background: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 10px #38bdf8;
}

.timeline-content {
  background: rgba(30, 41, 59, 0.3);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease;
}

.timeline-item:hover .timeline-content {
  transform: translateX(10px);
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(56, 189, 248, 0.3);
}

.period {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #38bdf8;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.role {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 4px 0;
}

.company {
  font-size: 1.1rem;
  color: #cbd5e1;
  font-weight: 400;
  margin: 0 0 16px 0;
}

.desc {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .section {
    padding: 80px 20px 40px;
  }
  
  .timeline-item {
    padding-left: 30px;
    margin-bottom: 40px;
  }
  
  .role {
    font-size: 1.25rem;
  }
  
  .timeline-content {
    padding: 20px;
  }
}
</style>
