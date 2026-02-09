
import React, { useState, useEffect, useRef } from 'react';
import { DeliveryData, CostData } from './types';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ManualInputBar } from './components/ManualInputBar';
import { Spreadsheet } from './components/Spreadsheet';
import { CostsInputBar } from './components/CostsInputBar';
import { CostsSpreadsheet } from './components/CostsSpreadsheet';
import { SummaryView } from './components/SummaryView';
import { processImageForSpreadsheet } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { formatDate } from './utils/formatUtils';

const SPREADSHEET_DATA_KEY = 'spreadsheetDeliveryData';
const SPREADSHEET_COSTS_KEY = 'spreadsheetCostsData';
const SPREADSHEET_TITLE_KEY = 'spreadsheetTitle';

type View = 'deliveries' | 'costs' | 'summary';

const App: React.FC = () => {
  const [spreadsheetData, setSpreadsheetData] = useState<DeliveryData[]>(() => {
    try {
      const savedData = localStorage.getItem(SPREADSHEET_DATA_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error("Erro ao carregar dados de entregas do localStorage:", error);
      return [];
    }
  });

  const [costsData, setCostsData] = useState<CostData[]>(() => {
    try {
      const savedData = localStorage.getItem(SPREADSHEET_COSTS_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error("Erro ao carregar dados de custos do localStorage:", error);
      return [];
    }
  });

  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem(SPREADSHEET_TITLE_KEY) || 'Planilha de Entregas';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<View>('deliveries');
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      localStorage.setItem(SPREADSHEET_DATA_KEY, JSON.stringify(spreadsheetData));
      localStorage.setItem(SPREADSHEET_COSTS_KEY, JSON.stringify(costsData));
      localStorage.setItem(SPREADSHEET_TITLE_KEY, spreadsheetTitle);
      setShowSaveConfirmation(true);
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
    }
  }, [spreadsheetData, costsData, spreadsheetTitle]);

  useEffect(() => {
    if (showSaveConfirmation) {
      const timer = setTimeout(() => setShowSaveConfirmation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSaveConfirmation]);

  // Handlers for Deliveries
  const handleAddRow = (newRow: Omit<DeliveryData, 'id'>) => {
    const formattedRow = { ...newRow, date: formatDate(newRow.date), id: Date.now() };
    setSpreadsheetData(prevData => [...prevData, formattedRow]);
  };
  const handleDeleteRow = (id: number) => {
    setSpreadsheetData(prevData => prevData.filter(row => row.id !== id));
  };
  const handleUpdateRow = (id: number, updatedData: Partial<Omit<DeliveryData, 'id'>>) => {
    setSpreadsheetData(prevData => prevData.map(row => row.id === id ? { ...row, ...updatedData } : row));
  };
  const handleClearAllDeliveries = () => setSpreadsheetData([]);

  // Handlers for Costs
  const handleAddCost = (newCost: Omit<CostData, 'id'>) => {
    const formattedCost = { 
      ...newCost, 
      date: formatDate(newCost.date), 
      id: Date.now(),
      observation: newCost.observation || '' 
    };
    setCostsData(prevData => [...prevData, formattedCost]);
  };
  const handleDeleteCost = (id: number) => {
    setCostsData(prevData => prevData.filter(cost => cost.id !== id));
  };
  const handleUpdateCost = (id: number, updatedData: Partial<Omit<CostData, 'id'>>) => {
    setCostsData(prevData => prevData.map(cost => cost.id === id ? { ...cost, ...updatedData } : cost));
  };
  const handleClearAllCosts = () => setCostsData([]);

  const handleTitleUpdate = (newTitle: string) => setSpreadsheetTitle(newTitle);

  const handleProcessImages = async (imageFiles: File[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const newRows: DeliveryData[] = [];
      for (const imageFile of imageFiles) {
        const { base64, mimeType } = await fileToBase64(imageFile);
        const extractedDataArray = await processImageForSpreadsheet(base64, mimeType);
        
        if (extractedDataArray?.length) {
          const processedRows = extractedDataArray.map((item, index) => ({
            id: Date.now() + Math.random() + index,
            date: formatDate(item.date),
            collection: item.collection || 'N/A',
            destination: item.destination || 'N/A',
            total: item.total || '0',
            observation: item.observation || '',
          })).filter(Boolean) as DeliveryData[];
          newRows.push(...processedRows);
        }
      }
      if (newRows.length === 0) throw new Error('A IA não conseguiu extrair dados válidos de nenhuma imagem.');
      setSpreadsheetData(prevData => [...prevData, ...newRows]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deliveriesTotal = spreadsheetData.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);
  const costsTotal = costsData.reduce((sum, row) => sum + (parseFloat(row.total.replace(',', '.')) || 0), 0);

  const renderView = () => {
    switch (activeView) {
      case 'deliveries':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <ManualInputBar onAddRow={handleAddRow} />
              <ImageUploader onProcessImages={handleProcessImages} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-8 relative">
              <Spreadsheet 
                title={spreadsheetTitle}
                data={spreadsheetData} 
                onDeleteRow={handleDeleteRow}
                onUpdateRow={handleUpdateRow} 
                onTitleUpdate={handleTitleUpdate}
                onClearAll={handleClearAllDeliveries}
                showSaveConfirmation={showSaveConfirmation}
              />
            </div>
          </div>
        );
      case 'costs':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <CostsInputBar onAddCost={handleAddCost} />
            </div>
            <div className="lg:col-span-8 relative">
              <CostsSpreadsheet
                data={costsData}
                onDeleteCost={handleDeleteCost}
                onUpdateCost={handleUpdateCost}
                onClearAll={handleClearAllCosts}
              />
            </div>
          </div>
        );
      case 'summary':
        return <SummaryView 
                  deliveriesTotal={deliveriesTotal} 
                  costsTotal={costsTotal}
                  deliveriesData={spreadsheetData}
                  costsData={costsData} 
                />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ view: View; label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-md transition-colors duration-200 ${
        activeView === view
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-6 bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex justify-center sm:justify-start gap-2">
          <TabButton view="deliveries" label="Entregas" />
          <TabButton view="costs" label="Custos" />
          <TabButton view="summary" label="Resumo" />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 relative" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Fechar">
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        {renderView()}
      </main>
    </div>
  );
};

export default App;