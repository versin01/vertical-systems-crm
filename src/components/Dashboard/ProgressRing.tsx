import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  percentage, 
  size, 
  strokeWidth, 
  color, 
  label 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative">
        {/* Outer glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
            transform: 'scale(1.2)'
          }}
        />
        
        {/* SVG Progress Ring */}
        <svg width={size} height={size} className="transform -rotate-90 relative z-10">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(55, 65, 81, 0.3)"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="drop-shadow-lg"
          />
          
          {/* Progress circle with enhanced styling */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-2000 ease-out drop-shadow-2xl"
            style={{
              filter: `drop-shadow(0 0 12px ${color}80)`
            }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="50%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
        
        {/* Center content with enhanced styling */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white drop-shadow-lg">
            {percentage}%
          </span>
          <div 
            className="w-8 h-0.5 mt-2 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        </div>
        
        {/* Animated particles around the ring */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360;
            const delay = i * 0.2;
            return (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-pulse"
                style={{
                  backgroundColor: color,
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle}deg) translateY(-${radius + 10}px) translateX(-50%)`,
                  animationDelay: `${delay}s`,
                  opacity: 0.6
                }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Enhanced label */}
      <div className="mt-4 text-center">
        <span className="text-lg font-semibold text-gray-200 drop-shadow-sm">
          {label}
        </span>
        <div 
          className="w-12 h-0.5 mx-auto mt-2 rounded-full opacity-40"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default ProgressRing;