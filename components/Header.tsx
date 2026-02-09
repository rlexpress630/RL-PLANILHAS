
import React from 'react';
import { RLIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
        <RLIcon className="w-12 h-12 text-blue-600" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            RL PLANILHAS
          </h1>
          <p className="text-gray-500 mt-1">
            Sua planilha de entregas, agora inteligente.
          </p>
        </div>
      </div>
    </header>
  );
};