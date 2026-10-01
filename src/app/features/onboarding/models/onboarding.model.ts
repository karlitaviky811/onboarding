export type OnboardingStep = 'welcome' | 'profile' | 'preferences' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  data: Partial<OnboardingData>;
}

export interface OnboardingData {
  name: string;
  email: string;
  preferences: string[];
}
