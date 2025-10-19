import React, { useState } from 'react';
import { User, Plus, Edit, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Coach } from '../types';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CoachDetailModal from './coaches/CoachDetailModal';

const CoachModal: React.FC<{ isOpen: boolean; onClose: () => void; coach?: Coach | null }> = ({ isOpen, onClose, coach }) => {
    const { addCoach, updateCoach, showToast } = useAppContext();
    const [name, setName] = useState('');

    React.useEffect(() => {
        setName(coach ? coach.name : '');
    }, [coach, isOpen]);

    const handleSubmit = () => {
        if (!name.trim()) {
            showToast('Il nome è obbligatorio.', 'error');
            return;
        }
        if (coach) {
            updateCoach({ ...coach, name: name.trim() });
            showToast('Mister aggiornato!', 'success');
        } else {
            addCoach({ name: name.trim() });
            showToast('Mister aggiunto!', 'success');
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={coach ? 'Modifica Mister' : 'Aggiungi Mister'}>
            <div className="space-y-4">
                <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500">Annulla</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-md bg-aglianese-green hover:bg-green-700 text-white font-bold">{coach ? 'Salva' : 'Aggiungi'}</button>
                </div>
            </div>
        </Modal>
    );
};

const CoachCard: React.FC<{ coach: Coach; onClick: () => void; }> = ({ coach, onClick }) => {
    return (
        <div onClick={onClick} className="bg-aglianese-gray-800 p-4 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-aglianese-gray-700 transition-colors">
            <div className="w-12 h-12 bg-aglianese-gray-700 rounded-full flex items-center justify-center">
                <User size={24} />
            </div>
            <div>
                <p className="font-bold text-lg">{coach.name}</p>
            </div>
        </div>
    );
};


const CoachesScreen: React.FC = () => {
    const { coaches, deleteCoach } = useAppContext();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
    const [deletingCoach, setDeletingCoach] = useState<Coach | null>(null);
    const [detailCoach, setDetailCoach] = useState<Coach | null>(null);

    const handleOpenAddEditModal = (coach: Coach | null = null) => {
        setDetailCoach(null);
        setEditingCoach(coach);
        setModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if(deletingCoach) {
            deleteCoach(deletingCoach.id);
            setDeletingCoach(null);
        }
    };
    
    const handleDeleteCoach = (coach: Coach) => {
        setDetailCoach(null);
        setDeletingCoach(coach);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Mister</h1>
            <div className="space-y-4">
                {coaches.map(coach => (
                    <CoachCard 
                        key={coach.id} 
                        coach={coach} 
                        onClick={() => setDetailCoach(coach)}
                    />
                ))}
            </div>

            <button
                onClick={() => handleOpenAddEditModal()}
                className="fixed bottom-24 right-4 bg-aglianese-green text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Aggiungi Mister"
            >
                <Plus size={28} />
            </button>
            
            {detailCoach && (
                <CoachDetailModal 
                    coach={detailCoach}
                    onClose={() => setDetailCoach(null)}
                    onEdit={handleOpenAddEditModal}
                    onDelete={handleDeleteCoach}
                />
            )}

            {isModalOpen && <CoachModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} coach={editingCoach} />}
            <ConfirmationModal
                isOpen={!!deletingCoach}
                onClose={() => setDeletingCoach(null)}
                onConfirm={handleConfirmDelete}
                title="Conferma Eliminazione"
                message={`Sei sicuro di voler eliminare ${deletingCoach?.name}? Verrà rimosso da tutte le partite associate.`}
            />
        </div>
    );
};

export default CoachesScreen;