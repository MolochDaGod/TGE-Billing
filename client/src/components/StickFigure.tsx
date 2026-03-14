import { useEffect, useState, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface StickFigureProps {
  enabled?: boolean;
}

export function StickFigure({ enabled = true }: StickFigureProps) {
  const [position, setPosition] = useState<Position>({ x: 100, y: window.innerHeight - 150 });
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [action, setAction] = useState<'idle' | 'walk' | 'run' | 'jump' | 'wave'>('idle');
  const animationFrameRef = useRef<number>();
  const lastMoveTime = useRef<number>(Date.now());

  if (!enabled) return null;

  // Humorous AI pathfinding logic
  useEffect(() => {
    const findNewTarget = () => {
      const behaviors = [
        // Random walk
        () => ({
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 200) + 50,
        }),
        // Walk to center
        () => ({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        }),
        // Walk to edge
        () => ({
          x: Math.random() > 0.5 ? 50 : window.innerWidth - 50,
          y: position.y,
        }),
      ];

      const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      return randomBehavior();
    };

    const decideAction = () => {
      const random = Math.random();
      if (random > 0.95) {
        setAction('jump');
        setTimeout(() => setAction('idle'), 1000);
      } else if (random > 0.9) {
        setAction('wave');
        setTimeout(() => setAction('idle'), 2000);
      } else if (!targetPosition) {
        const newTarget = findNewTarget();
        setTargetPosition(newTarget);
        setIsWalking(true);
        setAction('walk');
      }
    };

    const interval = setInterval(decideAction, 3000);
    return () => clearInterval(interval);
  }, [targetPosition, position]);

  // Respond to scroll events humorously
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const random = Math.random();

      if (random > 0.7) {
        // Run away from scroll!
        setAction('run');
        setTargetPosition({
          x: Math.random() * (window.innerWidth - 100),
          y: window.innerHeight - 150,
        });
        setTimeout(() => setAction('walk'), 1500);
      } else if (random > 0.5) {
        // Jump when scrolling
        setAction('jump');
        setTimeout(() => setAction('idle'), 800);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse following behavior (sometimes)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const random = Math.random();
      if (random > 0.98) {
        // Occasionally follow the mouse
        setTargetPosition({ x: e.clientX, y: e.clientY });
        setAction('run');
        setTimeout(() => setAction('walk'), 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Movement animation loop
  useEffect(() => {
    const animate = () => {
      if (!targetPosition) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dx = targetPosition.x - position.x;
      const dy = targetPosition.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        setTargetPosition(null);
        setIsWalking(false);
        setAction('idle');
      } else {
        const speed = action === 'run' ? 4 : 2;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;

        setDirection(dx > 0 ? 'right' : 'left');
        setPosition((prev) => ({
          x: prev.x + moveX,
          y: prev.y + moveY,
        }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetPosition, position, action]);

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-100"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scaleX(${direction === 'left' ? -1 : 1})`,
      }}
    >
      <svg
        width="60"
        height="80"
        viewBox="0 0 60 80"
        className={`stick-figure ${action}`}
      >
        {/* Head */}
        <circle
          cx="30"
          cy="15"
          r="10"
          fill="none"
          stroke="#e5fa00"
          strokeWidth="2"
          className="head"
        />
        
        {/* Body */}
        <line
          x1="30"
          y1="25"
          x2="30"
          y2="50"
          stroke="#e5fa00"
          strokeWidth="2"
          className="body"
        />
        
        {/* Arms */}
        <line
          x1="30"
          y1="30"
          x2="15"
          y2="40"
          stroke="#e5fa00"
          strokeWidth="2"
          className="arm-left"
        />
        <line
          x1="30"
          y1="30"
          x2="45"
          y2="40"
          stroke="#e5fa00"
          strokeWidth="2"
          className="arm-right"
        />
        
        {/* Legs */}
        <line
          x1="30"
          y1="50"
          x2="20"
          y2="70"
          stroke="#e5fa00"
          strokeWidth="2"
          className="leg-left"
        />
        <line
          x1="30"
          y1="50"
          x2="40"
          y2="70"
          stroke="#e5fa00"
          strokeWidth="2"
          className="leg-right"
        />
        
        {/* Eyes */}
        <circle cx="26" cy="13" r="1.5" fill="#e5fa00" />
        <circle cx="34" cy="13" r="1.5" fill="#e5fa00" />
      </svg>
    </div>
  );
}
