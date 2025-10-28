import React, { useEffect, useRef, useState } from 'react';

interface FunnelStage {
  id: string;
  label: string;
  value: number;
  color: string;
  icon?: string;
}

interface FunnelFlowProps {
  stages: FunnelStage[];
  width?: number;
  height?: number;
  animated?: boolean;
  showPercentages?: boolean;
}

const FunnelFlow: React.FC<FunnelFlowProps> = ({
  stages,
  width = 400,
  height = 300,
  animated = true,
  showPercentages = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      setAnimationProgress(0);
      const startTime = Date.now();
      const duration = 2500;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimationProgress(easeOutQuart);

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
  }, [animated, stages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (stages.length === 0) return;

    const maxValue = Math.max(1, ...stages.map(s => s.value));
    const stageHeight = (height - 40) / stages.length;
    const maxWidth = width - 80;

    // Draw flowing particles
    const particleCount = 20;
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < particleCount; i++) {
      const progress = (time + i * 0.5) % 4;
      const stageIndex = Math.floor(progress);
      const stageProgress = progress - stageIndex;
      
      if (stageIndex < stages.length - 1) {
        const currentStage = stages[stageIndex];
        const nextStage = stages[stageIndex + 1];
        
        const currentY = 40 + stageIndex * stageHeight + stageHeight / 2;
        const nextY = 40 + (stageIndex + 1) * stageHeight + stageHeight / 2;
        
        const currentWidth = (currentStage.value / maxValue) * maxWidth * animationProgress;
        const nextWidth = (nextStage.value / maxValue) * maxWidth * animationProgress;
        
        const y = currentY + (nextY - currentY) * stageProgress;
        const particleWidth = currentWidth + (nextWidth - currentWidth) * stageProgress;
        const x = 40 + particleWidth * (0.8 + Math.sin(time + i) * 0.1);
        
        // Particle glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glowGradient.addColorStop(0, '#00ffff80');
        glowGradient.addColorStop(1, '#00ffff00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle core
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw funnel stages
    stages.forEach((stage, index) => {
      const y = 40 + index * stageHeight;
      const stageWidth = (stage.value / maxValue) * maxWidth * animationProgress;
      const x = 40;

      // Stage background with glow
      ctx.shadowColor = stage.color;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Create gradient for the stage
      const gradient = ctx.createLinearGradient(x, y, x + stageWidth, y);
      gradient.addColorStop(0, stage.color + '80');
      gradient.addColorStop(0.5, stage.color);
      gradient.addColorStop(1, stage.color + '60');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, stageWidth, stageHeight - 10);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Stage border
      ctx.strokeStyle = stage.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, stageWidth, stageHeight - 10);

      // Connection lines to next stage
      if (index < stages.length - 1) {
        const nextStage = stages[index + 1];
        const nextStageWidth = (nextStage.value / maxValue) * maxWidth * animationProgress;
        
        // Draw flowing connection
        const connectionGradient = ctx.createLinearGradient(
          x + stageWidth, y + stageHeight - 10,
          x + nextStageWidth, y + stageHeight
        );
        connectionGradient.addColorStop(0, stage.color + '60');
        connectionGradient.addColorStop(1, nextStage.color + '60');
        
        ctx.strokeStyle = connectionGradient;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = time * 10;
        
        ctx.beginPath();
        ctx.moveTo(x + stageWidth, y + stageHeight - 10);
        ctx.lineTo(x + nextStageWidth, y + stageHeight);
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    });
  }, [stages, width, height, animationProgress]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
        style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
      />
      
      {/* Stage labels */}
      <div className="absolute inset-0 pointer-events-none">
        {stages.map((stage, index) => {
          const maxValue = Math.max(...stages.map(s => s.value));
          const stageHeight = (height - 40) / stages.length;
          const y = 40 + index * stageHeight;
          const stageWidth = (stage.value / maxValue) * (width - 80) * animationProgress;
          
          return (
            <div key={stage.id} className="absolute flex items-center">
              {/* Left label */}
              <div
                className="bg-gray-900/90 px-3 py-1 rounded-lg backdrop-blur-sm border border-gray-700/50 text-white text-sm font-medium"
                style={{
                  left: 10,
                  top: y + (stageHeight - 10) / 2 - 15,
                }}
              >
                {stage.label}
              </div>
              
              {/* Value label */}
              <div
                className="bg-gray-900/90 px-2 py-1 rounded-lg backdrop-blur-sm border border-gray-700/50 text-white text-xs font-bold"
                style={{
                  left: 50 + stageWidth + 10,
                  top: y + (stageHeight - 10) / 2 - 10,
                }}
              >
                {Math.round(stage.value * animationProgress)}
                {showPercentages && index > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({Math.round((stage.value / stages[0].value) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelFlow;