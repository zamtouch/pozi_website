import React from 'react';

interface CheckmarkIconProps {
  size?: number;
  className?: string;
}

export default function CheckmarkIcon({ 
  size = 24, 
  className = ''
}: CheckmarkIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circular background - dark teal/green */}
      <circle
        cx="12"
        cy="12"
        r="12"
        fill="#005b42"
      />
      {/* Checkmark - light yellow/lime green (thick rounded V shape) */}
      <path
        d="M8 12 L11 16 L16 8"
        stroke="#f0f9d8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

