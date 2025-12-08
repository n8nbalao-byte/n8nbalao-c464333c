import { useEffect, useRef } from "react";

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface Star {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
      color: string;
    }

    const stars: Star[] = [];
    const starCount = 200;

    // Colors for stars - white and subtle pink/coral tints
    const starColors = [
      "255, 255, 255",
      "255, 255, 255",
      "255, 255, 255",
      "255, 200, 200",
      "200, 200, 255",
    ];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background - dark blue/purple like the reference
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "hsl(230, 25%, 12%)");
      gradient.addColorStop(0.3, "hsl(230, 25%, 10%)");
      gradient.addColorStop(0.6, "hsl(235, 25%, 8%)");
      gradient.addColorStop(1, "hsl(240, 25%, 6%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw twinkling stars with glow
      stars.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.4 + 0.6;
        const currentOpacity = star.opacity * twinkle;

        // Main star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${currentOpacity})`;
        ctx.fill();

        // Glow effect for all stars
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${currentOpacity * 0.15})`;
        ctx.fill();

        // Extra bright glow for larger stars
        if (star.radius > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.color}, ${currentOpacity * 0.08})`;
          ctx.fill();
          
          // Add cross/sparkle effect for brightest stars
          if (star.radius > 2 && twinkle > 0.8) {
            ctx.strokeStyle = `rgba(${star.color}, ${currentOpacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(star.x - star.radius * 4, star.y);
            ctx.lineTo(star.x + star.radius * 4, star.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(star.x, star.y - star.radius * 4);
            ctx.lineTo(star.x, star.y + star.radius * 4);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}