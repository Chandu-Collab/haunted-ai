import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ParticleSystemProps {
  particleCount?: number;
  className?: string;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  particleCount = 50, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: `hsl(${250 + Math.random() * 60}, 70%, 60%)`, // Purple/blue range
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200
      });
    }

    setParticles(newParticles);
  }, [particleCount]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          // Update position
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          
          // Bounce off edges
          if (newX <= 0 || newX >= canvas.width) {
            particle.speedX *= -1;
            newX = Math.max(0, Math.min(canvas.width, newX));
          }
          if (newY <= 0 || newY >= canvas.height) {
            particle.speedY *= -1;
            newY = Math.max(0, Math.min(canvas.height, newY));
          }

          // Update life
          const newLife = particle.life + 1;
          const opacity = particle.opacity * (1 - newLife / particle.maxLife);

          // Reset particle if dead
          if (newLife > particle.maxLife) {
            return {
              ...particle,
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              life: 0,
              opacity: Math.random() * 0.5 + 0.2
            };
          }

          // Draw particle with glow effect
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(newX, newY, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return {
            ...particle,
            x: newX,
            y: newY,
            life: newLife,
            opacity
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleSystem;