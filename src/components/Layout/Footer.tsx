import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="h-12 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800/50 flex items-center justify-center">
      <div className="flex items-center space-x-2 text-gray-400 text-sm">
        <span>Made with</span>
        <Heart className="h-4 w-4 text-red-400 animate-pulse" />
        <span className="gradient-text bg-gradient-to-r from-blue-400 to-purple-600 font-medium">
          Vertical Systems
        </span>
      </div>
    </footer>
  );
};

export default Footer;