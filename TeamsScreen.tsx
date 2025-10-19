
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import AglianeseLogo from '../components/AglianeseLogo';

const TeamsScreen: React.FC = () => {
    const { addTeam, setActiveTeamId, teams } = useAppContext();
    const [teamName, setTeamName] = useState('');

    const handleCreateTeam = () => {
        if (teamName.trim()) {
            const newTeam = addTeam({
                name: teamName.trim(),
                primaryColorHex: '#10C46A',
                secondaryColorHex: '#121212',
            });
            setActiveTeamId(newTeam.id);
        }
    };
    
    // In a real app you might select from existing teams, but here we simplify.
    if (teams.length > 0 && !teams.find(t => t.id === localStorage.getItem('activeTeamId'))) {
        setActiveTeamId(teams[0].id);
        return null;
    }

    return (
        <div className="bg-aglianese-gray-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
            <AglianeseLogo className="h-16 w-16 mx-auto mb-4 text-aglianese-green" />
            <h1 className="text-2xl font-bold mb-2">Benvenuto in Mister Aglianese</h1>
            <p className="text-aglianese-gray-300 mb-6">
                Crea la tua squadra per iniziare a gestire partite, giocatori e statistiche.
            </p>
            
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Nome della squadra"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-aglianese-gray-700 p-3 rounded-md text-white placeholder-aglianese-gray-400 focus:outline-none focus:ring-2 focus:ring-aglianese-green"
                />
                <button
                    onClick={handleCreateTeam}
                    disabled={!teamName.trim()}
                    className="w-full bg-aglianese-green text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-aglianese-gray-600 disabled:cursor-not-allowed"
                >
                    Crea Squadra
                </button>
            </div>
        </div>
    );
};

export default TeamsScreen;
