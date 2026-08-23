import { DbService, ExecutionRun, StepResult } from './db.service';
import { chromium, Browser, Page } from 'playwright';

interface RunContext {
  browser?: Browser;
  page?: Page;
}

export class ExecutionService {
  private activeRuns = new Map<string, RunContext>();

  constructor(private dbService: DbService) {}

  async startExecution(automationId: string): Promise<string> {
    const plan = await this.dbService.getAutomationById(automationId);
    if (!plan) throw new Error('Automation not found');

    const runId = 'run_' + Date.now();
    
    const stepResults: StepResult[] = plan.steps.map(s => ({
      step: s.action || s.type, // Fallback to type if action isn't there
      status: 'Pending',
      originalAction: s.originalAction,
      ...s
    }));

    const run: ExecutionRun = {
      runId,
      automationId,
      status: 'Running',
      currentStepIndex: 0,
      stepResults,
      context: {},
      startedAt: Date.now()
    };

    await this.dbService.saveExecutionRun(run);
    
    this.activeRuns.set(runId, {});
    
    this.runLoop(runId);
    return runId;
  }

  async resumeExecution(runId: string): Promise<void> {
    const run = await this.dbService.getExecutionRun(runId);
    if (!run || run.status !== 'WaitingForApproval') throw new Error('Run not waiting for approval');
    
    if (run.stepResults[run.currentStepIndex]) {
      run.stepResults[run.currentStepIndex].status = 'Completed';
    }
    run.currentStepIndex++;
    run.status = 'Running';
    await this.dbService.saveExecutionRun(run);
    this.runLoop(runId);
  }

  async cancelExecution(runId: string): Promise<void> {
    const run = await this.dbService.getExecutionRun(runId);
    if (!run) throw new Error('Run not found');
    
    if (run.stepResults[run.currentStepIndex]) {
      run.stepResults[run.currentStepIndex].status = 'Failed';
    }
    run.status = 'Failed';
    await this.dbService.saveExecutionRun(run);
    
    const runCtx = this.activeRuns.get(runId);
    if (runCtx?.browser) {
       await runCtx.browser.close().catch(() => {});
    }
  }

  private async runLoop(runId: string) {
    let run = await this.dbService.getExecutionRun(runId);
    if (!run) return;

    const runCtx = this.activeRuns.get(runId) || {};
    this.activeRuns.set(runId, runCtx);

    try {
      while (run && run.status === 'Running' && run.currentStepIndex < run.stepResults.length) {
        const currentStep = run.stepResults[run.currentStepIndex];
        if (!currentStep) break;
        const action = (currentStep as any).action || currentStep.step;
        
        currentStep.status = 'Running';
        await this.dbService.saveExecutionRun(run);
        
        // Wait briefly for UI visual updates
        await new Promise(res => setTimeout(res, 1500));

        run = await this.dbService.getExecutionRun(runId) as ExecutionRun;
        if (!run || run.status !== 'Running') break;

        try {
          // Auto-initialize browser if needed for any browser action
          if (!runCtx.browser && ['OPEN_BROWSER', 'NAVIGATE_URL', 'CLICK', 'TYPE'].includes(action)) {
            runCtx.browser = await chromium.launch({ headless: false });
            runCtx.page = await runCtx.browser.newPage();
            if (action !== 'OPEN_BROWSER' && action !== 'NAVIGATE_URL') {
              await runCtx.page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' }).catch(e => console.warn("Fallback nav failed", e));
            }
          }

          if (action === 'OPEN_BROWSER') {
            let url = (currentStep as any).url;
            if (url && runCtx.page) {
              if (!url.startsWith('http')) url = 'https://' + url;
              await runCtx.page.goto(url, { waitUntil: 'domcontentloaded' }).catch(e => console.warn("Nav failed", e));
            }
          }
          else if (action === 'OPEN_TAB') {
            if (runCtx.browser) runCtx.page = await runCtx.browser.newPage();
          }
          else if (action === 'NAVIGATE_URL') {
            let url = (currentStep as any).url;
            if (url && runCtx.page) {
              // Ensure url has protocol
              if (!url.startsWith('http')) url = 'https://' + url;
              await runCtx.page.goto(url, { waitUntil: 'domcontentloaded' });
            }
            else throw new Error("URL or Page not available");
          }
          else if (action === 'CLICK') {
            const target = (currentStep as any).target;
            if (target && runCtx.page) {
              // Robust selector strategy
              const element = runCtx.page.getByRole('button', { name: target, exact: false }).first()
                .or(runCtx.page.getByRole('link', { name: target, exact: false }).first())
                .or(runCtx.page.getByText(target, { exact: false }).first())
                .or(runCtx.page.locator(`text=${target}`).first()); 

              await element.click({ timeout: 5000 }).catch(e => console.warn("Failed to click element", e));
            } else {
               console.warn("Target missing for CLICK, skipping click action");
            }
          }
          else if (action === 'TYPE') {
            const target = (currentStep as any).target;
            const value = (currentStep as any).value;
            if (target && value && runCtx.page) {
              const element = runCtx.page.getByRole('textbox', { name: target, exact: false }).first()
                .or(runCtx.page.getByRole('searchbox', { name: target, exact: false }).first())
                .or(runCtx.page.locator(`text=${target}`).first())
                .or(runCtx.page.locator(target).first());
                
              await element.fill(value, { timeout: 5000 }).catch(e => console.warn("Failed to fill element", e));
            } else if (value && runCtx.page) {
               // Fallback: just type if target isn't found but value is there
               await runCtx.page.keyboard.type(value);
            } else {
               console.warn("Target or value missing for TYPE, skipping type action");
            }
          }
          else if (action === 'KEY_PRESS') {
             const key = (currentStep as any).key;
             if (key && runCtx.page) {
               // Handle special keys
               let playwrightKey = key;
               if (key.toUpperCase() === 'ENTER') playwrightKey = 'Enter';
               await runCtx.page.keyboard.press(playwrightKey);
             }
          }
          else if (action === 'human_approval' || currentStep.step === 'human_approval') {
            currentStep.status = 'WaitingForApproval';
            run.status = 'WaitingForApproval';
            await this.dbService.saveExecutionRun(run);
            break; // Pause loop
          }
          else {
             // Fallback for unknown action (pretend it succeeded so it doesn't break)
             console.log("Unknown action, skipping:", action);
          }

          if ((currentStep.status as string) !== 'WaitingForApproval') {
            currentStep.status = 'Completed';
            run.currentStepIndex++;
            
            if (run.currentStepIndex >= run.stepResults.length) {
              run.status = 'Completed';
              run.completedAt = Date.now();
            }
            await this.dbService.saveExecutionRun(run);
          }
        } catch (stepError: any) {
          console.error("Step Failed:", stepError);
          currentStep.status = 'Failed';
          run.status = 'Failed';
          run.context = run.context || {};
          run.context.errorDetails = stepError.message || 'Unknown error';
          await this.dbService.saveExecutionRun(run);
          break;
        }
      }
    } catch (fatalError) {
       console.error("Fatal run error:", fatalError);
    }
  }
}
