<template>
  <div class="translator-page">
    <div class="tool-container">
      <header class="tool-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fas fa-language"></i>
          </div>
          <div class="title-group">
            <h1>AI Polyglot & Polisher</h1>
            <p class="subtitle">Translate, Polish, and Summarize with intelligent context awareness</p>
          </div>
        </div>
        <router-link to="/portfolio-home" class="back-link">
          <i class="fas fa-arrow-left"></i> Back
        </router-link>
      </header>

      <div class="control-panel">
        <div class="control-group">
          <label>Action</label>
          <LabelTypeSelect
            :modelValue="actions.findIndex(a => a.value === actionStr)"
            :options="actions.map((a, i) => ({ label: a.label, value: i, gtm: a.value }))"
            @update:modelValue="(i) => actionStr = actions[i].value"
          />
        </div>

        <div class="control-group" v-if="actionStr === 'translate'">
          <label>Target Language</label>
          <LabelTypeSelect
            :modelValue="languages.findIndex(l => l.value === targetLang)"
            :options="languages.map((l, i) => ({ label: l.label, value: i, gtm: l.value }))"
            @update:modelValue="(i) => targetLang = languages[i].value"
          />
        </div>

        <div class="control-group" v-if="actionStr === 'polish'">
          <label>Tone</label>
          <LabelTypeSelect
            :modelValue="tones.findIndex(t => t.value === tone)"
            :options="tones.map((t, i) => ({ label: t.label, value: i, gtm: t.value }))"
            @update:modelValue="(i) => tone = tones[i].value"
          />
        </div>
      </div>

      <div class="workspace">
        <div class="input-section">
          <div class="section-header">
            <span>Input Text</span>
            <span class="char-count">{{ inputText.length }} chars</span>
          </div>
          <textarea
            v-model="inputText"
            placeholder="Enter text here..."
            :disabled="isLoading"
          ></textarea>
        </div>

        <div class="action-bar">
          <button 
            class="process-btn" 
            @click="processText" 
            :disabled="isLoading || !inputText.trim()"
          >
            <i class="fas fa-spinner fa-spin" v-if="isLoading"></i>
            <span v-else>
              <i class="fas fa-magic"></i>
            </span>
          </button>
        </div>

        <div class="output-section">
          <div class="section-header">
            <span>Result</span>
            <button class="copy-btn" @click="copyToClipboard" v-if="outputText">
              <i class="fas" :class="copySuccess ? 'fa-check' : 'fa-copy'"></i>
              {{ copySuccess ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <div class="output-display" :class="{ 'placeholder': !outputText }">
            <div v-if="isLoading" class="loading-state">
              <div class="pulse-ring"></div>
              <span>Generating magic...</span>
            </div>
            <div v-else-if="outputText" class="result-text">{{ outputText }}</div>
            <div v-else class="empty-text">Result will appear here...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LabelTypeSelect from '@/Ingredient/utils/LabelTypeSelect.vue';
import { generateContent } from '@/services/aiService';

const inputText = ref('');
const outputText = ref('');
const isLoading = ref(false);
const copySuccess = ref(false);

const actionStr = ref('translate');
const targetLang = ref('English');
const tone = ref('Professional');

const actions = [
  { label: 'Translate', value: 'translate' },
  { label: 'Polish', value: 'polish' },
  { label: 'Summarize', value: 'summarize' }
];

const languages = [
  { label: 'English', value: 'English' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' }
];

const tones = [
  { label: 'Professional', value: 'Professional' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Academic', value: 'Academic' },
  { label: 'Creative', value: 'Creative' }
];

const processText = async () => {
  if (!inputText.value.trim() || isLoading.value) return;

  isLoading.value = true;
  outputText.value = '';

  let prompt = '';
  if (actionStr.value === 'translate') {
    prompt = `Translate the following text into ${targetLang.value}. Maintain the original meaning but ensure natural phrasing in the target language:\n\n${inputText.value}`;
  } else if (actionStr.value === 'polish') {
    prompt = `Rewrite the following text to make it more ${tone.value.toLowerCase()}. Improve grammar, clarity, and flow:\n\n${inputText.value}`;
  } else if (actionStr.value === 'summarize') {
    prompt = `Provide a concise summary of the following text:\n\n${inputText.value}`;
  }

  const response = await generateContent(prompt);
  
  if (response.error) {
    outputText.value = `Error: ${response.error}`;
  } else {
    outputText.value = response.text;
  }
  
  isLoading.value = false;
};

const copyToClipboard = async () => {
  if (!outputText.value) return;
  try {
    await navigator.clipboard.writeText(outputText.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
.translator-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Brighter gradient background */
  background: radial-gradient(circle at top left, #4f46e5, #0f172a); 
  padding: 40px 20px;
  /* Add padding left to avoid sidebar overlap on desktop */
  padding-left: 100px; 
  font-family: 'Inter', sans-serif;
  color: #f8fafc;
  box-sizing: border-box;
}

.tool-container {
  width: 100%;
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.15); /* Brighter glass */
  backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Brighter border */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Ensure rounded corners */
}

.tool-header {
  padding: 24px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  color: #e2e8f0;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
  background: rgba(0,0,0,0.2);
  padding: 6px 12px;
  border-radius: 8px;
}

.back-link:hover {
  color: #fff;
  background: rgba(0,0,0,0.3);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #60a5fa, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 8px 16px rgba(96, 165, 250, 0.4);
  flex-shrink: 0;
}

.title-group h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.subtitle {
  margin: 6px 0 0;
  color: #e2e8f0;
  font-size: 14px;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 24px 40px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  z-index: 10;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  flex: 1;
}

.control-group label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #e2e8f0;
  font-weight: 600;
}

.workspace {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  min-height: 500px;
}

.input-section, .output-section {
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-section {
  border-right: 1px solid rgba(255, 255, 255, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 600;
}

.char-count {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  color: #fff;
}

textarea {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  resize: none;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.6;
  font-family: inherit;
  outline: none;
  transition: all 0.3s;
  min-height: 300px;
}

textarea:focus {
  background: rgba(0, 0, 0, 0.3);
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

textarea::placeholder {
  color: #94a3b8;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.02);
}

.process-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #60a5fa, #a855f7);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
}

.process-btn:hover:not(:disabled) {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 24px rgba(96, 165, 250, 0.6);
}

.process-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: scale(0.95);
  background: #64748b;
}

.output-display {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 20px;
  overflow-y: auto;
  min-height: 300px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.output-display.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-text {
  white-space: pre-wrap;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.6;
}

.empty-text {
  color: #94a3b8;
  font-style: italic;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #cbd5e1;
}

.pulse-ring {
  width: 40px;
  height: 40px;
  border: 3px solid #60a5fa;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
}

/* Mobile Responsiveness */
@media (max-width: 979px) {
  .translator-page {
    padding: 100px 20px 40px 20px; /* Top padding for header if needed */
    padding-left: 20px; /* Reset left padding */
    align-items: flex-start;
    height: auto;
  }

  .tool-container {
    max-width: 100%;
    margin: 0;
    border-radius: 20px;
    height: auto;
    min-height: auto;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .tool-header {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .back-link {
    width: 100%;
    justify-content: center;
  }

  .workspace {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
  }
  
  .action-bar {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding: 20px;
  }

  .process-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 16px;
  }
  
  .process-btn span::after {
    content: " Process Text";
    margin-left: 8px;
    font-weight: 600;
  }

  .input-section {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    min-height: auto;
  }
  
  textarea {
    min-height: 150px;
  }
  
  .output-display {
    min-height: 150px;
  }
}
</style>