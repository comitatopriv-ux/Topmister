import React, { useState, useMemo } from 'react';
import { Plus, Shield, Trophy, Activity, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Match } from '../types';
import MatchModal from './matches/MatchModal'; 
import AiInsightCard from '../components/AiInsightCard';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-aglianese-gray-800 p-4 rounded-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-aglianese-gray-200">{label}</div>
        </div>
    </div>
);

const MatchResultCard: React.FC<{ match: Match }> = ({ match }) => {
    const { tournaments, showMatchReport } = useAppContext();
    const tournament = tournaments.find(t => t.id === match.tournamentId);
    const date = new Date(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    const outcomeColor = match.result.home > match.result.away ? 'text-green-400' : match.result.home < match.result.away ? 'text-red-400' : 'text-yellow-400';

    return (
        <div 
            onClick={() => showMatchReport(match.id)}
            className="bg-aglianese-gray-800 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-aglianese-gray-700 transition-colors"
        >
            <div>
                <p className="font-bold">vs {match.opponent}</p>
                <p className="text-xs text-aglianese-gray-200">{tournament?.name} - {date}</p>
            </div>
            <p className={`text-2xl font-bold ${outcomeColor}`}>{match.result.home} - {match.result.away}</p>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { matches } = useAppContext();
    const [isMatchModalOpen, setMatchModalOpen] = useState(false);

    const { nextMatch, recentResults } = useMemo(() => {
        const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const futureMatches = sortedMatches.filter(m => new Date(m.date) >= new Date());
        const pastMatches = sortedMatches.filter(m => new Date(m.date) < new Date()).reverse();
        
        return {
            nextMatch: futureMatches[0] || null,
            recentResults: pastMatches.slice(0, 3)
        };
    }, [matches]);
    
    return (
        <div className="space-y-6">
            <button
                onClick={() => setMatchModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-aglianese-green text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                <Plus size={24} />
                Aggiungi Partita
            </button>

            {nextMatch && (
                 <div className="bg-aglianese-gray-800 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3 text-aglianese-green">Prossima Partita</h2>
                     <div className="flex justify-between items-center">
                        <div>
                            <p className="text-2xl font-bold">vs {nextMatch.opponent}</p>
                            <p className="text-sm text-aglianese-gray-200">
                                {new Date(nextMatch.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <Shield size={40} className="text-aglianese-green" />
                    </div>
                </div>
            )}
            
            <AiInsightCard />

            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy size={20} /> Ultimi Risultati</h2>
                <div className="space-y-3">
                    {recentResults.length > 0 ? (
                        recentResults.map(match => <MatchResultCard key={match.id} match={match} />)
                    ) : (
                        <p className="text-aglianese-gray-200 text-center p-4 bg-aglianese-gray-800 rounded-lg">Nessun risultato recente.</p>
                    )}
                </div>
            </div>

            {isMatchModalOpen && <MatchModal isOpen={isMatchModalOpen} onClose={() => setMatchModalOpen(false)} />}
        </div>
    );
};

export default Dashboard;