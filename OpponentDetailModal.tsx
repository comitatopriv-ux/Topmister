import React, { useMemo } from 'react';
import Modal from '../../components/common/Modal';
import { useAppContext } from '../../context/AppContext';
import { Match } from '../../types';
import { TrendingUp, TrendingDown, ChevronsUpDown, BarChart3, Shield } from 'lucide-react';

interface OpponentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponentName: string | null;
}

const StatDisplay: React.FC<{ icon: React.ElementType, value: string | number, label: string }> = ({ icon: Icon, value, label }) => (
    <div className="bg-aglianese-gray-700 p-3 rounded-lg text-center">
        <Icon size={24} className="mx-auto mb-2 text-aglianese-green" />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-aglianese-gray-300">{label}</p>
    </div>
);

const OpponentDetailModal: React.FC<OpponentDetailModalProps> = ({ isOpen, onClose, opponentName }) => {
    const { matches, showMatchReport, tournaments } = useAppContext();

    const opponentData = useMemo(() => {
        if (!opponentName) return null;

        const filteredMatches = matches.filter(m => m.opponent === opponentName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

        filteredMatches.forEach(m => {
            goalsFor += m.result.home;
            goalsAgainst += m.result.away;
            if (m.result.home > m.result.away) wins++;
            else if (m.result.home < m.result.away) losses++;
            else draws++;
        });

        return {
            matches: filteredMatches,
            wins, draws, losses, goalsFor, goalsAgainst
        };
    }, [opponentName, matches]);

    const handleMatchClick = (match: Match) => {
        onClose();
        showMatchReport(match.id);
    };

    if (!isOpen || !opponentData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Dettaglio vs ${opponentName}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatDisplay icon={Shield} value={opponentData.matches.length} label="Partite" />
                    <StatDisplay icon={BarChart3} value={`${opponentData.wins}-${opponentData.draws}-${opponentData.losses}`} label="V-P-S" />
                    <StatDisplay icon={ChevronsUpDown} value={`${opponentData.goalsFor}-${opponentData.goalsAgainst}`} label="GF / GS" />
                    <StatDisplay icon={TrendingUp} value={opponentData.goalsFor} label="Gol Fatti" />
                    <StatDisplay icon={TrendingDown} value={opponentData.goalsAgainst} label="Gol Subiti" />
                </div>
                
                <div>
                    <h3 className="font-bold text-lg mb-2">Storico Partite</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {opponentData.matches.length > 0 ? opponentData.matches.map(m => (
                            <div 
                                key={m.id}
                                onClick={() => handleMatchClick(m)}
                                className="bg-aglianese-gray-700 p-3 rounded-md flex justify-between items-center text-sm cursor-pointer hover:bg-aglianese-gray-600"
                            >
                                <div>
                                  <span className="font-semibold">{new Date(m.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
                                  <span className="text-xs text-aglianese-gray-400 block">{tournaments.find(t => t.id === m.tournamentId)?.name || 'N/D'}</span>
                                </div>
                                <span className={`font-bold text-lg ${m.result.home > m.result.away ? 'text-green-400' : m.result.home < m.result.away ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {m.result.home} - {m.result.away}
                                </span>
                            </div>
                        )) : <p className="text-aglianese-gray-400 text-center py-4">Nessuna partita giocata.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OpponentDetailModal;