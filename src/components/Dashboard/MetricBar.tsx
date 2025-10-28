import React from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, maxValue, color }) => {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`
          }}
        />
      </div>
    </div>
  );
};

export default MetricBar;