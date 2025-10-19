import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useAppContext } from '../../context/AppContext';
import { Match } from '../../types';

interface ScorerState {
    playerId?: string;
    isOwnGoal: boolean;
    goals: number;
    // client-side unique key for mapping
    key: number;
}

const MatchEditModal: React.FC<{ isOpen: boolean; onClose: () => void; match: Match }> = ({ isOpen, onClose, match }) => {
    const { players, coaches, tournaments, updateMatch, showToast } = useAppContext();
    
    // Form state
    const [date, setDate] = useState('');
    const [opponent, setOpponent] = useState('');
    const [tournamentId, setTournamentId] = useState('');
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
    const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
    const [scorers, setScorers] = useState<ScorerState[]>([]);

    useEffect(() => {
        if (match) {
            setDate(match.date.split('T')[0]); // Format for input type="date"
            setOpponent(match.opponent);
            setTournamentId(match.tournamentId);
            setHomeScore(match.result.home);
            setAwayScore(match.result.away);
            setSelectedCoachIds(match.coachIds);
            setAttendeeIds(match.attendees.map(a => a.playerId));
            setScorers(match.scorers.map((s, i) => ({ ...s, key: Date.now() + i })));
        }
    }, [match, isOpen]);

    const availableAttendees = players.filter(p => attendeeIds.includes(p.id));

    const handleAddScorer = () => {
        setScorers([...scorers, { key: Date.now(), isOwnGoal: false, goals: 1, playerId: '' }]);
    };
    
    const handleRemoveScorer = (key: number) => {
        setScorers(scorers.filter(s => s.key !== key));
    };

    const handleScorerChange = (key: number, field: keyof ScorerState, value: any) => {
        setScorers(scorers.map(s => s.key === key ? { ...s, [field]: value } : s));
    };

    const handleSubmit = () => {
        // Validation
        if (!opponent.trim() || !tournamentId) {
            showToast('Avversario e torneo sono obbligatori.', 'error');
            return;
        }

        const totalGoals = scorers.reduce((sum, s) => sum + s.goals, 0);
        if (totalGoals !== homeScore) {
            showToast(`La somma dei gol dei marcatori (${totalGoals}) non corrisponde al risultato (${homeScore}).`, 'error');
            return;
        }

        const updatedMatch: Match = {
            ...match,
            date: new Date(date).toISOString(),
            opponent: opponent.trim(),
            tournamentId,
            result: { home: homeScore, away: awayScore },
            coachIds: selectedCoachIds,
            attendees: attendeeIds.map(id => ({ playerId: id, role: 'starter' })), // Simplified role
            scorers: scorers.map(s => ({ playerId: s.isOwnGoal ? undefined : s.playerId, isOwnGoal: s.isOwnGoal, goals: s.goals })),
        };

        updateMatch(updatedMatch);
        showToast('Partita aggiornata con successo!', 'success');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Modifica Partita vs ${match.opponent}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* General Info */}
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                    <select value={tournamentId} onChange={e => setTournamentId(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded">
                        {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                 <input type="text" placeholder="Avversario" value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Gol Fatti" value={homeScore} onChange={e => setHomeScore(parseInt(e.target.value) || 0)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                    <input type="number" placeholder="Gol Subiti" value={awayScore} onChange={e => setAwayScore(parseInt(e.target.value) || 0)} className="w-full bg-aglianese-gray-700 p-2 rounded" />
                 </div>

                {/* Coaches */}
                <div>
                    <label className="font-semibold block mb-2">Mister</label>
                    <div className="grid grid-cols-2 gap-2">
                        {coaches.map(coach => (
                            <label key={coach.id} className="flex items-center gap-2 bg-aglianese-gray-700 p-2 rounded">
                                <input type="checkbox" checked={selectedCoachIds.includes(coach.id)} onChange={() => {
                                    setSelectedCoachIds(prev => prev.includes(coach.id) ? prev.filter(id => id !== coach.id) : [...prev, coach.id]);
                                }} />
                                {coach.name}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Attendees */}
                 <div>
                    <label className="font-semibold block mb-2">Presenti</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {players.sort((a,b) => a.lastName.localeCompare(b.lastName)).map(player => (
                            <label key={player.id} className="flex items-center gap-2 bg-aglianese-gray-700 p-2 rounded">
                                <input type="checkbox" checked={attendeeIds.includes(player.id)} onChange={() => {
                                    setAttendeeIds(prev => prev.includes(player.id) ? prev.filter(id => id !== player.id) : [...prev, player.id]);
                                }} />
                                {player.firstName} {player.lastName}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Scorers */}
                <div>
                    <label className="font-semibold block mb-2">Marcatori</label>
                     <div className="space-y-2">
                        {scorers.map(scorer => (
                            <div key={scorer.key} className="flex items-center gap-2">
                                <select 
                                    value={scorer.isOwnGoal ? 'own_goal' : scorer.playerId || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        handleScorerChange(scorer.key, 'isOwnGoal', val === 'own_goal');
                                        handleScorerChange(scorer.key, 'playerId', val === 'own_goal' ? undefined : val);
                                    }}
                                    className="flex-grow bg-aglianese-gray-700 p-2 rounded"
                                >
                                    <option value="">Seleziona marcatore</option>
                                    <option value="own_goal">Autogol</option>
                                    {availableAttendees.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                                </select>
                                <input type="number" value={scorer.goals} onChange={e => handleScorerChange(scorer.key, 'goals', parseInt(e.target.value) || 0)} className="w-20 bg-aglianese-gray-700 p-2 rounded text-center" />
                                <button onClick={() => handleRemoveScorer(scorer.key)} className="p-2 text-red-400"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        <button onClick={handleAddScorer} className="text-sm text-aglianese-green flex items-center gap-1"><Plus size={16}/> Aggiungi marcatore</button>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500">Annulla</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-md bg-aglianese-green hover:bg-green-700 text-white font-bold">Salva Modifiche</button>
                </div>
            </div>
        </Modal>
    );
};

export default MatchEditModal;
