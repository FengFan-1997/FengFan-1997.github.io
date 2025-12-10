import { createRouter, createWebHistory } from 'vue-router';
import Ingredient from '../Ingredient/index.vue';
import ChristmasTree from '../ChristmasTree/index.vue';
import PortfolioHome from '../views/PortfolioHome.vue';
import GeminiChat from '../views/GeminiChat.vue';
import Translator from '../views/Translator.vue';
import StoryTeller from '../views/StoryTeller.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    }
  ]
});

export default router;
