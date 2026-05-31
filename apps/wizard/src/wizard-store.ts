/**
 * Wizard navigation + non-token decisions. Token *values* do NOT live here:
 * they live in `themeStore` (the copied theme engine), so the wizard's diff and
 * the Theme Builder's diff share one format. This store only holds the step and
 * the choices that are attributes/metadata rather than CSS vars (preset, scheme,
 * conformance, the accent seed, completion ticks).
 *
 * Mirrors the playground store pattern: pure state + subscribe.
 */

export const STEPS = [
  "preset",
  "scheme",
  "accent",
  "tones",
  "type",
  "shape",
  "conformance",
  "review",
  "export"
] as const;
export type Step = (typeof STEPS)[number];

export type Preset = "default" | "midnight" | "corporate" | "custom";
export type Scheme = "light" | "dark" | "auto";
export type Conformance = "aa" | "aaa";

export interface WizardConfig {
  preset: Preset;
  scheme: Scheme;
  /** Accent seed hex; the derived 10-stop ramp is written into themeStore. */
  seed?: string;
  conformance: Conformance;
  /** Google Fonts css2 `family=` query for the chosen webfont (export reminder). */
  fontGoogle?: string;
  completed: Partial<Record<Step, boolean>>;
}

export interface WizardState {
  step: Step;
  config: WizardConfig;
}

const DEFAULT_CONFIG: WizardConfig = {
  preset: "default",
  scheme: "auto",
  conformance: "aa",
  completed: {}
};

type Listener = (state: WizardState) => void;

class WizardStore {
  private state: WizardState = { step: "preset", config: { ...DEFAULT_CONFIG } };
  private listeners = new Set<Listener>();

  get(): WizardState {
    return this.state;
  }

  setStep(step: Step): void {
    if (this.state.step === step) return;
    this.state = { ...this.state, step };
    this.emit();
  }

  setConfig(partial: Partial<WizardConfig>): void {
    this.state = { ...this.state, config: { ...this.state.config, ...partial } };
    this.emit();
  }

  markComplete(step: Step, done = true): void {
    this.state = {
      ...this.state,
      config: {
        ...this.state.config,
        completed: { ...this.state.config.completed, [step]: done }
      }
    };
    this.emit();
  }

  reset(): void {
    this.state = { step: "preset", config: { ...DEFAULT_CONFIG, completed: {} } };
    this.emit();
  }

  next(): void {
    const i = STEPS.indexOf(this.state.step);
    const nextStep = STEPS[Math.min(i + 1, STEPS.length - 1)];
    if (nextStep) {
      this.markComplete(this.state.step);
      this.setStep(nextStep);
    }
  }

  prev(): void {
    const i = STEPS.indexOf(this.state.step);
    const prevStep = STEPS[Math.max(i - 1, 0)];
    if (prevStep) this.setStep(prevStep);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.state);
  }
}

export const wizardStore = new WizardStore();
