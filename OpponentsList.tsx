import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

interface OpponentStats {
    name: string;
    matchCount: number;
    wins: number;
    draws: number;
    losses: number;
}

interface OpponentsListProps {
    onOpponentClick: (opponentName: string) => void;
}

const OpponentsList: React.FC<OpponentsListProps> = ({ onOpponentClick }) => {
    const { matches } = useAppContext();

    const opponentStats = useMemo<OpponentStats[]>(() => {
        const statsMap = new Map<string, OpponentStats>();

        matches.forEach(match => {
            if (!match.opponent) return;

            const existing = statsMap.get(match.opponent) || {
                name: match.opponent,
                matchCount: 0,
                wins: 0,
                draws: 0,
                losses: 0,
            };

            existing.matchCount++;
            if (match.result.home > match.result.away) {
                existing.wins++;
            } else if (match.result.home < match.result.away) {
                existing.losses++;
            } else {
                existing.draws++;
            }

            statsMap.set(match.opponent, existing);
        });

        return Array.from(statsMap.values()).sort((a, b) => b.matchCount - a.matchCount);
    }, [matches]);

    if (opponentStats.length === 0) {
        return (
            <p className="text-center text-aglianese-gray-200 p-6 bg-aglianese-gray-800 rounded-lg">
                Nessun avversario affrontato. Registra una partita per iniziare.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {opponentStats.map(opponent => (
                <div 
                    key={opponent.name}
                    onClick={() => onOpponentClick(opponent.name)}
                    className="bg-aglianese-gray-800 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-aglianese-gray-700 transition-colors"
                >
                    <div>
                        <p className="font-bold text-lg">{opponent.name}</p>
                        <p className="text-sm text-aglianese-gray-300">{opponent.matchCount} partit{opponent.matchCount > 1 ? 'e' : 'a'} giocat{opponent.matchCount > 1 ? 'e' : 'a'}</p>
                    </div>
                    <div className="flex gap-2 text-sm font-semibold">
                        <span className="text-green-400">V: {opponent.wins}</span>
                        <span className="text-yellow-400">P: {opponent.draws}</span>
                        <span className="text-red-400">S: {opponent.losses}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OpponentsList;
