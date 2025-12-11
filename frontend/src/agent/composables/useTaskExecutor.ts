import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TaskPlan, TaskStep } from '../types/task';

const STORAGE_KEY = 'agent_task_plan';

export function useTaskExecutor() {
  const plan = ref<TaskPlan | null>(null);
  const isExecuting = ref(false);
  const router = useRouter();

  // Restore state on mount (e.g. after page reload/navigation)
  const restoreState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only resume if valid and not finished
        if (parsed && parsed.status === 'running') {
          plan.value = parsed;
          console.log('Resuming task plan...', plan.value);

          // If the current step was 'navigate', assume it completed successfully if we are back here
          if (plan.value && plan.value.steps[plan.value.currentStepIndex].type === 'navigate') {
            plan.value.steps[plan.value.currentStepIndex].status = 'completed';
            plan.value.currentStepIndex++;
          }

          executePlan(true); // Resume
        }
      } catch (e) {
        console.error('Failed to restore plan', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const saveState = () => {
    if (plan.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan.value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const setPlan = (rawPlan: any[]) => {
    plan.value = {
      id: Date.now().toString(),
      steps: rawPlan.map((s) => ({
        ...s,
        status: 'pending',
        description: generateDescription(s)
      })),
      status: 'pending',
      currentStepIndex: 0
    };
    saveState();
    executePlan();
  };

  const generateDescription = (step: any): string => {
    switch (step.type) {
      case 'navigate':
        return `Go to ${step.target}`;
      case 'click':
        return `Click ${step.target}`;
      case 'input':
        return `Type "${step.value}" into ${step.target}`;
      case 'highlight':
        return `Find ${step.target}`;
      case 'wait':
        return `Wait for ${step.value}ms`;
      default:
        return `Unknown step`;
    }
  };

  const executePlan = async (resume = false) => {
    if (!plan.value) return;

    // Use resume to suppress unused warning if logic requires it
    if (resume) console.log('Resuming execution...');

    plan.value.status = 'running';
    isExecuting.value = true;
    saveState();

    // Start from current index
    for (let i = plan.value.currentStepIndex; i < plan.value.steps.length; i++) {
      plan.value.currentStepIndex = i;
      const step = plan.value.steps[i];

      // If resuming, skip the first step if it was already marked done (logic in restoreState handles this)
      // But if we are here, we need to run it.

      step.status = 'running';
      saveState();

      try {
        await executeStep(step);
        step.status = 'completed';
        saveState();

        // Small pause between steps
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        console.error('Task execution failed:', e);
        step.status = 'failed';
        plan.value.status = 'failed';
        isExecuting.value = false;
        saveState();
        return;
      }
    }

    plan.value.status = 'completed';
    isExecuting.value = false;
    saveState();

    // Auto clear after success
    setTimeout(() => {
      if (plan.value?.status === 'completed') {
        plan.value = null;
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 5000);
  };

  const executeStep = async (step: TaskStep): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        // Base delay
        try {
          switch (step.type) {
            case 'navigate':
              console.log('Navigating to:', step.target);
              saveState();
              if (step.target?.startsWith('/') && router) {
                await router.push(step.target);
                resolve();
              } else {
                window.location.href = step.target!;
              }
              break;

            case 'click':
              const elClick = document.querySelector(step.target!) as HTMLElement;
              if (elClick) {
                elClick.click();
                elClick.focus();
                resolve();
              } else {
                reject(`Element ${step.target} not found`);
              }
              break;

            case 'input':
              const elInput = document.querySelector(step.target!) as HTMLInputElement;
              if (elInput) {
                elInput.value = step.value || '';
                elInput.dispatchEvent(new Event('input', { bubbles: true }));
                elInput.dispatchEvent(new Event('change', { bubbles: true }));
                resolve();
              } else {
                reject(`Input ${step.target} not found`);
              }
              break;

            case 'highlight':
              const elHigh = document.querySelector(step.target!) as HTMLElement;
              if (elHigh) {
                elHigh.classList.add('agent-highlight-target');
                elHigh.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                  elHigh.classList.remove('agent-highlight-target');
                  resolve();
                }, 2000);
              } else {
                reject(`Element ${step.target} not found`);
              }
              break;

            case 'wait':
              setTimeout(resolve, parseInt(step.value || '1000'));
              break;

            default:
              resolve();
          }
        } catch (e) {
          reject(e);
        }
      }, 500);
    });
  };

  // Auto-restore on init
  restoreState();

  return {
    plan,
    isExecuting,
    setPlan
  };
}
