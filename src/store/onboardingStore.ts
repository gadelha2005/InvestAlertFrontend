import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ONBOARDING_STORAGE_KEY = "investalert-onboarding";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  isVisible: boolean;
  startOnboarding: () => void;
  nextStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      isVisible: false,

      startOnboarding: () =>
        set({
          currentStep: 0,
          isVisible: true,
        }),

      nextStep: () =>
        set((state) => ({
          currentStep: state.currentStep + 1,
        })),

      skipOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
          isVisible: false,
          currentStep: 0,
        }),

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
          isVisible: false,
          currentStep: 0,
        }),

      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          currentStep: 0,
          isVisible: false,
        }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
    },
  ),
);
