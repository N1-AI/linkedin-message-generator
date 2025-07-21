"use client"

import { useState, useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";

interface StyleSelectorProps {
  onStyleChange?: (professional: number, length: number) => void;
}

export function StyleSelector({ onStyleChange }: StyleSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Center by default
  const [isDragging, setIsDragging] = useState(false);

  const calculateStyles = (x: number, y: number) => {
    // Convert x,y coordinates to professional (1-4) and length (1-3) values
    const professional = Math.max(1, Math.min(4, Math.round((x / 100) * 3) + 1));
    const length = Math.max(1, Math.min(3, Math.round((y / 100) * 2) + 1));
    return { professional, length };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setIsDragging(true);
    setPosition({ x, y });
    
    const { professional, length } = calculateStyles(x, y);
    onStyleChange?.(professional, length);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    setPosition({ x, y });
    
    const { professional, length } = calculateStyles(x, y);
    onStyleChange?.(professional, length);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as any, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove as any);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="space-y-3">
      <Label className="text-sm text-gray-500">Style</Label>
      <div 
        ref={containerRef}
        className="relative w-full h-[200px] bg-gray-50 rounded-md overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Grid lines - positioned behind text */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-gray-200/40" />
          ))}
        </div>

        {/* Labels - positioned above grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          <div className="text-center text-sm text-gray-400 font-light">casual</div>
          <div className="text-center text-sm text-gray-400 font-light">professional</div>
        </div>
        <div className="absolute inset-0 flex justify-between items-center px-4">
          <div className="text-sm text-gray-400 font-light">short</div>
          <div className="text-sm text-gray-400 font-light">long</div>
        </div>

        {/* Draggable bubble - positioned at the very top */}
        <div 
          className="absolute w-4 h-4 bg-gray-300 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 transition-shadow hover:shadow-md"
          style={{ 
            left: `${position.x}%`,
            top: `${position.y}%`,
            zIndex: 10
          }}
        >
          <div className="absolute inset-[3px] bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
} 