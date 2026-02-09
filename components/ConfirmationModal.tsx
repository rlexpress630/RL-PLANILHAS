import React from 'react';
import { WarningIcon, XIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Fechar modal"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <WarningIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-0 text-left flex-1">
                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500">
                    {message}
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
