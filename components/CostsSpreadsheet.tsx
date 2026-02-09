
import React, { useState } from 'react';
import { CostData } from '../types';
import { formatCurrency } from '../utils/formatUtils';
import { ConfirmationModal } from './ConfirmationModal';
import { TrashIcon, TableIcon, CheckIcon, XIcon, PencilIcon } from './icons';

interface CostsSpreadsheetProps {
  data: CostData[];
  onDeleteCost: (id: number) => void;
  onUpdateCost: (id: number, updatedData: Partial<Omit<CostData, 'id'>>) => void;
  onClearAll: () => void;
}

type EditableField = keyof Omit<CostData, 'id'>;

export const CostsSpreadsheet: React.FC<CostsSpreadsheetProps> = ({ data, onDeleteCost, onUpdateCost, onClearAll }) => {
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);

  const totalValue = data.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);

  const handleStartEdit = (row: CostData, field: EditableField) => {
    setEditingCell({ rowId: row.id, field });
    setEditValue(String(row[field]));
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleConfirmEdit = () => {
    if (!editingCell) return;
    onUpdateCost(editingCell.rowId, { [editingCell.field]: editValue });
    handleCancelEdit();
  };

  const handleClearAllClick = () => {
    setIsClearConfirmVisible(true);
  };

  const renderEditableCell = (row: CostData, field: EditableField, displayFormatter?: (value: any) => string) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
    const displayValue = displayFormatter ? displayFormatter(row[field]) : (row[field] || '');

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type={field === 'total' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-100 text-gray-900 p-1 rounded-md border border-blue-500 w-full"
            autoFocus
            onBlur={handleConfirmEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
        </div>
      );
    }
    return (
      <div onDoubleClick={() => handleStartEdit(row, field)} className="cursor-pointer min-h-[24px] p-1 -m-1 rounded hover:bg-gray-100 transition-colors">
        {displayValue}
      </div>
    );
  };

  return (
    <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4 px-2 sm:px-0">
        <h2 className="text-xl font-semibold text-blue-700">Planilha de Custos</h2>
        {data.length > 0 && (
          <button
            onClick={handleClearAllClick}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar Custos</span>
          </button>
        )}
      </div>
      <div>
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="relative px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.date}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{renderEditableCell(row, 'description')}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{renderEditableCell(row, 'observation')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{renderEditableCell(row, 'total', formatCurrency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => onDeleteCost(row.id)} className="text-red-500 hover:text-red-700 transition-colors p-1" aria-label={`Excluir item ${row.id}`}>
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-600 uppercase tracking-wider">Total de Custos</td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-red-700 font-bold">{formatCurrency(totalValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-slate-50 rounded-lg">
            <TableIcon className="mx-auto h-12 w-12 text-gray-400"/>
            <h3 className="mt-2 text-lg font-medium text-gray-700">Nenhum custo registrado</h3>
            <p className="mt-1 text-sm text-gray-500">Adicione um novo custo no formulário ao lado.</p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isClearConfirmVisible}
        onClose={() => setIsClearConfirmVisible(false)}
        onConfirm={onClearAll}
        title="Confirmar Limpeza de Custos"
        message="Você tem certeza de que deseja apagar todos os custos? Esta ação não pode ser desfeita."
        confirmButtonText="Sim, Limpar Tudo"
      />
    </div>
  );
};