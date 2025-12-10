<template>
  <div class="garden-wrapper">
    <!-- 3D Background (Fixed) -->
    <div id="scene-canvas" class="scene-background"></div>

    <!-- Music Control (Fixed) -->
    <div class="music-control" @click="toggleMusic">
      <span class="icon">{{ isMusicPlaying ? '🎵' : '🔇' }}</span>
    </div>

    <!-- Loading Overlay -->
    <div class="opening-overlay" :class="{ 'fade-out': isLoaded }">
      <div class="loading-text">Growing our garden...</div>
    </div>

    <!-- Scrollable Content Layer -->
    <div class="content-layer" @scroll="onScroll">
      
      <!-- Section 1: Hero (Title) -->
      <section class="section hero-section">
        <div class="hero-content">
          <h1 class="main-title">FKF <span class="amp">&</span> XY</h1>
          <h2 class="sub-title">520 · 1314</h2>
          <p class="scroll-hint">Scroll to explore our love</p>
          <div class="scroll-arrow">↓</div>
        </div>
      </section>

      <!-- Section 2: Our Story -->
      <section class="section story-section">
        <div class="glass-card">
          <h2>Our Story</h2>
          <p>
            It started with a simple "Hello World", but it became the most beautiful algorithm of my life.
            Like a rose that blooms in the wild, our love grew naturally, fiercely, and beautifully.
          </p>
          <p>
            Every day with you is a new commit to our repository of memories.
            No bugs, just features.
          </p>
        </div>
      </section>

      <!-- Section 3: Moments (Gallery) -->
      <section class="section gallery-section">
        <h2 class="section-title">Precious Moments</h2>
        <div class="gallery-grid">
          <div class="gallery-item" v-for="n in 6" :key="n">
            <div class="photo-placeholder">
              <span>Moment {{ n }}</span>
              <div class="heart-icon">❤️</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Promises -->
      <section class="section promise-section">
        <div class="glass-card">
          <h2>My Promises</h2>
          <ul class="promise-list">
            <li>To be your debugger when life throws errors.</li>
            <li>To be your CSS when you need style.</li>
            <li>To love you until the end of the loop.</li>
            <li>To always bring you roses, virtual or real.</li>
          </ul>
        </div>
      </section>

      <!-- Interactive Modules Component -->
      <div class="modules-wrapper">
        <LoveModules 
          :show="true" 
          :is-playing="isMusicPlaying"
          @toggle-music="toggleMusic"
          theme="bright" 
        />
      </div>

      <!-- Footer -->
      <footer class="footer">
        <p>Created with ❤️ for You</p>
        <p class="date">Forever & Always</p>
      </footer>
    </div>

    <audio ref="audioRef" loop preload="auto" src="/music/wedding.mp3"></audio>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';
import LoveModules from '../components/secret/LoveModules.vue';

const audioRef = ref<HTMLAudioElement | null>(null);
const isMusicPlaying = ref(false);
const isLoaded = ref(false);

// Three.js Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let clock: THREE.Clock;

// Objects
let grassMesh: THREE.InstancedMesh;
let roseMesh: THREE.InstancedMesh;
let petals: THREE.Points;
let fireflies: THREE.Points;

// Uniforms
const windUniforms = {
  uTime: { value: 0 },
  uWindStrength: { value: 0.3 }, // Stronger wind
  uWindSpeed: { value: 1.2 }
};

const bloomUniforms = {
  uTime: { value: 0 },
  uBloomProgress: { value: 0 },
  uColor: { value: new THREE.Color(0xff0033) } // Deeper Red
};

// Config
const GRASS_COUNT = 30000; // More grass
const ROSE_COUNT = 500;   // More roses
const PETAL_COUNT = 2000; // More petals
const FIREFLY_COUNT = 500; // New fireflies

