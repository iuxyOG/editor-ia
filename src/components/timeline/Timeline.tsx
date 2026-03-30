'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import {
  DndContext, useDraggable, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useVideoStore } from '@/hooks/useVideoStore';
import { useUIStore } from '@/hooks/useUIStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import { formatTime } from '@/utils/format';
import { cn } from '@/utils/cn';

const SEGMENT_COLORS = [
  'bg-brand-blue/30',
  'bg-brand-neon/30',
  'bg-brand-light/30',
  'bg-success/30',
  'bg-warning/30',
];

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { video } = useVideoStore();
  const { currentTime, setCurrentTime } = useUIStore();
  const { segments, illustrations, subtitlesEnabled, transcription, updateIllustration } = useEditorStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);

  const duration = video?.duration || 0;
  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !duration || draggingId || resizing) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      setCurrentTime(Math.max(0, Math.min(duration, pct * duration)));
    },
    [duration, setCurrentTime, draggingId, resizing]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, delta } = event;
    const illId = active.id as string;
    const ill = illustrations.find((i) => i.id === illId);
    if (!ill || !timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaSeconds = (delta.x / rect.width) * duration;
    // Snap to nearest second
    const snappedDelta = Math.round(deltaSeconds);

    const newStart = Math.max(0, Math.min(duration - 1, ill.start + snappedDelta));
    const illDuration = ill.end - ill.start;
    const newEnd = Math.min(duration, newStart + illDuration);

    updateIllustration(illId, { start: +newStart.toFixed(2), end: +newEnd.toFixed(2) });
  };

  // Handle resize via mouse events
  const handleResizeStart = (id: string, edge: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing({ id, edge });

    const startX = e.clientX;
    const ill = illustrations.find((i) => i.id === id);
    if (!ill || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();

    const handleMouseMove = (me: MouseEvent) => {
      const deltaX = me.clientX - startX;
      const deltaSec = Math.round((deltaX / rect.width) * duration);

      if (edge === 'left') {
        const newStart = Math.max(0, Math.min(ill.end - 1, ill.start + deltaSec));
        updateIllustration(id, { start: +newStart.toFixed(2) });
      } else {
        const newEnd = Math.max(ill.start + 1, Math.min(duration, ill.end + deltaSec));
        updateIllustration(id, { end: +newEnd.toFixed(2) });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Time markers
  const timeMarkers = useMemo(() => {
    if (!duration) return [];
    const interval = duration > 300 ? 60 : duration > 60 ? 30 : 10;
    const markers = [];
    for (let t = 0; t <= duration; t += interval) {
      markers.push({ time: t, position: (t / duration) * 100 });
    }
    return markers;
  }, [duration]);

  return (
    <div className="border-t border-border bg-bg-secondary p-3">
      {/* Time markers */}
      <div className="relative h-5 mb-1">
        {timeMarkers.map((m) => (
          <span
            key={m.time}
            className="absolute text-[10px] text-text-secondary font-mono -translate-x-1/2"
            style={{ left: `${m.position}%` }}
          >
            {formatTime(m.time)}
          </span>
        ))}
      </div>

      {/* Timeline tracks */}
      <div
        ref={timelineRef}
        className="relative cursor-pointer space-y-1"
        onClick={handleTimelineClick}
      >
        {/* Segments track */}
        <div className="relative h-8 bg-bg-tertiary rounded-sm overflow-hidden">
          {segments.map((seg, i) => {
            const left = (seg.start / duration) * 100;
            const width = ((seg.end - seg.start) / duration) * 100;
            return (
              <div
                key={seg.id}
                className={cn(
                  'absolute h-full border-r border-bg-primary/30 flex items-center px-1.5 overflow-hidden',
                  SEGMENT_COLORS[i % SEGMENT_COLORS.length]
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={seg.title}
              >
                <span className="text-[10px] text-text-primary truncate font-medium">
                  {seg.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Illustrations track — draggable */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="relative h-7 bg-bg-tertiary rounded-sm overflow-visible">
            <span className="absolute left-1 top-0.5 text-[9px] text-text-secondary z-[1] pointer-events-none">
              Ilustrações
            </span>
            {illustrations.map((ill) => (
              <DraggableIllustration
                key={ill.id}
                illustration={ill}
                duration={duration}
                isDragging={draggingId === ill.id}
                onResizeStart={handleResizeStart}
              />
            ))}
          </div>
        </DndContext>

        {/* Subtitles track */}
        {subtitlesEnabled && transcription && (
          <div className="relative h-5 bg-bg-tertiary rounded-sm overflow-hidden">
            {transcription.segments.map((seg) => {
              const left = (seg.start / duration) * 100;
              const width = ((seg.end - seg.start) / duration) * 100;
              return (
                <div
                  key={seg.id}
                  className="absolute h-full bg-success/20 border-l border-success/40"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              );
            })}
            <span className="absolute left-1 top-0.5 text-[9px] text-text-secondary">
              Legendas
            </span>
          </div>
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
          style={{ left: `${playheadPosition}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg" />
        </div>
      </div>
    </div>
  );
}

function DraggableIllustration({
  illustration,
  duration,
  isDragging,
  onResizeStart,
}: {
  illustration: { id: string; start: number; end: number; prompt: string };
  duration: number;
  isDragging: boolean;
  onResizeStart: (id: string, edge: 'left' | 'right', e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: illustration.id,
  });

  const left = (illustration.start / duration) * 100;
  const width = ((illustration.end - illustration.start) / duration) * 100;

  const style = {
    left: `${left}%`,
    width: `${width}%`,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute h-full bg-brand-neon/30 border border-brand-neon/50 rounded-sm group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-60 z-20 shadow-lg shadow-brand-neon/20'
      )}
      style={style}
      title={illustration.prompt}
      {...listeners}
      {...attributes}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand-neon/60 rounded-l-sm z-10"
        onMouseDown={(e) => onResizeStart(illustration.id, 'left', e)}
      />
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand-neon/60 rounded-r-sm z-10"
        onMouseDown={(e) => onResizeStart(illustration.id, 'right', e)}
      />
    </div>
  );
}
