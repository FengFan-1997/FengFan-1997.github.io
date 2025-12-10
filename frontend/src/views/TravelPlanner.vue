<template>
  <div class="travel-planner-container">
    <div class="hero-bg"></div>
    
    <div class="planner-card">
      <div class="card-header">
        <button class="back-btn" @click="goBack">←</button>
        <h1>WANDERLUST AI</h1>
        <p>Your Personal Travel Concierge</p>
      </div>

      <div class="form-grid" v-if="!itinerary">
        <div class="form-group">
          <label>Destination</label>
          <input v-model="destination" placeholder="e.g. Tokyo, Japan" />
        </div>
        <div class="form-group">
          <label>Duration (Days)</label>
          <input type="number" v-model="duration" min="1" max="14" />
        </div>
        <div class="form-group">
          <label>Budget</label>
          <select v-model="budget">
            <option value="Budget">Budget Backpacker</option>
            <option value="Moderate">Moderate Comfort</option>
            <option value="Luxury">Luxury Experience</option>
          </select>
        </div>
        <div class="form-group">
          <label>Interests</label>
          <input v-model="interests" placeholder="e.g. Food, History, Nature" />
        </div>
        
        <button class="generate-btn" @click="generateItinerary" :disabled="isLoading || !destination">
          {{ isLoading ? 'PLANNING TRIP...' : 'GENERATE ITINERARY' }}
        </button>
      </div>

      <div class="itinerary-result" v-else>
        <div class="result-header">
          <h2>Trip to {{ destination }}</h2>
          <button class="reset-btn" @click="itinerary = null">Plan New Trip</button>
        </div>
        
        <div class="timeline">
          <div v-for="(day, index) in itinerary.days" :key="index" class="day-card">
            <div class="day-marker">DAY {{ index + 1 }}</div>
            <div class="day-content">
              <h3>{{ day.theme }}</h3>
              <ul>
                <li v-for="(activity, aIdx) in day.activities" :key="aIdx">
                  <span class="time">{{ activity.time }}</span>
                  <span class="detail">{{ activity.desc }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { generateContent } from '../services/aiService';

const router = useRouter();
const destination = ref('');
const duration = ref(3);
const budget = ref('Moderate');
const interests = ref('');
const isLoading = ref(false);
const itinerary = ref<any>(null);

const goBack = () => router.push('/');

const generateItinerary = async () => {
  isLoading.value = true;
  itinerary.value = null;

  const prompt = `
    Role: Expert Travel Planner.
    Task: Create a ${duration.value}-day itinerary for ${destination.value}.
    Style: ${budget.value} budget, focusing on ${interests.value}.
    
    Output format (JSON only, no markdown):
    {
      "days": [
        {
          "theme": "Day Theme (e.g. Historical Dive)",
          "activities": [
            { "time": "Morning", "desc": "Activity description" },
            { "time": "Afternoon", "desc": "Activity description" },
            { "time": "Evening", "desc": "Activity description" }
          ]
        }
      ]
    }
  `;

  try {
    const response = await generateContent(prompt);
    let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    itinerary.value = JSON.parse(cleanText);
  } catch (e) {
    console.error(e);
    // Mock
    itinerary.value = {
      days: [
        {
          theme: "City Exploration",
          activities: [
            { time: "Morning", desc: "Visit the central market and try local coffee." },
            { time: "Afternoon", desc: "Walking tour of the historic district." },
            { time: "Evening", desc: "Dinner at a rooftop restaurant with city views." }
          ]
        },
        {
          theme: "Nature & Relaxation",
          activities: [
            { time: "Morning", desc: "Hike to the viewpoint." },
            { time: "Afternoon", desc: "Picnic in the botanical gardens." },
            { time: "Evening", desc: "Sunset river cruise." }
          ]
        }
      ]
    };
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.travel-planner-container {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop') no-repeat center center;
  background-size: cover;
  filter: brightness(0.6);
  z-index: -1;
}

.planner-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin-bottom: 30px;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #333;
}

h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #1a1a1a;
  font-weight: 800;
  letter-spacing: -1px;
}

p {
  color: #666;
  margin-top: 5px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group:last-of-type {
  grid-column: 1 / -1;
}

label {
  font-weight: 600;
  color: #4a4a4a;
  font-size: 0.9rem;
}

input, select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  color: #333;
}

input:focus, select:focus {
  outline: none;
  border-color: #000;
}

.generate-btn {
  grid-column: 1 / -1;
  background: #000;
  color: #fff;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: transform 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.generate-btn:disabled {
  opacity: 0.5;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.result-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1a1a;
}

.reset-btn {
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.day-card {
  display: flex;
  gap: 20px;
}

.day-marker {
  min-width: 80px;
  font-weight: 800;
  color: #000;
  padding-top: 5px;
}

.day-content {
  flex: 1;
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
}

.day-content h3 {
  margin: 0 0 15px;
  color: #1a1a1a;
  font-size: 1.1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.time {
  width: 100px;
  color: #666;
  font-weight: 500;
}

.detail {
  color: #333;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .day-card {
    flex-direction: column;
    gap: 10px;
  }
}
</style>