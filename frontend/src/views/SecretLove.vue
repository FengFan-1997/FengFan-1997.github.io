<template>
  <div class="secret-love-container" ref="container">
    <div class="overlay-text" :class="{ 'visible': phase >= 2 }">
      <h1 class="main-title">FKF <span class="heart">❤</span> XY</h1>
      <div class="sub-text">
        <span class="number">520</span>
        <span class="divider">·</span>
        <span class="number">1314</span>
      </div>
      <p class="romantic-quote">In the galaxy of my universe, you are the only rose.</p>
    </div>
    
    <div class="instruction" v-if="phase === 0">
      <p>Touch the stars to bloom...</p>
    </div>
    <div class="instruction" v-if="phase === 1">
      <p>Touch again to reveal the truth...</p>
    </div>
    <div class="instruction" v-if="phase === 2">
      <p>One last touch...</p>
    </div>

    <LoveModules :show="phase >= 3" />
    
    <!-- Hidden element for interaction state -->
    <div style="display: none;">{{ phase }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';
import LoveModules from '../components/secret/LoveModules.vue';

const container = ref<HTMLElement | null>(null);
const phase = ref(0);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let particles: THREE.Points;
let heartParticles: THREE.Points;
let roses: THREE.Points[] = [];
let shootingStars: THREE.Mesh[] = [];
let burstParticles: THREE.Points[] = []; // For click interaction bursts

const mouse = new THREE.Vector2();

// Configuration
const PARTICLE_COUNT = 2000;
const ROSE_COLOR = 0xff0055;

onMounted(() => {
  initThree();
  animate();
  
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);
  window.addEventListener('touchstart', onClick, { passive: false });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('click', onClick);
  window.removeEventListener('touchstart', onClick);
  
  if (renderer) {
    renderer.dispose();
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

function initThree() {
  if (!container.value) return;

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050210, 0.002);
  scene.background = new THREE.Color(0x050210);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.value.appendChild(renderer.domElement);

  // Create Particles
  createAmbientParticles();
  createHeartGalaxy();
  createShootingStars();
  // Roses will be created on interaction
}

function createRoseTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 0, 85, 1)');
    gradient.addColorStop(0.5, 'rgba(100, 0, 30, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createAmbientParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  const color = new THREE.Color(ROSE_COLOR);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 100;
    positions[i3 + 1] = (Math.random() - 0.5) * 100;
    positions[i3 + 2] = (Math.random() - 0.5) * 100;

    colors[i3] = color.r;
    colors[i3 + 1] = color.g + (Math.random() * 0.2);
    colors[i3 + 2] = color.b;
    
    sizes[i] = Math.random() * 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// Parametric Heart Shape Function
function getHeartPosition(t: number, scale: number = 1) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const z = 0; // Flat heart
  return new THREE.Vector3(x * scale, y * scale, z * scale);
}

function createHeartGalaxy() {
  const geometry = new THREE.BufferGeometry();
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const centerColor = new THREE.Color(0xff0033);
  const outerColor = new THREE.Color(0xffaec9);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Mix of Heart and Rose shapes
    let pos;
    if (Math.random() > 0.5) {
        // Heart
        const t = Math.random() * Math.PI * 2;
        pos = getHeartPosition(t, 0.5 + Math.random() * 0.2);
        // Spread it out in Z to make it 3D
        pos.z += (Math.random() - 0.5) * 5;
    } else {
        // Rose-ish cloud
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 10 * Math.random();
        pos = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }

    positions[i3] = pos.x;
    positions[i3+1] = pos.y;
    positions[i3+2] = pos.z;

    const mixedColor = centerColor.clone().lerp(outerColor, Math.random());
    colors[i3] = mixedColor.r;
    colors[i3+1] = mixedColor.g;
    colors[i3+2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.6
  });

  heartParticles = new THREE.Points(geometry, material);
  scene.add(heartParticles);

  // Initial Bloom Animation
  if (heartParticles) {
    heartParticles.scale.set(0, 0, 0);
    gsap.to(heartParticles.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 4,
      ease: "elastic.out(1, 0.3)",
      delay: 0.5
    });
    gsap.to(heartParticles.rotation, {
      y: Math.PI * 2,
      duration: 5,
      ease: "power2.out"
    });
  }
}

