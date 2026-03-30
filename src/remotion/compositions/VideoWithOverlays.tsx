import React from 'react';
import {
  AbsoluteFill, Video, useCurrentFrame, useVideoConfig, interpolate,
  Sequence,
} from 'remotion';
import { SubtitleTrack } from './SubtitleTrack';
import { IllustrationOverlay } from './IllustrationOverlay';
import type { Transcription, Illustration, SubtitleStyle } from '@/types';

interface VideoWithOverlaysProps {
  videoSrc: string;
  transcription: Transcription;
  illustrations: Illustration[];
  subtitleStyle: SubtitleStyle;
  subtitlesEnabled: boolean;
}

export const VideoWithOverlays: React.FC<VideoWithOverlaysProps> = ({
  videoSrc,
  transcription,
  illustrations,
  subtitleStyle,
  subtitlesEnabled,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Video base */}
      {videoSrc && (
        <Video
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}

      {/* Illustrations overlays */}
      {illustrations.map((ill) => (
        <Sequence
          key={ill.id}
          from={Math.round(ill.start * fps)}
          durationInFrames={Math.round((ill.end - ill.start) * fps)}
        >
          <IllustrationOverlay
            imageUrl={ill.imageUrl}
            position={ill.position}
            style={ill.style}
          />
        </Sequence>
      ))}

      {/* Subtitles */}
      {subtitlesEnabled && transcription?.words && (
        <SubtitleTrack
          words={transcription.words}
          style={subtitleStyle}
        />
      )}
    </AbsoluteFill>
  );
};
