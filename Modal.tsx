
import React from 'react';
import { X } from 'lucide-react';
import { LeaderboardPlayer } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-aglianese-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-aglianese-gray-700 sticky top-0 bg-aglianese-gray-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-aglianese-green rounded-full p-1"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; players: LeaderboardPlayer[]; unit: string }> = ({ isOpen, onClose, title, players, unit }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-aglianese-gray-700 p-3 rounded-md">
                    <div className="flex items-center gap-3">
                        <span className="font-bold w-6 text-center">{index + 1}.</span>
                        <span>{player.firstName} {player.lastName}</span>
                    </div>
                    <span className="font-bold text-aglianese-green">{player.score} {unit}</span>
                </div>
            ))}
        </div>
    </Modal>
);


export default Modal;