function createBloomingRoses() {
  const roseCount = 50; // Optimized count for mobile
  roses = [];
  
  const roseTexture = createRoseTexture();

  for (let i = 0; i < roseCount; i++) {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 400; // Increased density
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Random position for each rose
    const rosePos = new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 60
    );

    const color = new THREE.Color();
    color.setHSL(Math.random() * 0.1 + 0.9, 0.9, 0.5); // Red/Pink hues

    for (let j = 0; j < particleCount; j++) {
      // Rhodonea Curve (Rose) - more detailed
      const k = 4; // 4 petals
      const theta = Math.random() * Math.PI * 2;
      // Add some randomness to r to fill the volume
      const r = Math.cos(k * theta) * (0.8 + Math.random() * 0.4); 
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      // More depth
      const z = (Math.random() - 0.5) * 1.0;

      positions[j * 3] = x;
      positions[j * 3 + 1] = y;
      positions[j * 3 + 2] = z;

      colors[j * 3] = color.r;
      colors[j * 3 + 1] = color.g;
      colors[j * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5, // Larger size because of texture
      map: roseTexture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0
    });

    const rose = new THREE.Points(geometry, material);
    rose.position.copy(rosePos);
    rose.scale.set(0, 0, 0); // Start invisible
    scene.add(rose);
    roses.push(rose);

    // Staggered bloom animation
    gsap.to(rose.scale, {
      x: 3 + Math.random() * 2,
      y: 3 + Math.random() * 2,
      z: 3 + Math.random() * 2,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
      ease: "back.out(1.7)"
    });
    
    gsap.to(material, {
      opacity: 0.9,
      duration: 2,
      delay: Math.random() * 2
    });
    
    // Constant rotation
    gsap.to(rose.rotation, {
      z: Math.PI * 2,
      duration: 10 + Math.random() * 10,
      repeat: -1,
      ease: "none"
    });
  }
}