onMounted(async () => {
  initThree();
  createGrass();
  createRoses();
  createPetalRain();
  createFireflies();
  
  animate();

  setTimeout(() => {
    isLoaded.value = true;
    playMusic();
    startBloomSequence();
  }, 1000);

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('mousemove', onMouseMove);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
});

function initThree() {
  const container = document.getElementById('scene-canvas');
  if (!container) return;

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  // More realistic sky gradient using Fog and background color
  scene.background = new THREE.Color(0x87CEEB); 
  scene.fog = new THREE.FogExp2(0xe0f7fa, 0.02); // Soft fog

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 12);
  camera.lookAt(0, 1, 0);

  // Improved Lighting
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x228822, 0.6); // Sky/Ground
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.5); // Warm sun
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);
}

// --- GRASS SYSTEM (Enhanced) ---
function createGrass() {
  const geometry = new THREE.PlaneGeometry(0.15, 1.2, 1, 4);
  geometry.translate(0, 0.6, 0);

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;
      uniform float uTime;
      
      void main() {
        vUv = uv;
        vHeight = position.y;
        
        vec3 pos = position;
        
        // Complex wind
        float noise = sin(0.1 * instanceMatrix[3][0] + uTime * 0.5);
        float wave = sin(uTime * 1.5 + instanceMatrix[3][0] * 0.3 + instanceMatrix[3][2] * 0.3);
        float bend = pow(position.y, 1.5) * (0.5 + noise * 0.2);
        
        pos.x += wave * bend;
        pos.z += wave * bend * 0.3;
        
        vec4 mPos = instanceMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * mPos;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vHeight;
      
      void main() {
        // More realistic green gradients
        vec3 bottomColor = vec3(0.05, 0.2, 0.05); // Deep green
        vec3 topColor = vec3(0.4, 0.7, 0.2);     // Lush green
        
        vec3 color = mix(bottomColor, topColor, vHeight);
        // Add slight shadow at bottom
        color *= 0.8 + 0.2 * vHeight;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: windUniforms,
    side: THREE.DoubleSide
  });

  grassMesh = new THREE.InstancedMesh(geometry, material, GRASS_COUNT);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < GRASS_COUNT; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 40 - 5;
    
    dummy.position.set(x, 0, z);
    dummy.scale.setScalar(0.7 + Math.random() * 0.6);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
  }
  
  grassMesh.receiveShadow = true;
  scene.add(grassMesh);
}

// --- ROSE SYSTEM (Enhanced) ---
function createRoses() {
  const geometry = new THREE.SphereGeometry(0.35, 24, 24); // Smoother
  
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float uTime;
      uniform float uBloomProgress;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        vec3 pos = position;
        
        float angle = position.y * 4.0;
        float unfold = smoothstep(0.0, 1.0, uBloomProgress);
        
        // Spiral unfold
        float swirl = sin(pos.y * 8.0 + uTime * 0.5) * 0.15 * unfold;
        pos.x += swirl;
        pos.z -= swirl;
        
        float openFactor = pos.y > 0.0 ? (1.0 + unfold * 0.5) : 1.0;
        pos.x *= openFactor;
        pos.z *= openFactor;

        vec4 mPos = instanceMatrix * vec4(pos, 1.0);
        
        // Sway
        float sway = sin(uTime + mPos.x);
        mPos.x += sway * 0.1 * unfold;
        
        gl_Position = projectionMatrix * viewMatrix * mPos;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uColor;
      
      void main() {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(vNormal, light), 0.0);
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 2.0);
        
        // Velvety Red
        vec3 finalColor = uColor * (0.3 + diff * 0.7) + vec3(0.8, 0.2, 0.4) * rim * 0.5;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    uniforms: bloomUniforms
  });

  roseMesh = new THREE.InstancedMesh(geometry, material, ROSE_COUNT);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < ROSE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 35;
    
    dummy.position.set(x, 0.6 + Math.random() * 0.4, z);
    dummy.scale.setScalar(0.8 + Math.random() * 0.5);
    dummy.rotation.set(Math.random()*0.2, Math.random()*Math.PI, Math.random()*0.2);
    dummy.updateMatrix();
    roseMesh.setMatrixAt(i, dummy.matrix);
  }
  
  roseMesh.castShadow = true;
  scene.add(roseMesh);
}

