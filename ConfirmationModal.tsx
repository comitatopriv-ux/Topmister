
import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <p className="text-aglianese-gray-200 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-aglianese-green"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Conferma
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
