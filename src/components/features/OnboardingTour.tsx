/**
 * Onboarding Tour Component
 * Interactive guided tour for first-time users
 */

import { useState, useEffect } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_STEPS: Step[] = [
  {
    target: '.balance-hero',
    content: '👋 Bem-vindo ao Finansix! Aqui você vê seu saldo disponível em tempo real.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.fab-new-transaction',
    content: '💰 Clique aqui para adicionar sua primeira transação. É rápido e fácil!',
    placement: 'top',
  },
  {
    target: '.card-optimizer',
    content: '🎯 O Finansix sugere automaticamente o melhor cartão para usar. Sem pensar!',
    placement: 'bottom',
  },
  {
    target: '.nav-wallet',
    content: '💳 Gerencie suas contas e cartões de crédito aqui.',
    placement: 'top',
  },
  {
    target: '.nav-analysis',
    content: '📊 Veja análises detalhadas dos seus gastos e tendências.',
    placement: 'top',
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    
    if (!hasCompletedOnboarding) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('onboarding_completed', 'true');
      
      if (onComplete) {
        onComplete();
      }

      // If user finished the tour, navigate to new transaction
      if (status === STATUS.FINISHED && action === 'close') {
        setTimeout(() => {
          navigate('/transactions/new');
        }, 500);
      }
    }
  };

  return (
    <Joyride
      steps={ONBOARDING_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      spotlightClicks
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(258 90% 66%)', // Primary color
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          fontSize: 15,
        },
        buttonNext: {
          backgroundColor: 'hsl(258 90% 66%)',
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(258 90% 66%)',
        },
        buttonSkip: {
          color: 'hsl(222 47% 11% / 0.5)',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}

/**
 * Hook to reset onboarding (for testing or user request)
 */
export function useResetOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    window.location.reload();
  };

  return { resetOnboarding };
}
