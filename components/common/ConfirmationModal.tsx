
import React from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  isConfirming?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isConfirming = false,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center p-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-5">
          <i className="bi bi-exclamation-triangle-fill text-3xl text-red-600"></i>
        </div>
        <p className="text-gray-700 text-base mb-6 px-4">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            type="button"
            className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-estacio-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isConfirming ? <Spinner /> : confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
