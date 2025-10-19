import React from 'react';
import { BrainCircuit, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AiInsightCard: React.FC = () => {
    const { matches, aiInsights, isGeneratingInsight, generateAiInsight } = useAppContext();

    return (
        <div className="bg-aglianese-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BrainCircuit /> Curiosità AI del Periodo
            </h2>
            {isGeneratingInsight ? (
                <div className="flex justify-center items-center gap-3 text-aglianese-gray-200 py-4">
                    <Loader className="animate-spin" />
                    <span>Generazione analisi...</span>
                </div>
            ) : aiInsights && aiInsights.length > 0 ? (
                <div className="space-y-4">
                    {aiInsights.map((insight, index) => (
                         <div key={index} className="border-l-4 border-aglianese-green pl-4">
                            <h3 className="text-lg font-semibold text-aglianese-green flex items-center gap-2">
                                {insight.emoji || '💡'} {insight.title}
                            </h3>
                            <p className="text-aglianese-gray-200 mt-1">{insight.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-aglianese-gray-300">Nessuna analisi disponibile. Generane una per visualizzare spunti sulle recenti performance.</p>
            )}
            <button
                onClick={generateAiInsight}
                disabled={isGeneratingInsight || matches.length < 3}
                className="mt-4 w-full bg-aglianese-green text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-aglianese-gray-600 disabled:cursor-not-allowed"
            >
                {isGeneratingInsight ? 'Analizzando...' : aiInsights && aiInsights.length > 0 ? 'Genera Nuova Analisi' : 'Genera Analisi'}
            </button>
            {matches.length < 3 && !isGeneratingInsight && (
                <p className="text-xs text-center mt-2 text-yellow-400">
                    Sono necessarie almeno 3 partite per generare un'analisi.
                </p>
            )}
        </div>
    );
};

export default AiInsightCard;