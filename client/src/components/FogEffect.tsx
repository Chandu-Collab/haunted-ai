import React, { useEffect, useRef } from 'react';

interface FogLayer {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  direction: number;
}

interface FogEffectProps {
  intensity?: number;
  className?: string;
}

const FogEffect: React.FC<FogEffectProps> = ({ 
  intensity = 3, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogLayersRef = useRef<FogLayer[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize fog layers
    const initializeFog = () => {
      fogLayersRef.current = [];
      for (let i = 0; i < intensity; i++) {
        fogLayersRef.current.push({
          id: i,
          x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
          y: Math.random() * canvas.height,
          width: canvas.width * (0.8 + Math.random() * 0.4),
          height: 100 + Math.random() * 200,
          opacity: 0.05 + Math.random() * 0.1,
          speed: 0.2 + Math.random() * 0.3,
          direction: Math.random() * Math.PI * 2
        });
      }
    };

    const createGradient = (layer: FogLayer) => {
      const gradient = ctx.createRadialGradient(
        layer.x + layer.width / 2,
        layer.y + layer.height / 2,
        0,
        layer.x + layer.width / 2,
        layer.y + layer.height / 2,
        layer.width / 2
      );
      
      gradient.addColorStop(0, `rgba(124, 45, 255, ${layer.opacity})`);
      gradient.addColorStop(0.3, `rgba(76, 19, 179, ${layer.opacity * 0.7})`);
      gradient.addColorStop(0.7, `rgba(46, 10, 102, ${layer.opacity * 0.3})`);
      gradient.addColorStop(1, 'transparent');
      
      return gradient;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fogLayersRef.current.forEach(layer => {
        // Update position
        layer.x += Math.cos(layer.direction) * layer.speed;
        layer.y += Math.sin(layer.direction) * layer.speed * 0.3;

        // Wrap around screen
        if (layer.x > canvas.width + layer.width / 2) {
          layer.x = -layer.width / 2;
        }
        if (layer.x < -layer.width / 2) {
          layer.x = canvas.width + layer.width / 2;
        }
        if (layer.y > canvas.height + layer.height / 2) {
          layer.y = -layer.height / 2;
        }
        if (layer.y < -layer.height / 2) {
          layer.y = canvas.height + layer.height / 2;
        }

        // Subtle opacity oscillation
        layer.opacity = (0.05 + Math.sin(Date.now() * 0.001 + layer.id) * 0.03);

        // Draw fog layer
        ctx.save();
        ctx.fillStyle = createGradient(layer);
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeFog();
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
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[1] ${className}`}
      style={{ mixBlendMode: 'multiply' }}
    />
  );
};

export default FogEffect;