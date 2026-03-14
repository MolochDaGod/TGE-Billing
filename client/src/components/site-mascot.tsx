import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type MascotState = 'idle' | 'walking' | 'waving' | 'thinking' | 'celebrating' | 'sleeping' | 'working' | 'looking';
type Direction = 'left' | 'right';

const EMOTES = [
  { emoji: '⚡', label: 'zap' },
  { emoji: '💡', label: 'idea' },
  { emoji: '🔧', label: 'working' },
  { emoji: '☠️', label: 'pirate' },
  { emoji: '💰', label: 'treasure' },
  { emoji: '🏴‍☠️', label: 'flag' },
  { emoji: '💛', label: 'love' },
  { emoji: '✨', label: 'sparkle' },
];

const PHRASES = [
  "Arrr, let's wire this up!",
  "Shiver me circuits!",
  "X marks the breaker box!",
  "Yo ho ho and a spool of wire!",
  "Safety first, matey!",
  "All hands on deck!",
  "Treasure awaits!",
  "Ahoy there!",
  "*happy electrician noises*",
  "Bzzt bzzt!",
];

export function SiteMascot() {
  // Start position based on screen width to ensure visibility
  const getInitialX = () => Math.max(100, Math.min(window.innerWidth - 150, window.innerWidth / 2));
  
  const [position, setPosition] = useState({ x: getInitialX(), y: 0 });
  const [targetX, setTargetX] = useState(getInitialX());
  const [state, setState] = useState<MascotState>('walking');
  const [direction, setDirection] = useState<Direction>('right');
  const [showEmote, setShowEmote] = useState(false);
  const [currentEmote, setCurrentEmote] = useState(EMOTES[0]);
  const [showSpeech, setShowSpeech] = useState(true);
  const [currentPhrase, setCurrentPhrase] = useState("Ahoy there!");
  const [walkFrame, setWalkFrame] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Hide initial speech bubble after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSpeech(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Walking animation - smooth movement toward target
  useEffect(() => {
    if (isMinimized) return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setPosition(prev => {
        const diff = targetX - prev.x;
        const speed = 80; // pixels per second
        
        if (Math.abs(diff) < 2) {
          if (state === 'walking') {
            setState('idle');
          }
          return prev;
        }

        const movement = Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime);
        return { ...prev, x: prev.x + movement };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetX, isMinimized, state]);

  // Walk frame animation
  useEffect(() => {
    if (state !== 'walking') return;
    
    const interval = setInterval(() => {
      setWalkFrame(f => (f + 1) % 4);
    }, 150);
    
    return () => clearInterval(interval);
  }, [state]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() < 0.3 && state !== 'sleeping') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2000);
    
    return () => clearInterval(blinkInterval);
  }, [state]);

  // Random movement and actions - more frequent walking
  useEffect(() => {
    if (isMinimized) return;
    
    const actionInterval = setInterval(() => {
      const action = Math.random();
      
      if (action < 0.5) {
        // Walk somewhere - 50% chance, more walking!
        const screenWidth = window.innerWidth;
        const minX = 50;
        const maxX = screenWidth - 120;
        const newX = minX + Math.random() * (maxX - minX);
        
        setDirection(newX > position.x ? 'right' : 'left');
        setState('walking');
        setTargetX(newX);
      } else if (action < 0.6) {
        // Show emote
        const randomEmote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
        setCurrentEmote(randomEmote);
        setShowEmote(true);
        setTimeout(() => setShowEmote(false), 2000);
      } else if (action < 0.7) {
        // Say something
        const randomPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
        setCurrentPhrase(randomPhrase);
        setShowSpeech(true);
        setTimeout(() => setShowSpeech(false), 3000);
      } else if (action < 0.75) {
        // Celebrate
        setState('celebrating');
        setTimeout(() => setState('idle'), 2000);
      } else if (action < 0.8) {
        // Wave
        setState('waving');
        setTimeout(() => setState('idle'), 1500);
      } else if (action < 0.85) {
        // Think
        setState('thinking');
        setTimeout(() => setState('idle'), 2000);
      } else if (action < 0.9) {
        // Work
        setState('working');
        setTimeout(() => setState('idle'), 2500);
      } else if (action < 0.95) {
        // Look around
        setState('looking');
        setTimeout(() => setState('idle'), 1500);
      }
    }, 3000); // More frequent actions

    return () => clearInterval(actionInterval);
  }, [position.x, isMinimized]);

  // Handle click interaction
  const handleClick = useCallback(() => {
    const reactions = ['waving', 'celebrating', 'thinking'] as MascotState[];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    setState(randomReaction);
    
    const randomPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setCurrentPhrase(randomPhrase);
    setShowSpeech(true);
    
    setTimeout(() => {
      setState('idle');
      setShowSpeech(false);
    }, 2000);
  }, []);

  // Leg positions for walk cycle
  const getLeftLegY = () => {
    if (state !== 'walking') return 0;
    const cycle = [0, -3, 0, 3];
    return cycle[walkFrame];
  };
  
  const getRightLegY = () => {
    if (state !== 'walking') return 0;
    const cycle = [0, 3, 0, -3];
    return cycle[walkFrame];
  };

  // Body bob for different states
  const getBodyAnimation = () => {
    switch (state) {
      case 'walking':
        return {
          y: walkFrame % 2 === 0 ? -2 : 0,
        };
      case 'celebrating':
        return {
          y: [0, -12, 0],
          rotate: [-5, 5, -5],
          transition: { duration: 0.3, repeat: Infinity }
        };
      case 'waving':
        return {
          rotate: [-3, 3, -3],
          transition: { duration: 0.4, repeat: Infinity }
        };
      case 'thinking':
        return {
          y: [0, -3, 0],
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'sleeping':
        return {
          y: [0, 2, 0],
          transition: { duration: 2, repeat: Infinity }
        };
      case 'working':
        return {
          rotate: [-2, 2, -2],
          transition: { duration: 0.15, repeat: Infinity }
        };
      case 'looking':
        return {
          y: [0, -2, 0],
          transition: { duration: 0.8, repeat: Infinity }
        };
      default:
        return {
          y: [0, -3, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
        };
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 cursor-pointer pointer-events-auto"
        style={{ zIndex: 99999 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg border-2 border-primary/50 relative">
          <span className="text-3xl">⚡</span>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed cursor-pointer select-none pointer-events-auto"
      style={{ 
        zIndex: 99999,
        left: position.x, 
        bottom: 20,
        transform: `scaleX(${direction === 'left' ? -1 : 1})`,
      }}
      onClick={handleClick}
      data-testid="site-mascot"
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showSpeech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-20 left-1/2 whitespace-nowrap"
            style={{ transform: `scaleX(${direction === 'left' ? -1 : 1}) translateX(-50%)` }}
          >
            <div className="glass-card text-foreground px-4 py-2 rounded-2xl shadow-lg text-sm font-medium">
              {currentPhrase}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 glass-card rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emote bubble */}
      <AnimatePresence>
        {showEmote && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: [1, 1.2, 1], 
              y: -30,
            }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg"
          >
            {currentEmote.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot character - Bigger and cuter! */}
      <motion.div
        className="relative"
        animate={getBodyAnimation()}
      >
        {/* Glow effect under character */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-primary/20 rounded-full blur-lg" />
        
        {/* Pirate Hat */}
        <motion.div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
          animate={state === 'celebrating' ? { rotate: [-15, 15, -15], y: [0, -5, 0] } : {}}
          transition={{ duration: 0.3, repeat: state === 'celebrating' ? Infinity : 0 }}
        >
          <svg width="50" height="30" viewBox="0 0 50 30">
            {/* Hat base */}
            <ellipse cx="25" cy="26" rx="22" ry="5" fill="#1a1a1a" />
            {/* Hat top */}
            <path d="M8 24 L14 5 L36 5 L42 24 Z" fill="#1a1a1a" />
            {/* Hat band - gold! */}
            <rect x="12" y="18" width="26" height="4" fill="#e5fa00" />
            <rect x="12" y="18" width="26" height="4" fill="url(#goldGradient)" />
            {/* Skull and crossbones */}
            <circle cx="25" cy="12" r="5" fill="white" />
            <circle cx="22.5" cy="11" r="1.2" fill="#1a1a1a" />
            <circle cx="27.5" cy="11" r="1.2" fill="#1a1a1a" />
            <ellipse cx="25" cy="14.5" rx="2" ry="1.2" fill="#1a1a1a" />
            {/* Crossbones */}
            <line x1="17" y1="9" x2="33" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17" y1="17" x2="33" y2="9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            {/* Electric yellow feather */}
            <motion.path 
              d="M36 5 Q46 -4 50 8 Q42 5 36 5" 
              fill="#e5fa00"
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: '36px 5px' }}
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e5fa00" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#e5fa00" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Main Body SVG - Bigger and cuter */}
        <svg width="80" height="100" viewBox="0 0 80 100">
          {/* Head - rounder, cuter */}
          <ellipse cx="40" cy="24" r="16" ry="18" fill="#5a5a5a" />
          <ellipse cx="40" cy="22" r="14" ry="16" fill="#6a6a6a" />
          
          {/* Cute rosy cheeks */}
          <ellipse cx="26" cy="28" rx="4" ry="3" fill="#ff9999" opacity="0.4" />
          <ellipse cx="54" cy="28" rx="4" ry="3" fill="#ff9999" opacity="0.4" />
          
          {/* Eyes - bigger, cuter */}
          <motion.g animate={isBlinking || state === 'sleeping' ? { scaleY: 0.1 } : { scaleY: 1 }} style={{ transformOrigin: '40px 20px' }}>
            {/* Eye whites */}
            <ellipse cx="32" cy="20" rx="5" ry="6" fill="white" />
            <ellipse cx="48" cy="20" rx="5" ry="6" fill="white" />
            {/* Pupils - follow direction when looking */}
            <motion.g
              animate={state === 'looking' ? { x: [0, 3, -3, 0] } : {}}
              transition={{ duration: 1.5, repeat: state === 'looking' ? Infinity : 0 }}
            >
              <circle cx="33" cy="21" r="3" fill="#1a1a1a" />
              <circle cx="49" cy="21" r="3" fill="#1a1a1a" />
              {/* Eye shine */}
              <circle cx="34" cy="19" r="1" fill="white" />
              <circle cx="50" cy="19" r="1" fill="white" />
            </motion.g>
          </motion.g>
          
          {/* Cute eyebrows */}
          <path d="M27 14 Q32 12 37 14" stroke="#4a4a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M43 14 Q48 12 53 14" stroke="#4a4a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Smile - bigger and happier */}
          <motion.path 
            d={state === 'celebrating' ? "M30 30 Q40 40 50 30" : "M30 30 Q40 36 50 30"} 
            stroke="#1a1a1a" 
            strokeWidth="2.5" 
            fill="none" 
            strokeLinecap="round"
          />
          
          {/* Body/Torso - work uniform */}
          <rect x="24" y="42" width="32" height="30" rx="5" fill="#2a2a2a" />
          {/* Yellow safety stripe */}
          <rect x="24" y="52" width="32" height="4" fill="#e5fa00" />
          <rect x="24" y="62" width="32" height="4" fill="#e5fa00" />
          
          {/* Tool belt */}
          <rect x="22" y="68" width="36" height="8" rx="2" fill="#8B4513" />
          <rect x="26" y="69" width="6" height="6" rx="1" fill="#4a4a4a" />
          <rect x="48" y="69" width="6" height="6" rx="1" fill="#4a4a4a" />
          {/* Belt buckle - electric bolt! */}
          <rect x="36" y="69" width="8" height="6" rx="1" fill="#e5fa00" />
          <text x="40" y="74" textAnchor="middle" fontSize="6" fill="#1a1a1a">⚡</text>
          
          {/* Arms */}
          <motion.g
            animate={state === 'waving' ? { rotate: [0, -45, 0] } : state === 'working' ? { rotate: [-15, 15, -15] } : {}}
            transition={{ duration: state === 'waving' ? 0.3 : 0.2, repeat: state === 'waving' || state === 'working' ? Infinity : 0 }}
            style={{ transformOrigin: '56px 48px' }}
          >
            <rect x="54" y="44" width="10" height="22" rx="4" fill="#2a2a2a" />
            <ellipse cx="59" cy="68" rx="5" ry="5" fill="#6a6a6a" />
          </motion.g>
          <motion.g
            animate={state === 'celebrating' ? { rotate: [0, -30, 0] } : {}}
            transition={{ duration: 0.3, repeat: state === 'celebrating' ? Infinity : 0 }}
            style={{ transformOrigin: '24px 48px' }}
          >
            <rect x="16" y="44" width="10" height="22" rx="4" fill="#2a2a2a" />
            <ellipse cx="21" cy="68" rx="5" ry="5" fill="#6a6a6a" />
          </motion.g>
          
          {/* Legs - animated for walking */}
          <motion.rect 
            x="28" y="74" width="10" height="22" rx="3" fill="#1a1a1a"
            animate={{ y: getLeftLegY() }}
          />
          <motion.rect 
            x="42" y="74" width="10" height="22" rx="3" fill="#1a1a1a"
            animate={{ y: getRightLegY() }}
          />
          
          {/* Boots - safety yellow accents */}
          <motion.g animate={{ y: getLeftLegY() }}>
            <rect x="25" y="93" width="15" height="7" rx="3" fill="#3a3a3a" />
            <rect x="25" y="96" width="15" height="2" fill="#e5fa00" />
          </motion.g>
          <motion.g animate={{ y: getRightLegY() }}>
            <rect x="40" y="93" width="15" height="7" rx="3" fill="#3a3a3a" />
            <rect x="40" y="96" width="15" height="2" fill="#e5fa00" />
          </motion.g>
          
          {/* Tool in hand when working - with sparks! */}
          {state === 'working' && (
            <motion.g
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 0.15, repeat: Infinity }}
              style={{ transformOrigin: '59px 68px' }}
            >
              <line x1="59" y1="68" x2="72" y2="82" stroke="#666" strokeWidth="4" strokeLinecap="round" />
              <circle cx="72" cy="82" r="5" fill="#e5fa00" />
              {/* Electric sparks! */}
              <motion.g
                animate={{ opacity: [1, 0.3, 1, 0.5, 1] }}
                transition={{ duration: 0.1, repeat: Infinity }}
              >
                <line x1="74" y1="76" x2="80" y2="70" stroke="#e5fa00" strokeWidth="2" />
                <line x1="78" y1="82" x2="85" y2="82" stroke="#e5fa00" strokeWidth="2" />
                <line x1="74" y1="88" x2="80" y2="94" stroke="#e5fa00" strokeWidth="2" />
                <circle cx="76" cy="78" r="1.5" fill="#fff" />
                <circle cx="82" cy="84" r="1" fill="#fff" />
              </motion.g>
            </motion.g>
          )}
          
          {/* Thinking bubbles */}
          {state === 'thinking' && (
            <>
              <motion.circle
                cx="62" cy="12" r="3"
                fill="white"
                animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.circle
                cx="68" cy="6" r="4"
                fill="white"
                animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
              <motion.text
                x="75" y="4"
                fill="#e5fa00"
                fontSize="12"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ?
              </motion.text>
            </>
          )}
          
          {/* Zzz for sleeping */}
          {state === 'sleeping' && (
            <motion.g
              animate={{ y: [-2, 2, -2], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <text x="58" y="8" fill="#e5fa00" fontSize="10" fontWeight="bold">Z</text>
              <text x="65" y="4" fill="#e5fa00" fontSize="12" fontWeight="bold">z</text>
              <text x="72" y="0" fill="#e5fa00" fontSize="14" fontWeight="bold">Z</text>
            </motion.g>
          )}
        </svg>

        {/* Shadow that moves with walking */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/30 rounded-full blur-sm"
          animate={state === 'celebrating' ? { scale: [1, 0.7, 1] } : state === 'walking' ? { scaleX: [0.9, 1.1, 0.9] } : {}}
          transition={{ duration: state === 'walking' ? 0.3 : 0.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Minimize button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMinimized(true);
        }}
        className="absolute -top-4 -right-2 w-6 h-6 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity shadow-lg"
        data-testid="button-minimize-mascot"
      >
        ×
      </button>
    </motion.div>
  );
}
