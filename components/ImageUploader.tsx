
import React, { useCallback, useState, useEffect } from 'react';
import { UploadIcon, SparklesIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
        <SparklesIcon className="w-6 h-6" />
        <span>Adicionar com IA</span>
      </h2>
      <div className="space-y-4">
        <div className="relative">
          <label 
            htmlFor="dropzone-file"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`cursor-pointer flex flex-col items-center justify-center w-full min-h-[12rem] border-2 border-dashed rounded-lg transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-slate-50 hover:bg-gray-100'}`}
          >
            {previewUrls.length > 0 ? (
              <div className="p-4 w-full">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                        <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover rounded-md" />
                    </div>
                  ))}
                </div>
                 <p className="text-xs text-gray-500 text-center mt-3">Adicione mais imagens ou processe as atuais.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500 text-center">
                <UploadIcon className="w-10 h-10 mb-3" />
                <p className="mb-2 text-sm"><span className="font-semibold">Escolha uma ou mais imagens</span></p>
                <p className="text-xs">Arraste os arquivos ou use a câmera</p>
              </div>
            )}
            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
          </label>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-lg z-10 text-center p-4">
              <LoadingSpinner />
              <p className="mt-4 text-lg font-semibold text-blue-600">{loadingMessage}</p>
              <p className="text-sm text-gray-500">Isso pode levar alguns segundos...</p>
            </div>
          )}
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between gap-2">
             <p className="text-sm text-gray-600">{selectedFiles.length} {selectedFiles.length > 1 ? 'imagens selecionadas' : 'imagem selecionada'}.</p>
             <button onClick={handleClearAll} className="text-sm text-red-500 hover:text-red-700 font-semibold">
                Remover
            </button>
          </div>
        )}
        
        <button
          onClick={handleProcessClick}
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          {buttonText}
          <SparklesIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};