import React, { useMemo, useState } from 'react';
import { User, Edit, Trash2, Shield, Percent, BarChart3, Users as PlayersIcon, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Coach, Player, LeaderboardPlayer } from '../../types';
import Modal, { LeaderboardModal } from '../../components/common/Modal';

interface CoachDetailModalProps {
  coach: Coach;
  onClose: () => void;
  onEdit: (c: Coach) => void;
  onDelete: (c: Coach) => void;
}

const LeaderboardPreview: React.FC<{ title: string, icon: React.ElementType, players: {player: Player, value: number | string}[], unit: string, onClick: () => void }> = 
({ title, icon: Icon, players, unit, onClick }) => (
    <div className="bg-aglianese-gray-700 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Icon /> {title}</h3>
        <div className="space-y-2">
            {players.length > 0 ? players.map(({ player, value }) => (
                <div key={player.id} className="flex justify-between items-center text-sm">
                    <span>{player.firstName} {player.lastName}</span>
                    <span className="font-bold">{value} {unit}</span>
                </div>
            )) : <p className="text-sm text-aglianese-gray-400">Nessun dato</p>}
        </div>
         {players.length > 0 && <button onClick={onClick} className="text-aglianese-green text-sm mt-3">Mostra classifica completa</button>}
    </div>
);


const CoachDetailModal: React.FC<CoachDetailModalProps> = ({ coach, onClose, onEdit, onDelete }) => {
    const { matches, players, showMatchReport } = useAppContext();
    const [leaderboard, setLeaderboard] = useState<{ title: string; players: LeaderboardPlayer[]; unit: string } | null>(null);

    const stats = useMemo(() => {
        const coachedMatches = matches.filter(m => m.coachIds.includes(coach.id));
        
        let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
        coachedMatches.forEach(m => {
            goalsFor += m.result.home;
            goalsAgainst += m.result.away;
            if (m.result.home > m.result.away) wins++;
            else if (m.result.home < m.result.away) losses++;
            else draws++;
        });

        const winPercentage = coachedMatches.length > 0 ? ((wins / coachedMatches.length) * 100).toFixed(0) + '%' : 'N/A';

        const playerPresence: { [playerId: string]: number } = {};
        const playerGoals: { [playerId: string]: number } = {};

        coachedMatches.forEach(m => {
            m.attendees.forEach(a => {
                playerPresence[a.playerId] = (playerPresence[a.playerId] || 0) + 1;
            });
            m.scorers.forEach(s => {
                playerGoals[s.playerId] = (playerGoals[s.playerId] || 0) + s.goals;
            });
        });
        
        const topPlayersByPresence = Object.entries(playerPresence)
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, count]) => ({ player: players.find(p => p.id === playerId), value: count }))
            .filter(item => item.player) as { player: Player, value: number }[];

        const topPlayersByGoals = Object.entries(playerGoals)
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, goals]) => ({ player: players.find(p => p.id === playerId), value: goals }))
            .filter(item => item.player) as { player: Player, value: number }[];


        return { coachedMatches, wins, draws, losses, winPercentage, goalsFor, goalsAgainst, topPlayersByPresence, topPlayersByGoals };

    }, [coach, matches, players]);
    
    const openLeaderboard = (type: 'presence' | 'goals') => {
        let title: string, unit: string, playersToShow: LeaderboardPlayer[];
        if (type === 'presence') {
            title = `Presenze con ${coach.name}`;
            unit = 'pres.';
            playersToShow = stats.topPlayersByPresence.map(p => ({ ...p.player, score: p.value }));
        } else {
            title = `Marcatori con ${coach.name}`;
            unit = 'gol';
             playersToShow = stats.topPlayersByGoals.map(p => ({ ...p.player, score: p.value }));
        }
        setLeaderboard({ title, players: playersToShow, unit });
    }

    if (!coach) return null;

    return (
        <Modal isOpen={!!coach} onClose={onClose} title={`Dettaglio Mister: ${coach.name}`}>
            <div className="space-y-6">
                <div className="bg-aglianese-gray-700 p-4 rounded-lg flex items-center justify-between">
                   <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-aglianese-gray-600 rounded-full flex items-center justify-center">
                            <User size={32} className="text-aglianese-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{coach.name}</h2>
                        </div>
                   </div>
                    <div className="flex gap-2">
                        <button onClick={() => { onClose(); onEdit(coach); }} className="p-3 rounded-full hover:bg-aglianese-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"><Edit size={20} className="text-blue-400" /></button>
                        <button onClick={() => { onClose(); onDelete(coach); }} className="p-3 rounded-full hover:bg-aglianese-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"><Trash2 size={20} className="text-red-400" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><Shield className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.coachedMatches.length}</span><p className="text-sm">Partite</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><Percent className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.winPercentage}</span><p className="text-sm">% Vittorie</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg"><BarChart3 className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{`${stats.wins}-${stats.draws}-${stats.losses}`}</span><p className="text-sm">V-P-S</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg col-span-2 md:col-span-1"><TrendingUp className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.goalsFor}</span><p className="text-sm">Gol Fatti</p></div>
                    <div className="bg-aglianese-gray-700 p-4 rounded-lg col-span-2 md:col-span-1"><TrendingDown className="mx-auto mb-2 text-aglianese-green" /> <span className="font-bold text-xl">{stats.goalsAgainst}</span><p className="text-sm">Gol Subiti</p></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LeaderboardPreview title="Giocatori più presenti" icon={PlayersIcon} players={stats.topPlayersByPresence.slice(0, 5)} unit="pres." onClick={() => openLeaderboard('presence')} />
                    <LeaderboardPreview title="Bomber del Mister" icon={Target} players={stats.topPlayersByGoals.slice(0, 5)} unit="gol" onClick={() => openLeaderboard('goals')} />
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Partite Allenate</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.coachedMatches.length > 0 ? stats.coachedMatches.map(m => (
                             <div 
                                key={m.id}
                                onClick={() => { onClose(); showMatchReport(m.id); }}
                                className="bg-aglianese-gray-700 p-3 rounded-md flex justify-between items-center text-sm cursor-pointer hover:bg-aglianese-gray-600 transition-colors"
                            >
                                <div>
                                  <span className="font-semibold">vs {m.opponent}</span>
                                  <span className="text-xs text-aglianese-gray-400 block">{new Date(m.date).toLocaleDateString('it-IT')}</span>
                                </div>
                                <span className={`font-bold text-lg ${m.result.home > m.result.away ? 'text-green-400' : m.result.home < m.result.away ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {m.result.home} - {m.result.away}
                                </span>
                            </div>
                        )) : <p className="text-aglianese-gray-400 text-center py-4">Nessuna partita allenata.</p>}
                    </div>
                </div>
            </div>
            {leaderboard && (
                <LeaderboardModal 
                    isOpen={!!leaderboard}
                    onClose={() => setLeaderboard(null)}
                    title={leaderboard.title}
                    players={leaderboard.players}
                    unit={leaderboard.unit}
                />
            )}
        </Modal>
    );
};

export default CoachDetailModal;