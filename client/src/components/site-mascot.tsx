import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Sparky the TGE Electrician ──────────────────────────────────────────────
// A polished hardhat electrician mascot with glow effects and animations.

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
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl relative"
          style={{ background: 'linear-gradient(135deg, #e5fa00, #fbbf24)' }}>
          <span className="text-2xl">⚡</span>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid #e5fa00' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
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

      {/* ── Sparky — polished TGE electrician ── */}
      <motion.div className="relative" animate={getBodyAnimation()}>

        {/* Ground glow */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-xl"
          style={{ width: 80, height: 18, background: 'rgba(229,250,0,0.18)' }}
          animate={state === 'celebrating' ? { scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] } : { opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <svg width="88" height="112" viewBox="0 0 88 112">
          <defs>
            {/* Skin gradient */}
            <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fddcb0" />
              <stop offset="100%" stopColor="#e8b887" />
            </radialGradient>
            {/* Hard-hat gradient */}
            <radialGradient id="hatGrad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff176" />
              <stop offset="100%" stopColor="#e5c000" />
            </radialGradient>
            {/* Vest gradient */}
            <linearGradient id="vestGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1c3a5e" />
              <stop offset="100%" stopColor="#0f2540" />
            </linearGradient>
            {/* Electric glow filter */}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Hard Hat ── */}
          {/* Brim */}
          <ellipse cx="44" cy="18" rx="22" ry="5" fill="#d4b000" />
          {/* Cap dome */}
          <path d="M23 18 Q22 6 44 4 Q66 6 65 18 Z" fill="url(#hatGrad)" />
          {/* TGE logo on hat */}
          <rect x="36" y="8" width="16" height="8" rx="2" fill="#1a1a1a" opacity="0.7" />
          <text x="44" y="14.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#e5fa00" fontFamily="monospace">TGE</text>
          {/* Hat vent lines */}
          <line x1="38" y1="5" x2="37" y2="17" stroke="#c8a700" strokeWidth="0.8" opacity="0.5" />
          <line x1="50" y1="5" x2="51" y2="17" stroke="#c8a700" strokeWidth="0.8" opacity="0.5" />

          {/* ── Head / Face ── */}
          <ellipse cx="44" cy="30" rx="13" ry="14" fill="url(#skinGrad)" />

          {/* Eyes */}
          <motion.g
            animate={isBlinking || state === 'sleeping' ? { scaleY: 0.08 } : { scaleY: 1 }}
            style={{ transformOrigin: '44px 28px' }}
          >
            {/* Eye whites */}
            <ellipse cx="38" cy="28" rx="4.5" ry="5" fill="white" />
            <ellipse cx="50" cy="28" rx="4.5" ry="5" fill="white" />
            {/* Pupils */}
            <motion.g animate={state === 'looking' ? { x: [0, 2, -2, 0] } : {}}
              transition={{ duration: 1.8, repeat: state === 'looking' ? Infinity : 0 }}
            >
              <circle cx="39" cy="29" r="2.8" fill="#1a1a1a" />
              <circle cx="51" cy="29" r="2.8" fill="#1a1a1a" />
              {/* Iris glow — electric blue */}
              <circle cx="39" cy="29" r="1.8" fill="#38bdf8" opacity="0.85" />
              <circle cx="51" cy="29" r="1.8" fill="#38bdf8" opacity="0.85" />
              <circle cx="39.8" cy="27.5" r="0.8" fill="white" />
              <circle cx="51.8" cy="27.5" r="0.8" fill="white" />
            </motion.g>
          </motion.g>

          {/* Eyebrows */}
          <path d="M34 23 Q38 21.5 42 23" stroke="#7a5a30" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M46 23 Q50 21.5 54 23" stroke="#7a5a30" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Mouth */}
          <motion.path
            d={state === 'celebrating' ? 'M37 36 Q44 43 51 36' : 'M37 36 Q44 40 51 36'}
            stroke="#c07040" strokeWidth="2" fill="none" strokeLinecap="round"
          />

          {/* Chin dimple */}
          <ellipse cx="44" cy="41" rx="2" ry="1" fill="#d4a070" opacity="0.4" />

          {/* Ear */}
          <ellipse cx="31" cy="30" rx="3" ry="4" fill="#e8b887" />
          <ellipse cx="57" cy="30" rx="3" ry="4" fill="#e8b887" />

          {/* ── Neck ── */}
          <rect x="40" y="43" width="8" height="6" rx="2" fill="#e0a870" />

          {/* ── Safety Vest / Torso ── */}
          <rect x="26" y="47" width="36" height="32" rx="6" fill="url(#vestGrad)" />
          {/* Reflective stripes */}
          <rect x="26" y="56" width="36" height="4" rx="1" fill="#e5fa00" opacity="0.9" />
          <rect x="26" y="67" width="36" height="4" rx="1" fill="#e5fa00" opacity="0.9" />
          {/* TGE chest badge */}
          <rect x="38" y="49" width="12" height="6" rx="1.5" fill="white" opacity="0.15" />
          <text x="44" y="54" textAnchor="middle" fontSize="4" fill="white" fontFamily="monospace" fontWeight="bold">TGE</text>
          {/* Vest collar */}
          <path d="M38 47 L44 52 L50 47" fill="none" stroke="#e5fa00" strokeWidth="1" opacity="0.6" />

          {/* ── Tool Belt ── */}
          <rect x="24" y="76" width="40" height="7" rx="2" fill="#5c3317" />
          {/* Belt buckle */}
          <rect x="39" y="77" width="10" height="5" rx="1" fill="#e5fa00" />
          <text x="44" y="81" textAnchor="middle" fontSize="4.5" fill="#1a1a1a">⚡</text>
          {/* Tool pouches */}
          <rect x="27" y="77" width="8" height="5" rx="1" fill="#4a2a10" />
          <rect x="53" y="77" width="8" height="5" rx="1" fill="#4a2a10" />
          {/* Wrench silhouette */}
          <line x1="29" y1="77" x2="33" y2="81" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />

          {/* ── Right Arm (waving side) ── */}
          <motion.g
            animate={state === 'waving' ? { rotate: [0, -50, 10, -50, 0] }
              : state === 'working' ? { rotate: [-20, 20, -20] } : { rotate: 0 }}
            transition={{ duration: state === 'waving' ? 0.5 : 0.2, repeat: state === 'waving' || state === 'working' ? Infinity : 0 }}
            style={{ transformOrigin: '60px 51px' }}
          >
            <rect x="58" y="49" width="9" height="20" rx="4" fill="#1c3a5e" />
            <ellipse cx="62.5" cy="71" rx="5" ry="5" fill="#e8b887" />
          </motion.g>

          {/* ── Left Arm ── */}
          <motion.g
            animate={state === 'celebrating' ? { rotate: [0, -35, 0] } : { rotate: 0 }}
            transition={{ duration: 0.3, repeat: state === 'celebrating' ? Infinity : 0 }}
            style={{ transformOrigin: '28px 51px' }}
          >
            <rect x="21" y="49" width="9" height="20" rx="4" fill="#1c3a5e" />
            <ellipse cx="25.5" cy="71" rx="5" ry="5" fill="#e8b887" />
          </motion.g>

          {/* ── Pants / Legs ── */}
          <motion.rect x="28" y="84" width="11" height="24" rx="4" fill="#1a1a2e"
            animate={{ y: getLeftLegY() }} />
          <motion.rect x="49" y="84" width="11" height="24" rx="4" fill="#1a1a2e"
            animate={{ y: getRightLegY() }} />

          {/* ── Boots ── */}
          <motion.g animate={{ y: getLeftLegY() }}>
            <rect x="25" y="104" width="17" height="8" rx="3" fill="#2a2a2a" />
            <rect x="25" y="108" width="17" height="2.5" fill="#e5fa00" opacity="0.8" />
          </motion.g>
          <motion.g animate={{ y: getRightLegY() }}>
            <rect x="46" y="104" width="17" height="8" rx="3" fill="#2a2a2a" />
            <rect x="46" y="108" width="17" height="2.5" fill="#e5fa00" opacity="0.8" />
          </motion.g>

          {/* ── Working tool (voltage tester) ── */}
          {state === 'working' && (
            <motion.g
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 0.15, repeat: Infinity }}
              style={{ transformOrigin: '62px 71px' }}
              filter="url(#glow)"
            >
              <line x1="62" y1="71" x2="76" y2="86" stroke="#555" strokeWidth="4" strokeLinecap="round" />
              <circle cx="76" cy="86" r="5" fill="#e5fa00" />
              <motion.g animate={{ opacity: [1, 0.2, 1, 0.5, 1] }} transition={{ duration: 0.08, repeat: Infinity }}>
                <line x1="78" y1="80" x2="84" y2="74" stroke="#e5fa00" strokeWidth="2" />
                <line x1="82" y1="86" x2="88" y2="86" stroke="#e5fa00" strokeWidth="2" />
                <line x1="78" y1="92" x2="84" y2="98" stroke="#e5fa00" strokeWidth="2" />
                <circle cx="80" cy="80" r="1.5" fill="white" />
              </motion.g>
            </motion.g>
          )}

          {/* ── Thinking bubbles ── */}
          {state === 'thinking' && (
            <>
              <motion.circle cx="66" cy="16" r="2.5" fill="white" opacity="0.7"
                animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
              <motion.circle cx="72" cy="10" r="4" fill="white" opacity="0.7"
                animate={{ y: [0, -3, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
              <motion.text x="76" y="8" fill="#e5fa00" fontSize="11" fontWeight="bold"
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }}>?</motion.text>
            </>
          )}

          {/* ── Sleeping Zs ── */}
          {state === 'sleeping' && (
            <motion.g animate={{ y: [-2, 2, -2], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
              <text x="60" y="10" fill="#e5fa00" fontSize="9" fontWeight="bold">Z</text>
              <text x="67" y="5" fill="#e5fa00" fontSize="11" fontWeight="bold">z</text>
              <text x="74" y="0" fill="#e5fa00" fontSize="13" fontWeight="bold">Z</text>
            </motion.g>
          )}
        </svg>

        {/* Shadow */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-sm"
          style={{ width: 64, height: 10, background: 'rgba(0,0,0,0.35)' }}
          animate={state === 'celebrating' ? { scale: [1, 0.65, 1] } : state === 'walking' ? { scaleX: [0.85, 1.15, 0.85] } : {}}
          transition={{ duration: 0.35, repeat: Infinity }}
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
