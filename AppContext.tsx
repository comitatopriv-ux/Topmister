import React, { createContext, useContext, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import {
  AppContextType,
  AppProviderProps,
  Team,
  Player,
  Coach,
  Tournament,
  Match,
  ToastMessage,
  ToastType,
  Insight,
  MatchReport
} from '../types';
import { NAV_ITEMS } from '../constants';
import { generateCoachInsight, generateMatchReport } from '../services/geminiService';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(NAV_ITEMS[0]);
  const [teams, setTeams] = useLocalStorage<Team[]>('teams', []);
  const [players, setPlayers] = useLocalStorage<Player[]>('players', []);
  const [coaches, setCoaches] = useLocalStorage<Coach[]>('coaches', []);
  const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournaments', []);
  const [matches, setMatches] = useLocalStorage<Match[]>('matches', []);
  const [activeTeamId, setActiveTeamId] = useLocalStorage<string | null>('activeTeamId', null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [aiInsights, setAiInsights] = useLocalStorage<Insight[] | null>('aiInsights', null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const [reportingMatchId, setReportingMatchId] = useState<string | null>(null);
  const [aiGeneratedReport, setAiGeneratedReport] = useState<MatchReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const showToast = useCallback((message: string, type: ToastType) => {
    const newToast: ToastMessage = { id: Date.now(), message, type };
    setToast(newToast);
    setTimeout(() => {
      setToast((currentToast) => (currentToast?.id === newToast.id ? null : currentToast));
    }, 3000);
  }, []);

  const generateAiInsight = useCallback(async () => {
    setIsGeneratingInsight(true);
    try {
        const insights = await generateCoachInsight(matches, players, coaches, tournaments);
        setAiInsights(insights);
        if (insights && insights.length > 0 && insights[0].title !== "Errore AI") {
            showToast("Nuova analisi AI generata!", 'success');
        } else if (insights && insights.length > 0) {
            showToast(insights[0].description, 'error');
        }
    } catch (error) {
        console.error(error);
        const errorInsights = [{title: 'Errore', description: "Impossibile contattare l'intelligenza artificiale.", emoji: '🤖'}];
        setAiInsights(errorInsights);
        showToast(errorInsights[0].description, 'error');
    } finally {
        setIsGeneratingInsight(false);
    }
  }, [matches, players, coaches, tournaments, showToast, setAiInsights]);

  const generateAIMatchSummary = useCallback(async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setIsGeneratingReport(true);
    setAiGeneratedReport(null);
    try {
        const report = await generateMatchReport(match, matches, players);
        setAiGeneratedReport(report);
    } catch (error) {
        console.error("Error generating match report:", error);
        setAiGeneratedReport({
            title: "Errore Report",
            content: "Impossibile generare il riassunto AI per questa partita."
        });
        showToast("Errore nella generazione del riassunto AI.", 'error');
    } finally {
        setIsGeneratingReport(false);
    }
  }, [matches, players, showToast]);

  const showMatchReport = useCallback((matchId: string) => {
    setReportingMatchId(matchId);
  }, []);

  const clearMatchReport = useCallback(() => {
    setReportingMatchId(null);
    setAiGeneratedReport(null);
  }, []);

  const addTeam = (teamData: Omit<Team, 'id'>): Team => {
    const newTeam: Team = { ...teamData, id: Date.now().toString() };
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  const addPlayer = (playerData: Omit<Player, 'id' | 'teamId'>): Player => {
    if (!activeTeamId) throw new Error("No active team selected");
    const newPlayer: Player = { ...playerData, id: Date.now().toString(), teamId: activeTeamId };
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };
  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };
  const deletePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    // Also remove player from matches
    setMatches(prevMatches => prevMatches.map(match => ({
      ...match,
      attendees: match.attendees.filter(a => a.playerId !== playerId),
      scorers: match.scorers.filter(s => s.playerId !== playerId)
    })));
  };

  const addCoach = (coachData: Omit<Coach, 'id'>): Coach => {
    const newCoach: Coach = { ...coachData, id: Date.now().toString() };
    setCoaches(prev => [...prev, newCoach]);
    return newCoach;
  };
  const updateCoach = (updatedCoach: Coach) => {
    setCoaches(prev => prev.map(c => c.id === updatedCoach.id ? updatedCoach : c));
  };
  const deleteCoach = (coachId: string) => {
    setCoaches(prev => prev.filter(c => c.id !== coachId));
     setMatches(prevMatches => prevMatches.map(match => ({
      ...match,
      coachIds: match.coachIds.filter(id => id !== coachId)
    })));
  };

  const addTournament = (tournamentData: Omit<Tournament, 'id'>): Tournament => {
    const newTournament: Tournament = { ...tournamentData, id: Date.now().toString() };
    setTournaments(prev => [...prev, newTournament]);
    return newTournament;
  };
  const updateTournament = (updatedTournament: Tournament) => {
    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
  };
  const deleteTournament = (tournamentId: string) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
  };

  const addMatch = (matchData: Omit<Match, 'id'>): Match => {
    const newMatch: Match = { ...matchData, id: Date.now().toString() };
    setMatches(prev => [...prev, newMatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return newMatch;
  };
  const updateMatch = (updatedMatch: Match) => {
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  const deleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };
  

  const value: AppContextType = {
    activeTab,
    teams,
    players,
    coaches,
    tournaments,
    matches,
    activeTeamId,
    toast,
    aiInsights,
    isGeneratingInsight,
    reportingMatchId,
    aiGeneratedReport,
    isGeneratingReport,
    setActiveTab,
    setActiveTeamId,
    showToast,
    generateAiInsight,
    showMatchReport,
    generateAIMatchSummary,
    clearMatchReport,
    addTeam,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addCoach,
    updateCoach,
    deleteCoach,
    addTournament,
    updateTournament,
    deleteTournament,
    addMatch,
    updateMatch,
    deleteMatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};