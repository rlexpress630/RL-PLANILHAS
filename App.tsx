
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { DeliveryData, CostData } from './types';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { processImageForSpreadsheet } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { formatDate } from './utils/formatUtils';

// Lazy loading components for performance
const ImageUploader = lazy(() => import('./components/ImageUploader').then(m => ({ default: m.ImageUploader })));
const ManualInputBar = lazy(() => import('./components/ManualInputBar').then(m => ({ default: m.ManualInputBar })));
const Spreadsheet = lazy(() => import('./components/Spreadsheet').then(m => ({ default: m.Spreadsheet })));
const CostsInputBar = lazy(() => import('./components/CostsInputBar').then(m => ({ default: m.CostsInputBar })));
const CostsSpreadsheet = lazy(() => import('./components/CostsSpreadsheet').then(m => ({ default: m.CostsSpreadsheet })));
const SummaryView = lazy(() => import('./components/SummaryView').then(m => ({ default: m.SummaryView })));

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
          <motion.div 
            key="deliveries"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
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
          </motion.div>
        );
      case 'costs':
        return (
          <motion.div 
            key="costs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
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
          </motion.div>
        );
      case 'summary':
        return (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <SummaryView 
              deliveriesTotal={deliveriesTotal} 
              costsTotal={costsTotal}
              deliveriesData={spreadsheetData}
              costsData={costsData} 
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ view: View; label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-6 py-3 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 ${
        activeView === view
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap justify-center sm:justify-start gap-2">
            <TabButton view="deliveries" label="Entregas" />
            <TabButton view="costs" label="Custos" />
            <TabButton view="summary" label="Resumo" />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex justify-between items-center" 
              role="alert"
            >
              <div>
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}

          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <AnimatePresence mode="wait">
              {renderView()}
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;