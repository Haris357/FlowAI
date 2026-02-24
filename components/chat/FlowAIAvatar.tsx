'use client';

import { useRef, useEffect } from 'react';
import { Box } from '@mui/joy';
import { useColorScheme } from '@mui/joy/styles';

interface FlowAIAvatarProps {
  size?: number;
  isThinking?: boolean;
}

export default function FlowAIAvatar({ size = 28, isThinking = false }: FlowAIAvatarProps) {
  const { mode } = useColorScheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isDark = mode === 'dark';

  const thinkingSrc = isDark ? '/thinkingdark.mp4' : '/thinkinglight.mp4';
  const hoverSrc = isDark ? '/hoverdark.mp4' : '/hoverlight.mp4';

  // Reset video when switching between thinking/idle
  useEffect(() => {
    if (videoRef.current) {
      if (isThinking) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isThinking]);

  const handleMouseEnter = () => {
    if (!isThinking && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (!isThinking && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: 'default',
        position: 'relative',
      }}
    >
      <video
        ref={videoRef}
        key={isThinking ? thinkingSrc : hoverSrc}
        autoPlay={isThinking}
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        <source src={isThinking ? thinkingSrc : hoverSrc} type="video/mp4" />
      </video>
    </Box>
  );
}