function createShootingStars() {
  const geometry = new THREE.ConeGeometry(0.1, 3, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  
  for(let i=0; i<5; i++) {
    const star = new THREE.Mesh(geometry, material);
    resetShootingStar(star);
    scene.add(star);
    shootingStars.push(star);
  }
}

function resetShootingStar(star: THREE.Mesh) {
  star.position.x = (Math.random() - 0.5) * 100;
  star.position.y = (Math.random() - 0.5) * 100 + 50;
  star.position.z = (Math.random() - 0.5) * 50;
  star.rotation.z = -Math.PI / 4;
  (star as any).speed = 0.5 + Math.random();
}

function animateShootingStars() {
  shootingStars.forEach(star => {
    star.position.x -= (star as any).speed;
    star.position.y -= (star as any).speed;
    
    if(star.position.y < -50) {
      resetShootingStar(star);
    }
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Rotate ambient particles
  if (particles) {
    particles.rotation.y = time * 0.05;
    particles.rotation.x = time * 0.02;
  }

  // Pulse heart particles
  if (heartParticles) {
    heartParticles.rotation.y = -time * 0.1;
    const scale = 1 + Math.sin(time * 2) * 0.05;
    heartParticles.scale.set(scale, scale, scale);
  }
  
  animateShootingStars();
  animateBursts();

  // Gentle camera movement based on mouse
  camera.position.x += (mouse.x * 10 - camera.position.x) * 0.05;
  camera.position.y += (-mouse.y * 10 - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

function onResize() {
  if (!container.value) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event: MouseEvent | TouchEvent) {
  // Phase progression logic
  if (phase.value < 3) {
    phase.value++;
    
    if (phase.value === 1) {
      createBloomingRoses();
    }
  }
  
  // Always do the burst effect
  let clientX, clientY;
  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  shootHeartBurst(clientX, clientY);
}

function shootHeartBurst(clientX: number, clientY: number) {
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = -(clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const spawnPos = camera.position.clone().add(dir.multiplyScalar(40));

  createBurst(spawnPos);
}

function createBurst(position: THREE.Vector3) {
  const geometry = new THREE.BufferGeometry();
  const count = 100;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = [];

  const color = new THREE.Color().setHSL(Math.random(), 1, 0.6);

  for(let i=0; i<count; i++) {
    positions[i*3] = position.x;
    positions[i*3+1] = position.y;
    positions[i*3+2] = position.z;

    const t = Math.random() * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    velocities.push({
      x: hx * 0.05 * Math.random(),
      y: hy * 0.05 * Math.random(),
      z: (Math.random() - 0.5) * 0.5
    });

    colors[i*3] = color.r;
    colors[i*3+1] = color.g;
    colors[i*3+2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 1
  });

  const burst = new THREE.Points(geometry, material);
  (burst as any).velocities = velocities;
  (burst as any).life = 1.0;
  
  scene.add(burst);
  burstParticles.push(burst);
}

function animateBursts() {
  for(let i = burstParticles.length - 1; i >= 0; i--) {
    const burst = burstParticles[i];
    const velocities = (burst as any).velocities;
    const positions = burst.geometry.attributes.position.array as Float32Array;
    
    (burst as any).life -= 0.02;
    (burst.material as THREE.PointsMaterial).opacity = (burst as any).life;

    if((burst as any).life <= 0) {
      scene.remove(burst);
      burstParticles.splice(i, 1);
      continue;
    }

    for(let j=0; j<velocities.length; j++) {
      positions[j*3] += velocities[j].x;
      positions[j*3+1] += velocities[j].y;
      positions[j*3+2] += velocities[j].z;
    }
    burst.geometry.attributes.position.needsUpdate = true;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@1,700&display=swap');

.secret-love-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #050210;
  overflow: hidden;
  z-index: 9999;
  cursor: pointer;
  touch-action: none;
}

.overlay-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  pointer-events: none;
  opacity: 0;
  transition: opacity 2s ease-in-out;
  z-index: 10;
  width: 100%;
  text-shadow: 0 0 10px rgba(255, 0, 85, 0.5);
}

.overlay-text.visible {
  opacity: 1;
}

.main-title {
  font-family: 'Playfair Display', serif;
  font-size: 5rem;
  margin: 0;
  background: linear-gradient(135deg, #ff0055 0%, #ff99aa 50%, #fff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 15px rgba(255, 0, 85, 0.6));
  animation: floatTitle 6s ease-in-out infinite;
}

.heart {
  color: #ff0055;
  -webkit-text-fill-color: #ff0055;
  animation: beat 1.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  display: inline-block;
}

.sub-text {
  font-family: 'Dancing Script', cursive;
  font-size: 3.5rem;
  margin-top: 1rem;
  color: #ffaec9;
  text-shadow: 0 0 15px rgba(255, 174, 201, 0.8);
  letter-spacing: 2px;
}

.divider {
  margin: 0 20px;
  font-size: 2rem;
  vertical-align: middle;
  color: #ff0055;
}

.romantic-quote {
  font-family: 'Dancing Script', cursive;
  font-size: 1.8rem;
  margin-top: 3rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.instruction {
  position: absolute;
  bottom: 80px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  letter-spacing: 2px;
  animation: fadePulse 3s infinite;
  pointer-events: none;
}

@keyframes beat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

@keyframes fadePulse {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 0.8; transform: translateY(-5px); }
}

@keyframes floatTitle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 3.5rem;
  }
  .sub-text {
    font-size: 2.5rem;
  }
  .romantic-quote {
    font-size: 1.4rem;
    padding: 0 20px;
  }
}
</style>