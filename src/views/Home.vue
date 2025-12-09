<template>
  <div class="home">
    <Sidebar />
    <div class="content">
      <h1>Welcome to the Project</h1>
      <p>
        <router-link to="/ingredient">Go to Ingredient Module</router-link>
      </p>
      <p>
        <router-link to="/christmas-tree">Go to Christmas Tree Module</router-link>
      </p>
      <p>
        <router-link to="/portfolio-home">Go to Portfolio Home (New Design)</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #0f172a;
}

.content {
  text-align: center;
  padding: 50px;
  color: #e2e8f0;
}

.content a { color: #38bdf8; }
</style>
