import React from 'react';
import { Composition } from 'remotion';
import { VideoWithOverlays } from './compositions/VideoWithOverlays';
import type { Transcription, Illustration, SubtitleStyle } from '@/types';

interface FinalVideoProps {
  videoSrc: string;
  transcription: Transcription;
  illustrations: Illustration[];
  subtitleStyle: SubtitleStyle;
  subtitlesEnabled: boolean;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* @ts-expect-error -- Remotion generic arity varies by version */}
      <Composition<FinalVideoProps>
        id="FinalVideo"
        component={VideoWithOverlays}
        durationInFrames={30 * 60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: '',
          transcription: {
            text: '',
            segments: [],
            words: [],
            language: 'pt',
            duration: 0,
          },
          illustrations: [],
          subtitleStyle: {
            preset: 'hormozi',
            fontFamily: 'Outfit',
            fontSize: 48,
            textColor: '#FFFFFF',
            highlightColor: '#2563EB',
            position: 'bottom',
            background: 'none',
          },
          subtitlesEnabled: true,
        }}
      />
    </>
  );
};
