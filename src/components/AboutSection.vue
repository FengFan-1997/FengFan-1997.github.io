<template>
  <section class="section about-section">
    <div class="content-wrapper">
      <h2 class="section-title">ABOUT ME</h2>
      <div class="about-content">
        <div class="about-text">
          <p class="bio">
            3 年前端开发经验，专注 React/Vue 生态，擅长从 0 到 1 搭建前端架构，注重代码可维护性与用户体验。
          </p>
          
          <div class="tech-stack">
            <div class="stack-category">
              <h3>熟练掌握</h3>
              <p>HTML5 / CSS3 / JS (ES6+), React / Vue3, Webpack / Vite, 性能优化</p>
            </div>
            <div class="stack-category">
              <h3>了解使用</h3>
              <p>TypeScript, UniApp, Node.js 基础</p>
            </div>
          </div>

          <div class="philosophy">
            <p>“以用户体验为核心，以代码质量为底线，做靠谱的前端解决方案”</p>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">3+</span>
            <span class="stat-label">Years Exp.</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">30+</span>
            <span class="stat-label">Projects</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">10+</span>
            <span class="stat-label">Awards</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

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
  margin-bottom: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stack-category p {
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 1.1rem;
}

.philosophy {
  padding: 30px;
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid #38bdf8;
  border-radius: 0 12px 12px 0;
}

.philosophy p {
  font-size: 1.2rem;
  font-style: italic;
  color: #f1f5f9;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 30px 20px;
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  border-color: rgba(56, 189, 248, 0.2);
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .section {
    padding: 80px 20px 40px;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 40px;
  }

  .about-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-item {
    padding: 15px 5px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
