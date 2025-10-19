
import React from 'react';
import { Home, Shield, Users, BarChart, BrainCircuit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { NAV_ITEMS } from '../constants';
import AglianeseLogo from './AglianeseLogo';

interface LayoutProps {
  children: React.ReactNode;
}

const navIcons: { [key: string]: React.ElementType } = {
  Dashboard: Home,
  Partite: Shield,
  Giocatori: Users,
  Statistiche: BarChart,
  Mister: BrainCircuit,
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <div className="flex flex-col h-screen bg-aglianese-gray-900 text-white">
      <header className="p-4 bg-aglianese-gray-800 border-b border-aglianese-gray-700 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <AglianeseLogo className="h-8 w-8" />
           <h1 className="text-xl font-bold">Mister Aglianese</h1>
         </div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 pb-24">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-aglianese-gray-800 border-t border-aglianese-gray-700">
        <nav className="flex justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = navIcons[item];
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 text-xs focus:outline-none focus:ring-2 focus:ring-aglianese-green rounded-t-sm transition-colors duration-200 ${
                  isActive ? 'text-aglianese-green' : 'text-aglianese-gray-200 hover:text-white'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span>{item}</span>
              </button>
            );
          })}
        </nav>
      </footer>
    </div>
  );
};

export default Layout;
