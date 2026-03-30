'use client';

import { Type, AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useEditorStore } from '@/hooks/useEditorStore';
import { cn } from '@/utils/cn';
import type { SubtitlePreset } from '@/types';

const PRESETS: { id: SubtitlePreset; label: string; description: string }[] = [
  { id: 'hormozi', label: 'Hormozi', description: 'Palavra por palavra, negrito, impacto' },
  { id: 'clean', label: 'Clean', description: 'Branco sobre fundo semi-transparente' },
  { id: 'karaoke', label: 'Karaoke', description: 'Highlight progressivo' },
  { id: 'typewriter', label: 'Typewriter', description: 'Efeito de digitação' },
  { id: 'pop', label: 'Pop', description: 'Animação bounce por palavra' },
];

const FONTS = [
  'Outfit', 'Plus Jakarta Sans', 'Inter', 'Roboto', 'Montserrat',
  'Poppins', 'Oswald', 'Bebas Neue', 'Anton',
];

const POSITIONS = [
  { id: 'top' as const, label: 'Topo', icon: <AlignLeft className="w-3.5 h-3.5" /> },
  { id: 'center' as const, label: 'Centro', icon: <AlignCenter className="w-3.5 h-3.5" /> },
  { id: 'bottom' as const, label: 'Rodapé', icon: <AlignRight className="w-3.5 h-3.5" /> },
];

const BACKGROUNDS = [
  { id: 'none' as const, label: 'Nenhum' },
  { id: 'blur' as const, label: 'Blur' },
  { id: 'solid' as const, label: 'Sólido' },
];

export function SubtitlesPanel() {
  const { subtitlesEnabled, toggleSubtitles, subtitleStyle, setSubtitleStyle } = useEditorStore();

  return (
    <div className="h-full overflow-y-auto">
      {/* Toggle */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-brand-light" />
          <span className="text-sm font-heading font-semibold text-text-primary">
            Legendas
          </span>
        </div>
        <button
          onClick={toggleSubtitles}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            subtitlesEnabled ? 'bg-brand-blue' : 'bg-bg-tertiary'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
              subtitlesEnabled && 'translate-x-5'
            )}
          />
        </button>
      </div>

      <div className={cn('space-y-6 p-4', !subtitlesEnabled && 'opacity-50 pointer-events-none')}>
        {/* Presets */}
        <div>
          <h4 className="text-xs font-heading font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Estilo
          </h4>
          <div className="space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSubtitleStyle({ preset: preset.id })}
                className={cn(
                  'w-full text-left p-3 rounded-btn border transition-all',
                  subtitleStyle.preset === preset.id
                    ? 'border-brand-blue bg-brand-blue/10'
                    : 'border-border hover:border-brand-blue/30 bg-bg-tertiary'
                )}
              >
                <p className="text-sm font-medium text-text-primary">{preset.label}</p>
                <p className="text-xs text-text-secondary">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <h4 className="text-xs font-heading font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Fonte
          </h4>
          <select
            value={subtitleStyle.fontFamily}
            onChange={(e) => setSubtitleStyle({ fontFamily: e.target.value })}
            className="w-full p-2.5 bg-bg-tertiary border border-border rounded-btn text-sm text-text-primary focus:outline-none focus:border-brand-blue/50"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">
              Tamanho
            </h4>
            <span className="text-xs text-brand-light">{subtitleStyle.fontSize}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="96"
            value={subtitleStyle.fontSize}
            onChange={(e) => setSubtitleStyle({ fontSize: Number(e.target.value) })}
            className="w-full h-1.5 bg-bg-tertiary rounded-full accent-brand-blue"
          />
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Cor do Texto
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={subtitleStyle.textColor}
                onChange={(e) => setSubtitleStyle({ textColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-text-secondary font-mono">
                {subtitleStyle.textColor}
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-heading font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Cor Destaque
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={subtitleStyle.highlightColor}
                onChange={(e) => setSubtitleStyle({ highlightColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-text-secondary font-mono">
                {subtitleStyle.highlightColor}
              </span>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <h4 className="text-xs font-heading font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Posição
          </h4>
          <div className="flex gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos.id}
                onClick={() => setSubtitleStyle({ position: pos.id })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn text-xs font-medium transition-all',
                  subtitleStyle.position === pos.id
                    ? 'bg-brand-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                )}
              >
                {pos.icon} {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div>
          <h4 className="text-xs font-heading font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Fundo
          </h4>
          <div className="flex gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSubtitleStyle({ background: bg.id })}
                className={cn(
                  'flex-1 py-2 rounded-btn text-xs font-medium transition-all',
                  subtitleStyle.background === bg.id
                    ? 'bg-brand-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                )}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
