import React, { useMemo, useState } from 'react';
import { Target, Users, Shield, Percent, BarChart3, TrendingUp, TrendingDown, ChevronsUpDown, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Player, Tournament, LeaderboardPlayer, Match } from '../types';
import Modal, { LeaderboardModal } from '../components/common/Modal';
import { DEFAULT_MATCH_DURATION_MINUTES } from '../constants';

// --- Local Components for this screen ---

const MatchListItem: React.FC<{ match: Match; onClick: (matchId: string) => void }> = ({ match, onClick }) => {
    const { tournaments } = useAppContext();
    const tournament = tournaments.find(t => t.id === match.tournamentId);
    const date = new Date(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    const resultOutcome = match.result.home > match.result.away ? 'V' : match.result.home < match.result.away ? 'S' : 'P';
    const outcomeColor = resultOutcome === 'V' ? 'text-green-400' : resultOutcome === 'S' ? 'text-red-400' : 'text-yellow-400';

    return (
        <div 
            onClick={() => onClick(match.id)}
            className="bg-aglianese-gray-700 p-3 rounded-md flex justify-between items-center text-sm cursor-pointer hover:bg-aglianese-gray-600 transition-colors"
        >
            <div>
                <span className="font-semibold">vs {match.opponent}</span>
                <span className="text-xs text-aglianese-gray-400 block">{date} ({tournament?.name})</span>
            </div>
            <span className={`font-bold text-lg ${outcomeColor}`}>{match.result.home} - {match.result.away}</span>
        </div>
    );
};

interface StatDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        groupedMatches: {
            groupTitle: string;
            matches: Match[];
        }[];
    } | null;
}

