import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLanguageStore = defineStore('language', () => {
  const currentLang = ref<'en' | 'zh'>('en');

  const translations = {
    en: {
      nav: {
        hero: 'Home',
        projects: 'Projects',
        about: 'About',
        skills: 'Skills',
        experience: 'Experience',
        testimonials: 'Testimonials',
      },
      hero: {
        greeting: 'Hello, I am',
        role: 'Creative Developer',
        description: 'Building immersive web experiences with Vue 3, Three.js, and AI.',
        subtitle: 'Creating digital experiences where intelligence meets immersion',
        valueProp: 'AI Driven · Interactive Innovation · Extreme Performance',
        scroll: 'SCROLL TO EXPLORE',
        cta: 'View My Work',
      },
      about: {
        title: 'ABOUT ME',
        bio: '3+ years of frontend experience, focusing on React/Vue ecosystem. Expert in building frontend architecture from scratch, emphasizing code maintainability and user experience.',
        proficient: 'Proficient In',
        familiar: 'Familiar With',
        philosophy: 'User experience at the core, code quality as the baseline. Delivering reliable frontend solutions.',
        stats: {
          years: 'Years Exp.',
          projects: 'Projects',
          awards: 'Awards',
        }
      },
      projects: {
        title: 'SELECTED WORKS',
        viewProject: 'View Project',
        filters: {
          all: 'All',
        },
        items: {
          ingredients: {
            title: 'AI INGREDIENTS',
            desc: 'Intelligent Label Generation powered by Gemini. Transform simple text into FDA-compliant nutrition facts and ingredient lists with one click.',
          },
          gemini: {
            title: 'GEMINI CHAT',
            desc: 'Advanced conversational interface powered by Gemini 2.5 Flash. Features real-time streaming responses and context-aware interactions.',
          },
          polyglot: {
            title: 'AI POLYGLOT',
            desc: 'Smart translation and text polishing tool. Supports multiple languages and tone adjustments (Professional, Casual, Creative).',
          },
          storyteller: {
            title: 'STORYTELLER',
            desc: 'Interactive AI story generator. Create immersive narratives based on genre, theme, and character inputs.',
          },
          christmas: {
            title: 'CHRISTMAS MAGIC',
            desc: 'An immersive 3D experience controlled by hand gestures. Uses MediaPipe for tracking and Three.js for rendering a magical interactive scene.',
          },
          nexus: {
            title: 'NEXUS DASHBOARD',
            desc: 'Next-gen analytics platform for high-frequency trading. Features real-time WebGL charting, sub-millisecond data updates, and customizable workspaces.',
          },
          market: {
            title: 'AETHER MARKET',
            desc: 'Decentralized NFT marketplace with 3D immersive gallery mode. Built on Ethereum with IPFS integration and custom smart contracts.',
          }
        }
      },
      common: {
        loading: 'Loading...',
      }
    },
    zh: {
      nav: {
        hero: '首页',
        projects: '项目',
        about: '关于',
        skills: '技能',
        experience: '经历',
        testimonials: '评价',
      },
      hero: {
        greeting: '你好，我是',
        role: '创意开发工程师',
        description: '使用 Vue 3, Three.js 和 AI 构建沉浸式网络体验。',
        subtitle: '打造智能与沉浸并存的数字体验',
        valueProp: 'AI 驱动 · 交互创新 · 极致性能',
        scroll: '向下滚动探索',
        cta: '查看作品',
      },
      projects: {
        title: '精选作品',
        viewProject: '查看项目',
        filters: {
          all: '全部',
        },
        items: {
          ingredients: {
            title: 'AI 配料表',
            desc: '基于 Gemini 的智能标签生成。一键将简单文本转换为符合 FDA 标准的营养成分表和配料表。',
          },
          gemini: {
            title: 'Gemini 对话',
            desc: '基于 Gemini 2.5 Flash 的高级对话界面。支持实时流式响应和上下文感知交互。',
          },
          polyglot: {
            title: 'AI 多语言助手',
            desc: '智能翻译和文本润色工具。支持多种语言和语气调整（专业、休闲、创意）。',
          },
          storyteller: {
            title: '故事讲述者',
            desc: '交互式 AI 故事生成器。根据流派、主题和角色输入创建沉浸式叙事。',
          },
          christmas: {
            title: '圣诞魔法',
            desc: '通过手势控制的沉浸式 3D 体验。使用 MediaPipe 进行追踪，Three.js 进行渲染。',
          },
          nexus: {
            title: 'Nexus 仪表盘',
            desc: '面向高频交易的下一代分析平台。具有实时 WebGL 图表、亚毫秒级数据更新和可定制工作区。',
          },
          market: {
            title: 'Aether 市场',
            desc: '具有 3D 沉浸式画廊模式的去中心化 NFT 市场。基于以太坊构建，集成 IPFS 和自定义智能合约。',
          }
        }
      },
      common: {
        loading: '加载中...',
      }
    }
  };

  function toggleLanguage() {
    currentLang.value = currentLang.value === 'en' ? 'zh' : 'en';
  }

  function setLanguage(lang: 'en' | 'zh') {
    currentLang.value = lang;
  }

  function t(key: string) {
    const keys = key.split('.');
    let value: any = translations[currentLang.value];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return value;
  }

  return {
    currentLang,
    toggleLanguage,
    setLanguage,
    t
  };
});
