import { createRouter, createWebHistory } from 'vue-router';
import Ingredient from '../Ingredient/index.vue';
import ChristmasTree from '../ChristmasTree/index.vue';
import PortfolioHome from '../views/PortfolioHome.vue';
import GeminiChat from '../views/GeminiChat.vue';
import Translator from '../views/Translator.vue';
import StoryTeller from '../views/StoryTeller.vue';
import ResumeForge from '../views/ResumeForge.vue';
import CodeGuardian from '../views/CodeGuardian.vue';
import TravelPlanner from '../views/TravelPlanner.vue';
import NexusDashboard from '../views/NexusDashboard.vue';
import AetherMarket from '../views/AetherMarket.vue';
import SecretLove from '../views/SecretLove.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/secret-garden',
      name: 'secret-garden',
      component: SecretLove
    },
    {
      path: '/',
      name: 'home',
      component: PortfolioHome
    },
    {
      path: '/portfolio-home',
      name: 'portfolio-home',
      component: PortfolioHome
    },
    {
      path: '/gemini-chat',
      name: 'gemini-chat',
      component: GeminiChat
    },
    {
      path: '/translator',
      name: 'translator',
      component: Translator
    },
    {
      path: '/storyteller',
      name: 'storyteller',
      component: StoryTeller
    },
    {
      path: '/ingredient',
      name: 'ingredient',
      component: Ingredient
    },
    {
      path: '/christmas-tree',
      name: 'christmas-tree',
      component: ChristmasTree
    },
    {
      path: '/resume-forge',
      name: 'resume-forge',
      component: ResumeForge
    },
    {
      path: '/code-guardian',
      name: 'code-guardian',
      component: CodeGuardian
    },
    {
      path: '/travel-planner',
      name: 'travel-planner',
      component: TravelPlanner
    },
    {
      path: '/nexus-dashboard',
      name: 'nexus-dashboard',
      component: NexusDashboard
    },
    {
      path: '/aether-market',
      name: 'aether-market',
      component: AetherMarket
    }
  ]
});

export default router;
