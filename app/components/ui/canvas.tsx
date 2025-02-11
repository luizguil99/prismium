import { useEffect, useRef } from 'react';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cursorTrails: { x: number; y: number; opacity: number }[] = [];
    let animationFrameId: number;
    let isDrawing = false;

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas || !ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      cursorTrails.push({
        x,
        y,
        opacity: 1
      });

      if (cursorTrails.length > 50) {
        cursorTrails = cursorTrails.slice(-50);
      }
    }

    function animate() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      cursorTrails.forEach((point, index) => {
        point.opacity -= 0.02;
        
        if (point.opacity <= 0) {
          cursorTrails.splice(index, 1);
          return;
        }

        const size = 20; // Aumentei o tamanho para ficar mais visível
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, size
        );
        
        // Cores mais vibrantes
        gradient.addColorStop(0, `rgba(64, 156, 255, ${point.opacity})`);
        gradient.addColorStop(0.5, `rgba(128, 0, 255, ${point.opacity * 0.7})`);
        gradient.addColorStop(1, 'rgba(128, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    // Inicialização
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove); // Mudei para window
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10, // Aumentei o z-index
        opacity: 0.8 // Adicionei uma opacidade para suavizar
      }}
    />
  );
} 