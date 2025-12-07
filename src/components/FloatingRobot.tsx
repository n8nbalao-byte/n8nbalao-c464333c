import { useEffect, useRef, useState, useCallback } from "react";
import robotMascot from "@/assets/robot-mascot.png";

export function FloatingRobot() {
  const [position, setPosition] = useState({ x: 50, y: 200 });
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 200 });
  const [isScared, setIsScared] = useState(false);
  const robotRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Smooth animation towards target position
  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        
        // Easing - move 8% towards target each frame for smooth movement
        const easing = 0.08;
        
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

    // If mouse is within 250px of robot, run away smoothly
    if (distance < 250) {
      setIsScared(true);
      
      // Calculate direction away from mouse
      const angle = Math.atan2(robotCenterY - e.clientY, robotCenterX - e.clientX);
      
      // Move robot away from mouse - distance based on proximity
      const moveDistance = Math.max(100, 300 - distance);
      let newX = position.x + Math.cos(angle) * moveDistance;
      let newY = position.y + Math.sin(angle) * moveDistance;

      // Keep robot within viewport bounds with padding
      const padding = 50;
      const maxX = window.innerWidth - 180;
      const maxY = window.innerHeight - 180;
      
      newX = Math.max(padding, Math.min(maxX, newX));
      newY = Math.max(100, Math.min(maxY, newY));

      setTargetPosition({ x: newX, y: newY });

      // Reset scared state after a delay
      setTimeout(() => setIsScared(false), 500);
    }
  }, [position]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Gentle idle floating animation
  useEffect(() => {
    if (isScared) return;
    
    const idleInterval = setInterval(() => {
      setTargetPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 20,
        y: prev.y + (Math.random() - 0.5) * 15
      }));
    }, 3000);

    return () => clearInterval(idleInterval);
  }, [isScared]);

  return (
    <div
      ref={robotRef}
      className="fixed z-40 hidden lg:block pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: "none", // We handle animation manually
      }}
    >
      <img
        src={robotMascot}
        alt="Assistente Virtual"
        className={`w-36 h-auto drop-shadow-2xl transition-transform duration-300 ${
          isScared ? "scale-90" : "scale-100"
        }`}
        style={{
          transform: `${isScared ? "scaleX(-1)" : "scaleX(1)"} translateY(${Math.sin(Date.now() / 1000) * 8}px)`,
          filter: isScared ? "brightness(1.1)" : "brightness(1)",
        }}
      />
      {/* Scared expression indicator */}
      {isScared && (
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
          😰
        </div>
      )}
    </div>
  );
}
