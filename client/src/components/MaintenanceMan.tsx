import { useEffect, useState, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface LightBulb {
  id: string;
  x: number;
  y: number;
  isOn: boolean;
  turnedOnAt?: number;
}

type Action = 
  | 'idle' 
  | 'walk' 
  | 'run'
  | 'climb-ladder' 
  | 'grappling-hook' 
  | 'turn-on-bulb' 
  | 'wave' 
  | 'scratch-head'
  | 'toolbox'
  | 'celebrate'
  | 'inspect-text';

interface MaintenanceManProps {
  enabled?: boolean;
}

export function MaintenanceMan({ enabled = true }: MaintenanceManProps) {
  const [position, setPosition] = useState<Position>({ x: 150, y: window.innerHeight - 200 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<Action>('idle');
  const [lightBulbs, setLightBulbs] = useState<LightBulb[]>([]);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const animationFrameRef = useRef<number>();
  const [showLadder, setShowLadder] = useState(false);
  const [showGrappling, setShowGrappling] = useState(false);
  const [grapplingTarget, setGrapplingTarget] = useState<Position | null>(null);
  const [sparks, setSparks] = useState<{id: string; x: number; y: number}[]>([]);
  const [highlightedText, setHighlightedText] = useState<HTMLElement | null>(null);

  if (!enabled) return null;

  // Initialize light bulbs at various positions on the page
  useEffect(() => {
    const initBulbs = () => {
      const bulbs: LightBulb[] = [
        { id: 'bulb-1', x: 200, y: 100, isOn: false },
        { id: 'bulb-2', x: window.innerWidth - 200, y: 150, isOn: false },
        { id: 'bulb-3', x: 400, y: 300, isOn: false },
        { id: 'bulb-4', x: window.innerWidth - 400, y: 350, isOn: false },
        { id: 'bulb-5', x: window.innerWidth / 2, y: 200, isOn: false },
      ];
      setLightBulbs(bulbs);
    };

    initBulbs();
    window.addEventListener('resize', initBulbs);
    return () => window.removeEventListener('resize', initBulbs);
  }, []);

  // Turn off lights after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLightBulbs(prev => prev.map(bulb => {
        if (bulb.isOn && bulb.turnedOnAt && Date.now() - bulb.turnedOnAt > 30000) {
          return { ...bulb, isOn: false, turnedOnAt: undefined };
        }
        return bulb;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // AI behavior: Find interactive elements and navigate to them
  useEffect(() => {
    const performRandomAction = () => {
      const random = Math.random();
      
      if (random > 0.85) {
        // Find a light bulb to turn on
        const offBulbs = lightBulbs.filter(b => !b.isOn);
        if (offBulbs.length > 0) {
          const targetBulb = offBulbs[Math.floor(Math.random() * offBulbs.length)];
          navigateToTarget({ x: targetBulb.x, y: targetBulb.y }, 'turn-on-bulb', targetBulb.id);
        }
      } else if (random > 0.75) {
        setAction('wave');
        setTimeout(() => setAction('idle'), 2500);
      } else if (random > 0.65) {
        setAction('scratch-head');
        setTimeout(() => setAction('idle'), 2000);
      } else if (random > 0.55) {
        setAction('toolbox');
        setTimeout(() => setAction('idle'), 3000);
      } else {
        // Find a button or heading to interact with
        const interactiveElements = document.querySelectorAll('button, h1, h2, a[href]');
        if (interactiveElements.length > 0) {
          const randomElement = interactiveElements[Math.floor(Math.random() * interactiveElements.length)] as HTMLElement;
          const rect = randomElement.getBoundingClientRect();
          navigateToTarget({ 
            x: rect.left + rect.width / 2, 
            y: rect.top + window.scrollY - 80 
          }, 'walk');
        }
      }
    };

    const interval = setInterval(performRandomAction, 5000);
    return () => clearInterval(interval);
  }, [lightBulbs]);

  const navigateToTarget = (target: Position, actionType: Action, bulbId?: string) => {
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    
    setDirection(dx > 0 ? 'right' : 'left');

    // If target is above, use ladder or grappling hook
    if (dy < -50) {
      const useGrappling = Math.random() > 0.5;
      if (useGrappling) {
        setShowGrappling(true);
        setGrapplingTarget(target);
        setAction('grappling-hook');
        
        setTimeout(() => {
          setPosition(target);
          setShowGrappling(false);
          setGrapplingTarget(null);
          if (bulbId) turnOnBulb(bulbId);
          setAction('idle');
        }, 2000);
      } else {
        setShowLadder(true);
        setAction('climb-ladder');
        
        setTimeout(() => {
          setPosition(target);
          setShowLadder(false);
          if (bulbId) turnOnBulb(bulbId);
          setAction('idle');
        }, 3000);
      }
    } else {
      // Walk to target
      setAction('walk');
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = distance / 2; // 2 pixels per frame at 60fps
      
      let startTime: number;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        
        if (progress < 1) {
          setPosition({
            x: position.x + dx * progress,
            y: position.y + dy * progress,
          });
          requestAnimationFrame(animate);
        } else {
          setPosition(target);
          if (bulbId) turnOnBulb(bulbId);
          setAction('idle');
        }
      };
      requestAnimationFrame(animate);
    }
  };

  const turnOnBulb = (bulbId: string) => {
    setAction('turn-on-bulb');
    const bulb = lightBulbs.find(b => b.id === bulbId);
    
    setTimeout(() => {
      // Add spark effects
      if (bulb) {
        const newSparks = Array.from({ length: 5 }, (_, i) => ({
          id: `spark-${Date.now()}-${i}`,
          x: bulb.x + (Math.random() - 0.5) * 40,
          y: bulb.y + (Math.random() - 0.5) * 40,
        }));
        setSparks(prev => [...prev, ...newSparks]);
        
        // Remove sparks after animation
        setTimeout(() => {
          setSparks(prev => prev.filter(s => !newSparks.some(ns => ns.id === s.id)));
        }, 500);
      }
      
      setLightBulbs(prev => prev.map(b => 
        b.id === bulbId 
          ? { ...b, isOn: true, turnedOnAt: Date.now() }
          : b
      ));
      setAction('celebrate');
      setTimeout(() => setAction('idle'), 1500);
    }, 1000);
  };

  // Add text mesh effect to headings
  useEffect(() => {
    const addTextMeshEffect = () => {
      const headings = document.querySelectorAll('h1, h2, h3');
      headings.forEach(heading => {
        if (!heading.classList.contains('text-mesh-processed')) {
          heading.classList.add('text-mesh-processed');
        }
      });
    };

    addTextMeshEffect();
    const observer = new MutationObserver(addTextMeshEffect);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Spark Effects */}
      {sparks.map(spark => (
        <div
          key={spark.id}
          className="spark-effect fixed z-50"
          style={{
            left: `${spark.x}px`,
            top: `${spark.y}px`,
          }}
        />
      ))}

      {/* Light Bulbs */}
      {lightBulbs.map(bulb => (
        <div key={bulb.id}>
          {/* Bulb */}
          <div
            className="fixed pointer-events-none z-40"
            style={{
              left: `${bulb.x}px`,
              top: `${bulb.y}px`,
            }}
          >
            <svg width="30" height="40" viewBox="0 0 30 40">
              {/* Bulb glass */}
              <ellipse
                cx="15"
                cy="15"
                rx="10"
                ry="12"
                fill={bulb.isOn ? '#e5fa00' : '#666'}
                opacity={bulb.isOn ? 0.9 : 0.5}
                className="transition-all duration-300"
              />
              {/* Bulb base */}
              <rect
                x="11"
                y="25"
                width="8"
                height="8"
                fill="#888"
                rx="2"
              />
              {/* Filament */}
              <path
                d="M 13 12 Q 15 8, 17 12"
                stroke={bulb.isOn ? '#ff6600' : '#444'}
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>
          
          {/* Light glow effect - positioned behind content */}
          {bulb.isOn && (
            <div
              className="fixed pointer-events-none z-30 light-glow"
              style={{
                left: `${bulb.x - 75}px`,
                top: `${bulb.y - 75}px`,
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(229, 250, 0, 0.4) 0%, rgba(229, 250, 0, 0.2) 30%, transparent 70%)',
                borderRadius: '50%',
                animation: 'light-pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </div>
      ))}

      {/* Ladder */}
      {showLadder && (
        <div
          className="fixed pointer-events-none z-45"
          style={{
            left: `${position.x + 20}px`,
            top: `${position.y - 100}px`,
          }}
        >
          <svg width="40" height="120" viewBox="0 0 40 120">
            <line x1="10" y1="0" x2="10" y2="120" stroke="#e5fa00" strokeWidth="3" />
            <line x1="30" y1="0" x2="30" y2="120" stroke="#e5fa00" strokeWidth="3" />
            <line x1="10" y1="20" x2="30" y2="20" stroke="#e5fa00" strokeWidth="2" />
            <line x1="10" y1="40" x2="30" y2="40" stroke="#e5fa00" strokeWidth="2" />
            <line x1="10" y1="60" x2="30" y2="60" stroke="#e5fa00" strokeWidth="2" />
            <line x1="10" y1="80" x2="30" y2="80" stroke="#e5fa00" strokeWidth="2" />
            <line x1="10" y1="100" x2="30" y2="100" stroke="#e5fa00" strokeWidth="2" />
          </svg>
        </div>
      )}

      {/* Grappling Hook */}
      {showGrappling && grapplingTarget && (
        <div className="fixed pointer-events-none z-45">
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <line
              x1={position.x + 30}
              y1={position.y + 20}
              x2={grapplingTarget.x}
              y2={grapplingTarget.y}
              stroke="#e5fa00"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
            <circle cx={grapplingTarget.x} cy={grapplingTarget.y} r="5" fill="#e5fa00" />
          </svg>
        </div>
      )}

      {/* Maintenance Man */}
      <div
        className="fixed pointer-events-none z-50 transition-all duration-200"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `scaleX(${direction === 'left' ? -1 : 1})`,
        }}
      >
        <svg
          width="70"
          height="90"
          viewBox="0 0 70 90"
          className={`maintenance-man ${action}`}
        >
          {/* Hard Hat */}
          <ellipse cx="35" cy="12" rx="14" ry="6" fill="#e5fa00" className="hard-hat" />
          <rect x="21" y="8" width="28" height="8" fill="#e5fa00" rx="2" />
          
          {/* Head */}
          <circle cx="35" cy="22" r="10" fill="#ffcc99" className="head" />
          
          {/* Eyes */}
          <circle cx="31" cy="21" r="1.5" fill="#000" />
          <circle cx="39" cy="21" r="1.5" fill="#000" />
          
          {/* Body */}
          <rect x="25" y="32" width="20" height="25" fill="#ff6600" rx="3" className="body" />
          
          {/* Tool Belt */}
          <rect x="23" y="52" width="24" height="5" fill="#8B4513" />
          <rect x="28" y="52" width="4" height="8" fill="#666" />
          <rect x="38" y="52" width="4" height="8" fill="#FFD700" />
          
          {/* Arms */}
          <line
            x1="25"
            y1="37"
            x2="12"
            y2="48"
            stroke="#ffcc99"
            strokeWidth="4"
            className="arm-left"
            strokeLinecap="round"
          />
          <line
            x1="45"
            y1="37"
            x2="58"
            y2="48"
            stroke="#ffcc99"
            strokeWidth="4"
            className="arm-right"
            strokeLinecap="round"
          />
          
          {/* Hands with gloves */}
          <circle cx="12" cy="48" r="3" fill="#e5fa00" className="hand-left" />
          <circle cx="58" cy="48" r="3" fill="#e5fa00" className="hand-right" />
          
          {/* Legs */}
          <line
            x1="30"
            y1="57"
            x2="25"
            y2="80"
            stroke="#00508C"
            strokeWidth="5"
            className="leg-left"
            strokeLinecap="round"
          />
          <line
            x1="40"
            y1="57"
            x2="45"
            y2="80"
            stroke="#00508C"
            strokeWidth="5"
            className="leg-right"
            strokeLinecap="round"
          />
          
          {/* Boots */}
          <ellipse cx="25" cy="82" rx="4" ry="3" fill="#000" />
          <ellipse cx="45" cy="82" rx="4" ry="3" fill="#000" />

          {/* Wrench (when using toolbox) */}
          {action === 'toolbox' && (
            <g className="wrench">
              <rect x="55" y="45" width="3" height="12" fill="#888" />
              <circle cx="56.5" cy="44" r="3" fill="#888" />
            </g>
          )}
        </svg>
      </div>
    </>
  );
}
