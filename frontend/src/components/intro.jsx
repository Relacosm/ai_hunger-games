import { useState, useEffect } from 'react';

export default function IntroAnimation({ onComplete }) {
  const [animationState, setAnimationState] = useState('initial');
  const [revealStates, setRevealStates] = useState([]);
  const [glowEffect, setGlowEffect] = useState(false);

  const letters = "RELACOSM".split("");

  useEffect(() => {
    setRevealStates(new Array(letters.length).fill('initial'));

    const sequenceTimer = setTimeout(() => {
      setAnimationState('reveal');
      
      // Reveal letters with staggered animation
      letters.forEach((_, index) => {
        setTimeout(() => {
          setRevealStates(prev => {
            const newStates = [...prev];
            newStates[index] = 'revealing';
            return newStates;
          });
        }, index * 100);
        
        setTimeout(() => {
          setRevealStates(prev => {
            const newStates = [...prev];
            newStates[index] = 'revealed';
            return newStates;
          });
        }, index * 100 + 200);
      });

      // Add glow effect after all letters are revealed
      const glowTimer = setTimeout(() => {
        setGlowEffect(true);
      }, letters.length * 100 + 400);

      // Start fade-out process
      const revealDuration = letters.length * 100 + 800;
      const fadeOutTimer = setTimeout(() => {
        setAnimationState('fadeOut');
        
        const completeTimer = setTimeout(() => {
          setAnimationState('complete');
          if (onComplete) onComplete();
        }, 200);
        
        return () => clearTimeout(completeTimer);
      }, revealDuration + 1200);
      
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(fadeOutTimer);
      };
    }, 400);

    return () => clearTimeout(sequenceTimer);
  }, []);

  const getLetterClasses = (state, index) => {
    const baseClasses = 'inline-block text-6xl md:text-8xl font-bold transition-all duration-700 ease-out transform-gpu';
    
    switch (state) {
      case 'revealing':
        return `${baseClasses} opacity-60 translate-y-2 scale-95 text-slate-300`;
      case 'revealed':
        return `${baseClasses} opacity-100 translate-y-0 scale-100 ${
          glowEffect 
            ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
            : 'text-slate-100'
        }`;
      case 'initial':
      default:
        return `${baseClasses} opacity-0 translate-y-8 scale-90 text-slate-400`;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'fixed inset-0 flex items-center justify-center z-[100] transition-all duration-200 ease-in-out';
    
    switch (animationState) {
      case 'fadeOut':
        return `${baseClasses} bg-neutral-950 opacity-0 scale-105`;
      case 'complete':
        return `${baseClasses} bg-neutral-950 opacity-0 scale-110 pointer-events-none`;
      default:
        return `${baseClasses} bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 opacity-100 scale-100`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-slate-400 rounded-full transition-all duration-2000 ${
              animationState === 'reveal' ? 'opacity-20 animate-pulse' : 'opacity-0'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main text container */}
      <div className="relative flex justify-center items-center">
        {/* Subtle background glow */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent blur-xl transition-opacity duration-1000 ${
            glowEffect ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Letters */}
        <div className="relative flex">
          {letters.map((letter, index) => (
            <span
              key={index}
              className={getLetterClasses(revealStates[index], index)}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
        
        {/* Animated underline */}
        <div
          className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent transition-all duration-1500 ease-out ${
            animationState === 'reveal' ? 'w-full opacity-80' : 'w-0 opacity-0'
          }`}
        />
        
        {/* Corner accents */}
        <div 
          className={`absolute -top-8 -left-8 w-16 h-16 border-l-2 border-t-2 border-slate-600 transition-all duration-1000 ${
            glowEffect ? 'opacity-40 scale-110' : 'opacity-0 scale-90'
          }`}
        />
        <div 
          className={`absolute -bottom-8 -right-8 w-16 h-16 border-r-2 border-b-2 border-slate-600 transition-all duration-1000 ${
            glowEffect ? 'opacity-40 scale-110' : 'opacity-0 scale-90'
          }`}
        />
      </div>
    </div>
  );
}