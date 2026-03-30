'use client';

import { useEffect } from 'react';
import {
  Mic, Brain, Image, Film, Check, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useVideoStore } from '@/hooks/useVideoStore';
import { usePipeline } from '@/hooks/usePipeline';
import type { PipelineStep } from '@/types';

interface StepConfig {
  id: PipelineStep;
  label: string;
  icon: React.ReactNode;
}

const steps: StepConfig[] = [
  { id: 'transcription', label: 'Transcrição', icon: <Mic className="w-5 h-5" /> },
  { id: 'analysis', label: 'Análise de Conteúdo', icon: <Brain className="w-5 h-5" /> },
  { id: 'illustrations', label: 'Ilustrações', icon: <Image className="w-5 h-5" /> },
  { id: 'rendering', label: 'Renderização', icon: <Film className="w-5 h-5" /> },
];

export function ProcessingPipeline({ onComplete }: { onComplete: () => void }) {
  const { video } = useVideoStore();
  const {
    completedSteps, currentStep, progress, message, error, start, retry, stepOrder,
  } = usePipeline(video?.id ?? null, video?.url ?? null);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (stepOrder.every((s) => completedSteps.has(s))) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [completedSteps, stepOrder, onComplete]);

  const currentStepIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
          Processando seu vídeo
        </h2>
        <p className="text-text-secondary text-sm">{message}</p>
      </div>

      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = currentStep === step.id && !error;
        const isPending = currentStepIndex < index && !isCompleted;
        const isError = error && currentStep === step.id;

        return (
          <Card
            key={step.id}
            className={`transition-all duration-500 ${
              isCurrent ? 'border-brand-blue/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''
            } ${isPending ? 'opacity-40' : ''} ${isError ? 'border-error/40' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all duration-300
                  ${isCompleted ? 'bg-success/20 text-success' : ''}
                  ${isCurrent ? 'bg-brand-blue/20 text-brand-blue' : ''}
                  ${isPending ? 'bg-bg-tertiary text-text-secondary' : ''}
                  ${isError ? 'bg-error/20 text-error' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-heading font-semibold text-sm text-text-primary">
                    {step.label}
                  </h3>
                  {isCurrent && (
                    <span className="text-xs text-brand-light font-medium">{progress}%</span>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-success font-medium">Concluído</span>
                  )}
                </div>

                {isCurrent && <ProgressBar value={progress} size="sm" />}

                {isError && (
                  <p className="text-xs text-error mt-1">{error}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {error && (
        <div className="flex justify-center mt-6">
          <Button variant="secondary" onClick={retry}>
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