// --- PARTICLE RAIN (Enhanced) ---
function createPetalRain() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PETAL_COUNT * 3);
  const randoms = new Float32Array(PETAL_COUNT * 3);
  
  for(let i=0; i<PETAL_COUNT; i++) {
    positions[i*3] = (Math.random() - 0.5) * 60;
    positions[i*3+1] = Math.random() * 30 + 5;
    positions[i*3+2] = (Math.random() - 0.5) * 40;
    
    randoms[i*3] = Math.random();
    randoms[i*3+1] = Math.random();
    randoms[i*3+2] = Math.random();
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
  
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute vec3 aRandom;
      uniform float uTime;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        
        // Fall + Wind
        float speed = 1.5 + aRandom.y;
        float yOffset = mod(uTime * speed, 30.0);
        pos.y -= yOffset;
        if (pos.y < 0.0) pos.y += 30.0;
        
        pos.x += sin(uTime + aRandom.x * 10.0) * 1.0; // Stronger drift
        pos.z += cos(uTime + aRandom.z * 10.0) * 0.5;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (15.0 * aRandom.x + 8.0) * (10.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = 0.9;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if(length(coord) > 0.5) discard;
        gl_FragColor = vec4(1.0, 0.6, 0.7, vAlpha);
      }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false
  });
  
  petals = new THREE.Points(geometry, material);
  scene.add(petals);
}

