import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatUtils';
import { SparklesIcon, TableIcon } from './icons';
import { DeliveryData, CostData } from '../types';

interface SummaryViewProps {
  deliveriesTotal: number;
  costsTotal: number;
  deliveriesData: DeliveryData[];
  costsData: CostData[];
}

interface BreakdownItem {
  label: string;
  total: number;
}

const BreakdownList: React.FC<{ title: string; items: BreakdownItem[]; colorClass: string }> = ({ title, items, colorClass }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
    {items.length > 0 ? (
      <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between items-baseline pb-2 border-b border-gray-100 last:border-b-0">
            <span className="text-gray-600 text-sm break-all pr-4">{item.label}</span>
            <span className={`font-semibold text-md flex-shrink-0 ${colorClass}`}>{formatCurrency(item.total)}</span>
          </li>
        ))}
      </ul>
    ) : (
       <div className="text-center py-8">
        <TableIcon className="mx-auto h-8 w-8 text-gray-300"/>
        <p className="mt-2 text-sm text-gray-500">Nenhum dado para exibir.</p>
      </div>
    )}
  </div>
);


export const SummaryView: React.FC<SummaryViewProps> = ({ deliveriesTotal, costsTotal, deliveriesData, costsData }) => {
  const finalResult = deliveriesTotal - costsTotal;
  const isProfit = finalResult >= 0;

  const deliveriesByDestination = useMemo(() => {
    // FIX: Explicitly typing the accumulator `acc` as `Record<string, number>` ensures it's treated as a dictionary, resolving the arithmetic operation error.
    const grouped = deliveriesData.reduce((acc: Record<string, number>, delivery) => {
      const key = delivery.destination.trim() || 'Não especificado';
      const value = parseFloat(delivery.total.replace(',', '.')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  }, [deliveriesData]);

  const costsByCategory = useMemo(() => {
    // FIX: Explicitly typing the accumulator `acc` as `Record<string, number>` ensures it's treated as a dictionary, resolving the arithmetic operation error.
    const grouped = costsData.reduce((acc: Record<string, number>, cost) => {
      const key = cost.description.trim() || 'Não especificado';
      const value = parseFloat(cost.total.replace(',', '.')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {});
      
    return Object.entries(grouped)
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  }, [costsData]);

  const SummaryCard: React.FC<{ title: string; value: number; colorClass: string; isLarge?: boolean; description?: string; highlight?: boolean; }> = ({ title, value, colorClass, isLarge = false, description, highlight = false }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border text-center ${isLarge ? 'col-span-1 sm:col-span-2' : ''} ${highlight ? 'border-2 border-blue-500' : 'border-gray-200'}`}>
      <h3 className={`text-lg font-semibold ${isLarge ? 'text-gray-800' : 'text-gray-600'}`}>{title}</h3>
      <p className={`text-4xl font-bold mt-2 ${colorClass}`}>
        {formatCurrency(value)}
      </p>
      {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center gap-2">
          <SparklesIcon className="w-7 h-7" />
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SummaryCard 
            title="Faturamento Total (Entregas)" 
            value={deliveriesTotal} 
            colorClass="text-green-600"
          />
          <SummaryCard 
            title="Custos Totais" 
            value={costsTotal} 
            colorClass="text-red-600"
          />
          <SummaryCard 
            title={`Valor Total Final (${isProfit ? "Lucro" : "Prejuízo"})`}
            value={finalResult} 
            colorClass={isProfit ? "text-blue-600" : "text-red-700"}
            isLarge={true}
            highlight={true}
            description="O resultado final de todas as suas operações."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BreakdownList 
          title="Faturamento por Destino"
          items={deliveriesByDestination}
          colorClass="text-green-600"
        />
        <BreakdownList 
          title="Custos por Categoria"
          items={costsByCategory}
          colorClass="text-red-600"
        />
      </div>
    </div>
  );
};