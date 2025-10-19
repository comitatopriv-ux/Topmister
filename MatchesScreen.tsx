import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Match } from '../../types';
import MatchModal from './matches/MatchModal';
import OpponentsList from './matches/OpponentsList';
import OpponentDetailModal from './matches/OpponentDetailModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import MatchEditModal from './matches/MatchEditModal';

const MatchCard: React.FC<{ match: Match; onEdit: () => void; onDelete: () => void; onShowReport: () => void; }> = ({ match, onEdit, onDelete, onShowReport }) => {
    const { tournaments } = useAppContext();
    const tournament = tournaments.find(t => t.id === match.tournamentId);
    const date = new Date(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    const outcomeColor = match.result.home > match.result.away ? 'border-green-500' : match.result.home < match.result.away ? 'border-red-500' : 'border-yellow-500';

    return (
        <div className={`bg-aglianese-gray-800 p-4 rounded-lg border-l-4 ${outcomeColor} flex items-center justify-between`}>
            <div className="flex-grow cursor-pointer" onClick={onShowReport}>
                <p className="font-bold text-lg">vs {match.opponent}</p>
                <p className="text-sm text-aglianese-gray-300">{tournament?.name || 'N/D'} - {date}</p>
                 <p className="text-2xl font-bold mt-1">{match.result.home} - {match.result.away}</p>
            </div>
            <div className="flex flex-col gap-2">
                 <button onClick={onEdit} className="p-2 text-blue-400 hover:bg-aglianese-gray-700 rounded-full"><Edit size={18} /></button>
                 <button onClick={onDelete} className="p-2 text-red-400 hover:bg-aglianese-gray-700 rounded-full"><Trash2 size={18} /></button>
            </div>
        </div>
    );
};

const MatchesScreen: React.FC = () => {
    const { matches, deleteMatch, showMatchReport } = useAppContext();
    const [view, setView] = useState<'all' | 'opponents'>('all');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
    const [opponentDetailName, setOpponentDetailName] = useState<string | null>(null);

    const handleConfirmDelete = () => {
        if (deletingMatch) {
            deleteMatch(deletingMatch.id);
            setDeletingMatch(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Partite</h1>

            <div className="flex bg-aglianese-gray-800 p-1 rounded-lg">
                <button
                    onClick={() => setView('all')}
                    className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${view === 'all' ? 'bg-aglianese-green text-white' : 'text-aglianese-gray-200'}`}
                >
                    Tutte le Partite
                </button>
                <button
                    onClick={() => setView('opponents')}
                    className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${view === 'opponents' ? 'bg-aglianese-green text-white' : 'text-aglianese-gray-200'}`}
                >
                    Avversari
                </button>
            </div>

            {view === 'all' ? (
                <div className="space-y-4">
                    {matches.length > 0 ? (
                        matches.map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onEdit={() => setEditingMatch(match)}
                                onDelete={() => setDeletingMatch(match)}
                                onShowReport={() => showMatchReport(match.id)}
                            />
                        ))
                    ) : (
                        <p className="text-center text-aglianese-gray-200 p-6 bg-aglianese-gray-800 rounded-lg">
                            Nessuna partita registrata.
                        </p>
                    )}
                </div>
            ) : (
                <OpponentsList onOpponentClick={setOpponentDetailName} />
            )}

            <button
                onClick={() => setAddModalOpen(true)}
                className="fixed bottom-24 right-4 bg-aglianese-green text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Aggiungi Partita"
            >
                <Plus size={28} />
            </button>
            
            {isAddModalOpen && <MatchModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />}
            {editingMatch && <MatchEditModal isOpen={!!editingMatch} onClose={() => setEditingMatch(null)} match={editingMatch} />}
            
            <ConfirmationModal
                isOpen={!!deletingMatch}
                onClose={() => setDeletingMatch(null)}
                onConfirm={handleConfirmDelete}
                title="Conferma Eliminazione Partita"
                message={`Sei sicuro di voler eliminare la partita contro ${deletingMatch?.opponent}?`}
            />

            <OpponentDetailModal 
                isOpen={!!opponentDetailName}
                onClose={() => setOpponentDetailName(null)}
                opponentName={opponentDetailName}
            />
        </div>
    );
};

export default MatchesScreen;
