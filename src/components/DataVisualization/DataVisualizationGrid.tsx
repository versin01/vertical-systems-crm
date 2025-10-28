import React from 'react';
import NeuronNetwork from './NeuronNetwork';
import SpiderWebChart from './SpiderWebChart';
import FunnelFlow from './FunnelFlow';

interface VisualizationData {
  neuronData: {
    nodes: {
      id: string;
      value: number;
      label: string;
      color: string;
      connections: string[];
    }[];
  };
  spiderData: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
  }[];
  funnelData: {
    id: string;
    label: string;
    value: number;
    color: string;
  }[];
}

interface DataVisualizationGridProps {
  data: VisualizationData;
  className?: string;
}

const DataVisualizationGrid: React.FC<DataVisualizationGridProps> = ({ 
  data, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 ${className}`}>
      {/* Neuron Network - Lead Connections */}
      <div className="glass-card p-6 hover:bg-gray-800/40 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gradient-text section-gradient-finances">
            Financial Flow Network
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live Data</span>
          </div>
        </div>
        <div className="flex justify-center">
          <NeuronNetwork 
            data={data.neuronData}
            width={350}
            height={250}
            animated={true}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Neural network visualization of financial interdependencies and value flow
        </p>
      </div>

      {/* Spider Web - Performance Metrics */}
      <div className="glass-card p-6 hover:bg-gray-800/40 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gradient-text section-gradient-leads">
            Performance Radar
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Multi-Metric</span>
          </div>
        </div>
        <div className="flex justify-center">
          <SpiderWebChart 
            data={data.spiderData}
            width={300}
            height={250}
            levels={5}
            animated={true}
            showGrid={true}
            showLabels={true}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Multi-dimensional performance analysis across key metrics
        </p>
      </div>

      {/* Funnel Flow - Conversion Pipeline */}
      <div className="glass-card p-6 hover:bg-gray-800/40 transition-all duration-300 group lg:col-span-2 xl:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gradient-text section-gradient-leads">
            Conversion Flow
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Real-time</span>
          </div>
        </div>
        <div className="flex justify-center">
          <FunnelFlow 
            stages={data.funnelData}
            width={350}
            height={280}
            animated={true}
            showPercentages={true}
          />
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Dynamic funnel visualization with conversion flow analysis
        </p>
      </div>
    </div>
  );
};

export default DataVisualizationGrid;