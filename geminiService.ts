import { GoogleGenAI, Type } from "@google/genai";
import { Match, Player, Coach, Tournament, Insight, ParsedMatchFromText } from "../types";

// FIX: The API key must be obtained from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoachInsight = async (
  matches: Match[],
  players: Player[],
  coaches: Coach[],
  tournaments: Tournament[]
): Promise<Insight[] | null> => {
  if (matches.length < 3) {
    return null;
  }

  const getPlayerName = (playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}`.trim() : 'Sconosciuto';
  };
  
  const getScorersString = (match: Match): string => {
      if (match.scorers.length === 0) return "Nessuno";
      return match.scorers.map(s => {
          if (s.isOwnGoal) {
              return `Autogol (${s.goals})`;
          }
          return `${getPlayerName(s.playerId!)} (${s.goals})`;
      }).join(', ');
  }

  // Basic overall stats
  let wins = 0, draws = 0, losses = 0;
  matches.forEach(match => {
    if (match.result.home > match.result.away) wins++;
    else if (match.result.home < match.result.away) losses++;
    else draws++;
  });

  // Top scorers
  const scorerData: { [playerId: string]: number } = {};
  matches.forEach(m => {
      m.scorers.forEach(s => {
          if (!s.isOwnGoal && s.playerId) {
            scorerData[s.playerId] = (scorerData[s.playerId] || 0) + s.goals;
          }
      });
  });
  const topScorers = Object.entries(scorerData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([playerId, goals]) => `${getPlayerName(playerId)}: ${goals} gol`)
      .join('; ');

  const dataSummary = `
    - Risultati totali: ${wins} vittorie, ${draws} pareggi, ${losses} sconfitte.
    - Marcatori principali: ${topScorers || 'N/A'}.
    - Elenco partite dettagliate (massimo 10 recenti):
${matches.slice(0, 10).map(m => `  - Partita del ${new Date(m.date).toLocaleDateString('it-IT')} vs ${m.opponent} (Torneo: ${tournaments.find(t=>t.id===m.tournamentId)?.name || 'N/A'}), Risultato: ${m.result.home}-${m.result.away}. Marcatori: ${getScorersString(m)}. Mister: ${m.coachIds.map(id => coaches.find(c=>c.id===id)?.name).join(', ')}. Presenti: ${m.attendees.length} giocatori.`).join('\n')}
  `;

  const prompt = `
    Sei un commentatore sportivo carismatico, divertente e un po' pazzo, come se fossi il 'Fabio Caressa' del calcio giovanile. Il tuo compito è trovare spunti sorprendenti e vivaci analizzando i dati delle partite.
    Evita commenti banali. Sii creativo e usa un tono entusiasta!

    Trova ALMENO 3 statistiche o pattern curiosi e alternativi basati sui dati forniti.

    Ecco alcuni esempi del tipo di spunto che cerchiamo:
    - "INARRESTABILI! Contro la 'Virtus', è la terza vittoria di fila. Praticamente il nostro amuleto portafortuna!"
    - "Mister Rossi in panchina è una garanzia: con lui la difesa è un muro invalicabile, mai subito gol nel primo tempo!"
    - "Quando Bianchi vede una maglia blu, si trasforma in un bomber implacabile: ha segnato il 75% dei suoi gol contro squadre con quei colori!"
    - "L'assenza di Verdi si fa sentire: tutte le sconfitte sono arrivate quando lui non era in campo. Urge un clone!"

    Analizza i seguenti dati, che rappresentano le partite giocate:
    ${dataSummary}

    Ora, basandoti ESCLUSIVAMENTE sui dati forniti, estrai ALMENO 3 spunti interessanti e divertenti. Devono essere statistiche verificabili dai dati.
    Sii specifico. Ad esempio, invece di "Rossi segna molto", scrivi "Rossi ha timbrato il cartellino in 3 delle ultime 4 partite, che macchina!".
    Fornisci la tua analisi nel formato JSON specificato: un array di oggetti. Ogni oggetto deve avere un "title" accattivante (massimo 5-6 parole), una "description" concisa e vivace (massimo 2 frasi), e una "emoji" appropriata.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              emoji: { type: Type.STRING },
            },
            required: ["title", "description", "emoji"],
          },
        },
      },
    });

    const jsonText = response.text;
    const insights: Insight[] = JSON.parse(jsonText);
    return insights;
  } catch (error) {
    console.error("Error generating AI insight:", error);
    return [{
        title: "Errore AI",
        description: "Impossibile generare l'analisi in questo momento.",
        emoji: "🤖"
    }];
  }
};


export const generateMatchReport = async (
  match: Match,
  allMatches: Match[],
  players: Player[]
): Promise<{ title: string; content: string }> => {
  const getPlayerName = (playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}`.trim() : 'Sconosciuto';
  };
  
  const getScorersString = (scorers: Match['scorers']): string => {
      if (scorers.length === 0) return "Nessuno";
      return scorers.map(s => {
          if (s.isOwnGoal) return `Autogol (${s.goals})`;
          return `${getPlayerName(s.playerId!)} (${s.goals})`;
      }).join(', ');
  }

  const historyMatches = allMatches.filter(m => new Date(m.date) < new Date(match.date));
  
  const playerMilestones = match.attendees.map(attendee => {
    const player = players.find(p => p.id === attendee.playerId);
    if (!player) return null;

    const previousAppearances = historyMatches.filter(m => m.attendees.some(a => a.playerId === attendee.playerId)).length;
    const totalAppearances = previousAppearances + 1;
    
    const previousGoals = historyMatches.reduce((sum, m) => sum + (m.scorers.find(s => !s.isOwnGoal && s.playerId === attendee.playerId)?.goals || 0), 0);
    const goalsInThisMatch = match.scorers.find(s => !s.isOwnGoal && s.playerId === attendee.playerId)?.goals || 0;
    const totalGoals = previousGoals + goalsInThisMatch;

    const milestones = [];
    if (previousAppearances === 0) milestones.push("Debutto");
    if (previousGoals === 0 && goalsInThisMatch > 0) milestones.push("Primo gol in carriera");
    if (goalsInThisMatch === 2) milestones.push("Doppietta");
    if (goalsInThisMatch >= 3) milestones.push("Tripletta");
    if ([10, 25, 50, 75, 100].includes(totalAppearances)) milestones.push(`${totalAppearances}ª presenza`);
    if (totalGoals >= 10 && previousGoals < 10) milestones.push(`Raggiunti 10 gol in carriera`);
    if (totalGoals >= 25 && previousGoals < 25) milestones.push(`Raggiunti 25 gol in carriera`);
    if (totalGoals >= 50 && previousGoals < 50) milestones.push(`Raggiunti 50 gol in carriera`);


    return {
      name: getPlayerName(attendee.playerId),
      milestones: milestones.length > 0 ? milestones.join(', ') : 'Nessuno',
    };
  }).filter(p => p && p.milestones !== 'Nessuno');

  const dataSummary = `
  Dettagli partita:
  - Data: ${new Date(match.date).toLocaleDateString('it-IT')}
  - Avversario: ${match.opponent}
  - Risultato: ${match.result.home}-${match.result.away}
  - Marcatori: ${getScorersString(match.scorers)}
  
  Traguardi e eventi notevoli in questa partita:
  ${playerMilestones.map(p => `- ${p.name}: ${p.milestones}`).join('\n')}
  `;

  const prompt = `
    Sei un cronista sportivo entusiasta che commenta una partita di calcio giovanile. Il tuo tono è positivo e celebrativo.
    Basandoti sui dati della partita e sui traguardi raggiunti, scrivi un breve riassunto (2-3 frasi).
    
    Concentrati su 1 o 2 eventi più significativi. Esempi: un debutto speciale, il primo gol di un giocatore, una tripletta, o il raggiungimento di un traguardo come la 10ª presenza.
    Se la partita è stata vinta in modo convincente o con una rimonta, menzionalo brevemente.
    
    Dati da analizzare:
    ${dataSummary}
    
    Fornisci la tua analisi in formato JSON. Il "title" deve essere un titolo da giornale, breve e d'impatto (massimo 7 parole). Il "content" deve essere il paragrafo di riassunto. La lingua deve essere l'italiano. Non aggiungere nient'altro al di fuori del JSON.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "content"],
        },
      },
    });

    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating match report:", error);
    return {
        title: "Errore AI",
        content: "Impossibile generare il riassunto per questa partita."
    };
  }
};


