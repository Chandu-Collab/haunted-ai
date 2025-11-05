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
  glow: number;
  type: 'orb' | 'sparkle' | 'mist';
}

interface ParticleSystemProps {
  particleCount?: number;
  intensity?: number; // 0-100 intensity scale
  className?: string;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  particleCount = 50,
  intensity = 50,
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  // Create a random particle type and properties
  const createParticle = (id: number, rect: DOMRect): Particle => {
    const types: ('orb' | 'sparkle' | 'mist')[] = ['orb', 'sparkle', 'mist'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Scale factor based on intensity (0.5x to 2x scaling)
    const intensityScale = 0.5 + (intensity / 100) * 1.5;
    
    let baseProps = {
      id,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      speedX: (Math.random() - 0.5) * 0.5 * intensityScale,
      speedY: (Math.random() - 0.5) * 0.5 * intensityScale,
      life: Math.random() * 100,
      maxLife: 200 + Math.random() * 300,
      type
    };

    switch (type) {
      case 'orb':
        return {
          ...baseProps,
          size: (Math.random() * 4 + 2) * intensityScale, // Scaled size
          opacity: (Math.random() * 0.6 + 0.3) * Math.min(1, intensityScale), // Scaled opacity
          color: `hsl(${250 + Math.random() * 60}, ${Math.min(100, 80 + intensity / 5)}%, ${Math.min(90, 70 + intensity / 10)}%)`, // Brighter at high intensity
          glow: (10 + Math.random() * 15) * intensityScale, // Scaled glow
        };
      case 'sparkle':
        return {
          ...baseProps,
          size: (Math.random() * 2 + 1) * intensityScale, // Scaled size
          opacity: (Math.random() * 0.8 + 0.2) * Math.min(1, intensityScale), // Scaled opacity
          color: `hsl(${280 + Math.random() * 40}, ${Math.min(100, 90 + intensity / 10)}%, ${Math.min(95, 85 + intensity / 10)}%)`, // Brighter sparkles
          glow: (5 + Math.random() * 10) * intensityScale, // Scaled glow
          speedY: baseProps.speedY - 0.2 * intensityScale, // Faster float upward
        };
      case 'mist':
        return {
          ...baseProps,
          size: (Math.random() * 8 + 4) * intensityScale, // Scaled size
          opacity: (Math.random() * 0.3 + 0.1) * Math.min(1, intensityScale * 0.8), // Scaled but kept subtle
          color: `hsl(${240 + Math.random() * 80}, ${Math.min(100, 50 + intensity / 5)}%, ${Math.min(80, 60 + intensity / 8)}%)`, // More visible at high intensity
          glow: (20 + Math.random() * 30) * intensityScale, // Scaled glow
          speedX: baseProps.speedX * 0.3, // Keep slower movement
          speedY: baseProps.speedY * 0.3,
        };
    }
  };

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i, rect));
    }

    setParticles(newParticles);
  }, [particleCount, intensity]); // Added intensity dependency

  // Adjust particle count dynamically
  useEffect(() => {
    setParticles(prevParticles => {
      const currentCount = prevParticles.length;
      
      if (currentCount === particleCount) return prevParticles;
      
      if (currentCount < particleCount) {
        // Add more particles
        const canvas = canvasRef.current;
        if (!canvas) return prevParticles;
        
        const rect = canvas.getBoundingClientRect();
        const additionalParticles: Particle[] = [];
        
        for (let i = currentCount; i < particleCount; i++) {
          additionalParticles.push(createParticle(i, rect));
        }
        
        return [...prevParticles, ...additionalParticles];
      } else {
        // Remove excess particles
        return prevParticles.slice(0, particleCount);
      }
    });
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
          const intensityScale = 0.5 + (intensity / 100) * 1.5;
          
          // Update position with floating motion (intensity affects movement)
          let newX = particle.x + particle.speedX + Math.sin(particle.life * 0.02 * intensityScale) * (0.1 * intensityScale);
          let newY = particle.y + particle.speedY + Math.cos(particle.life * 0.015 * intensityScale) * (0.1 * intensityScale);
          
          // Bounce off edges
          if (newX <= 0 || newX >= canvas.width) {
            particle.speedX *= -1;
            newX = Math.max(0, Math.min(canvas.width, newX));
          }
          if (newY <= 0 || newY >= canvas.height) {
            particle.speedY *= -1;
            newY = Math.max(0, Math.min(canvas.height, newY));
          }

          // Update life and opacity
          const newLife = particle.life + (1 + (intensity / 100) * 0.5); // Faster life cycle at high intensity
          let opacity = particle.opacity * (1 - newLife / particle.maxLife);
          
          // Add pulsing effect for orbs (intensity affects pulse speed)
          if (particle.type === 'orb') {
            opacity *= 0.7 + 0.3 * Math.sin(newLife * (0.05 + intensity / 2000));
          }
          
          // Add twinkling for sparkles (intensity affects twinkle speed)
          if (particle.type === 'sparkle') {
            opacity *= 0.5 + 0.5 * Math.sin(newLife * (0.1 + intensity / 1000));
          }

          // Reset particle if dead
          if (newLife > particle.maxLife) {
            const rect = canvas.getBoundingClientRect();
            return createParticle(particle.id, rect);
          }

          // Draw particle with enhanced effects
          ctx.save();
          ctx.globalAlpha = opacity;
          
          // Create different rendering for different types
          if (particle.type === 'orb') {
            // Draw orb with glow effect
            const gradient = ctx.createRadialGradient(newX, newY, 0, newX, newY, particle.size + particle.glow);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.4, particle.color.replace('70%', '50%'));
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(newX, newY, particle.size + particle.glow, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core
            ctx.globalAlpha = opacity * 0.8;
            ctx.fillStyle = particle.color.replace('70%', '90%');
            ctx.beginPath();
            ctx.arc(newX, newY, particle.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
          } else if (particle.type === 'sparkle') {
            // Draw sparkle with star effect
            ctx.shadowBlur = particle.glow;
            ctx.shadowColor = particle.color;
            ctx.fillStyle = particle.color;
            
            // Draw star shape
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
              const angle = (i * Math.PI) / 2;
              const x1 = newX + Math.cos(angle) * particle.size;
              const y1 = newY + Math.sin(angle) * particle.size;
              const x2 = newX + Math.cos(angle + Math.PI / 4) * particle.size * 0.4;
              const y2 = newY + Math.sin(angle + Math.PI / 4) * particle.size * 0.4;
              
              if (i === 0) ctx.moveTo(x1, y1);
              ctx.lineTo(x1, y1);
              ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            
          } else if (particle.type === 'mist') {
            // Draw mist with soft gradient
            const gradient = ctx.createRadialGradient(newX, newY, 0, newX, newY, particle.size + particle.glow);
            gradient.addColorStop(0, particle.color.replace('60%', '40%'));
            gradient.addColorStop(0.6, particle.color.replace('60%', '20%'));
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(newX, newY, particle.size + particle.glow, 0, Math.PI * 2);
            ctx.fill();
          }

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
  }, [particles.length, intensity]); // Added intensity dependency

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
      className={`fixed inset-0 w-full h-full sm:w-screen sm:h-screen pointer-events-none z-0 ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleSystem;