
import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  color: string;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, color, label }) => {
  const [ghostWidth, setGhostWidth] = useState(0);
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  // Ghost bar catches up after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setGhostWidth(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-[9px] font-mono text-slate-400">{current} / {max}</span>
      </div>
      <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden border border-slate-800 relative">
        {/* Ghost/Lag Bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-slate-600/30 transition-all duration-1000 ease-out"
          style={{ width: `${ghostWidth}%` }}
        ></div>
        {/* Main Value Bar */}
        <div 
          className={`h-full transition-all duration-300 ease-out relative z-10 ${color}`} 
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle pulse effect on the tip */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 blur-[1px]"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