export const parseMatchText = async (
  rawText: string,
  players: Player[],
  tournaments: Tournament[],
  coaches: Coach[]
): Promise<ParsedMatchFromText[] | null> => {
    const playerLastNames = players.map(p => p.lastName).join(', ');
    const tournamentNames = tournaments.map(t => t.name).join(', ');
    const coachNames = coaches.map(c => c.name).join(', ');

    const prompt = `Sei un assistente AI specializzato nell'estrazione di dati da testi non strutturati riguardanti partite di calcio. Il tuo compito è analizzare il testo fornito, che può contenere una o più partite separate da '---'.

Per OGNI partita trovata, estrai le seguenti informazioni e formattale in un oggetto JSON.

**Struttura del testo di input per ogni partita:**
Il testo per ogni partita segue generalmente questo formato (le etichette possono variare leggermente):
- **Data**: La data della partita (es. Data: 15 settembre 2025 o 15/09/25).
- **Torneo**: Il nome del torneo (es. Torneo: Amichevole). Il nome deve essere uno dei seguenti: ${tournamentNames}.
- **Risultato**: Una linea con la squadra di casa (sempre 'Aglianese'), i gol, e l'avversario (es. Aglianese 5 – 2 Pistoiese).
- **Mister**: Il nome dell'allenatore (es. Mister: Rossi). Il nome deve essere uno dei seguenti: ${coachNames}.
- **Presenti**: Un elenco di cognomi dei giocatori presenti (es. Presenti: Lenzi, Magni, Pasticci). I cognomi devono essere tra questi: ${playerLastNames}.
- **Marcatori**: Un elenco di cognomi e gol segnati (es. Marcatori: Giusti (2), Autogol (1)). "Autogol" è un marcatore valido.

**Istruzioni importanti:**
1.  **Analisi per partita**: Analizza ogni blocco di testo separato da '---' come una partita distinta.
2.  **Estrazione precisa**: Estrai solo i dati che trovi. Se un'informazione (es. mister) manca, ometti la chiave corrispondente nel JSON.
3.  **Gestione Autogol**: Se trovi "Autogol" tra i marcatori, crea un oggetto marcatore con isOwnGoal: true e il numero di gol, ma senza lastName.
4.  **Errori**: Se non riesci a estrarre informazioni sufficienti per una partita (es. manca il risultato o l'avversario), non includerla nell'output. Se l'intero testo è incomprensibile, restituisci un array vuoto [].
5.  **Output**: Restituisci SEMPRE un array JSON di oggetti, anche se trovi una sola partita.

**Testo da analizzare:**
"""
${rawText}
"""

Fornisci il risultato come un array di oggetti JSON. Non includere alcuna spiegazione o testo aggiuntivo, solo l'array JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            date: { type: Type.STRING, description: "Data della partita in formato ISO (es. 2025-09-15)." },
                            tournamentName: { type: Type.STRING },
                            opponentName: { type: Type.STRING },
                            homeScore: { type: Type.INTEGER },
                            awayScore: { type: Type.INTEGER },
                            attendees: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di cognomi dei giocatori presenti." },
                            scorers: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        lastName: { type: Type.STRING },
                                        goals: { type: Type.INTEGER },
                                        isOwnGoal: { type: Type.BOOLEAN, description: "Vero se è un autogol." },
                                    },
                                    required: ["goals"]
                                },
                                description: "Array di oggetti marcatore con cognome e gol."
                            },
                            coachNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di nomi dei mister presenti." },
                            parseErrors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Eventuali errori di parsing specifici della partita." }
                        }
                    }
                }
            }
        });
        const jsonText = response.text;
        const parsedMatches: ParsedMatchFromText[] = JSON.parse(jsonText);
        return parsedMatches;
    } catch (error) {
        console.error("Error parsing match text with AI:", error);
        return null;
    }
};