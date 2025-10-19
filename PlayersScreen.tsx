import React, { useState, useMemo } from 'react';
import { User, Plus, Edit, Trash2, Shield, Target, Footprints } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Player, Match, Tournament } from '../types';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';

// PlayerModal Component
const PlayerModal: React.FC<{ isOpen: boolean; onClose: () => void; player?: Player | null }> = ({ isOpen, onClose, player }) => {
    const { addPlayer, updatePlayer, showToast } = useAppContext();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [jerseyNumber, setJerseyNumber] = useState('');

    React.useEffect(() => {
        if (player) {
            setFirstName(player.firstName);
            setLastName(player.lastName);
            setJerseyNumber(player.jerseyNumber?.toString() ?? '');
        } else {
            setFirstName('');
            setLastName('');
            setJerseyNumber('');
        }
    }, [player, isOpen]);

    const handleSubmit = () => {
        if (!firstName.trim()) {
            showToast('Il nome è obbligatorio.', 'error');
            return;
        }
        
        const num = parseInt(jerseyNumber, 10);
        const finalJerseyNumber = isNaN(num) ? undefined : num;

        const playerData = { firstName: firstName.trim(), lastName: lastName.trim(), jerseyNumber: finalJerseyNumber };

        if (player) {
            updatePlayer({ ...player, ...playerData });
            showToast('Giocatore aggiornato!', 'success');
        } else {
            addPlayer(playerData);
            showToast('Giocatore aggiunto!', 'success');
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={player ? 'Modifica Giocatore' : 'Aggiungi Giocatore'}>
            <div className="space-y-4">
                <input type="text" placeholder="Nome" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                <input type="text" placeholder="Cognome" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                <input type="number" placeholder="Numero Maglia" value={jerseyNumber} onChange={e => setJerseyNumber(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500">Annulla</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-md bg-aglianese-green hover:bg-green-700 text-white font-bold">{player ? 'Salva Modifiche' : 'Aggiungi'}</button>
                </div>
            </div>
        </Modal>
    );
};

// PlayerDetailModal Component
const PlayerDetailModal: React.FC<{ player: Player | null; onClose: () => void; onEdit: (p: Player) => void; onDelete: (p: Player) => void }> = ({ player, onClose, onEdit, onDelete }) => {
    const { matches, tournaments, showMatchReport } = useAppContext();
    
    const stats = useMemo(() => {
        if (!player) return null;

        const playedMatches = matches.filter(m => m.attendees.some(a => a.playerId === player.id));
        const totalGoals = matches.reduce((sum, m) => {
            const scorer = m.scorers.find(s => s.playerId === player.id);
            return sum + (scorer ? scorer.goals : 0);
        }, 0);

        const totalAppearances = playedMatches.length;
        const weightedAppearances = playedMatches.reduce((sum, m) => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            return sum + (tournament ? tournament.presenceWeight : 1);
        }, 0);

        return { playedMatches, totalGoals, totalAppearances, weightedAppearances: weightedAppearances.toFixed(2) };
    }, [player, matches, tournaments]);

    if (!player || !stats) return null;

    return (
        <Modal isOpen={!!player} onClose={onClose} title="Dettaglio Giocatore">
            <div className="space-y-6">
                <div className="bg-aglianese-gray-700 p-4 rounded-lg flex items-center justify-between">
                   <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-aglianese-gray-600 rounded-full flex items-center justify-center">
                            <User size={32} className="text-aglianese-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{player.firstName} {player.lastName}</h2>
                            {player.jerseyNumber && <p className="text-aglianese-green">Numero {player.jerseyNumber}</p>}
                        </div>
                   </div>
                    <div className="flex gap-2">
                        <button onClick={() => { onClose(); onEdit(player); }} className="p-3 rounded-full hover:bg-aglianese-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><Edit size={20} className="text-blue-400" /></button>
                        <button onClick={() => { onClose(); onDelete(player); }} className="p-3 rounded-full hover:bg-aglianese-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"><Trash2 size={20} className="text-red-400" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><Footprints className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.totalAppearances}</span><p className="text-sm">Presenze</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><Shield className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.weightedAppearances}</span><p className="text-sm">Presenze Pond.</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><Target className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.totalGoals}</span><p className="text-sm">Gol</p></div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Partite Giocate</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.playedMatches.length > 0 ? stats.playedMatches.map(m => (
                            <div 
                                key={m.id} 
                                onClick={() => { onClose(); showMatchReport(m.id); }}
                                className="bg-aglianese-gray-700 p-3 rounded-md flex justify-between items-center text-sm cursor-pointer hover:bg-aglianese-gray-600 transition-colors"
                            >
                                <div>
                                  <span className="font-semibold">vs {m.opponent}</span>
                                  <span className="text-xs text-aglianese-gray-400 block">{new Date(m.date).toLocaleDateString('it-IT')}</span>
                                </div>
                                <span className="font-bold text-lg">{m.result.home} - {m.result.away}</span>
                            </div>
                        )) : <p className="text-aglianese-gray-400 text-center py-4">Nessuna partita giocata.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};


// PlayersScreen Component (Main)
const PlayersScreen: React.FC = () => {
    const { players, deletePlayer } = useAppContext();
    const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
    const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);

    const handleOpenPlayerModal = (player: Player | null = null) => {
        setEditingPlayer(player);
        setPlayerModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingPlayer) {
            deletePlayer(deletingPlayer.id);
            setDeletingPlayer(null);
        }
    };
    
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Giocatori</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.sort((a,b) => a.firstName.localeCompare(b.firstName)).map(player => (
                    <div key={player.id} onClick={() => setDetailPlayer(player)} className="bg-aglianese-gray-800 p-4 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-aglianese-gray-700 transition-colors">
                        <div className="w-12 h-12 bg-aglianese-gray-700 rounded-full flex items-center justify-center">
                            <User size={24} className="text-aglianese-gray-400" />
                        </div>
                        <div>
                            <p className="font-bold">{player.firstName} {player.lastName}</p>
                            {player.jerseyNumber && <p className="text-sm text-aglianese-green">#{player.jerseyNumber}</p>}
                        </div>
                    </div>
                ))}
            </div>
            
            <button
                onClick={() => handleOpenPlayerModal()}
                className="fixed bottom-24 right-4 bg-aglianese-green text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Aggiungi Giocatore"
            >
                <Plus size={28} />
            </button>
            
            {isPlayerModalOpen && <PlayerModal isOpen={isPlayerModalOpen} onClose={() => setPlayerModalOpen(false)} player={editingPlayer} />}
            
            <PlayerDetailModal 
                player={detailPlayer} 
                onClose={() => setDetailPlayer(null)} 
                onEdit={handleOpenPlayerModal}
                onDelete={setDeletingPlayer}
            />
            
            <ConfirmationModal
                isOpen={!!deletingPlayer}
                onClose={() => setDeletingPlayer(null)}
                onConfirm={handleConfirmDelete}
                title="Conferma Eliminazione"
                message={`Sei sicuro di voler eliminare ${deletingPlayer?.firstName} ${deletingPlayer?.lastName}? Verrà rimosso anche da tutte le partite.`}
            />
        </div>
    );
};

export default PlayersScreen;