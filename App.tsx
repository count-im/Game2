
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, CharacterStats, CombatLogEntry, CombatAction } from './types';
import CharacterDisplay from './components/CharacterDisplay';
import { generateCombatDescription, generateVictoryMessage, generateBattleBackground } from './services/geminiService';

const ENEMIES_LIST = [
  { name: "Sith Acolyte", level: 1 },
  { name: "Inquisitor Seventh", level: 2 },
  { name: "Grand Inquisitor", level: 3 },
  { name: "Darth Malgus", level: 4 }
];

const SABER_COLORS = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-emerald-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' }
];

// Fallback high-quality space background
const DEFAULT_SPACE_BG = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=2000";

const PROLOGUE_MUSIC_URL = "https://cdn.pixabay.com/audio/2022/01/26/audio_d0c6ff1bab.mp3";
const SABER_HUM_URL = "https://cdn.pixabay.com/audio/2022/03/15/audio_8217f7390b.mp3";
const SABER_SWING_URL = "https://cdn.pixabay.com/audio/2022/03/15/audio_507316710b.mp3";
const SABER_CLASH_URL = "https://cdn.pixabay.com/audio/2022/03/24/audio_3320f77241.mp3";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [battleBackground, setBattleBackground] = useState<string | null>(null);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  
  const [player, setPlayer] = useState<CharacterStats>({
    name: '',
    level: 1,
    hp: 120,
    maxHp: 120,
    attack: 30,
    defense: 10,
    exp: 0,
    saberColor: 'blue',
    crit: 0.15,
    evasion: 0.10,
    potions: 3,
    cooldowns: { powerStrike: 0 },
    isGuarding: false
  });
  
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const [enemy, setEnemy] = useState<CharacterStats | null>(null);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAttacker, setActiveAttacker] = useState<'player' | 'enemy' | null>(null);
  const [activeHit, setActiveHit] = useState<'player' | 'enemy' | null>(null);
  const [showBlueText, setShowBlueText] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const humAudioRef = useRef<HTMLAudioElement | null>(null);
  const swingAudioRef = useRef<HTMLAudioElement | null>(null);
  const clashAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    humAudioRef.current = new Audio(SABER_HUM_URL);
    humAudioRef.current.loop = true;
    swingAudioRef.current = new Audio(SABER_SWING_URL);
    clashAudioRef.current = new Audio(SABER_CLASH_URL);
    
    return () => {
      humAudioRef.current?.pause();
      swingAudioRef.current?.pause();
      clashAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (gameState === GameState.PROLOGUE) {
      const timer = setTimeout(() => setShowBlueText(false), 5000);
      if (audioRef.current && !isMuted) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
      }
      return () => clearTimeout(timer);
    }
  }, [gameState, isMuted]);

  useEffect(() => {
    if (gameState === GameState.BATTLE) {
      if (audioRef.current) {
        const fadeOut = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume -= 0.05;
          } else {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            clearInterval(fadeOut);
          }
        }, 100);
      }
      if (humAudioRef.current && !isMuted) {
        humAudioRef.current.volume = 0.15;
        humAudioRef.current.play().catch(e => console.warn("Hum play blocked:", e));
      }
    } else if (gameState === GameState.VICTORY || gameState === GameState.DEFEAT) {
      humAudioRef.current?.pause();
    }
  }, [gameState, isMuted]);

  const addLog = (message: string, type: 'player' | 'enemy' | 'system') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36), message, type }]);
  };

  const createEnemy = (index: number) => {
    const template = ENEMIES_LIST[index];
    const level = template.level;
    const hp = (Math.floor(Math.random() * 20) + 40) * level;
    return {
      name: template.name,
      level: level,
      hp: hp,
      maxHp: hp,
      attack: (Math.floor(Math.random() * 10) + 12) * level,
      defense: (Math.floor(Math.random() * 4) + 4) * level,
      saberColor: 'red',
      crit: Math.min(0.03 + 0.02 * level, 0.15),
      evasion: Math.min(0.02 + 0.01 * level, 0.12),
      potions: 0,
      cooldowns: { powerStrike: 0 },
      isGuarding: false,
      exp: 0
    };
  };

  const fetchNewBackground = async () => {
    setIsBackgroundLoading(true);
    const bg = await generateBattleBackground();
    if (bg) setBattleBackground(bg);
    setIsBackgroundLoading(false);
  };

  const startGameAfterPrologue = async () => {
    const initialPlayer = { ...player, name: playerName, saberColor: selectedColor };
    setPlayer(initialPlayer);
    const firstEnemy = createEnemy(0);
    setEnemy(firstEnemy);
    setGameState(GameState.BATTLE);
    addLog(`Battle started! ${firstEnemy.name} emerges from the shadows.`, 'system');
    fetchNewBackground();
  };

  const handleLevelUp = (p: CharacterStats): CharacterStats => {
    let newPlayer = { ...p };
    while (newPlayer.exp >= 500) {
      newPlayer.exp -= 500;
      newPlayer.level += 1;
      newPlayer.maxHp += 40;
      newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 50); 
      newPlayer.attack += 15;
      newPlayer.defense += 8;
      addLog(`Your attunement with the Force deepens! You are now Level ${newPlayer.level}.`, 'system');
    }
    return newPlayer;
  };

  const postBattleRest = (p: CharacterStats): CharacterStats => {
    const healAmount = Math.floor(p.maxHp * 0.25);
    const newHp = Math.min(p.maxHp, p.hp + healAmount);
    addLog(`Through meditation, you recover ${healAmount} health.`, 'system');
    return { ...p, hp: newHp };
  };

  const playSwingSound = () => {
    if (swingAudioRef.current && !isMuted) {
      swingAudioRef.current.currentTime = 0;
      swingAudioRef.current.volume = 0.4;
      swingAudioRef.current.play().catch(e => console.warn("Swing sound blocked:", e));
    }
  };

  const playClashSound = () => {
    if (clashAudioRef.current && !isMuted) {
      clashAudioRef.current.currentTime = 0;
      clashAudioRef.current.volume = 0.5;
      clashAudioRef.current.play().catch(e => console.warn("Clash sound blocked:", e));
    }
  };

  const executeTurn = async (action: CombatAction) => {
    if (isProcessing || !enemy || player.hp <= 0) return;
    setIsProcessing(true);

    let playerRef = { ...player };
    let enemyRef = { ...enemy };
    
    if (action === 'POTION') {
      if (playerRef.potions > 0) {
        const heal = 50;
        playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + heal);
        playerRef.potions -= 1;
        addLog(`You use a stim-pack, recovering ${heal} health.`, 'player');
      } else {
        addLog(`You have no stim-packs remaining! Basic strike initiated instead.`, 'system');
        action = 'ATTACK';
      }
    }

    if (action === 'GUARD') {
      playerRef.isGuarding = true;
      addLog(`You adopt a defensive Soresu stance, preparing to parry.`, 'player');
    }

    if (action === 'ATTACK' || action === 'POWER_STRIKE') {
      setActiveAttacker('player');
      playSwingSound();
      
      let damage = Math.floor(Math.random() * playerRef.attack) + 10;
      let isCrit = Math.random() < playerRef.crit;
      if (action === 'POWER_STRIKE') {
        damage = Math.floor(damage * 2.2);
        playerRef.cooldowns.powerStrike = 3;
      }
      if (isCrit) damage = Math.floor(damage * 1.8);

      const actualDamage = Math.max(0, damage - enemyRef.defense);

      await new Promise(r => setTimeout(r, 400));
      
      if (Math.random() < enemyRef.evasion) {
        addLog(`${enemyRef.name} masterfully evades your strike!`, 'enemy');
      } else {
        playClashSound();
        setActiveHit('enemy');
        enemyRef.hp = Math.max(0, enemyRef.hp - actualDamage);
        const desc = await generateCombatDescription(playerRef.name, enemyRef.name, actualDamage, true);
        addLog(`${isCrit ? '(CRITICAL!) ' : ''}${desc}`, 'player');
      }

      await new Promise(r => setTimeout(r, 400));
      setActiveHit(null);
      await new Promise(r => setTimeout(r, 400));
      setActiveAttacker(null);
    }

    setPlayer(playerRef);
    setEnemy(enemyRef);

    if (enemyRef.hp <= 0) {
      addLog(`${enemyRef.name} has been bested. The dark aura fades.`, 'system');
      const expGained = enemyRef.level * 200;
      addLog(`You gained ${expGained} experience.`, 'system');
      
      let nextPlayer = { ...playerRef, exp: playerRef.exp + expGained, isGuarding: false };
      nextPlayer = handleLevelUp(nextPlayer);
      
      if (currentEnemyIndex + 1 < ENEMIES_LIST.length) {
        nextPlayer = postBattleRest(nextPlayer);
        setPlayer(nextPlayer);
        const nextIndex = currentEnemyIndex + 1;
        setCurrentEnemyIndex(nextIndex);
        setEnemy(createEnemy(nextIndex));
        addLog(`Deepening your focus, you sense a new disturbance...`, 'system');
        fetchNewBackground(); 
      } else {
        setPlayer(nextPlayer);
        setGameState(GameState.VICTORY);
      }
      setIsProcessing(false);
      return;
    }

    await new Promise(r => setTimeout(r, 400));
    setActiveAttacker('enemy');
    playSwingSound();

    let eDamage = Math.floor(Math.random() * enemyRef.attack) + 8;
    let isECrit = Math.random() < enemyRef.crit;
    if (isECrit) eDamage = Math.floor(eDamage * 1.8);
    
    let finalEDamage = Math.max(0, eDamage - playerRef.defense);
    if (playerRef.isGuarding) {
      finalEDamage = Math.floor(finalEDamage * 0.4);
      playerRef.isGuarding = false;
    }

    await new Promise(r => setTimeout(r, 400));

    if (Math.random() < playerRef.evasion) {
      addLog(`You sense the movement through the Force and evade ${enemyRef.name}'s blade!`, 'player');
    } else {
      playClashSound();
      setActiveHit('player');
      playerRef.hp = Math.max(0, playerRef.hp - finalEDamage);
      const eDesc = await generateCombatDescription(enemyRef.name, playerRef.name, finalEDamage, false);
      addLog(`${isECrit ? '(CRITICAL!) ' : ''}${eDesc}`, 'enemy');
    }

    await new Promise(r => setTimeout(r, 400));
    setActiveHit(null);
    await new Promise(r => setTimeout(r, 400));
    setActiveAttacker(null);

    if (playerRef.cooldowns.powerStrike > 0) {
      playerRef.cooldowns.powerStrike -= 1;
    }

    setPlayer(playerRef);
    if (playerRef.hp <= 0) {
      setGameState(GameState.DEFEAT);
    }

    setIsProcessing(false);
  };

  const restart = () => {
    window.location.reload();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      if (newMuted) audioRef.current.pause();
      else if (gameState === GameState.PROLOGUE) audioRef.current.play();
    }
    if (humAudioRef.current) {
      if (newMuted) humAudioRef.current.pause();
      else if (gameState === GameState.BATTLE) humAudioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative transition-colors duration-1000 overflow-hidden">
      <audio ref={audioRef} src={PROLOGUE_MUSIC_URL} loop />
      
      {/* Starfield Layer (Lowest) */}
      <div className="starfield"></div>
      
      {/* Background Layer (Battle specific) */}
      <div 
        className={`fixed inset-0 z-[-5] transition-opacity duration-[3000ms] ease-in-out bg-battle ${gameState === GameState.BATTLE ? 'opacity-50' : 'opacity-0'}`}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${battleBackground || DEFAULT_SPACE_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {isBackgroundLoading && gameState === GameState.BATTLE && (
        <div className="fixed top-20 right-10 z-50 flex items-center space-x-2 text-[10px] uppercase tracking-widest text-blue-400 opacity-50 bg-slate-950/80 p-2 rounded-full border border-blue-900/50 backdrop-blur-md">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span>Rendering Sector Background...</span>
        </div>
      )}
      
      <button 
        onClick={toggleMute}
        className="fixed top-6 right-6 z-[100] bg-slate-900/50 backdrop-blur-md border border-slate-700 p-3 rounded-full hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1V10a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {gameState === GameState.START && (
        <div className="flex flex-col items-center z-10 w-full max-w-xl px-4 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-10">
            <h1 className="text-6xl md:text-8xl font-orbitron font-bold tracking-tighter text-blue-500 glow-blue uppercase">
              Jedi Duel
            </h1>
            <p className="text-slate-400 mt-2 tracking-[0.4em] uppercase text-xs font-light">Galactic Conflict Legacy</p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-8 md:p-10 shadow-2xl text-center w-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-lg font-orbitron mb-8 uppercase tracking-widest text-slate-300">Identity Protocol</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] text-slate-500 uppercase tracking-[0.2em] block text-left ml-1">Padawan Designation</label>
                <input 
                  type="text" 
                  placeholder="Enter Name..." 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center text-lg focus:outline-none focus:border-blue-500/50 transition-all font-orbitron tracking-wider text-blue-100"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[9px] text-slate-500 uppercase tracking-[0.2em] block text-left ml-1">Kyber Crystal Attunement</label>
                <div className="grid grid-cols-4 gap-4 bg-slate-950/30 p-5 rounded-xl border border-slate-800">
                  {SABER_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`h-12 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${color.class} ${
                        selectedColor === color.name ? 'border-white ring-2 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                    >
                       {selectedColor === color.name && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setGameState(GameState.PROLOGUE)}
                disabled={!playerName.trim()}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-30 text-white font-bold py-5 rounded-xl uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl shadow-blue-900/20 text-lg border-b-4 border-blue-900"
              >
                Invoke the Force
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.PROLOGUE && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-1000">
          {showBlueText ? (
            <div className="fade-in-blue font-serif italic text-2xl px-8 max-w-2xl">
              A long time ago in a galaxy far, far away....
            </div>
          ) : (
            <div className="crawl-container">
              <div className="crawl-content">
                <h1>Episode I</h1>
                <h2>The Padawan's Trial</h2>
                <p>
                  It is a time of great uncertainty. The DARK SIDE of the Force has begun to shadow the outer rim, 
                  as mysterious Sith warriors emerge to challenge the peace of the Republic.
                </p>
                <br />
                <p>
                  Young {playerName.toUpperCase()}, a promising Padawan, has been dispatched to a forgotten star system 
                  to investigate reports of a Sith Acolyte gathering forbidden artifacts.
                </p>
                <br />
                <p>
                  Guided by the light and armed with a signature {selectedColor.toUpperCase()} lightsaber, the trial begins. The destiny of 
                  the Jedi Order—and the entire galaxy—rests on the shoulders of one who must learn to 
                  trust the Force above all else....
                </p>
              </div>
              
              <button 
                onClick={startGameAfterPrologue}
                className="absolute bottom-10 right-10 bg-white/5 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[10px] transition-all backdrop-blur-md z-50 hover:border-white/50"
              >
                Skip to Battle
              </button>
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={startGameAfterPrologue}
              ></div>
            </div>
          )}
        </div>
      )}

      {gameState === GameState.BATTLE && enemy && (
        <div className="w-full max-w-7xl p-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
            <div className="lg:col-span-1">
              <CharacterDisplay stats={player} isAttacking={activeAttacker === 'player'} isHit={activeHit === 'player'} />
            </div>

            <div className="lg:col-span-2 flex flex-col h-[600px] bg-slate-950/60 backdrop-blur-xl rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 opacity-20"></div>

              <div className="p-4 border-b border-slate-800/50 bg-slate-900/30 flex justify-between items-center z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  <span className="text-[10px] text-slate-400 font-orbitron tracking-[0.3em] uppercase">Battle Link Established</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">ENCOUNTER {currentEnemyIndex + 1} / {ENEMIES_LIST.length}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[13px] custom-scrollbar z-10">
                {logs.map((log) => (
                  <div key={log.id} className={`p-4 rounded-xl border-l-4 transition-all duration-500 animate-in slide-in-from-left-4 ${
                    log.type === 'player' ? 'border-blue-500 bg-blue-900/10 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.05)]' :
                    log.type === 'enemy' ? 'border-red-500 bg-red-900/10 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
                    'border-slate-600 bg-slate-900/40 text-slate-400 italic'
                  }`}>
                    <div className="flex items-start space-x-3">
                       <span className="opacity-30 mt-1">{log.type === 'player' ? '>>' : log.type === 'enemy' ? '<<' : '--'}</span>
                       <span className="leading-relaxed">{log.message}</span>
                    </div>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>

              <div className="p-4 border-t border-slate-800/50 bg-slate-900/40 z-10">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => executeTurn('ATTACK')}
                    disabled={isProcessing}
                    className="py-3 px-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-100 border border-blue-500/50 rounded-xl uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-30"
                  >
                    Lightsaber Strike
                  </button>
                  <button 
                    onClick={() => executeTurn('POWER_STRIKE')}
                    disabled={isProcessing || player.cooldowns.powerStrike > 0}
                    className="py-3 px-4 bg-purple-600/20 hover:bg-purple-600/40 text-purple-100 border border-purple-500/50 rounded-xl uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-30 relative overflow-hidden"
                  >
                    Force Smash
                    {player.cooldowns.powerStrike > 0 && (
                      <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-[10px] text-slate-400">
                        CD: {player.cooldowns.powerStrike}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={() => executeTurn('GUARD')}
                    disabled={isProcessing}
                    className="py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-100 border border-emerald-500/50 rounded-xl uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-30"
                  >
                    Soresu Guard
                  </button>
                  <button 
                    onClick={() => executeTurn('POTION')}
                    disabled={isProcessing || player.potions <= 0}
                    className="py-3 px-4 bg-red-600/20 hover:bg-red-600/40 text-red-100 border border-red-500/50 rounded-xl uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-30 flex justify-between items-center"
                  >
                    <span>Stim-Pack</span>
                    <span className="bg-red-500/20 px-2 rounded text-[10px]">{player.potions}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <CharacterDisplay stats={enemy} isEnemy isAttacking={activeAttacker === 'enemy'} isHit={activeHit === 'enemy'} />
            </div>
          </div>
        </div>
      )}

      {(gameState === GameState.VICTORY || gameState === GameState.DEFEAT) && (
        <div className="max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-3xl border border-slate-700/50 rounded-[40px] p-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 z-10 relative overflow-hidden">
          <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${gameState === GameState.VICTORY ? 'bg-blue-500' : 'bg-red-500'}`}></div>
          <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${gameState === GameState.VICTORY ? 'bg-blue-500' : 'bg-red-500'}`}></div>

          <h2 className={`text-6xl md:text-8xl font-orbitron font-bold mb-8 tracking-tighter ${gameState === GameState.VICTORY ? 'text-blue-500 glow-blue' : 'text-red-500 glow-red'}`}>
            {gameState === GameState.VICTORY ? 'MASTERY' : 'OBLIVION'}
          </h2>
          
          <div className="my-10 text-xl leading-relaxed text-slate-300 font-light max-w-xl mx-auto">
            {gameState === GameState.VICTORY ? (
              <p>The Force flows through you with blinding clarity. Peace returns to the sector. You have risen, Master {playerName}.</p>
            ) : (
              <p>The shadows were deeper than anticipated. As you fall, the lights of the galaxy dim. Meditation is required.</p>
            )}
          </div>

          <div className="space-y-6 pt-4">
             <button 
              onClick={restart}
              className="px-12 py-5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-2xl text-sm"
            >
              Restart Simulation
            </button>
          </div>
        </div>
      )}

      {gameState !== GameState.PROLOGUE && (
        <footer className="fixed bottom-6 text-slate-700 text-[10px] tracking-[0.5em] uppercase font-orbitron">
          &copy; 2025 Galactic Archive &bull; Jedi Duel Protocol v3.0
        </footer>
      )}
    </div>
  );
};

export default App;
