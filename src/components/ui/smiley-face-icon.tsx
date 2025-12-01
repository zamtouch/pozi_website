import React from 'react';

interface SmileyFaceIconProps {
  size?: number;
  className?: string;
}

export default function SmileyFaceIcon({ 
  size = 24, 
  className = ''
}: SmileyFaceIconProps) {
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
      {/* Smiley face - light yellow/lime green outline */}
      <g stroke="#f0f9d8" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Face outline (incomplete circle, hand-drawn style) */}
        <path d="M7 11.5 Q7 7 12 6.5 Q17 7 17 11.5 Q17 15 12 15.5 Q7 15 7 11.5" />
        {/* Left eye (short upward curve) */}
        <path d="M9.5 9.5 Q10 9 10.5 9.5" />
        {/* Right eye (short upward curve) */}
        <path d="M13.5 9.5 Q14 9 14.5 9.5" />
        {/* Smile (longer upward curve) */}
        <path d="M9 13.5 Q12 15.5 15 13.5" />
      </g>
    </svg>
  );
}

