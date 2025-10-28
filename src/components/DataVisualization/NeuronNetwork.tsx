import React, { useEffect, useRef, useState } from 'react';

interface NeuronNode {
  id: string;
  x: number;
  y: number;
  value: number;
  label: string;
  color: string;
  connections: string[];
  pulse: number;
}

interface NeuronNetworkProps {
  data: {
    nodes: {
      id: string;
      value: number;
      label: string;
      color: string;
      connections: string[];
    }[];
  };
  width?: number;
  height?: number;
  animated?: boolean;
}

const NeuronNetwork: React.FC<NeuronNetworkProps> = ({ 
  data, 
  width = 400, 
  height = 300, 
  animated = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [nodes, setNodes] = useState<NeuronNode[]>([]);

  useEffect(() => {
    // Initialize nodes with positions
    const initialNodes: NeuronNode[] = data.nodes.map((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const centerX = width / 2;
      const centerY = height / 2;
      
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        pulse: Math.random() * Math.PI * 2
      };
    });
    
    setNodes(initialNodes);
  }, [data, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update pulse animation
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          pulse: node.pulse + 0.05
        }))
      );

      // Draw connections
      nodes.forEach(node => {
        node.connections.forEach(connectionId => {
          const targetNode = nodes.find(n => n.id === connectionId);
          if (targetNode) {
            const gradient = ctx.createLinearGradient(node.x, node.y, targetNode.x, targetNode.y);
            gradient.addColorStop(0, node.color + '40');
            gradient.addColorStop(0.5, '#ffffff20');
            gradient.addColorStop(1, targetNode.color + '40');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = Date.now() * 0.01;
            
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
            
            // Data flow particles
            const progress = (Date.now() * 0.002) % 1;
            const particleX = node.x + (targetNode.x - node.x) * progress;
            const particleY = node.y + (targetNode.y - node.y) * progress;
            
            ctx.fillStyle = '#00ffff80';
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const pulseSize = Math.sin(node.pulse) * 5 + 15;
        const normalizedValue = Math.max(0.3, node.value / 100);
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseSize + 10
        );
        glowGradient.addColorStop(0, node.color + '60');
        glowGradient.addColorStop(1, node.color + '00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Main node
        const nodeGradient = ctx.createRadialGradient(
          node.x - 5, node.y - 5, 0,
          node.x, node.y, pulseSize
        );
        nodeGradient.addColorStop(0, '#ffffff');
        nodeGradient.addColorStop(0.3, node.color);
        nodeGradient.addColorStop(1, node.color + '80');
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * normalizedValue, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      if (animated) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, width, height, animated]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
        style={{ background: 'radial-gradient(circle at center, #1f2937 0%, #111827 100%)' }}
      />
      
      {/* Node labels */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map(node => (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white bg-gray-900/80 px-2 py-1 rounded-full backdrop-blur-sm border border-gray-700/50"
            style={{
              left: node.x,
              top: node.y + 25,
            }}
          >
            {node.label}
            <div className="text-center text-xs text-gray-400 mt-1">
              {node.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeuronNetwork;