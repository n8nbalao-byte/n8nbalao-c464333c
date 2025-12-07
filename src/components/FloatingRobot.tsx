import { useEffect, useRef, useState, useCallback } from "react";
import robotMascot from "@/assets/robot-mascot.png";

export function FloatingRobot() {
  const [position, setPosition] = useState({ x: 50, y: 200 });
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 200 });
  const robotRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Very smooth animation towards target position
  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        
        // Very slow easing - move only 2% towards target each frame
        const easing = 0.02;
        
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

    // If mouse is within 200px of robot, slowly move away
    if (distance < 200) {
      // Calculate direction away from mouse
      const angle = Math.atan2(robotCenterY - e.clientY, robotCenterX - e.clientX);
      
      // Small movement distance for gentle escape
      const moveDistance = 80;
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

  // Gentle idle floating - very subtle movement
  useEffect(() => {
    const idleInterval = setInterval(() => {
      setTargetPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 10,
        y: prev.y + (Math.random() - 0.5) * 8
      }));
    }, 4000);

    return () => clearInterval(idleInterval);
  }, []);

  return (
    <div
      ref={robotRef}
      className="fixed z-40 hidden lg:block pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <img
        src={robotMascot}
        alt="Assistente Virtual"
        className="w-36 h-auto drop-shadow-2xl"
      />
    </div>
  );
}
