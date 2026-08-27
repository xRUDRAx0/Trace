import React from 'react';

export default function TraceLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 40" 
      height="1em"
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* TRACE Text */}
      <text 
        x="2" 
        y="31" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        fontWeight="700" 
        fontSize="34" 
        fill="currentColor" 
        letterSpacing="-0.04em"
      >
        trace
      </text>
      
      {/* Cursive Swoosh */}
      <path 
        d="M 2 34 C 12 40, 20 22, 30 12 C 40 2, 52 2, 62 8 C 72 14, 70 22, 64 20 C 58 18, 58 8, 66 8 C 74 8, 80 12, 86 12" 
        stroke="currentColor" 
        strokeOpacity="0.4"
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Dot */}
      <circle 
        cx="92" 
        cy="12" 
        r="1.5" 
        fill="currentColor" 
        fillOpacity="0.4" 
      />
    </svg>
  );
}
