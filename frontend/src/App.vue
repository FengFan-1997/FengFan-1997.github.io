<script setup lang="ts">
import Agent from './agent/components/Agent.vue';
</script>

<template>
  <router-view></router-view>
  <Agent />
</template>

<style>
/* Global styles can go here */
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
