import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useAuthStore } from "@/store/authStore";
import "./OnboardingTour.css";

const onboardingSteps = [
  {
    id: 1,
    title: "Bem-vindo ao InvestAlert!",
    description:
      "Sua plataforma de monitoramento de investimentos. Vamos fazer um rápido tour pelas funções principais.",
    target: "app-layout__brand",
    position: "bottom" as const,
  },
  {
    id: 2,
    title: "Dashboard",
    description:
      "Aqui você tem uma visão geral de todos os seus investimentos, com gráficos e estatísticas em tempo real.",
    target: "dashboard-nav",
    position: "right" as const,
  },
  {
    id: 3,
    title: "Ativos",
    description:
      "Gerencie todos os ativos do mercado. Veja cotações, análises e adicione novos ativos ao seu portfólio.",
    target: "ativos-nav",
    position: "right" as const,
  },
  {
    id: 4,
    title: "Scanner",
    description:
      "Use ferramentas avançadas para escanear e identificar oportunidades de investimento no mercado.",
    target: "scanner-nav",
    position: "right" as const,
  },
  {
    id: 5,
    title: "Carteira",
    description:
      "Acompanhe sua carteira de investimentos com performance, alocação de ativos e rentabilidade.",
    target: "carteira-nav",
    position: "right" as const,
  },
  {
    id: 6,
    title: "Alertas",
    description:
      "Configure alertas personalizados para receber notificações quando seus ativos atingem metas específicas.",
    target: "alertas-nav",
    position: "right" as const,
  },
  {
    id: 7,
    title: "Notificações",
    description:
      "Acompanhe todos os avisos gerados pelos seus alertas e mantenha-se informado sobre suas ações.",
    target: "notificacoes-nav",
    position: "right" as const,
  },
];

export default function OnboardingTour() {
  const {
    isVisible,
    currentStep,
    hasCompletedOnboarding,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    startOnboarding,
  } = useOnboardingStore();
  const { isAuthenticated, usuario } = useAuthStore();
  const previousUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && usuario?.usuarioId) {
      // Se o usuário mudou, reset o onboarding
      if (
        previousUserIdRef.current !== null &&
        previousUserIdRef.current !== usuario.usuarioId
      ) {
        localStorage.removeItem("investalert-onboarding");
        useOnboardingStore.setState({
          hasCompletedOnboarding: false,
          currentStep: 0,
          isVisible: false,
        });
      }

      previousUserIdRef.current = usuario.usuarioId;

      // Inicia o onboarding se ainda não foi completado
      if (!hasCompletedOnboarding && !isVisible) {
        startOnboarding();
      }
    }
  }, [
    isAuthenticated,
    usuario?.usuarioId,
    hasCompletedOnboarding,
    isVisible,
    startOnboarding,
  ]);

  if (!isVisible || currentStep >= onboardingSteps.length) return null;

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-backdrop" onClick={skipOnboarding} />

      <div
        className={`onboarding-tooltip onboarding-tooltip--${currentStepData.position}`}
        data-step={currentStep}
      >
        <div className="onboarding-tooltip__header">
          <h3 className="onboarding-tooltip__title">{currentStepData.title}</h3>
          <button
            className="onboarding-tooltip__close"
            onClick={skipOnboarding}
            aria-label="Pular tour"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <p className="onboarding-tooltip__description">
          {currentStepData.description}
        </p>

        <div className="onboarding-tooltip__progress">
          <div className="onboarding-tooltip__progress-bar">
            <div
              className="onboarding-tooltip__progress-fill"
              style={{
                width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
              }}
            />
          </div>
          <span className="onboarding-tooltip__step-counter">
            {currentStep + 1} de {onboardingSteps.length}
          </span>
        </div>

        <div className="onboarding-tooltip__actions">
          <button
            type="button"
            className="onboarding-tooltip__button onboarding-tooltip__button--skip"
            onClick={skipOnboarding}
          >
            Pular
          </button>
          <button
            type="button"
            className="onboarding-tooltip__button onboarding-tooltip__button--next"
            onClick={handleNext}
          >
            {isLastStep ? "Concluir" : "Próximo"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
