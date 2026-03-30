import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { TranscriptionWord, SubtitleStyle } from '@/types';

interface SubtitleTrackProps {
  words: TranscriptionWord[];
  style: SubtitleStyle;
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Agrupar palavras em blocos
  const blockSize = style.preset === 'hormozi' ? 3 : 6;
  const blocks: TranscriptionWord[][] = [];
  for (let i = 0; i < words.length; i += blockSize) {
    blocks.push(words.slice(i, i + blockSize));
  }

  // Encontrar bloco atual
  const currentBlock = blocks.find((block) => {
    const start = block[0].start;
    const end = block[block.length - 1].end;
    return currentTime >= start && currentTime <= end;
  });

  if (!currentBlock) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: '10%', left: '50%', transform: 'translateX(-50%)' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    bottom: { bottom: '10%', left: '50%', transform: 'translateX(-50%)' },
  };

  const bgStyles: Record<string, React.CSSProperties> = {
    none: {},
    blur: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px' },
    solid: { backgroundColor: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: '8px' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[style.position],
        ...bgStyles[style.background],
        textAlign: 'center',
        maxWidth: '80%',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
        {currentBlock.map((word, i) => {
          const isHighlighted = currentTime >= word.start && currentTime <= word.end;

          // Animação baseada no preset
          let wordStyle: React.CSSProperties = {
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            color: style.textColor,
            fontWeight: 800,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          };

          if (style.preset === 'hormozi' && isHighlighted) {
            wordStyle = {
              ...wordStyle,
              color: style.highlightColor,
              transform: 'scale(1.2)',
            };
          }

          if (style.preset === 'karaoke') {
            wordStyle = {
              ...wordStyle,
              color: isHighlighted ? style.highlightColor : style.textColor,
              opacity: isHighlighted ? 1 : 0.6,
            };
          }

          if (style.preset === 'pop') {
            const progress = isHighlighted
              ? interpolate(
                  currentTime - word.start,
                  [0, (word.end - word.start) * 0.3, word.end - word.start],
                  [0.5, 1.3, 1]
                )
              : 1;
            wordStyle = {
              ...wordStyle,
              transform: `scale(${progress})`,
              color: isHighlighted ? style.highlightColor : style.textColor,
            };
          }

          if (style.preset === 'typewriter') {
            const wordProgress = currentTime >= word.start ? 1 : 0;
            wordStyle = {
              ...wordStyle,
              opacity: wordProgress,
            };
          }

          return (
            <span
              key={i}
              style={{
                ...wordStyle,
                display: 'inline-block',
                transition: 'all 0.1s ease',
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
