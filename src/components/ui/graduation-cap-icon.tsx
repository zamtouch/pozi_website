import React from 'react';

interface GraduationCapIconProps {
  size?: number;
  className?: string;
}

export default function GraduationCapIcon({ 
  size = 24, 
  className = ''
}: GraduationCapIconProps) {
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
      {/* Graduation cap - light yellow/lime green outline */}
      <g stroke="#f0f9d8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Cap top (square, slightly askew) */}
        <path d="M8.5 10.5 L15.5 10.5 L14.5 7.5 L9.5 7.5 Z" />
        {/* Cap base (rounded) */}
        <path d="M7.5 10.5 Q12 12.5 16.5 10.5" />
        {/* Tassel knot (circular) */}
        <circle cx="12" cy="7.5" r="1.2" fill="#f0f9d8" />
        {/* Tassel (triangular shape below knot) */}
        <path d="M12 8.7 L11 10.5 L13 10.5 Z" />
      </g>
    </svg>
  );
}

