'use client';

import { useState, useMemo } from 'react';
import { Check, Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useUIStore } from '@/hooks/useUIStore';
import { formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export function SegmentsPanel() {
  const { segments, transcription } = useEditorStore();
  const { currentTime, setCurrentTime } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);

  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [segments, searchQuery]);

  const activeSegmentId = useMemo(() => {
    const seg = segments.find((s) => currentTime >= s.start && currentTime <= s.end);
    return seg?.id;
  }, [segments, currentTime]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-heading font-bold text-sm text-text-primary mb-3">
          Segmentos ({segments.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar na transcrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border rounded-btn text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-blue/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSegments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => setCurrentTime(segment.start)}
            className={cn(
              'w-full text-left p-3 rounded-btn transition-all duration-200',
              activeSegmentId === segment.id
                ? 'bg-brand-blue/10 border border-brand-blue/30'
                : 'hover:bg-bg-tertiary border border-transparent'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-brand-light font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(segment.start)} - {formatTime(segment.end)}
              </span>
              {segment.status === 'completed' && (
                <Check className="w-3.5 h-3.5 text-success" />
              )}
            </div>
            <p className="text-sm font-medium text-text-primary truncate">
              {segment.title}
            </p>
            {segment.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                {segment.description}
              </p>
            )}
          </button>
        ))}

        {filteredSegments.length === 0 && (
          <div className="text-center py-8 text-text-secondary text-sm">
            Nenhum segmento encontrado
          </div>
        )}
      </div>

      {/* Transcrição expandível */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowTranscription(!showTranscription)}
          className="w-full flex items-center justify-between p-3 text-sm font-heading font-semibold text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          Transcrição Completa
          {showTranscription ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        {showTranscription && (
          <div className="max-h-48 overflow-y-auto p-3 pt-0">
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {transcription?.text || 'Transcrição não disponível'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
