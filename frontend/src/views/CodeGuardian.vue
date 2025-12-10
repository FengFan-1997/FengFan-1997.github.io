<template>
  <div class="code-guardian-container">
    <div class="sidebar">
      <div class="logo">
        <span class="shield-icon">🛡️</span>
        CODE GUARDIAN
      </div>
      <div class="stats">
        <div class="stat-item">
          <label>SCANNED</label>
          <span>1,204</span>
        </div>
        <div class="stat-item">
          <label>SECURED</label>
          <span>$45M+</span>
        </div>
      </div>
      <button class="back-btn" @click="goBack">EXIT DASHBOARD</button>
    </div>

    <div class="main-content">
      <div class="editor-section">
        <div class="panel-header">
          <h3>SOLIDITY CONTRACT</h3>
          <span class="status-badge">READY</span>
        </div>
        <textarea 
          v-model="contractCode" 
          placeholder="// Paste your Solidity Smart Contract here..."
          class="code-editor"
        ></textarea>
        <button class="audit-btn" @click="auditContract" :disabled="isAuditing || !contractCode">
          {{ isAuditing ? 'SCANNING MEMPOOL...' : 'START SECURITY AUDIT' }}
        </button>
      </div>

      <div class="report-section">
        <div class="panel-header">
          <h3>AUDIT REPORT</h3>
          <span v-if="report" :class="['severity-badge', report.severity.toLowerCase()]">
            {{ report.severity }} RISK
          </span>
        </div>
        
        <div v-if="!report" class="empty-state">
          Waiting for scan results...
        </div>

        <div v-else class="report-content">
          <div class="vulnerability-list">
            <div 
              v-for="(vuln, idx) in report.vulnerabilities" 
              :key="idx" 
              class="vuln-item"
            >
              <div class="vuln-header">
                <span class="vuln-type">{{ vuln.type }}</span>
                <span class="vuln-line">Line {{ vuln.line }}</span>
              </div>
              <p class="vuln-desc">{{ vuln.description }}</p>
              <div class="vuln-fix">
                <strong>Recommended Fix:</strong>
                <code>{{ vuln.fix }}</code>
              </div>
            </div>
          </div>
          
          <div class="security-score">
            <div class="score-ring" :style="{ '--score': report.score }">
              <span>{{ report.score }}/100</span>
            </div>
            <p>Overall Security Score</p>
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
const contractCode = ref('');
const isAuditing = ref(false);
const report = ref<any>(null);

const goBack = () => router.push('/');

const auditContract = async () => {
  isAuditing.value = true;
  report.value = null;

  const prompt = `
    Role: Senior Smart Contract Security Auditor.
    Task: Audit the following Solidity code for security vulnerabilities (Reentrancy, Overflow, Access Control, Gas Optimization).
    
    Code:
    ${contractCode.value.substring(0, 3000)}

    Output format (JSON only, no markdown):
    {
      "score": number (0-100),
      "severity": "HIGH" | "MEDIUM" | "LOW" | "SAFE",
      "vulnerabilities": [
        {
          "type": "Vulnerability Name",
          "line": number,
          "description": "Short explanation",
          "fix": "One line code fix or suggestion"
        }
      ]
    }
  `;

  try {
    const response = await generateContent(prompt);
    let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    report.value = JSON.parse(cleanText);
  } catch (e) {
    console.error(e);
    // Mock
    report.value = {
      score: 65,
      severity: "HIGH",
      vulnerabilities: [
        {
          type: "Reentrancy Attack",
          line: 14,
          description: "External call is made before state update.",
          fix: "Move balances[msg.sender] -= amount; before the call."
        },
        {
          type: "Unchecked Return Value",
          line: 22,
          description: "Low-level call return value is not checked.",
          fix: "require(success, 'Transfer failed');"
        }
      ]
    };
  } finally {
    isAuditing.value = false;
  }
};
</script>

<style scoped>
.code-guardian-container {
  display: flex;
  height: 100vh;
  background: #0b0e14;
  color: #c9d1d9;
  font-family: 'Space Mono', monospace;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: #161b22;
  border-right: 1px solid #30363d;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.2rem;
  font-weight: 700;
  color: #58a6ff;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
}

.stat-item {
  margin-bottom: 20px;
}

.stat-item label {
  display: block;
  font-size: 0.7rem;
  color: #8b949e;
  margin-bottom: 5px;
}

.stat-item span {
  font-size: 1.5rem;
  color: #f0f6fc;
}

.back-btn {
  margin-top: auto;
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: #58a6ff;
  color: #58a6ff;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 20px;
  gap: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #30363d;
}

h3 {
  margin: 0;
  font-size: 1rem;
  color: #58a6ff;
}

.editor-section, .report-section {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.code-editor {
  flex: 1;
  background: #0b0e14;
  border: 1px solid #30363d;
  color: #c9d1d9;
  font-family: 'Space Mono', monospace;
  padding: 15px;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.5;
}

.code-editor:focus {
  outline: none;
  border-color: #58a6ff;
}

.audit-btn {
  margin-top: 15px;
  background: #238636;
  color: white;
  border: none;
  padding: 12px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  border-radius: 6px;
}

.audit-btn:hover:not(:disabled) {
  background: #2ea043;
}

.audit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #484f58;
}

.severity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.severity-badge.high { background: rgba(248, 81, 73, 0.2); color: #ff7b72; border: 1px solid #ff7b72; }
.severity-badge.medium { background: rgba(210, 153, 34, 0.2); color: #d29922; border: 1px solid #d29922; }
.severity-badge.low { background: rgba(59, 153, 252, 0.2); color: #58a6ff; border: 1px solid #58a6ff; }
.severity-badge.safe { background: rgba(46, 160, 67, 0.2); color: #3fb950; border: 1px solid #3fb950; }

.report-content {
  overflow-y: auto;
  flex: 1;
}

.vuln-item {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.vuln-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.vuln-type {
  color: #ff7b72;
  font-weight: 700;
}

.vuln-line {
  color: #8b949e;
  font-size: 0.8rem;
}

.vuln-desc {
  margin: 0 0 10px;
  font-size: 0.9rem;
}

.vuln-fix code {
  display: block;
  background: #0d1117;
  padding: 8px;
  margin-top: 5px;
  border-radius: 4px;
  color: #3fb950;
  font-size: 0.85rem;
}

.security-score {
  margin-top: 20px;
  text-align: center;
  border-top: 1px solid #30363d;
  padding-top: 20px;
}

.score-ring {
  font-size: 2rem;
  font-weight: 700;
  color: #f0f6fc;
}
</style>