'use client';

import { useState } from 'react';
import { Wand2, History, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEditorStore } from '@/hooks/useEditorStore';
import { cn } from '@/utils/cn';

const PROMPT_TEMPLATES = [
  {
    label: 'Corporativo & Profissional',
    prompt: 'Adicione ilustrações corporativas e profissionais. Use estilo clean, ícones vetoriais e paleta sóbria. Legendas elegantes e discretas.',
  },
  {
    label: 'Humor & Memes',
    prompt: 'Use estilo meme e humor. Ilustrações engraçadas, expressivas e exageradas. Legendas grandes e impactantes com cores vibrantes.',
  },
  {
    label: 'Dados & Gráficos',
    prompt: 'Foque em dados e gráficos. Crie visualizações de dados, infográficos e dashboards contextuais. Estilo tech/data visualization.',
  },
  {
    label: 'Tech / Startup',
    prompt: 'Estilo tech/startup moderno. Ilustrações isométricas, gradientes neon, visual futurista. Legendas com efeito glow.',
  },
  {
    label: 'Educacional',
    prompt: 'Estilo educacional e didático. Diagramas explicativos, setas, destaques em pontos-chave. Legendas claras e organizadas.',
  },
  {
    label: 'Storytelling Cinematográfico',
    prompt: 'Abordagem cinematográfica. Ilustrações atmosféricas, mood boards, color grading dramático. Legendas sutis e elegantes.',
  },
];

export function PromptPanel() {
  const { customPrompt, setCustomPrompt, promptHistory, addPromptHistory } = useEditorStore();
  const [isApplying, setIsApplying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleApply = async () => {
    if (!customPrompt.trim()) return;
    setIsApplying(true);
    addPromptHistory(customPrompt);

    // Simular regeneração
    await new Promise((r) => setTimeout(r, 2000));
    setIsApplying(false);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Prompt input */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-brand-light" />
          <h4 className="text-xs font-heading font-semibold text-text-primary">
            Prompt Personalizado
          </h4>
        </div>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Descreva como você quer que a IA edite seu vídeo..."
          className="w-full p-3 bg-bg-tertiary border border-border rounded-btn text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-brand-blue/50 min-h-[100px]"
          rows={4}
        />

        <Button
          glow
          size="sm"
          className="w-full mt-3"
          onClick={handleApply}
          loading={isApplying}
          disabled={!customPrompt.trim()}
        >
          <Sparkles className="w-4 h-4" />
          Aplicar e Regenerar
        </Button>
      </div>

      {/* Templates */}
      <div className="flex-1 p-4 space-y-4">
        <h4 className="text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
          Templates
        </h4>

        <div className="space-y-2">
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.label}
              onClick={() => setCustomPrompt(template.prompt)}
              className="w-full text-left p-3 rounded-btn bg-bg-tertiary border border-border hover:border-brand-blue/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  {template.label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                {template.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 p-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <History className="w-4 h-4" />
          Histórico ({promptHistory.length})
        </button>

        {showHistory && promptHistory.length > 0 && (
          <div className="max-h-40 overflow-y-auto px-3 pb-3 space-y-1">
            {promptHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setCustomPrompt(item.prompt)}
                className="w-full text-left p-2 rounded-btn text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors truncate"
              >
                {item.prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
