'use client';

import { useState } from 'react';
import {
  RefreshCw, Trash2, Edit3, Plus, Palette, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useUIStore } from '@/hooks/useUIStore';
import { useVideoStore } from '@/hooks/useVideoStore';
import * as api from '@/lib/api';
import { formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { IllustrationStyle } from '@/types';

const STYLES: { id: IllustrationStyle; label: string }[] = [
  { id: 'flat', label: 'Flat / Vetorial' },
  { id: 'realistic', label: 'Realista' },
  { id: 'cartoon', label: 'Cartoon / Comic' },
  { id: 'minimalist', label: 'Minimalista' },
  { id: 'watercolor', label: 'Aquarela' },
  { id: '3d-render', label: '3D Render' },
  { id: 'custom', label: 'Custom' },
];

export function IllustrationsPanel() {
  const {
    illustrations, illustrationStyle, setIllustrationStyle,
    updateIllustration, removeIllustration, addIllustration,
  } = useEditorStore();
  const { setCurrentTime } = useUIStore();
  const { video } = useVideoStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  const handleEdit = (id: string, currentPrompt: string) => {
    setEditingId(id);
    setEditPrompt(currentPrompt);
  };

  const handleSaveEdit = (id: string) => {
    updateIllustration(id, { prompt: editPrompt });
    setEditingId(null);
  };

  const handleRegenerate = async (id: string) => {
    const ill = illustrations.find((i) => i.id === id);
    if (!ill) return;

    setRegeneratingIds((prev) => new Set([...prev, id]));
    try {
      const data = await api.regenerateImage({ prompt: ill.prompt, style: illustrationStyle });
      if (data.imageUrl) {
        updateIllustration(id, { imageUrl: data.imageUrl, style: illustrationStyle });
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAdd = () => {
    const newId = `ill_new_${Date.now()}`;
    addIllustration({
      id: newId,
      segmentId: '',
      prompt: 'Nova ilustração personalizada',
      imageUrl: `/api/placeholder/illustration/${newId}?style=${illustrationStyle}&prompt=Nova`,
      style: illustrationStyle,
      start: 0,
      end: Math.min(10, video?.duration || 10),
      position: 'top-right',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Style selector */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-brand-light" />
          <h4 className="text-xs font-heading font-semibold text-text-primary">
            Estilo Global
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setIllustrationStyle(style.id)}
              className={cn(
                'px-2.5 py-1 rounded-btn text-xs transition-all',
                illustrationStyle === style.id
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Illustrations grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {illustrations.map((ill) => (
          <div
            key={ill.id}
            className="glass-card p-3 group hover:border-brand-blue/30 transition-all"
          >
            <div className="flex gap-3">
              <div className="relative shrink-0">
                <GripVertical className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 cursor-grab" />
                {regeneratingIds.has(ill.id) ? (
                  <div className="w-20 h-16 rounded bg-bg-tertiary flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-brand-blue animate-spin" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={ill.imageUrl}
                    alt={ill.prompt}
                    className="w-20 h-16 rounded bg-bg-tertiary object-cover cursor-pointer"
                    onClick={() => setCurrentTime(ill.start)}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {editingId === ill.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full p-2 bg-bg-tertiary border border-border rounded-btn text-xs text-text-primary resize-none focus:outline-none focus:border-brand-blue/50"
                      rows={2}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleSaveEdit(ill.id)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-text-primary line-clamp-2 mb-1">
                      {ill.prompt}
                    </p>
                    <p className="text-[10px] text-text-secondary font-mono">
                      {formatTime(ill.start)} — {formatTime(ill.end)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {editingId !== ill.id && (
              <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => handleEdit(ill.id, ill.prompt)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-brand-light transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => handleRegenerate(ill.id)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-brand-light transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
                <button
                  onClick={() => removeIllustration(ill.id)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-secondary hover:text-error transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Remover
                </button>
              </div>
            )}
          </div>
        ))}

        {illustrations.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            Nenhuma ilustração gerada ainda
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-border">
        <Button variant="secondary" size="sm" className="w-full" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> Adicionar Ilustração
        </Button>
      </div>
    </div>
  );
}
