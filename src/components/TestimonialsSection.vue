<template>
  <section class="section testimonials-section">
    <div class="content-wrapper">
      <h2 class="section-title">WHAT PEOPLE SAY</h2>
      <div class="testimonials-grid">
        <div v-for="(item, index) in testimonials" :key="index" class="testimonial-card">
          <div class="quote-icon">"</div>
          <p class="quote-text">{{ item.text }}</p>
          <div class="quote-author">
            <span class="author-name">{{ item.author }}</span>
            <span class="author-role">{{ item.role }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    text: "One of the most talented developers I've worked with. The attention to detail in animations is unmatched.",
    author: "Sarah J.",
    role: "Product Design Lead"
  },
  {
    text: "Delivered the project ahead of schedule and the performance optimization was incredible. Highly recommended.",
    author: "Michael C.",
    role: "CTO, StartUp Inc."
  },
  {
    text: "A true creative technologist. Transformed our vague requirements into a stunning interactive experience.",
    author: "David L.",
    role: "Creative Director"
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

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.testimonial-card {
  background: rgba(30, 41, 59, 0.3);
  padding: 40px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: #38bdf8;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px -10px rgba(56, 189, 248, 0.15);
}

.quote-icon {
  font-size: 4rem;
  color: #38bdf8;
  opacity: 0.2;
  font-family: serif;
  line-height: 1;
  margin-bottom: 20px;
}

.quote-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 30px;
  font-style: italic;
}

.quote-author {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 700;
  color: #fff;
  font-size: 1.1rem;
}

.author-role {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .section {
    padding: 80px 20px 40px;
  }
  
  .testimonials-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
</style>
