import React from 'react';

interface VercelSvgLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function VercelSvgLogo({ width = 24, height = 24, color = 'currentColor' }: VercelSvgLogoProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L24 22H0L12 2Z" fill={color} />
    </svg>
  );
}
