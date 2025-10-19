import React from 'react';
import { useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './Dashboard';
import MatchesScreen from './MatchesScreen';
import PlayersScreen from './PlayersScreen';
import StatsScreen from './StatsScreen';
import CoachesScreen from './CoachesScreen';
import TeamsScreen from './TeamsScreen';
import Toast from './components/common/Toast';
import MatchReportModal from './components/common/MatchReportModal';

const App: React.FC = () => {
  const { activeTab, activeTeamId, toast, reportingMatchId, clearMatchReport } = useAppContext();

  const renderScreen = () => {
    if (!activeTeamId) {
      return <TeamsScreen />;
    }
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Partite':
        return <MatchesScreen />;
      case 'Giocatori':
        return <PlayersScreen />;
      case 'Statistiche':
        return <StatsScreen />;
      case 'Mister':
        return <CoachesScreen />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {activeTeamId ? (
        <Layout>
          {renderScreen()}
        </Layout>
      ) : (
        <div className="h-screen w-screen flex items-center justify-center">
          <TeamsScreen />
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
      <MatchReportModal
        isOpen={!!reportingMatchId}
        onClose={clearMatchReport}
        matchId={reportingMatchId}
      />
    </>
  );
};

export default App;
