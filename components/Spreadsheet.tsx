import React, { useState, useEffect } from 'react';
import { DeliveryData } from '../types';
import { downloadCSV, downloadPDF, downloadXLSX } from '../utils/fileUtils';
import { formatCurrency } from '../utils/formatUtils';
import { ConfirmationModal } from './ConfirmationModal';
import { DownloadIcon, TrashIcon, TableIcon, ChevronDownIcon, CheckIcon, XIcon, PencilIcon, FilePdfIcon, FileExcelIcon, WhatsappIcon, EmailIcon } from './icons';

type EditableField = keyof Omit<DeliveryData, 'id' | 'date'>;
type EditRowState = Omit<DeliveryData, 'id' | 'date'>;

interface SpreadsheetProps {
  title: string;
  data: DeliveryData[];
  onDeleteRow: (id: number) => void;
  onUpdateRow: (id: number, updatedData: Partial<Omit<DeliveryData, 'id'>>) => void;
  onTitleUpdate: (newTitle: string) => void;
  onClearAll: () => void;
  showSaveConfirmation: boolean;
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({ title, data, onDeleteRow, onUpdateRow, onTitleUpdate, onClearAll, showSaveConfirmation }) => {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isClearConfirmVisible, setIsClearConfirmVisible] = useState(false);
  
