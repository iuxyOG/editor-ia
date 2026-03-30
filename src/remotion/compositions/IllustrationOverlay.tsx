import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Img } from 'remotion';
import type { IllustrationStyle } from '@/types';

interface IllustrationOverlayProps {
  imageUrl: string;
  position: string;
  style: IllustrationStyle;
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-left': { top: '5%', left: '5%' },
  'top-right': { top: '5%', right: '5%' },
  'bottom-left': { bottom: '15%', left: '5%' },
  'bottom-right': { bottom: '15%', right: '5%' },
  'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'full': { top: 0, left: 0, width: '100%', height: '100%' },
};

export const IllustrationOverlay: React.FC<IllustrationOverlayProps> = ({
  imageUrl,
  position,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in animation
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Scale animation
  const scale = interpolate(frame, [0, fps * 0.3], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  const posStyle = POSITION_STYLES[position] || POSITION_STYLES['top-right'];
  const isFullScreen = position === 'full';

  return (
    <div
      style={{
        position: 'absolute',
        ...posStyle,
        opacity,
        transform: `${posStyle.transform || ''} scale(${scale})`.trim(),
        zIndex: isFullScreen ? 1 : 5,
      }}
    >
      <Img
        src={imageUrl}
        style={{
          width: isFullScreen ? '100%' : '200px',
          height: isFullScreen ? '100%' : 'auto',
          borderRadius: isFullScreen ? 0 : '12px',
          boxShadow: isFullScreen ? 'none' : '0 4px 20px rgba(0,0,0,0.5)',
          objectFit: isFullScreen ? 'cover' : 'contain',
        }}
      />
    </div>
  );
};
