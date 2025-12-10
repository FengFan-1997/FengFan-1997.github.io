<template>
  <div class="love-modules" :class="{ visible: show }">
    <!-- Music Player Module -->
    <div class="module music-player">
      <div class="disc" :class="{ playing: isPlaying }">
        <div class="disc-inner"></div>
      </div>
      <div class="info">
        <div class="song-name">Perfect</div>
        <div class="artist">Ed Sheeran</div>
        <div class="controls">
          <button class="btn-control" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Letter Module -->
    <div class="module letter-box" @click="openLetter">
      <div class="envelope">
        <div class="flap"></div>
        <div class="heart-seal">❤</div>
      </div>
      <span class="label">Read Me</span>
    </div>

    <!-- Letter Modal -->
    <div class="letter-modal" v-if="showLetter" @click.self="closeLetter">
      <div class="letter-content">
        <button class="close-btn" @click="closeLetter">×</button>
        <h2>My Dearest,</h2>
        <p>
          In this vast universe, you are my favorite coordinate. 
          Every rose in this garden blooms for you.
          <br><br>
          Just like these stars that shine specifically for us,
          my love for you is constant and infinite.
        </p>
        <p class="sign">Forever Yours,<br>FKF</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  show: boolean
}>();

const isPlaying = ref(false);
const showLetter = ref(false);

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  // In a real app, trigger audio here
};

const openLetter = () => {
  showLetter.value = true;
};

const closeLetter = () => {
  showLetter.value = false;
};
</script>

<style scoped>
.love-modules {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 30px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 1s ease;
  pointer-events: none;
  z-index: 20;
}

.love-modules.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.module {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 15px;
  cursor: pointer;
  transition: transform 0.3s ease, background 0.3s;
}

.module:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

/* Music Player */
.music-player {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 220px;
}

.disc {
  width: 40px;
  height: 40px;
  background: #111;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.disc.playing {
  animation: spin 3s linear infinite;
}

.disc-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #ff0055;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #fff;
}

.info {
  flex: 1;
}

.song-name {
  color: #fff;
  font-size: 0.9rem;
  font-weight: bold;
}

.artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

.btn-control {
  background: none;
  border: none;
  color: #ff0055;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  margin-top: 5px;
}

/* Letter Box */
.letter-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
}

.envelope {
  width: 40px;
  height: 28px;
  background: #fff;
  position: relative;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.envelope::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 15px solid #e0e0e0;
}

.heart-seal {
  color: #ff0055;
  font-size: 12px;
  z-index: 2;
  margin-top: -5px;
}

.label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  margin-top: 8px;
}

/* Letter Modal */
.letter-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.letter-content {
  background: #fff;
  width: 90%;
  max-width: 500px;
  padding: 40px;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  font-family: 'Dancing Script', cursive;
  transform: rotate(-1deg);
  background-image: repeating-linear-gradient(#fff, #fff 29px, #eee 30px);
}

.letter-content h2 {
  color: #333;
  margin-top: 0;
  font-size: 2.5rem;
}

.letter-content p {
  color: #555;
  font-size: 1.5rem;
  line-height: 1.6;
}

.sign {
  text-align: right;
  margin-top: 30px;
  font-weight: bold;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .love-modules {
    flex-direction: column;
    align-items: center;
    bottom: 20px;
    gap: 15px;
  }
}
</style>