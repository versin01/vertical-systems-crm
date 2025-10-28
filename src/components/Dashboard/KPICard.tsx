import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, trend }) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <div className="glass-card p-6 hover:bg-gray-800/50 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r from-red-400 to-rose-600 opacity-80 group-hover:opacity-100 transition-opacity`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className={`text-sm font-medium ${trendColors[trend]}`}>
          {change}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default KPICard;