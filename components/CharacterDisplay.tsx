
import React from 'react';
import { CharacterStats } from '../types';
import ProgressBar from './ProgressBar';

interface CharacterDisplayProps {
  stats: CharacterStats;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ stats, isEnemy = false, isAttacking = false, isHit = false }) => {
  const colorMap: Record<string, { bg: string, shadow: string, text: string, glow: string }> = {
    blue: { bg: 'bg-blue-400', shadow: 'saber-blue', text: 'text-blue-400', glow: 'glow-blue' },
    green: { bg: 'bg-emerald-400', shadow: 'saber-green', text: 'text-emerald-400', glow: 'glow-green' },
    purple: { bg: 'bg-purple-500', shadow: 'saber-purple', text: 'text-purple-500', glow: 'glow-purple' },
    red: { bg: 'bg-red-500', shadow: 'saber-red', text: 'text-red-400', glow: 'glow-red' },
  };

  const selectedColor = stats.saberColor || (isEnemy ? 'red' : 'blue');
  const theme = colorMap[selectedColor] || colorMap.blue;
  
  return (
    <div className={`flex flex-col items-center p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 backdrop-blur-xl transition-all duration-500 
      ${isAttacking ? (isEnemy ? '-translate-x-12 scale-105' : 'translate-x-12 scale-105') : ''} 
      ${isHit ? 'animate-shake' : ''} 
      ${stats.isGuarding ? 'ring-2 ring-blue-500/50 ring-offset-4 ring-offset-slate-950' : ''}
      shadow-2xl relative overflow-hidden`}>
      
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${isHit ? 'opacity-100 animate-flash-red' : 'opacity-0'}`}></div>

      <div className="relative mb-6 z-10">
        <div className={`w-36 h-36 rounded-full border-2 p-1 transition-colors duration-500 ${isEnemy ? 'border-red-600/30' : `border-${selectedColor}-600/30`} overflow-hidden bg-slate-800 shadow-inner`}>
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <img 
              src={`https://picsum.photos/seed/${isEnemy ? (stats.name === 'Darth Malgus' ? 'vader-real' : 'sith-generic-' + stats.level) : 'jedi-hero-' + stats.level}/300`} 
              alt={stats.name} 
              className={`w-full h-full object-cover transition-all duration-500 ${isHit ? 'grayscale-0 scale-110 sepia-[0.3] saturate-[2]' : 'grayscale-[0.3] scale-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
          </div>
        </div>
        
        {stats.isGuarding && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-bold px-2 py-1 rounded-full animate-pulse shadow-lg border border-blue-400">
            GUARDING
          </div>
        )}
        
        <div className={`absolute ${isEnemy ? '-left-10' : '-right-10'} top-1/2 -translate-y-1/2 h-44 w-2 ${theme.bg} ${theme.shadow} rounded-full transition-all duration-300 ${stats.hp <= 0 ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}`}>
          <div className={`absolute top-0 w-full h-full ${theme.bg} blur-md animate-flicker`}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-10 bg-slate-700 rounded-t-sm border border-slate-500 flex flex-col justify-end pb-1 space-y-1 items-center shadow-lg">
             <div className="w-2 h-[1px] bg-slate-400"></div>
             <div className="w-2 h-[1px] bg-slate-400"></div>
          </div>
        </div>
      </div>

      <div className="text-center z-10 w-full">
        <h3 className={`text-2xl font-orbitron font-bold mb-0.5 tracking-tighter ${theme.text} ${theme.glow}`}>
          {stats.name}
        </h3>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-4">
          Rank: {isEnemy ? `Level ${stats.level} Sith Lord` : `Level ${stats.level} Jedi Knight`}
        </p>
        
        <div className="w-full space-y-4">
          <ProgressBar 
            current={stats.hp} 
            max={stats.maxHp} 
            color={isEnemy ? 'bg-red-600' : 'bg-emerald-500'} 
            label="Vitality" 
          />
          
          <div className="grid grid-cols-3 gap-2 px-2">
             <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                <span className="block text-[8px] text-slate-500 uppercase tracking-tighter">Attack</span>
                <span className="text-xs font-mono font-bold text-slate-300">{stats.attack}</span>
             </div>
             <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                <span className="block text-[8px] text-slate-500 uppercase tracking-tighter">Defense</span>
                <span className="text-xs font-mono font-bold text-slate-300">{stats.defense}</span>
             </div>
             <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                <span className="block text-[8px] text-slate-500 uppercase tracking-tighter">Potions</span>
                <span className={`text-[10px] font-bold ${stats.potions > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                  {stats.potions}
                </span>
             </div>
          </div>

          {!isEnemy && (
            <div className="pt-2">
              <ProgressBar 
                current={stats.exp} 
                max={500} 
                color="bg-blue-600" 
                label="Force attunement" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterDisplay;
