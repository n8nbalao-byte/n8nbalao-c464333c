import { useEffect, useRef, useState, useCallback } from "react";
import robotMascot from "@/assets/robot-mascot.png";

export function FloatingRobot() {
  const [position, setPosition] = useState({ x: 50, y: 200 });
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 200 });
  const [floatOffset, setFloatOffset] = useState(0);
  const robotRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Very smooth animation towards target position
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update float offset for gentle bobbing
      setFloatOffset(Math.sin(currentTime / 1500) * 6);
      
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        
        // Very slow easing - move only 1.5% towards target each frame
        const easing = 0.015;
        
        return {
          x: prev.x + dx * easing,
          y: prev.y + dy * easing
        };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!robotRef.current) return;

    const rect = robotRef.current.getBoundingClientRect();
    const robotCenterX = rect.left + rect.width / 2;
    const robotCenterY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(e.clientX - robotCenterX, 2) + 
      Math.pow(e.clientY - robotCenterY, 2)
    );

    // If mouse is within 180px of robot, slowly move away
    if (distance < 180) {
      // Calculate direction away from mouse
      const angle = Math.atan2(robotCenterY - e.clientY, robotCenterX - e.clientX);
      
      // Very small movement distance for ultra gentle escape
      const moveDistance = 60;
      let newX = position.x + Math.cos(angle) * moveDistance;
      let newY = position.y + Math.sin(angle) * moveDistance;

      // Keep robot within viewport bounds
      const padding = 50;
      const maxX = window.innerWidth - 180;
      const maxY = window.innerHeight - 180;
      
      newX = Math.max(padding, Math.min(maxX, newX));
      newY = Math.max(100, Math.min(maxY, newY));

      setTargetPosition({ x: newX, y: newY });
    }
  }, [position]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Gentle idle floating - very subtle random movement
  useEffect(() => {
    const idleInterval = setInterval(() => {
      setTargetPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 8,
        y: prev.y + (Math.random() - 0.5) * 6
      }));
    }, 5000);

    return () => clearInterval(idleInterval);
  }, []);

  return (
    <div
      ref={robotRef}
      className="fixed z-40 hidden lg:block pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y + floatOffset}px`,
        transition: "none",
      }}
    >
      <img
        src={robotMascot}
        alt="Assistente Virtual"
        className="w-36 h-auto drop-shadow-2xl"
        style={{
          transform: "scaleX(1)", // Always facing forward
        }}
      />
    </div>
  );
}