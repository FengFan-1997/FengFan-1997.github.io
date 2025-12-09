<template>
  <div class="page-container">
    <div class="story-container">
      <header class="header">
        <h1 class="title">AI Storyteller</h1>
        <router-link to="/portfolio-home" class="back-link">
          <i class="fas fa-arrow-left"></i> Back
        </router-link>
      </header>

      <div class="content-wrapper">
        <div class="sidebar">
          <div class="input-group">
            <label>Genre</label>
            <div class="select-wrapper">
              <LabelTypeSelect v-model="genreValue" :options="genreOptions" />
            </div>
          </div>

          <div class="input-group">
            <label>Theme / Prompt</label>
            <textarea 
              v-model="prompt" 
              placeholder="E.g., A robot discovering emotions..."
              rows="4"
            ></textarea>
          </div>

          <div class="input-group">
            <label>Protagonist Name</label>
            <input type="text" v-model="protagonist" placeholder="Optional" />
          </div>

          <button @click="generateStory" :disabled="isLoading || !prompt.trim()">
            {{ isLoading ? 'Weaving Tale...' : 'Generate Story' }}
          </button>
        </div>

        <div class="story-display">
          <div v-if="!story && !isLoading" class="placeholder-state">
            <div class="icon">📖</div>
            <p>Your story awaits...</p>
          </div>
          
          <div v-else class="story-content">
            <div v-if="storyTitle" class="story-title">{{ storyTitle }}</div>
            <div class="story-text" v-html="formattedStory"></div>
            <div v-if="isLoading" class="loading-indicator">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { generateContent } from '../services/aiService';
import LabelTypeSelect from '../Ingredient/utils/LabelTypeSelect.vue';

const genreValue = ref(1);
const prompt = ref('');
const protagonist = ref('');
const story = ref('');
const storyTitle = ref('');
const isLoading = ref(false);

const genreOptions = [
  { label: 'Sci-Fi', value: 1, gtm: 'genre_scifi' },
  { label: 'Fantasy', value: 2, gtm: 'genre_fantasy' },
  { label: 'Mystery', value: 3, gtm: 'genre_mystery' },
  { label: 'Horror', value: 4, gtm: 'genre_horror' },
  { label: 'Romance', value: 5, gtm: 'genre_romance' },
  { label: 'Cyberpunk', value: 6, gtm: 'genre_cyberpunk' },
];

const genre = computed(() => {
  const map: Record<number, string> = {
    1: 'Sci-Fi',
    2: 'Fantasy',
    3: 'Mystery',
    4: 'Horror',
    5: 'Romance',
    6: 'Cyberpunk',
  };
  return map[genreValue.value];
});

const formattedStory = computed(() => {
  return story.value.replace(/\n/g, '<br>');
});

const generateStory = async () => {
  if (!prompt.value.trim() || isLoading.value) return;

  isLoading.value = true;
  story.value = '';
  storyTitle.value = '';

  const fullPrompt = `Write a short ${genre.value} story. 
  Theme: ${prompt.value}. 
  ${protagonist.value ? `Protagonist: ${protagonist.value}.` : ''}
  
  Format the output as follows:
  Title: [Story Title]
  [Story Body]`;

  const response = await generateContent(fullPrompt);
  
  if (response.error) {
    story.value = `Error: ${response.error}`;
  } else {
    const text = response.text;
    const titleMatch = text.match(/Title:\s*(.*?)(\n|$)/);
    if (titleMatch) {
      storyTitle.value = titleMatch[1].trim();
      story.value = text.replace(titleMatch[0], '').trim();
    } else {
      story.value = text;
    }
  }
  
  isLoading.value = false;
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #050505;
  background-image: radial-gradient(circle at 50% 50%, #2e2b5b 0%, #000000 100%);
  color: #f1f5f9;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  padding-left: 100px; /* Avoid sidebar overlap */
  font-family: 'Inter', system-ui, sans-serif;
  box-sizing: border-box;
}

.story-container {
  width: 100%;
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.1); /* Brighter glass */
  backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  height: 85vh;
  overflow: hidden;
}

.header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #f472b6, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.back-link {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link:hover {
  color: #a78bfa;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group label {
  font-size: 0.9rem;
  color: #cbd5e1;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.select-wrapper {
  width: 100%;
}

textarea, input[type="text"] {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f1f5f9;
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  outline: none;
  transition: all 0.3s;
  box-sizing: border-box;
}

textarea:focus, input[type="text"]:focus {
  border-color: #a78bfa;
  background: rgba(0, 0, 0, 0.3);
}

button {
  margin-top: auto;
  padding: 14px;
  background: linear-gradient(135deg, #a78bfa, #f472b6);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 15px rgba(167, 139, 250, 0.3);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(167, 139, 250, 0.4);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.story-display {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 20px;
}

.placeholder-state .icon {
  font-size: 4rem;
  opacity: 0.5;
}

.story-content {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.story-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
  color: #f1f5f9;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.3);
}

.story-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #f8fafc;
  white-space: pre-wrap;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
  font-size: 1.5rem;
  color: #a78bfa;
}

.loading-indicator span {
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-indicator span:nth-child(1) { animation-delay: -0.32s; }
.loading-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@media (max-width: 979px) {
  .page-container {
    padding: 0; /* Remove padding to avoid overflow */
    padding-left: 0;
    height: 100dvh; /* Use dynamic viewport height */
    min-height: 100dvh;
    align-items: stretch;
  }

  .story-container {
    height: 100%;
    min-height: auto;
    border-radius: 0;
    border: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .content-wrapper {
    flex-direction: column;
    overflow: hidden;
    flex: 1;
    display: flex;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    height: auto;
    max-height: 40vh; /* Limit height of inputs */
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  
  .story-display {
    height: auto;
    min-height: 0;
    flex: 1; /* Take remaining space */
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto; /* Scrollable story */
  }

  .header {
    padding: 16px 20px;
    flex-shrink: 0;
  }
}
</style>
