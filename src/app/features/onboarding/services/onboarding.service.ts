import { Injectable, computed, signal } from '@angular/core';
import { OnboardingData, OnboardingState, OnboardingStep } from '../models/onboarding.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly _state = signal<OnboardingState>({
    currentStep: 'welcome',
    completedSteps: [],
    data: {},
  });

  readonly state = this._state.asReadonly();
  readonly currentStep = computed(() => this._state().currentStep);
  readonly isComplete = computed(() => this._state().currentStep === 'complete');

  goToStep(step: OnboardingStep): void {
    this._state.update(s => ({ ...s, currentStep: step }));
  }

  completeStep(step: OnboardingStep, data?: Partial<OnboardingData>): void {
    this._state.update(s => ({
      ...s,
      completedSteps: [...s.completedSteps, step],
      data: { ...s.data, ...data },
    }));
  }

  reset(): void {
    this._state.set({ currentStep: 'welcome', completedSteps: [], data: {} });
  }
}