  // State for mobile-friendly editing
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<EditRowState>({ collection: '', destination: '', total: '', observation: '' });


  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const totalValue = data.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);

  const handleDownloadCSV = () => {
    downloadCSV(data, title);
  };

  const handleDownloadPDF = () => {
    downloadPDF(data, title);
  };

  const handleDownloadXLSX = () => {
    downloadXLSX(data, title);
  };

  const handleShareWhatsApp = () => {
    let summary = `📋 *Resumo da Planilha: ${title}*\n\n`;
    summary += `Total de Entregas: *${data.length}*\n`;
    summary += `Valor Total: *${formatCurrency(totalValue)}*\n`;

    const top5Rows = data.slice(0, 5);
    if (top5Rows.length > 0) {
      summary += `\n*Prévia das Entregas:*\n`;
      top5Rows.forEach(row => {
        summary += `- *Destino:* ${row.destination}, *Total:* ${formatCurrency(row.total)}\n`;
      });
    }

    const encodedText = encodeURIComponent(summary);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = `Resumo da Planilha: ${title}`;
    let body = `Olá,\n\n`;
    body += `Segue o resumo da planilha "${title}":\n\n`;
    body += `Total de Entregas: ${data.length}\n`;
    body += `Valor Total: ${formatCurrency(totalValue)}\n\n`;
    
    const top5Rows = data.slice(0, 5);
    if (top5Rows.length > 0) {
      body += `Prévia das primeiras 5 entregas:\n\n`;
      top5Rows.forEach(row => {
        body += `Data: ${row.date}\n`;
        body += `Destino: ${row.destination}\n`;
        body += `Total: ${formatCurrency(row.total)}\n`;
        body += `-----------------\n`;
      });
    }

    body += `\nPara a planilha completa, você pode exportar os arquivos (CSV, PDF, Excel) diretamente do aplicativo.\n\n`;
    body += `Atenciosamente.`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    const mailtoLink = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    window.open(mailtoLink, '_blank');
  };

  const handleClearAllClick = () => {
    setIsClearConfirmVisible(true);
  };

  const handleConfirmClearAll = () => {
    onClearAll();
  };

  const handleToggleExpand = (id: number) => {
    if (editingRowId === id) return; // Don't collapse card while editing
    setExpandedRowId(prevId => (prevId === id ? null : id));
  };

  const handleStartEdit = (row: DeliveryData, field: EditableField) => {
    setEditingCell({ rowId: row.id, field });
    setEditValue(String(row[field]));
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleConfirmEdit = () => {
    if (!editingCell) return;
    onUpdateRow(editingCell.rowId, { [editingCell.field]: editValue });
    handleCancelEdit();
  };
  
  // Handlers for mobile edit mode
  const handleStartMobileEdit = (row: DeliveryData) => {
    setEditingRowId(row.id);
    setEditRowData({
      collection: row.collection,
      destination: row.destination,
      total: row.total,
      observation: row.observation,
    });
    if (expandedRowId !== row.id) {
      setExpandedRowId(row.id);
    }
  };

  const handleCancelMobileEdit = () => {
    setEditingRowId(null);
  };

  const handleSaveMobileEdit = () => {
    if (editingRowId) {
      onUpdateRow(editingRowId, editRowData);
    }
    setEditingRowId(null);
  };

  const handleEditRowDataChange = (field: keyof EditRowState, value: string) => {
    setEditRowData(prev => ({ ...prev, [field]: value }));
  };


  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      onTitleUpdate(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };

  const renderEditableCell = (row: DeliveryData, field: EditableField, displayFormatter?: (value: any) => string) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
    const displayValue = displayFormatter ? displayFormatter(row[field]) : row[field];

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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-2 sm:px-0 gap-4">
        <div className="flex items-center gap-2 group">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-semibold bg-gray-100 text-blue-600 p-1 rounded-md outline-none"
              autoFocus
            />
          ) : (
            <h2 onDoubleClick={() => setIsEditingTitle(true)} className="text-xl font-semibold text-blue-700 cursor-pointer">
              {title}
            </h2>
          )}
          {!isEditingTitle && (
            <button onClick={() => setIsEditingTitle(true)} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
           <div className={`transition-opacity duration-300 ease-in-out ${showSaveConfirmation ? 'opacity-100' : 'opacity-0'}`}>
            <CheckIcon className="w-5 h-5 text-green-500" />
          </div>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <FilePdfIcon className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleDownloadXLSX}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <FileExcelIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <WhatsappIcon className="w-4 h-4" />
               <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <EmailIcon className="w-4 h-4" />
               <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={handleClearAllClick}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 sm:py-2 sm:px-3 rounded-lg transition-all duration-300 text-sm"
            >
              <TrashIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar Tudo</span>
            </button>
          </div>
        )}
      </div>
      <div>
        {data.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="space-y-3">
                {data.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const isEditingThisRow = editingRowId === row.id;
                  
                  const mobileInputFieldClasses = "w-full bg-slate-100 text-gray-800 p-2 rounded-md border border-blue-500 outline-none transition-all";

                  return (
                    <div key={row.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2 space-y-2">
                          <div className="flex justify-between items-baseline gap-2">
                            {isEditingThisRow ? (
                              <input value={editRowData.destination} onChange={e => handleEditRowDataChange('destination', e.target.value)} className={`${mobileInputFieldClasses} font-bold text-md`} />
                            ) : (
                              <div className="font-bold text-gray-800 text-md break-words">{row.destination}</div>
                            )}
                            {isEditingThisRow ? (
                              <input type="number" value={editRowData.total} onChange={e => handleEditRowDataChange('total', e.target.value)} className={`${mobileInputFieldClasses} font-bold text-lg text-blue-600 max-w-[100px] text-right`} />
                            ) : (
                              <div className="font-bold text-lg text-blue-600 flex-shrink-0">{formatCurrency(row.total)}</div>
                            )}
                          </div>
                          <div className="flex justify-between items-baseline mt-1">
                            {isEditingThisRow ? (
                                <input value={editRowData.collection} onChange={e => handleEditRowDataChange('collection', e.target.value)} className={`${mobileInputFieldClasses} text-xs`} />
                            ) : (
                              <div className="text-xs text-gray-500">Coleta: {row.collection}</div>
                            )}
                            <p className="text-sm text-gray-500 flex-shrink-0 ml-2">{row.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center pl-2 self-center cursor-pointer" onClick={() => handleToggleExpand(row.id)}>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Observação</h4>
                            {isEditingThisRow ? (
                              <textarea value={editRowData.observation} onChange={e => handleEditRowDataChange('observation', e.target.value)} className={`${mobileInputFieldClasses} text-sm`} rows={2}></textarea>
                            ) : (
                              <div className="text-sm text-gray-600 whitespace-normal break-words">{row.observation}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                            {isEditingThisRow ? (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleSaveMobileEdit(); }} className="p-1" aria-label="Salvar alterações">
                                  <CheckIcon className="w-6 h-6 text-green-500 hover:text-green-700" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleCancelMobileEdit(); }} className="p-1" aria-label="Cancelar edição">
                                  <XIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleStartMobileEdit(row); }} className="p-1" aria-label={`Editar item ${row.id}`}>
                                  <PencilIcon className="w-5 h-5 text-blue-500 hover:text-blue-700" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteRow(row.id); }} className="p-1" aria-label={`Excluir item ${row.id}`}>
                                  <TrashIcon className="w-5 h-5 text-red-500 hover:text-red-700" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-800">Total Geral:</span>
                    <span className="font-bold text-xl text-blue-600">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coleta</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
                    <th scope="col" className="relative px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.date}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{renderEditableCell(row, 'collection')}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{renderEditableCell(row, 'destination')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{renderEditableCell(row, 'total', formatCurrency)}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{renderEditableCell(row, 'observation')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button 
                          onClick={() => onDeleteRow(row.id)} 
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          aria-label={`Excluir item ${row.id}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-600 uppercase tracking-wider">Total Geral</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-blue-700 font-bold">
                      {formatCurrency(totalValue)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-16 px-6 bg-slate-50 rounded-lg">
            <TableIcon className="mx-auto h-12 w-12 text-gray-400"/>
            <h3 className="mt-2 text-lg font-medium text-gray-700">Nenhum dado na planilha</h3>
            <p className="mt-1 text-sm text-gray-500">Adicione uma nova linha manualmente ou use a IA para extrair de uma imagem.</p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isClearConfirmVisible}
        onClose={() => setIsClearConfirmVisible(false)}
        onConfirm={handleConfirmClearAll}
        title="Confirmar Limpeza Total"
        message="Você tem certeza de que deseja apagar todos os dados da planilha? Esta ação não pode ser desfeita."
        confirmButtonText="Sim, Limpar Tudo"
      />
    </div>
  );
};