import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ShieldCheck, Bot, Loader, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useAppContext } from '../../context/AppContext';
import { Match, Player, Tournament, Coach, ParsedMatchFromText } from '../../types';
import { parseMatchText } from '../../services/geminiService';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match?: Match | null; // Note: Edit mode is disabled in this new flow
}

type ValidationStatus = 'success' | 'error' | 'warning';

interface ValidatedScorer {
    player?: Player;
    isOwnGoal: boolean;
    goals: number;
}

interface ValidationResult {
    hasErrors: boolean;
    messages: { status: ValidationStatus; text: string }[];
    validatedData?: {
        date: string;
        tournament: Tournament;
        opponent: string;
        homeScore: number;
        awayScore: number;
        coaches: Coach[];
        attendees: Player[];
        scorers: ValidatedScorer[];
    }
}

const ValidationItem: React.FC<{ status: ValidationStatus; message: string }> = ({ status, message }) => {
    const Icon = status === 'success' ? CheckCircle : status === 'error' ? XCircle : AlertTriangle;
    const color = status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-yellow-400';
    const bg = status === 'success' ? 'bg-green-900/50' : status === 'error' ? 'bg-red-900/50' : 'bg-yellow-900/50';

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border border-transparent ${bg}`}>
            <Icon size={20} className={`flex-shrink-0 mt-0.5 ${color}`} />
            <p className="text-sm text-aglianese-gray-200">{message}</p>
        </div>
    );
};

const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose }) => {
    const { players, coaches, tournaments, addMatch, showToast } = useAppContext();
    
    const [rawText, setRawText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
    const [isTournamentModalOpen, setTournamentModalOpen] = useState(false);
    
    const placeholderText = `Esempio (inserisci una o più partite separate da ---):\n\nTorneo: Ponte 2000\nData: 15 settembre 2025\nAglianese 8 – 9 Tobbiana\nMister: Rossi\nPresenti: Lenzi, Magni, Pasticci, Bonacchi, Polidori, Giusti, Fischietti\nMarcatori: Giusti (4), Bonacchi (2), Pasticci (2)\n\n---\n\nTorneo: Amichevole\nData: 22 settembre 2025\nAglianese 5 – 2 Pistoiese\nMister: Verdi\nPresenti: Lenzi, Magni, Pasticci, Bonacchi, Polidori, Giusti\nMarcatori: Pasticci (3), Lenzi (1), Autogol (1)`;

    useEffect(() => {
        if (!isOpen) {
           setTimeout(() => { // Delay reset to allow closing animation
             setRawText('');
             setIsParsing(false);
             setValidationResults(null);
           }, 300);
        }
    }, [isOpen]);

    const validateData = useCallback((data: ParsedMatchFromText, allPlayers: Player[], allTournaments: Tournament[], allCoaches: Coach[]): ValidationResult => {
        const messages: { status: ValidationStatus; text: string }[] = [];
        let hasErrors = false;

        const validated: any = { scorers: [] };
        
        // --- General validation ---
        if (!data.date) { hasErrors = true; messages.push({status: 'error', text: "Data non trovata nel testo."}); }
        else { validated.date = new Date(data.date).toISOString(); messages.push({status: 'success', text: `Data: ${new Date(data.date).toLocaleDateString('it-IT')}`}); }

        if (!data.tournamentName) { hasErrors = true; messages.push({status: 'error', text: "Nome torneo non trovato nel testo."}); }
        else {
            const tournament = allTournaments.find(t => t.name.toLowerCase() === data.tournamentName?.toLowerCase());
            if (tournament) { validated.tournament = tournament; messages.push({status: 'success', text: `Torneo: ${tournament.name}`}); }
            else { hasErrors = true; messages.push({status: 'error', text: `Torneo '${data.tournamentName}' non trovato. Aggiungilo da "Gestisci Tornei".`});}
        }

        if (!data.opponentName || data.homeScore === undefined || data.awayScore === undefined) { hasErrors = true; messages.push({status: 'error', text: "Risultato o avversario non trovato."});}
        else { 
            validated.opponent = data.opponentName;
            validated.homeScore = data.homeScore;
            validated.awayScore = data.awayScore;
            messages.push({status: 'success', text: `Risultato: Aglianese ${data.homeScore} - ${data.opponentName} ${data.awayScore}`});
        }
        
        // --- Entities validation ---
        const findPlayersByLastName = (lastNameList: string[]) => {
            return (lastNameList || []).map(lastName => {
                const found = allPlayers.find(p => p.lastName.toLowerCase() === lastName.toLowerCase());
                 if (!found) {
                    hasErrors = true;
                    messages.push({status: 'error', text: `Giocatore '${lastName}' non trovato.`});
                }
                return found;
            }).filter((p): p is Player => !!p);
        };
        const findCoachesByName = (nameList: string[]) => {
             return (nameList || []).map(name => {
                const found = allCoaches.find(c => c.name.toLowerCase() === name.toLowerCase());
                 if (!found) {
                    hasErrors = true;
                    messages.push({status: 'error', text: `Mister '${name}' non trovato.`});
                }
                return found;
            }).filter((c): c is Coach => !!c);
        }
       
        validated.coaches = findCoachesByName(data.coachNames || []);
        if((data.coachNames || []).length > 0 && validated.coaches.length === (data.coachNames || []).length) {
            messages.push({ status: 'success', text: `Mister presenti: ${validated.coaches.map(c=>c.name).join(', ')}`});
        }


        validated.attendees = findPlayersByLastName(data.attendees || []);
        if((data.attendees || []).length === 0) {
            hasErrors = true;
            messages.push({status: 'error', text: "Nessun giocatore presente trovato."});
        } else if (validated.attendees.length === (data.attendees || []).length) {
             messages.push({status: 'success', text: `${validated.attendees.length} giocatori presenti riconosciuti.`});
        }
       
        // FIX: The type predicate `is ValidatedScorer` was incorrect because `ValidatedScorer` is not a subtype of the array element type. Removing the predicate allows TypeScript to correctly infer the type and resolve the error.
        validated.scorers = (data.scorers || []).map(scorer => {
            if (scorer.isOwnGoal) {
                return { isOwnGoal: true, goals: scorer.goals };
            }
            const player = allPlayers.find(p => p.lastName.toLowerCase() === scorer.lastName?.toLowerCase());
            if (!player) {
                hasErrors = true;
                messages.push({status: 'error', text: `Marcatore '${scorer.lastName}' non trovato.`});
                return null;
            }
            return { player, goals: scorer.goals, isOwnGoal: false };
        }).filter((s): s is ValidatedScorer => s !== null);


        // --- Logic Validation ---
        if (!hasErrors) {
            const totalGoals = validated.scorers.reduce((sum, s) => sum + s.goals, 0);
            if (totalGoals !== validated.homeScore) {
                hasErrors = true;
                messages.push({status: 'error', text: `La somma dei gol dei marcatori (${totalGoals}) non corrisponde al risultato (${validated.homeScore}).`});
            }

            validated.scorers.forEach(scorer => {
                if (!scorer.isOwnGoal && scorer.player) {
                    if (!validated.attendees.some(attendee => attendee.id === scorer.player.id)) {
                        hasErrors = true;
                        messages.push({status: 'error', text: `Il marcatore ${scorer.player.lastName} non è nella lista dei presenti.`});
                    }
                }
            });
        }
        
        return { hasErrors, messages, validatedData: hasErrors ? undefined : validated };

    }, []);

    const handleParse = async () => {
        if (!rawText.trim()) return showToast('Inserisci il testo della/e partita/e.', 'error');
        setIsParsing(true);
        setValidationResults(null);

        try {
            const aiResults = await parseMatchText(rawText, players, tournaments, coaches);
            if (!aiResults || aiResults.length === 0) {
                showToast("L'AI non ha trovato partite valide nel testo.", 'error');
                return;
            }
            const validations = aiResults.map(res => validateData(res, players, tournaments, coaches));
            setValidationResults(validations);
        } catch (e) {
            showToast("Errore imprevisto durante l'analisi AI.", 'error');
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleSave = () => {
        if (!validationResults) {
            showToast('Nessuna partita da salvare.', 'error');
            return;
        }

        const validMatchesToSave = validationResults.filter(r => !r.hasErrors && r.validatedData);
        
        if (validMatchesToSave.length === 0) {
            showToast('Nessuna partita valida da salvare. Correggi gli errori.', 'error');
            return;
        }

        let savedCount = 0;
        validMatchesToSave.forEach(result => {
             if (result.validatedData) {
                const { date, opponent, tournament, homeScore, awayScore, coaches: coachList, attendees, scorers } = result.validatedData;

                const matchData: Omit<Match, 'id'> = {
                    date,
                    opponent,
                    tournamentId: tournament.id,
                    result: { home: homeScore, away: awayScore },
                    coachIds: coachList.map(c => c.id),
                    attendees: attendees.map(p => ({ playerId: p.id, role: 'starter' })),
                    scorers: scorers.map(s => ({
                        playerId: s.player?.id,
                        isOwnGoal: s.isOwnGoal,
                        goals: s.goals
                    })),
                };
                addMatch(matchData);
                savedCount++;
            }
        });

        if (savedCount > 0) {
            showToast(`${savedCount} partit${savedCount > 1 ? 'e' : 'a'} aggiunt${savedCount > 1 ? 'e' : 'a'} con successo!`, 'success');
        }
        onClose();
    };

    const handleReset = () => {
        setValidationResults(null);
    };

    const validMatchesCount = validationResults?.filter(v => !v.hasErrors).length || 0;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi Partite da Testo">
            <div className="space-y-6">
                {!validationResults ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-aglianese-gray-300">
                           <FileText size={20}/>
                           <h3 className="font-semibold">Incolla qui i dati di una o più partite</h3>
                        </div>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={placeholderText}
                            rows={10}
                            className="w-full bg-aglianese-gray-900 border border-aglianese-gray-600 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aglianese-green"
                        />
                         <div className="flex justify-between items-center gap-4">
                            <button onClick={() => setTournamentModalOpen(true)} className="px-4 py-2 text-sm rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500 flex items-center gap-2">
                                <ShieldCheck size={16} /> Gestisci Tornei
                            </button>
                            <button
                                onClick={handleParse}
                                disabled={isParsing}
                                className="px-6 py-2 rounded-md bg-aglianese-green hover:bg-green-700 text-white font-bold flex items-center gap-2 disabled:bg-aglianese-gray-600"
                            >
                                {isParsing ? <Loader size={20} className="animate-spin" /> : <Bot size={20} />}
                                {isParsing ? 'Analisi in corso...' : 'Analizza Dati'}
                            </button>
                        </div>
                    </div>
                ) : (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-aglianese-gray-700 p-3 rounded-lg sticky top-0">
                            <h3 className="font-semibold">{validationResults.length} partit{validationResults.length !== 1 ? 'e' : 'a'} trovat{validationResults.length !== 1 ? 'e' : 'a'}. <span className={validMatchesCount > 0 ? 'text-aglianese-green' : 'text-yellow-400'}>{validMatchesCount} valide.</span></h3>
                           <div className="flex justify-end gap-2">
                                <button onClick={handleReset} className="px-3 py-1.5 text-sm rounded-md bg-aglianese-gray-600 hover:bg-aglianese-gray-500">
                                    Modifica
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={validMatchesCount === 0}
                                    className="px-4 py-1.5 text-sm rounded-md bg-aglianese-green hover:bg-green-700 text-white font-bold disabled:bg-aglianese-gray-600 disabled:cursor-not-allowed"
                                >
                                    Salva {validMatchesCount > 0 ? `${validMatchesCount} ` : ''}Valide
                                </button>
                           </div>
                        </div>

                        <div className="space-y-3 max-h-[55vh] overflow-y-auto p-1 pr-2">
                            {validationResults.map((result, index) => (
                               <div key={index} className={`p-4 rounded-lg border ${result.hasErrors ? 'border-red-500/50 bg-red-900/20' : 'border-green-500/50 bg-green-900/20'}`}>
                                    <h4 className="font-bold mb-3">
                                        Partita #{index + 1}: {result.validatedData?.opponent ? `vs ${result.validatedData.opponent}` : (result.messages.find(m => m.text.includes('Risultato'))?.text || 'Dati incompleti')}
                                    </h4>
                                    <div className="space-y-2">
                                        {result.messages.map((msg, msgIndex) => (
                                            <ValidationItem key={msgIndex} status={msg.status} message={msg.text} />
                                        ))}
                                    </div>
                               </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {isTournamentModalOpen && <TournamentManagementModal isOpen={isTournamentModalOpen} onClose={() => setTournamentModalOpen(false)} />}
        </Modal>
    );
};


const TournamentManagementModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({isOpen, onClose}) => {
    const { tournaments, addTournament, deleteTournament } = useAppContext();
    const [name, setName] = useState('');
    const [weight, setWeight] = useState(1.0);

    const handleAdd = () => {
        if (name.trim()) {
            addTournament({ name: name.trim(), presenceWeight: weight });
            setName('');
            setWeight(1.0);
        }
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestisci Tornei">
             <div className="space-y-4">
                 <p className="text-sm text-aglianese-gray-300 bg-aglianese-gray-700 p-3 rounded-md">
                     Il peso presenza influisce sulle statistiche. Esempio: <br/>
                     Partita intera (es. 45') = <b>1</b> presenza <br/>
                     Partita breve (es. 15') = <b>0.33</b> presenze
                 </p>
                <div className="flex gap-2">
                    <input type="text" placeholder="Nome torneo" value={name} onChange={e => setName(e.target.value)} className="flex-grow bg-aglianese-gray-700 p-2 rounded"/>
                    <input type="number" step="0.01" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="w-24 bg-aglianese-gray-700 p-2 rounded text-center" />
                    <button onClick={handleAdd} className="p-2 bg-aglianese-green rounded"><Plus size={20}/></button>
                </div>
                 <div className="space-y-2">
                     {tournaments.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-aglianese-gray-700 p-2 rounded">
                            <span>{t.name} (Peso: {t.presenceWeight})</span>
                             <button onClick={() => deleteTournament(t.id)} className="p-1 text-red-400"><Trash2 size={16}/></button>
                        </div>
                     ))}
                 </div>
             </div>
        </Modal>
    )
}

export default MatchModal;