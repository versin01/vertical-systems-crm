import React from 'react';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  gradientClass: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle, gradientClass }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold gradient-text ${gradientClass}`}>
          {title}
        </h1>
        <p className="text-gray-400 mt-2">
          {subtitle}
        </p>
      </div>
      
      <div className="glass-card p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">
          {title} Coming Soon
        </h2>
        <p className="text-gray-400">
          This feature is currently under development.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;