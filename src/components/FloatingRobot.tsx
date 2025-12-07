import { useEffect, useRef, useState } from "react";
import robotMascot from "@/assets/robot-mascot.png";

export function FloatingRobot() {
  const [position, setPosition] = useState({ x: 50, y: 200 });
  const [isRunning, setIsRunning] = useState(false);
  const robotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!robotRef.current) return;

      const rect = robotRef.current.getBoundingClientRect();
      const robotCenterX = rect.left + rect.width / 2;
      const robotCenterY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(e.clientX - robotCenterX, 2) + 
        Math.pow(e.clientY - robotCenterY, 2)
      );

      // If mouse is within 200px of robot, run away
      if (distance < 200) {
        setIsRunning(true);
        
        // Calculate direction away from mouse
        const angle = Math.atan2(robotCenterY - e.clientY, robotCenterX - e.clientX);
        
        // Move robot away from mouse
        const moveDistance = 150;
        let newX = position.x + Math.cos(angle) * moveDistance;
        let newY = position.y + Math.sin(angle) * moveDistance;

        // Keep robot within viewport bounds
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;
        
        newX = Math.max(20, Math.min(maxX, newX));
        newY = Math.max(100, Math.min(maxY, newY));

        setPosition({ x: newX, y: newY });

        // Reset running state after animation
        setTimeout(() => setIsRunning(false), 300);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [position]);

  return (
    <div
      ref={robotRef}
      className={`fixed z-40 hidden lg:block transition-all duration-300 ease-out ${
        isRunning ? "scale-110" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <img
        src={robotMascot}
        alt="Assistente Virtual"
        className={`w-32 h-auto drop-shadow-2xl ${
          isRunning ? "animate-bounce" : "animate-float"
        }`}
        style={{
          transform: isRunning ? "scaleX(-1)" : "scaleX(1)",
        }}
      />
    </div>
  );
}