// --- FIREFLIES (New) ---
function createFireflies() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(FIREFLY_COUNT * 3);
  const randoms = new Float32Array(FIREFLY_COUNT);

  for(let i=0; i<FIREFLY_COUNT; i++) {
    positions[i*3] = (Math.random() - 0.5) * 50;
    positions[i*3+1] = Math.random() * 5 + 0.5;
    positions[i*3+2] = (Math.random() - 0.5) * 30;
    randoms[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aRandom;
      uniform float uTime;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        
        // Gentle float
        pos.y += sin(uTime * 2.0 + aRandom * 100.0) * 0.2;
        pos.x += cos(uTime * 1.0 + aRandom * 50.0) * 0.2;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (4.0 * aRandom + 2.0) * (10.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        // Blink
        vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + aRandom * 10.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if(length(coord) > 0.5) discard;
        // Warm gold/yellow
        gl_FragColor = vec4(1.0, 0.9, 0.4, vAlpha);
      }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  fireflies = new THREE.Points(geometry, material);
  scene.add(fireflies);
}

function startBloomSequence() {
  gsap.to(bloomUniforms.uBloomProgress, {
    value: 1,
    duration: 3,
    ease: "power2.out"
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  
  windUniforms.uTime.value = elapsedTime;
  bloomUniforms.uTime.value = elapsedTime;
  if(petals) (petals.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
  if(fireflies) (fireflies.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;

  renderer.render(scene, camera);
}

// --- SCROLL INTERACTION ---
function onScroll(e: Event) {
  const target = e.target as HTMLElement;
  const scrollY = target.scrollTop;

  // Camera moves up/down or zooms out based on scroll
  // Initial position (0, 3, 12)
  
  // As we scroll down, camera lifts up to see the garden from above
  camera.position.y = 3 + scrollY * 0.01;
  camera.position.z = 12 - scrollY * 0.005;
  camera.lookAt(0, 1 + scrollY * 0.005, 0);
}

function toggleMusic() {
  if (!audioRef.value) return;
  if (audioRef.value.paused) {
    playMusic();
  } else {
    audioRef.value.pause();
    isMusicPlaying.value = false;
  }
}

function playMusic() {
  if (audioRef.value) {
    audioRef.value.play().then(() => {
      isMusicPlaying.value = true;
    }).catch(() => {});
  }
}

function onMouseMove(event: MouseEvent) {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  // Subtle parallax
  camera.position.x += (x - camera.position.x) * 0.05;
  camera.position.y += (y * 0.5 + 3 - camera.position.y) * 0.05;
  camera.lookAt(0, 1, 0);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
</script>

<style scoped>
/* High Quality Fonts */
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');

.garden-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.scene-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* Behind content */
  background: linear-gradient(to bottom, #87CEEB 0%, #e0f7fa 100%);
}

.content-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto; /* Scrollable */
  scroll-behavior: smooth;
  z-index: 10;
}

/* --- HERO SECTION --- */
.hero-section {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.hero-content {
  color: #fff;
  text-shadow: 0 4px 20px rgba(0,0,0,0.2);
  animation: fadeIn 2s ease-out;
}

.main-title {
  font-family: 'Great Vibes', cursive; /* Handwritten Style */
  font-size: 8rem;
  margin: 0;
  color: #fff;
  background: linear-gradient(to right, #fff, #ffebee);
  -webkit-background-clip: text;

  filter: drop-shadow(0 0 10px rgba(255,105,180,0.5));
}

.amp {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 4rem;
  vertical-align: middle;
  color: #ffeb3b;
}

.sub-title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  margin: 10px 0;
  font-weight: normal;
  letter-spacing: 5px;
  color: #fff;
}

.scroll-hint {
  margin-top: 50px;
  font-size: 1rem;
  opacity: 0.8;
  letter-spacing: 2px;
}

.scroll-arrow {
  font-size: 2rem;
  animation: bounce 2s infinite;
  margin-top: 10px;
}

/* --- SECTIONS --- */
.section {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.section-title {
  font-family: 'Great Vibes', cursive;
  font-size: 4rem;
  color: #d81b60;
  margin-bottom: 40px;
  text-shadow: 0 2px 10px rgba(255,255,255,0.8);
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  padding: 60px;
  border-radius: 30px;
  max-width: 800px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  border: 1px solid rgba(255,255,255,0.8);
  margin: 20px;
}

.glass-card h2 {
  font-family: 'Great Vibes', cursive;
  font-size: 3.5rem;
  color: #c2185b;
  margin-bottom: 20px;
}

.glass-card p {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 20px;
}

/* --- GALLERY --- */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  width: 100%;
}

.gallery-item {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.gallery-item:hover {
  transform: translateY(-10px);
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background: #ffebee;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #d81b60;
  font-family: 'Playfair Display', serif;
}

.heart-icon {
  font-size: 2rem;
  margin-top: 10px;
}

/* --- PROMISES --- */
.promise-list {
  list-style: none;
  padding: 0;
  text-align: left;
  display: inline-block;
}

.promise-list li {
  font-size: 1.2rem;
  margin-bottom: 15px;
  padding-left: 30px;
  position: relative;
}

.promise-list li::before {
  content: '🌹';
  position: absolute;
  left: 0;
  top: 2px;
}

/* --- FOOTER --- */
.footer {
  padding: 50px;
  text-align: center;
  color: #555;
  background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
}

.footer .date {
  font-family: 'Great Vibes', cursive;
  font-size: 2rem;
  color: #d81b60;
}

/* --- UI CONTROLS --- */
.music-control {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  font-size: 1.5rem;
}

.opening-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 1.5s ease-out;
  pointer-events: none;
}

.opening-overlay.fade-out {
  opacity: 0;
}

.loading-text {
  font-family: 'Great Vibes', cursive;
  font-size: 3rem;
  color: #d81b60;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hide scrollbar for clean look but allow scroll */
.content-layer::-webkit-scrollbar {
  width: 8px;
}
.content-layer::-webkit-scrollbar-track {
  background: transparent;
}
.content-layer::-webkit-scrollbar-thumb {
  background: rgba(255, 105, 180, 0.5);
  border-radius: 4px;
}
</style>