const StatDetailModal: React.FC<StatDetailModalProps> = ({ isOpen, onClose, data }) => {
    const { showMatchReport } = useAppContext();

    const handleMatchClick = (matchId: string) => {
        onClose(); 
        showMatchReport(matchId);
    };

    if (!data) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={data.title}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {data.groupedMatches.map(group => (
                    <div key={group.groupTitle}>
                        {data.groupedMatches.length > 1 && (
                            <h3 className="font-bold text-lg mb-2 text-aglianese-green">{group.groupTitle} ({group.matches.length})</h3>
                        )}
                        <div className="space-y-2">
                            {group.matches.length > 0 ? (
                                group.matches.map(match => (
                                    <MatchListItem key={match.id} match={match} onClick={handleMatchClick} />
                                ))
                            ) : (
                                <p className="text-sm text-aglianese-gray-400">Nessuna partita in questa categoria.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};


// --- Main Component ---

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; onClick: () => void }> = ({ label, value, icon: Icon, onClick }) => (
    <button onClick={onClick} className="bg-aglianese-gray-800 p-4 rounded-lg text-center w-full hover:bg-aglianese-gray-700 focus:outline-none focus:ring-2 focus:ring-aglianese-green transition-colors">
        <Icon className="mx-auto text-aglianese-green mb-2" size={32} />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-aglianese-gray-200">{label}</div>
    </button>
);


const StatsScreen: React.FC = () => {
    const { matches, players, tournaments } = useAppContext();
    const [filterTournamentId, setFilterTournamentId] = useState<string>('all');
    const [leaderboard, setLeaderboard] = useState<{ title: string; players: LeaderboardPlayer[]; unit: string } | null>(null);
    const [statDetail, setStatDetail] = useState<StatDetailModalProps['data']>(null);

    const filteredMatches = useMemo(() => {
        return filterTournamentId === 'all'
            ? matches
            : matches.filter(m => m.tournamentId === filterTournamentId);
    }, [matches, filterTournamentId]);

    const stats = useMemo(() => {
        const totalMatches = filteredMatches.length;
        if (totalMatches === 0) {
            return { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, minutesPlayed: 0, topScorers: [], topAppearances: [], topWeightedAppearances: [], topWinRate: [] };
        }

        let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
        let minutesPlayed = 0;

        filteredMatches.forEach(m => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            minutesPlayed += (tournament?.presenceWeight || 1) * DEFAULT_MATCH_DURATION_MINUTES;

            goalsFor += m.result.home;
            goalsAgainst += m.result.away;
            if (m.result.home > m.result.away) wins++;
            else if (m.result.home < m.result.away) losses++;
            else draws++;
            if (m.result.away === 0) cleanSheets++;
        });

        const playerStats: { [id: string]: { played: number, wins: number, weighted: number, goals: number, appearances: number } } = {};
        players.forEach(p => { playerStats[p.id] = { played: 0, wins: 0, weighted: 0, goals: 0, appearances: 0 } });
        
        filteredMatches.forEach(m => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            const weight = tournament?.presenceWeight || 1;
            m.attendees.forEach(a => {
                if(playerStats[a.playerId]) {
                    playerStats[a.playerId].played++;
                    playerStats[a.playerId].weighted += weight;
                    playerStats[a.playerId].appearances++;
                    if(m.result.home > m.result.away) playerStats[a.playerId].wins++;
                }
            });
            m.scorers.forEach(s => {
                if(s.playerId && playerStats[s.playerId]) {
                    playerStats[s.playerId].goals += s.goals;
                }
            });
        });

        const toLeaderboard = (data: typeof playerStats, key: 'goals' | 'appearances' | 'weighted') => 
            Object.entries(data).map(([playerId, stats]) => ({ player: players.find(p => p.id === playerId), val: stats[key] }))
            .filter(item => item.player && item.val > 0)
            .sort((a, b) => b.val - a.val) as { player: Player; val: number }[];

        const topScorers = toLeaderboard(playerStats, 'goals').slice(0, 5);
        const topAppearances = toLeaderboard(playerStats, 'appearances').slice(0, 5);
        const topWeightedAppearances = toLeaderboard(playerStats, 'weighted').slice(0, 5);

        const topWinRate = Object.entries(playerStats)
            .map(([playerId, stats]) => ({ player: players.find(p => p.id === playerId), rate: stats.played > 0 ? (stats.wins / stats.played) * 100 : 0, played: stats.played }))
            .filter(item => item.player && item.played > 0)
            .sort((a,b) => b.rate - a.rate)
            .slice(0, 5) as { player: Player; rate: number }[];

        return { wins, draws, losses, goalsFor, goalsAgainst, cleanSheets, minutesPlayed, topScorers, topAppearances, topWeightedAppearances, topWinRate };
    }, [filteredMatches, players, tournaments]);

    const handleStatCardClick = (type: 'played' | 'vps' | 'gf' | 'ga' | 'cs' | 'mins') => {
        let modalData: StatDetailModalProps['data'] = { title: '', groupedMatches: [] };
        switch(type) {
            case 'played':
            case 'mins':
                modalData = { title: 'Partite Giocate', groupedMatches: [{ groupTitle: 'Tutte', matches: filteredMatches }] };
                break;
            case 'vps':
                modalData = { title: 'Vittorie, Pareggi, Sconfitte', groupedMatches: [
                    { groupTitle: 'Vinte', matches: filteredMatches.filter(m => m.result.home > m.result.away) },
                    { groupTitle: 'Pareggiate', matches: filteredMatches.filter(m => m.result.home === m.result.away) },
                    { groupTitle: 'Perse', matches: filteredMatches.filter(m => m.result.home < m.result.away) }
                ]};
                break;
            case 'gf':
                 modalData = { title: 'Partite con Gol Fatti', groupedMatches: [{ groupTitle: 'Partite', matches: filteredMatches.filter(m => m.result.home > 0) }] };
                break;
            case 'ga':
                 modalData = { title: 'Partite con Gol Subiti', groupedMatches: [{ groupTitle: 'Partite', matches: filteredMatches.filter(m => m.result.away > 0) }] };
                break;
            case 'cs':
                 modalData = { title: 'Partite con Rete Inviolata', groupedMatches: [{ groupTitle: 'Partite', matches: filteredMatches.filter(m => m.result.away === 0) }] };
                break;
        }
        setStatDetail(modalData);
    }

    const openLeaderboard = (type: 'scorers' | 'appearances' | 'weighted' | 'winrate') => {
        const playerStats: { [id: string]: { played: number, wins: number, weighted: number, goals: number, appearances: number } } = {};
        players.forEach(p => { playerStats[p.id] = { played: 0, wins: 0, weighted: 0, goals: 0, appearances: 0 } });
        
        filteredMatches.forEach(m => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            const weight = tournament?.presenceWeight || 1;
            m.attendees.forEach(a => { if(playerStats[a.playerId]) { playerStats[a.playerId].played++; playerStats[a.playerId].weighted += weight; playerStats[a.playerId].appearances++; if(m.result.home > m.result.away) playerStats[a.playerId].wins++; }});
            m.scorers.forEach(s => { if(s.playerId && playerStats[s.playerId]) playerStats[s.playerId].goals += s.goals });
        });

        let allPlayers: LeaderboardPlayer[] = [];
        let title = '', unit = '';

        if (type === 'scorers') {
            title = 'Classifica Marcatori'; unit = 'gol';
            allPlayers = Object.entries(playerStats).map(([id, stats]) => ({...players.find(p=>p.id===id)!, score: stats.goals})).filter(p => p.score > 0).sort((a,b) => b.score - a.score);
        } else if (type === 'appearances') {
             title = 'Classifica Presenze'; unit = 'pres.';
            allPlayers = Object.entries(playerStats).map(([id, stats]) => ({...players.find(p=>p.id===id)!, score: stats.appearances})).filter(p => p.score > 0).sort((a,b) => b.score - a.score);
        } else if (type === 'weighted') {
            title = 'Classifica Presenze (Ponderata)'; unit = 'pres.';
            allPlayers = Object.entries(playerStats).map(([id, stats]) => ({...players.find(p=>p.id===id)!, score: stats.weighted.toFixed(2)})).filter(p => parseFloat(p.score as string) > 0).sort((a,b) => parseFloat(b.score as string) - parseFloat(a.score as string));
        } else if (type === 'winrate') {
             title = 'Classifica % Vittorie'; unit = '%';
            allPlayers = Object.entries(playerStats).map(([id, stats]) => ({...players.find(p=>p.id===id)!, score: stats.played > 0 ? ((stats.wins / stats.played) * 100).toFixed(0) : '0'})).filter(p => parseInt(p.score as string) > 0).sort((a,b) => parseInt(b.score as string) - parseInt(a.score as string));
        }

        setLeaderboard({ title, players: allPlayers, unit });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Statistiche</h1>
                <select value={filterTournamentId} onChange={e => setFilterTournamentId(e.target.value)} className="bg-aglianese-gray-700 p-2 rounded-md">
                    <option value="all">Tutti i Tornei</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Partite Giocate" value={filteredMatches.length} icon={Shield} onClick={() => handleStatCardClick('played')} />
                <StatCard label="V-P-S" value={`${stats.wins}-${stats.draws}-${stats.losses}`} icon={BarChart3} onClick={() => handleStatCardClick('vps')} />
                <StatCard label="Gol Fatti" value={stats.goalsFor} icon={TrendingUp} onClick={() => handleStatCardClick('gf')} />
                <StatCard label="Gol Subiti" value={stats.goalsAgainst} icon={TrendingDown} onClick={() => handleStatCardClick('ga')} />
                <StatCard label="Clean Sheets" value={stats.cleanSheets} icon={Shield} onClick={() => handleStatCardClick('cs')} />
                <StatCard label="Minuti Giocati" value={stats.minutesPlayed} icon={Clock} onClick={() => handleStatCardClick('mins')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FIX: Changed data structure from array of arrays to array of objects to ensure correct type inference. */}
                {[
                    { title: 'Classifica Marcatori', data: stats.topScorers, unit: 'gol', type: 'scorers' as const },
                    { title: 'Classifica Presenze', data: stats.topAppearances, unit: 'pres.', type: 'appearances' as const },
                    { title: 'Classifica Presenze (Pond.)', data: stats.topWeightedAppearances, unit: 'pres.', type: 'weighted' as const },
                    { title: 'Classifica % Vittorie', data: stats.topWinRate, unit: '%', type: 'winrate' as const }
                ].map(({ title, data, unit, type }) => (
                    <div key={title} className="bg-aglianese-gray-800 p-4 rounded-lg">
                        <h2 className="font-bold mb-3 flex items-center gap-2">
                           {type==='scorers' && <Target/>} {type==='appearances' && <Users/>} {type==='weighted' && <Users/>} {type==='winrate' && <Percent/>} {title}
                        </h2>
                        <div className="space-y-2">
                            {(data as any[]).length > 0 ? (data as any[]).map(({ player, val, rate }) => (
                                <div key={player.id} className="flex justify-between items-center">
                                    <span>{player.firstName} {player.lastName}</span>
                                    <span className="font-bold">{type === 'winrate' ? `${rate.toFixed(0)}${unit}` : type === 'weighted' ? val.toFixed(2) : val}</span>
                                </div>
                            )) : <p className="text-sm text-aglianese-gray-400">Nessun dato</p>}
                        </div>
                        {(data as any[]).length > 0 && <button onClick={() => openLeaderboard(type)} className="text-aglianese-green text-sm mt-3">Mostra classifica completa</button>}
                    </div>
                ))}
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
            <StatDetailModal 
                isOpen={!!statDetail}
                onClose={() => setStatDetail(null)}
                data={statDetail}
            />
        </div>
    );
};

export default StatsScreen;