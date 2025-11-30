import React from 'react';

interface SmileyIconProps {
  size?: number;
  color?: 'green' | 'pink' | 'yellow-green' | 'yellow';
  className?: string;
  animated?: boolean;
}

const colorMap = {
  green: '#005b42',
  pink: '#fce7f3',
  'yellow-green': '#f0f9d8',
  yellow: '#fbbf24',
};

export default function SmileyIcon({ 
  size = 24, 
  color = 'yellow',
  className = '',
  animated = false 
}: SmileyIconProps) {
  const strokeColor = colorMap[color];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-smiley' : ''} ${className}`}
    >
      {/* Outline circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      {/* Eyes */}
      <circle
        cx="8"
        cy="9"
        r="1.5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="9"
        r="1.5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      {/* Smile */}
      <path
        d="M8 14c0 2.5 1.5 4 4 4s4-1.5 4-4"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

