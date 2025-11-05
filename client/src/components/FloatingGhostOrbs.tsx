import React, { useEffect, useRef } from 'react';

interface GhostOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  direction: number;
  pulsePhase: number;
  color: string;
}

interface FloatingGhostOrbsProps {
  orbCount?: number;
  className?: string;
  intensity?: number; // 0-100
}

const FloatingGhostOrbs: React.FC<FloatingGhostOrbsProps> = ({
  orbCount = 8,
  className = '',
  intensity = 80
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<GhostOrb[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive: handle device pixel ratio for sharpness
    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.scale(dpr, dpr);
    };

    // Initialize orbs
    const initializeOrbs = () => {
      orbsRef.current = [];
      for (let i = 0; i < orbCount; i++) {
        const colors = [
          'rgba(124, 45, 255, 0.6)',   // Purple
          'rgba(76, 19, 179, 0.5)',    // Dark purple
          'rgba(156, 39, 176, 0.4)',   // Pink purple
          'rgba(103, 58, 183, 0.5)',   // Blue purple
          'rgba(255, 255, 255, 0.3)'   // White/ethereal
        ];

        orbsRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: (3 + Math.random() * 8) * Math.max(0.5, intensity / 100), // Size scales with intensity
          opacity: (0.3 + Math.random() * 0.4) * (intensity / 100),
          speed: (0.3 + Math.random() * 0.5) * (1 + intensity / 200), // Speed increases with intensity
          direction: Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbsRef.current.forEach(orb => {
        // Update position with floating motion
        orb.x += Math.cos(orb.direction) * orb.speed;
        orb.y += Math.sin(orb.direction) * orb.speed * 0.6;

        // Add subtle drift
        orb.direction += (Math.random() - 0.5) * 0.02;

        // Wrap around edges
        if (orb.x < -orb.size) orb.x = canvas.width + orb.size;
        if (orb.x > canvas.width + orb.size) orb.x = -orb.size;
        if (orb.y < -orb.size) orb.y = canvas.height + orb.size;
        if (orb.y > canvas.height + orb.size) orb.y = -orb.size;

        // Update pulse phase (faster pulsing with higher intensity)
        orb.pulsePhase += 0.03 * (1 + intensity / 100);

        // Calculate pulsing size and opacity (more dramatic with higher intensity)
        const pulseIntensity = 0.8 + (0.4 * (intensity / 100));
        const pulseFactor = pulseIntensity + (0.4 * (intensity / 100)) * Math.sin(orb.pulsePhase);
        const currentSize = orb.size * pulseFactor;
        const currentOpacity = orb.opacity * pulseFactor;

        // Draw outer glow
        const glowGradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentSize * 3
        );
        const glowColor = orb.color.replace(/[\d.]+\)$/, '0.1)');
        glowGradient.addColorStop(0, orb.color);
        glowGradient.addColorStop(0.4, glowColor);
        glowGradient.addColorStop(1, 'transparent');

        ctx.save();
        ctx.globalAlpha = currentOpacity * 0.8;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw main orb
        const mainGradient = ctx.createRadialGradient(
          orb.x - currentSize * 0.3, orb.y - currentSize * 0.3, 0,
          orb.x, orb.y, currentSize
        );
        mainGradient.addColorStop(0, orb.color.replace(/[\d.]+\)$/, '0.9)'));
        mainGradient.addColorStop(0.6, orb.color);
        mainGradient.addColorStop(1, orb.color.replace(/[\d.]+\)$/, '0.1)'));

        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Add sparkle effect occasionally (more frequent with higher intensity)
        const sparkleChance = 0.05 * (intensity / 100);
        if (Math.random() < sparkleChance) {
          ctx.globalAlpha = currentOpacity * 1.5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(
            orb.x + (Math.random() - 0.5) * currentSize * 0.5,
            orb.y + (Math.random() - 0.5) * currentSize * 0.5,
            (0.5 + Math.random()) * (1 + intensity / 200),
            0, Math.PI * 2
          );
          ctx.fill();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      setCanvasSize();
      initializeOrbs();
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [orbCount, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-[2] ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default FloatingGhostOrbs;