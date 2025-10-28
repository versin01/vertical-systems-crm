import React, { useEffect, useRef, useState } from 'react';

interface SpiderWebData {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface SpiderWebChartProps {
  data: SpiderWebData[];
  width?: number;
  height?: number;
  levels?: number;
  animated?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
}

const SpiderWebChart: React.FC<SpiderWebChartProps> = ({
  data,
  width = 300,
  height = 300,
  levels = 5,
  animated = true,
  showGrid = true,
  showLabels = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [animationProgress, setAnimationProgress] = useState(0);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  useEffect(() => {
    if (animated) {
      setAnimationProgress(0);
      const startTime = Date.now();
      const duration = 2000; // 2 seconds

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        setAnimationProgress(easeOutCubic);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animate();
    } else {
      setAnimationProgress(1);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw grid/web
    if (showGrid) {
      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius * level) / levels;
        
        // Draw concentric polygons
        ctx.strokeStyle = `rgba(75, 85, 99, ${0.3 + (level / levels) * 0.4})`;
        ctx.lineWidth = level === levels ? 2 : 1;
        ctx.setLineDash(level === levels ? [] : [2, 4]);
        
        ctx.beginPath();
        for (let i = 0; i <= data.length; i++) {
          const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + Math.cos(angle) * levelRadius;
          const y = centerY + Math.sin(angle) * levelRadius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw radial lines
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      
      for (let i = 0; i < data.length; i++) {
        const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    // Draw data area with glow effect
    if (data.length > 0) {
      // Create glow effect
      ctx.shadowColor = '#14b8a6';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw filled area
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
      gradient.addColorStop(1, 'rgba(20, 184, 166, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      for (let i = 0; i <= data.length; i++) {
        const dataPoint = data[i % data.length];
        const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
        const normalizedValue = (dataPoint.value / dataPoint.maxValue) * animationProgress;
        const pointRadius = radius * normalizedValue;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw outline
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw data points
      for (let i = 0; i < data.length; i++) {
        const dataPoint = data[i];
        const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2;
        const normalizedValue = (dataPoint.value / dataPoint.maxValue) * animationProgress;
        const pointRadius = radius * normalizedValue;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;

        // Outer glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
        glowGradient.addColorStop(0, dataPoint.color + '80');
        glowGradient.addColorStop(1, dataPoint.color + '00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Main point
        const pointGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 6);
        pointGradient.addColorStop(0, '#ffffff');
        pointGradient.addColorStop(0.3, dataPoint.color);
        pointGradient.addColorStop(1, dataPoint.color + 'cc');
        
        ctx.fillStyle = pointGradient;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [data, width, height, levels, showGrid, animationProgress, centerX, centerY, radius]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
        style={{ background: 'radial-gradient(circle at center, #1f2937 0%, #111827 100%)' }}
      />
      
      {/* Labels */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none">
          {data.map((item, index) => {
            const angle = (index / data.length) * 2 * Math.PI - Math.PI / 2;
            const labelRadius = radius + 30;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;
            
            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white bg-gray-900/80 px-2 py-1 rounded-full backdrop-blur-sm border border-gray-700/50"
                style={{
                  left: x,
                  top: y,
                }}
              >
                <div className="text-center">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((item.value / item.maxValue) * 100 * animationProgress)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-gray-900/90 px-3 py-2 rounded-lg backdrop-blur-sm border border-gray-700/50">
          <div className="text-lg font-bold text-white">
            {Math.round(data.reduce((sum, item) => sum + (item.value / item.maxValue), 0) / data.length * 100 * animationProgress)}%
          </div>
          <div className="text-xs text-gray-400">Overall</div>
        </div>
      </div>
    </div>
  );
};

export default SpiderWebChart;