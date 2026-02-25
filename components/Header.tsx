
import React from 'react';
import { RLIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <RLIcon className="w-12 h-12 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">
              RL PLANILHA
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Logística Inteligente
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};