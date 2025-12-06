import React, { useState, useEffect } from 'react';
import { Users, Send, RotateCcw, Skull, Crown, Loader2 } from 'lucide-react';

const PERSONALITIES = [
  { id: 1, name: 'The Philosopher', trait: 'Deep thinker, questions everything', color: 'bg-purple-500', alive: true },
  { id: 2, name: 'The Pragmatist', trait: 'Practical, solution-oriented', color: 'bg-blue-500', alive: true },
  { id: 3, name: 'The Optimist', trait: 'Positive, sees the bright side', color: 'bg-yellow-500', alive: true },
  { id: 4, name: 'The Skeptic', trait: 'Doubtful, questions claims', color: 'bg-cyan-500', alive: true },
  { id: 5, name: 'The Empath', trait: 'Emotional, understanding', color: 'bg-pink-500', alive: true },
  { id: 6, name: 'The Rebel', trait: 'Contrarian, challenges norms', color: 'bg-orange-500', alive: true },
  { id: 7, name: 'The Analyst', trait: 'Data-driven, logical', color: 'bg-green-500', alive: true },
  { id: 8, name: 'The Visionary', trait: 'Future-focused, innovative', color: 'bg-indigo-500', alive: true }
];

export default function AIHungerGames() {
  const [personalities, setPersonalities] = useState(PERSONALITIES);
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState([]);
  const [votes, setVotes] = useState([]);
  const [stage, setStage] = useState('input');
  const [loading, setLoading] = useState(false);
  const [eliminated, setEliminated] = useState(null);
  const [tiePersonalities, setTiePersonalities] = useState([]);
  const [round, setRound] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(35);

  const alivePersonalities = personalities.filter(p => p.alive);

  // Timer effect - counts DOWN from 35
  useEffect(() => {
    let interval;
    if (loading && (stage === 'answering' || stage === 'voting')) {
      setElapsedTime(35);
      interval = setInterval(() => {
        setElapsedTime(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, stage]);

  const handleAskQuestion = async () => {
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setStage('answering');
    setResponses([]);
    setVotes([]);

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          personalities: alivePersonalities.map(p => ({
            id: p.id,
            name: p.name,
            trait: p.trait
          }))
        })
      });

      if (response.status === 429) {
      const errorData = await response.json();
      alert(`⏰ ${errorData.message}\n\nPlease wait before starting a new game.`);
      setLoading(false);
      setStage('input');
      return;
      }

      const data = await response.json();
      
      for (let i = 0; i < data.responses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setResponses(prev => [...prev, data.responses[i]]);
      }
      
      setLoading(false);
      setStage('answers');
    } catch (error) {
      console.error('Error:', error);
      alert(`Error connecting to server at ${import.meta.env.VITE_API_URL}`);
      setLoading(false);
      setStage('input');
    }
  };

  const startVoting = async () => {
    setStage('voting');
    setLoading(true);
    setVotes([]);
    setTiePersonalities([]);
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          responses: responses
        })
      });

      const data = await response.json();
      
      for (let i = 0; i < data.votes.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setVotes(prev => [...prev, data.votes[i]]);
      }
      
      setLoading(false);
      
      setTimeout(() => {
        const voteCounts = {};
        alivePersonalities.forEach(p => {
          voteCounts[p.id] = data.votes.filter(v => v.votedFor === p.id).length;
        });

        const maxVotes = Math.max(...Object.values(voteCounts));
        const losers = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes).map(Number);

        if (losers.length > 1) {
          setTiePersonalities(losers);
        } else {
          eliminatePersonality(losers[0]);
        }
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      setStage('answers');
    }
  };

  const eliminatePersonality = (id) => {
    const eliminatedPerson = personalities.find(p => p.id === id);
    setEliminated(eliminatedPerson);
    setPersonalities(prev => prev.map(p => 
      p.id === id ? { ...p, alive: false } : p
    ));
    setStage('eliminated');
    
    const remaining = personalities.filter(p => p.alive && p.id !== id);
    if (remaining.length === 1) {
      setTimeout(() => setStage('winner'), 2000);
    }
  };

  const handleTieBreak = (id) => {
    eliminatePersonality(id);
    setTiePersonalities([]);
  };

  const handleNextRound = () => {
    if (alivePersonalities.length === 1) return;
    setQuestion('');
    setResponses([]);
    setVotes([]);
    setEliminated(null);
    setStage('input');
    setRound(prev => prev + 1);
  };

  const restartGame = () => {
    setPersonalities(PERSONALITIES.map(p => ({ ...p, alive: true })));
    setQuestion('');
    setResponses([]);
    setVotes([]);
    setEliminated(null);
    setTiePersonalities([]);
    setStage('input');
    setRound(1);
    setElapsedTime(0);
  };

  const getVoteCount = (id) => {
    return votes.filter(v => v.votedFor === id).length;
  };

  return (
  <div className="min-h-screen bg-black text-white p-2 sm:p-4 relative overflow-hidden">
    {/* Dystopian Background Elements */}
    <div className="fixed inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`
      }}></div>
    </div>
    
    {/* Capitol Spotlight Effect */}
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-400 opacity-5 blur-[150px] rounded-full"></div>
    </div>

    <div className="max-w-7xl mx-auto relative z-10">
      {/* Header - Capitol Broadcast Style */}
      <div className="text-center mb-4 sm:mb-8 pb-4 sm:pb-6 border-b-2 sm:border-b-4 border-amber-600">
        <div className="mb-2 sm:mb-4 flex items-center justify-center gap-2">
          <div className="h-1 w-10 sm:w-20 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
          <Skull className="text-amber-600" size={24} />
          <div className="h-1 w-10 sm:w-20 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
        </div>
        
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-2 sm:mb-3 tracking-wider uppercase" style={{
          textShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)',
          background: 'linear-gradient(to bottom, #fff, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          The AI Hunger Games
        </h1>
        
        <div className="inline-block bg-gradient-to-r from-amber-900 to-yellow-900 px-4 sm:px-8 py-2 sm:py-3 border border-amber-600 sm:border-2 mb-2 sm:mb-4">
          <p className="text-amber-200 text-sm sm:text-xl font-bold tracking-widest uppercase">
            May the Best Algorithm Win
          </p>
        </div>
        
        <div className="mt-3 sm:mt-6 flex gap-2 sm:gap-6 justify-center items-center flex-wrap px-2">
          <div className="bg-gray-900 border border-amber-500 sm:border-2 px-3 sm:px-6 py-2 sm:py-3">
            <div className="text-amber-400 text-xs uppercase tracking-wider mb-1">Arena Round</div>
            <div className="text-xl sm:text-3xl font-black text-white">{round}</div>
          </div>
          
          <div className="bg-gray-900 border border-amber-600 sm:border-2 px-3 sm:px-6 py-2 sm:py-3">
            <div className="text-amber-400 text-xs uppercase tracking-wider mb-1">Tributes Remaining</div>
            <div className="text-xl sm:text-3xl font-black text-white">{alivePersonalities.length}<span className="text-sm sm:text-lg text-gray-500">/8</span></div>
          </div>
          
          <button
            onClick={restartGame}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-amber-600 hover:bg-amber-700 border border-amber-400 sm:border-2 font-bold uppercase tracking-wider transition transform hover:scale-105 text-xs sm:text-base"
          >
            <RotateCcw size={16} className="sm:w-5 sm:h-5" />
            Reset Arena
          </button>

          <a href="https://github.com/relacosm/ai_hunger-games"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-800 hover:bg-gray-900 border border-gray-600 sm:border-2 font-bold uppercase tracking-wider transition transform hover:scale-105 text-xs sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Arena - Tribute Pedestals */}
      <div className="mb-4 sm:mb-8 bg-gradient-to-b from-gray-900 to-black border-2 sm:border-4 border-gray-800 p-3 sm:p-8 relative">
        {/* Arena Title */}
        <div className="text-center mb-3 sm:mb-6">
          <div className="inline-block border-t border-b sm:border-t-2 sm:border-b-2 border-amber-500 px-4 sm:px-8 py-1 sm:py-2">
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-widest text-amber-400">The Arena</h2>
          </div>
        </div>
        
        {/* Tribute Pedestals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          {personalities.map((p) => (
            <div
              key={p.id}
              className={`relative transition-all ${p.alive ? 'hover:scale-105' : ''}`}
            >
              {/* Pedestal Platform */}
              <div className="flex flex-col items-center">
                {/* Status Indicator Ring */}
                {p.alive && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-20 sm:h-20 border-2 sm:border-4 border-green-500 rounded-full animate-pulse opacity-30"></div>
                )}
                
                {/* Tribute Figure */}
                <div className={`relative ${!p.alive ? 'opacity-30' : ''} scale-75 sm:scale-100`}>
                  {/* Head */}
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${p.color} rounded-full border-2 sm:border-4 ${p.alive ? 'border-amber-400' : 'border-gray-600'} shadow-2xl flex items-center justify-center relative ${!p.alive ? 'grayscale' : ''}`}>
                    {!p.alive && <Skull size={20} className="sm:w-8 sm:h-8 text-gray-400" />}
                    {p.alive && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full absolute -top-1 -right-1 animate-pulse"></div>}
                  </div>
                  
                  {/* Body with Arms */}
                  <div className="relative flex justify-center">
                    {/* Torso */}
                    <div className={`w-9 h-16 sm:w-12 sm:h-20 ${p.color} rounded-b-full mt-1 border-2 sm:border-4 ${p.alive ? 'border-amber-400' : 'border-gray-600'} shadow-2xl ${!p.alive ? 'grayscale' : ''}`} />
                    
                    {/* Arms at sides */}
                    <div className={`absolute top-2 -left-2 sm:-left-3 w-2 sm:w-3 h-10 sm:h-14 ${p.color} rounded-full ${!p.alive ? 'grayscale' : ''}`} />
                    <div className={`absolute top-2 -right-2 sm:-right-3 w-2 sm:w-3 h-10 sm:h-14 ${p.color} rounded-full ${!p.alive ? 'grayscale' : ''}`} />
                  </div>
                  
                  {/* Legs */}
                  <div className="flex gap-1.5 sm:gap-2 -mt-1 justify-center">
                    <div className={`w-3 h-12 sm:w-4 sm:h-16 ${p.color} rounded-b-full ${!p.alive ? 'grayscale' : ''}`} />
                    <div className={`w-3 h-12 sm:w-4 sm:h-16 ${p.color} rounded-b-full ${!p.alive ? 'grayscale' : ''}`} />
                  </div>
                </div>
                
                {/* Pedestal Base */}
                <div className="w-full">
                  {/* Pedestal Block */}
                  <div className={`mt-2 bg-gradient-to-b from-gray-800 to-gray-900 border ${p.alive ? 'border-amber-500' : 'border-gray-700'} sm:border-2 relative`}>
                    {/* District Number */}
                    <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-black border border-amber-500 sm:border-2 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-black text-amber-400">
                      T {p.id}
                    </div>
                    
                    <div className="px-2 sm:px-3 py-3 sm:py-4">
                      <h3 className={`font-black text-xs sm:text-sm text-center uppercase tracking-wider ${p.alive ? 'text-amber-400' : 'text-gray-500'}`}>
                        {p.name}
                      </h3>
                      <p className="text-xs text-center text-gray-400 mt-1 hidden sm:block">{p.trait}</p>
                      
                      {votes.length > 0 && p.alive && (
                        <div className="mt-2 bg-amber-900 border border-amber-600 py-1 text-center">
                          <span className="text-xs font-bold text-amber-300">
                            ⚔️ {getVoteCount(p.id)} VOTES
                          </span>
                        </div>
                      )}
                      
                      {!p.alive && (
                        <div className="mt-2 bg-black border border-amber-600 sm:border-2 py-1 text-center">
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                            ☠ Eliminated
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Pedestal Lines */}
                    <div className="h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner Screen - Capitol Victory Ceremony */}
      {stage === 'winner' && alivePersonalities.length === 1 && (
        <div className="relative bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-700 border-2 sm:border-4 border-amber-300 p-6 sm:p-12 mb-4 sm:mb-8 overflow-hidden">
          {/* Confetti Effect */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute animate-pulse" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '4px',
                height: '4px',
                background: '#fff',
                transform: `rotate(${Math.random() * 360}deg)`
              }}></div>
            ))}
          </div>
          
          <div className="text-center relative z-10">
            <Crown size={64} className="sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 text-amber-200 drop-shadow-2xl animate-pulse" />
            <div className="mb-3 sm:mb-4">
              <div className="inline-block border-2 sm:border-4 border-amber-200 bg-black px-4 sm:px-8 py-1 sm:py-2">
                <h2 className="text-3xl sm:text-5xl font-black text-amber-300 uppercase tracking-widest">Victor</h2>
              </div>
            </div>
            <h3 className="text-4xl sm:text-6xl font-black mb-3 sm:mb-4 text-white uppercase tracking-wide" style={{
              textShadow: '4px 4px 0 rgba(0,0,0,0.5)'
            }}>
              {alivePersonalities[0].name}
            </h3>
            <div className="bg-black bg-opacity-50 inline-block px-4 sm:px-8 py-2 sm:py-3 border border-amber-300 sm:border-2">
              <p className="text-lg sm:text-2xl text-amber-100 font-bold">{alivePersonalities[0].trait}</p>
            </div>
            <div className="mt-4 sm:mt-8 text-amber-50 text-base sm:text-xl font-bold uppercase tracking-wider">
              🏆 Sole Survivor of the Arena 🏆
            </div>
          </div>
        </div>
      )}

      {/* Input Stage - Gamemaker Control Panel */}
      {stage === 'input' && alivePersonalities.length > 1 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 sm:border-4 border-amber-900 p-4 sm:p-8 mb-4 sm:mb-8 relative overflow-hidden">
          {/* Control Panel Header */}
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600"></div>
          
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-amber-400">Gamemaker Control</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-600 to-transparent"></div>
          </div>
          
          <p className="text-gray-400 mb-4 sm:mb-6 uppercase tracking-wide text-xs sm:text-sm">
            Deploy Arena Challenge • Tributes Must Respond
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Enter situation or question..."
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-black border border-amber-900 sm:border-2 focus:border-amber-600 text-white placeholder-gray-600 text-sm sm:text-base font-mono focus:outline-none transition"
            />
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || loading}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 disabled:from-gray-700 disabled:to-gray-800 border border-amber-400 sm:border-2 disabled:border-gray-700 font-black uppercase tracking-wider transition transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <Send size={20} />
              Deploy
            </button>
          </div>
        </div>
      )}

      {/* Answering Stage */}
      {stage === 'answering' && (
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 sm:border-4 border-amber-900 p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="border-l-2 sm:border-l-4 border-amber-600 pl-3 sm:pl-4 mb-4 sm:mb-6">
            <div className="text-xs uppercase tracking-widest text-amber-600 mb-1 sm:mb-2">Arena Challenge</div>
            <h2 className="text-xl sm:text-3xl font-bold text-amber-400">{question}</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {responses.map((r, i) => {
              const personality = personalities.find(p => p.id === r.id);
              return (
                <div key={i} className={`${personality.color} bg-opacity-10 border-l-2 sm:border-l-4 ${personality.color.replace('bg-', 'border-')} p-4 sm:p-6 animate-fadeIn relative`}>
                  <div className="absolute top-2 right-2 bg-black px-2 py-1 text-xs font-black text-amber-400 border border-amber-600">
                    TRIBUTE {personality.id}
                  </div>
                  <h3 className="font-black text-base sm:text-lg mb-2 sm:mb-3 uppercase tracking-wide text-white">{personality.name}</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed pr-20 sm:pr-0">{r.answer}</p>
                </div>
              );
            })}
            {responses.length < alivePersonalities.length && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-600 bg-amber-900 bg-opacity-20 p-4 sm:p-6 border border-amber-900">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="font-bold uppercase tracking-wide text-sm sm:text-base">Receiving Transmissions... ({responses.length}/{alivePersonalities.length})</span>
                </div>
                {loading && (
                  <div className="bg-black border border-amber-500 sm:border-2 px-3 sm:px-4 py-1.5 sm:py-2">
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{elapsedTime}s</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answers Review Stage */}
      {stage === 'answers' && (
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 sm:border-4 border-amber-900 p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="border-l-2 sm:border-l-4 border-amber-600 pl-3 sm:pl-4 mb-4 sm:mb-6">
            <div className="text-xs uppercase tracking-widest text-amber-600 mb-1 sm:mb-2">Arena Challenge</div>
            <h2 className="text-xl sm:text-3xl font-bold text-amber-400">{question}</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {responses.map((r, i) => {
              const personality = personalities.find(p => p.id === r.id);
              return (
                <div key={i} className={`${personality.color} bg-opacity-10 border-l-2 sm:border-l-4 ${personality.color.replace('bg-', 'border-')} p-4 sm:p-6 relative`}>
                  <div className="absolute top-2 right-2 bg-black px-2 py-1 text-xs font-black text-amber-400 border border-amber-600">
                    TRIBUTE {personality.id}
                  </div>
                  <h3 className="font-black text-base sm:text-lg mb-2 sm:mb-3 uppercase tracking-wide text-white">{personality.name}</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed pr-20 sm:pr-0">{r.answer}</p>
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <div className="mb-3 sm:mb-4">
              <div className="inline-block border-t border-b sm:border-t-2 sm:border-b-2 border-amber-600 px-4 sm:px-8 py-1 sm:py-2">
                <p className="text-amber-400 uppercase tracking-widest font-black text-sm sm:text-base">Commence Elimination Vote</p>
              </div>
            </div>
            <button
              onClick={startVoting}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-black border-2 sm:border-4 border-amber-500 text-lg sm:text-2xl font-black uppercase tracking-wider transition transform hover:scale-110 shadow-2xl"
            >
              ⚡ Begin Voting ⚡
            </button>
          </div>
        </div>
      )}

      {/* Voting Stage */}
      {stage === 'voting' && (
        <div className="bg-gradient-to-br from-amber-950 to-black border-2 sm:border-4 border-amber-700 p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-block border-2 sm:border-4 border-amber-600 bg-black px-4 sm:px-8 py-2 sm:py-3">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-amber-400">Elimination Votes</h2>
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {votes.map((v, i) => {
              const voter = personalities.find(p => p.id === v.voter);
              const votedFor = personalities.find(p => p.id === v.votedFor);
              return (
                <div key={i} className="bg-black border border-amber-900 sm:border-2 p-4 sm:p-6 animate-slideIn relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-gradient-to-b from-amber-600 to-amber-900"></div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-base sm:text-xl font-bold mb-2 flex flex-wrap items-center gap-2">
                      <span className={`${voter.color.replace('bg-', 'text-')} font-black uppercase text-sm sm:text-base`}>{voter.name}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-amber-400 font-black uppercase text-sm sm:text-base">ELIMINATE {votedFor.name}</span>
                    </p>
                    <div className="bg-gray-900 border-l border-amber-800 sm:border-l-2 pl-3 sm:pl-4 py-2 mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm text-gray-400 italic">"{v.reason}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {loading && votes.length < alivePersonalities.length && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-400 bg-amber-950 bg-opacity-50 p-4 sm:p-6 border border-amber-900 sm:border-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Loader2 className="animate-spin" size={28} />
                  <span className="font-black uppercase tracking-wide text-base sm:text-lg">Counting Votes... ({votes.length}/{alivePersonalities.length})</span>
                </div>
                <div className="bg-black border border-amber-500 sm:border-2 px-3 sm:px-4 py-1.5 sm:py-2">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{elapsedTime}s</span>
                </div>
              </div>
            )}
          </div>

          {/* Tie Breaker */}
          {!loading && tiePersonalities.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-br from-yellow-900 to-amber-900 border-2 sm:border-4 border-amber-500 p-4 sm:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-2xl sm:text-4xl font-black mb-2 sm:mb-3 uppercase tracking-wider text-amber-300">⚔️ Tied Vote ⚔️</h3>
                <p className="text-amber-100 text-base sm:text-lg uppercase tracking-wide">You Must Break The Tie</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {tiePersonalities.map(id => {
                  const p = personalities.find(pers => pers.id === id);
                  const voteCount = votes.filter(v => v.votedFor === id).length;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTieBreak(id)}
                      className={`${p.color} border-2 sm:border-4 border-amber-300 p-6 sm:p-8 transition transform hover:scale-105 hover:border-amber-500 relative`}
                    >
                      <div className="absolute top-2 right-2 bg-black px-2 sm:px-3 py-1 border border-amber-400 sm:border-2">
                        <span className="text-xs font-black text-amber-400">TRIBUTE {p.id}</span>
                      </div>
                      <h3 className="font-black text-xl sm:text-2xl mb-2 sm:mb-3 uppercase tracking-wide">{p.name}</h3>
                      <p className="text-sm mb-3 sm:mb-4 opacity-90">{p.trait}</p>
                      <div className="bg-black bg-opacity-50 py-2 border-t-2 border-white">
                        <p className="text-base sm:text-lg font-black uppercase">Votes: {voteCount}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reveal Elimination Button */}
          {!loading && tiePersonalities.length === 0 && votes.length === alivePersonalities.length && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={() => {
                  const voteCounts = {};
                  alivePersonalities.forEach(p => {
                    voteCounts[p.id] = votes.filter(v => v.votedFor === p.id).length;
                  });
                  const maxVotes = Math.max(...Object.values(voteCounts));
                  const loser = Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes);
                  eliminatePersonality(Number(loser));
                }}
                className="px-10 sm:px-16 py-4 sm:py-6 bg-gradient-to-r from-black to-amber-900 hover:from-amber-900 hover:to-black border-2 sm:border-4 border-amber-500 text-xl sm:text-3xl font-black uppercase tracking-widest transition transform hover:scale-110 shadow-2xl"
              >
                💀 Reveal Elimination 💀
              </button>
            </div>
          )}
        </div>
      )}

      {/* Elimination Screen */}
      {stage === 'eliminated' && eliminated && (
        <div className="relative bg-gradient-to-b from-amber-900 via-black to-black border-2 sm:border-4 border-amber-600 p-6 sm:p-12 mb-4 sm:mb-8 overflow-hidden">
          {/* Dramatic Effect */}
          <div className="absolute inset-0 bg-amber-600 opacity-10 animate-pulse"></div>
          
          <div className="text-center relative z-10">
            <Skull size={80} className="sm:w-30 sm:h-30 mx-auto mb-4 sm:mb-6 text-amber-500 animate-pulse" />
            
            <div className="mb-3 sm:mb-4">
              <div className="inline-block border-2 sm:border-4 border-amber-600 bg-black px-6 sm:px-12 py-2 sm:py-3">
                <h2 className="text-3xl sm:text-5xl font-black text-amber-500 uppercase tracking-widest">Eliminated</h2>
              </div>
            </div>
            
            <div className="bg-black border-2 sm:border-4 border-amber-800 inline-block px-6 sm:px-12 py-4 sm:py-6 mb-4 sm:mb-6">
              <h3 className="text -3xl sm:text-5xl font-black mb-3 sm:mb-4 text-white uppercase tracking-wide">{eliminated.name}</h3>
              <p className="text-lg sm:text-xl text-gray-400 mb-2">{eliminated.trait}</p>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-900 sm:border-t-2">
                <p className="text-amber-400 uppercase tracking-widest font-bold text-sm sm:text-base">Tribute {eliminated.id} - Fallen</p>
              </div>
            </div>
            
            {alivePersonalities.length > 0 && (
              <button
                onClick={handleNextRound}
                className="mt-4 sm:mt-6 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 border-2 sm:border-4 border-amber-500 text-amber-400 font-black text-lg sm:text-xl uppercase tracking-widest transition transform hover:scale-105"
              >
                Continue to Next Round →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}