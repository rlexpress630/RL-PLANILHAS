
import React, { useCallback, useState, useEffect } from 'react';
import { UploadIcon, SparklesIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
  onProcessImages: (files: File[]) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onProcessImages, 
  isLoading, 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Detectando dados...');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const loadingMessages = [
    'Detectando dados...',
    'Extraindo informações...',
    'Formatando planilha...',
    'Quase pronto...',
  ];

  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);
      intervalId = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 2500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      return;
    }

    const objectUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFilesSelected = (files: FileList | null) => {
    if (files) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      setSelectedFiles(prevFiles => [...prevFiles, ...imageFiles]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(event.target.files);
    event.target.value = '';
  };

  const handleProcessClick = () => {
    if (selectedFiles.length > 0) {
      onProcessImages(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };
  
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFilesSelected(event.dataTransfer.files);
  }, []);

  const buttonText = isLoading 
    ? 'Processando...' 
    : `Processar ${selectedFiles.length} ${selectedFiles.length > 1 ? 'Imagens' : 'Imagem'} com IA`;


  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-black mb-4 text-blue-600 flex items-center gap-2 tracking-tighter">
        <SparklesIcon className="w-6 h-6" />
        <span>ADICIONAR COM IA</span>
      </h2>
      <div className="space-y-4">
        <div className="relative">
          <label 
            htmlFor="dropzone-file"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`cursor-pointer flex flex-col items-center justify-center w-full min-h-[12rem] border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 bg-slate-50 hover:bg-gray-100'}`}
          >
            {previewUrls.length > 0 ? (
              <div className="p-4 w-full">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                  {previewUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square group overflow-hidden rounded-xl border border-gray-200"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setZoomedImageUrl(url);
                      }}
                    >
                        <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                    </div>
                  ))}
                </div>
                 <p className="text-xs text-gray-400 font-bold text-center mt-3 uppercase tracking-widest">Clique para ampliar ou adicione mais</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500 text-center">
                <UploadIcon className="w-10 h-10 mb-3 text-blue-400" />
                <p className="mb-2 text-sm font-bold text-gray-700 uppercase tracking-tight">Escolha uma ou mais imagens</p>
                <p className="text-xs text-gray-400">Arraste os arquivos ou use a câmera</p>
              </div>
            )}
            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
          </label>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10 text-center p-4">
              <LoadingSpinner />
              <p className="mt-4 text-lg font-black text-blue-600 tracking-tighter uppercase">{loadingMessage}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aguarde alguns segundos...</p>
            </div>
          )}
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between gap-2">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedFiles.length} {selectedFiles.length > 1 ? 'selecionadas' : 'selecionada'}</p>
             <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 font-black uppercase tracking-widest transition-colors">
                Remover Tudo
            </button>
          </div>
        )}
        
        <button
          onClick={handleProcessClick}
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black py-4 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-100 active:scale-[0.98] uppercase tracking-tighter"
        >
          {buttonText}
          <SparklesIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImageUrl(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
            >
              <img 
                src={zoomedImageUrl} 
                alt="Zoomed" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <button 
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                onClick={() => setZoomedImageUrl(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};