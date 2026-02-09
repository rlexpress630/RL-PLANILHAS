
import React, { useState } from 'react';
import type { DeliveryData } from '../types';
import { PlusIcon } from './icons';
import { isValidDateString } from '../utils/formatUtils';

interface ManualInputBarProps {
  onAddRow: (newRow: Omit<DeliveryData, 'id'>) => void;
}

export const ManualInputBar: React.FC<ManualInputBarProps> = ({ onAddRow }) => {
  const [date, setDate] = useState('');
  const [collection, setCollection] = useState('');
  const [destination, setDestination] = useState('');
  const [total, setTotal] = useState('');
  const [observation, setObservation] = useState('');
  const [errors, setErrors] = useState({ date: '' });

  const validate = () => {
    const newErrors = { date: '' };
    let isValid = true;

    if (!date || !isValidDateString(date)) {
      newErrors.date = 'Data inválida. Use o formato DD/MM/AAAA.';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && collection && destination) {
      onAddRow({ 
        date: date, 
        collection,
        destination,
        total: total || '0',
        observation: observation || 'N/A', 
      });
      // Reset fields
      setDate('');
      setCollection('');
      setDestination('');
      setTotal('');
      setObservation('');
      setErrors({ date: '' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Adicionar Manualmente</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Data (DD/MM/AAAA)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full bg-slate-50 text-gray-800 p-3 rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
            onFocus={(e) => e.target.type = 'date'}
            onBlur={(e) => e.target.type = 'text'}
            aria-invalid={!!errors.date}
            aria-describedby="date-error"
          />
          {errors.date && <p id="date-error" className="text-red-600 text-xs mt-1 px-1">{errors.date}</p>}
        </div>
        <input
          type="text"
          placeholder="Endereço de Coleta"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="w-full bg-slate-50 text-gray-800 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          required
        />
        <input
          type="text"
          placeholder="Endereço de Destino"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full bg-slate-50 text-gray-800 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          required
        />
        <input
          type="number"
          placeholder="Total (R$)"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="w-full bg-slate-50 text-gray-800 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          step="0.01"
        />
        <input
          type="text"
          placeholder="Observação (opcional)"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          className="w-full bg-slate-50 text-gray-800 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 mt-2"
        >
          <PlusIcon className="w-5 h-5" />
          Adicionar à Planilha
        </button>
      </form>
    </div>
  );
};