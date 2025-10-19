import React, { useMemo, useEffect } from 'react';
import Modal from './Modal';
import { Sparkles, Loader, Trophy, User, Users, Target, UserCheck, Repeat } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface MatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | null;
}

const InfoSection: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div>
        <h4 className="text-lg font-bold flex items-center gap-2 mb-2 text-aglianese-gray-200">
            <Icon size={20} className="text-aglianese-green" /> {title}
        </h4>
        <div className="bg-aglianese-gray-700 p-3 rounded-lg text-sm">{children}</div>
    </div>
);


const MatchReportModal: React.FC<MatchReportModalProps> = ({ isOpen, onClose, matchId }) => {
  const { 
    matches, 
    players, 
    coaches, 
    tournaments,
    generateAIMatchSummary, 
    isGeneratingReport, 
    aiGeneratedReport: report 
  } = useAppContext();

  useEffect(() => {
    if (isOpen && matchId) {
      generateAIMatchSummary(matchId);
    }
  }, [isOpen, matchId, generateAIMatchSummary]);

  const reportData = useMemo(() => {
    if (!matchId) return null;
    const match = matches.find(m => m.id === matchId);
    if (!match) return null;

    const getPlayerName = (pId: string) => {
        const player = players.find(p => p.id === pId);
        return player ? `${player.firstName} ${player.lastName}`.trim() : 'Sconosciuto';
    }

    const tournament = tournaments.find(t => t.id === match.tournamentId);
    const presentCoaches = coaches.filter(c => match.coachIds.includes(c.id));
    const starters = match.attendees.filter(a => a.role === 'starter').map(a => getPlayerName(a.playerId));
    const subs = match.attendees.filter(a => a.role === 'sub').map(a => getPlayerName(a.playerId));
    const matchScorers = match.scorers.map(s => ({ 
        name: s.isOwnGoal ? 'Autogol' : getPlayerName(s.playerId!), 
        goals: s.goals 
    }));
    const precedents = matches
        .filter(m => m.opponent === match.opponent && new Date(m.date) < new Date(match.date))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { match, tournament, presentCoaches, starters, subs, matchScorers, precedents };
  }, [matchId, matches, players, coaches, tournaments]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Partita">
      <div>
        {!reportData && isOpen && (
           <div className="flex flex-col items-center justify-center gap-4 text-aglianese-gray-200 py-8 min-h-[300px]">
             <Loader size={48} className="animate-spin text-aglianese-green" />
             <span>Caricamento dati...</span>
           </div>
        )}

        {reportData && (
          <div className="space-y-6">
            <div className="text-center bg-aglianese-gray-800 p-4 rounded-lg">
                <p className="text-sm text-aglianese-gray-300">{new Date(reportData.match.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <h2 className="text-3xl font-bold">vs {reportData.match.opponent}</h2>
                <p className={`text-4xl font-bold mt-1 ${reportData.match.result.home > reportData.match.result.away ? 'text-green-400' : reportData.match.result.home < reportData.match.result.away ? 'text-red-400' : 'text-yellow-400'}`}>
                    {reportData.match.result.home} - {reportData.match.result.away}
                </p>
            </div>
            
            <InfoSection icon={Sparkles} title="Analisi AI">
              {isGeneratingReport ? (
                  <div className="flex items-center justify-center gap-3 text-aglianese-gray-200 py-2">
                      <Loader className="animate-spin" />
                      <span>Generazione riassunto...</span>
                  </div>
              ) : report && report.title !== "Errore Report" ? (
                  <>
                      <h3 className="font-bold text-aglianese-green">{report.title}</h3>
                      <p className="text-aglianese-gray-200 mt-1">{report.content}</p>
                  </>
              ) : (
                  <p className="text-sm text-aglianese-gray-400">
                      {report ? report.content : "Nessun riassunto AI disponibile."}
                  </p>
              )}
            </InfoSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InfoSection icon={Trophy} title="Torneo">
                    <p>{reportData.tournament?.name || 'N/D'}</p>
                </InfoSection>
                <InfoSection icon={UserCheck} title="Mister">
                    {reportData.presentCoaches.length > 0 ? reportData.presentCoaches.map(c => c.name).join(', ') : 'Nessuno'}
                </InfoSection>
            </div>
            
            <InfoSection icon={Target} title="Marcatori">
                {reportData.matchScorers.length > 0 ? (
                    <ul className="list-disc list-inside">
                        {reportData.matchScorers.map((s, i) => <li key={i}>{s.name} ({s.goals} gol)</li>)}
                    </ul>
                ) : <p>Nessun gol segnato.</p>}
            </InfoSection>

            <InfoSection icon={Users} title="Giocatori Presenti">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 className="font-semibold mb-1">Titolari</h5>
                        {reportData.starters.length > 0 ? reportData.starters.map((name, i) => <p key={i} className="truncate">{name}</p>) : <p className="text-gray-400">N/D</p>}
                    </div>
                     <div>
                        <h5 className="font-semibold mb-1">Sostituti</h5>
                        {reportData.subs.length > 0 ? reportData.subs.map((name, i) => <p key={i} className="truncate">{name}</p>) : <p className="text-gray-400">N/D</p>}
                    </div>
                </div>
            </InfoSection>

            <InfoSection icon={Repeat} title="Precedenti">
                 {reportData.precedents.length > 0 ? (
                    <div className="space-y-2">
                        {reportData.precedents.slice(0, 3).map(p => (
                            <div key={p.id} className="flex justify-between items-center bg-aglianese-gray-800 p-2 rounded">
                                <span>{new Date(p.date).toLocaleDateString('it-IT')}</span>
                                <span className="font-bold">{p.result.home} - {p.result.away}</span>
                            </div>
                        ))}
                    </div>
                ) : <p>Nessun precedente trovato.</p>}
            </InfoSection>

          </div>
        )}
      </div>
    </Modal>
  );
};

export default MatchReportModal;