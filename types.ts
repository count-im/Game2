
export interface CharacterStats {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  saberColor?: string;
  crit: number;      // 0 to 1
  evasion: number;   // 0 to 1
  potions: number;
  cooldowns: {
    powerStrike: number;
  };
  isGuarding: boolean;
}

export enum GameState {
  START = 'START',
  PROLOGUE = 'PROLOGUE',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
  EPILOGUE = 'EPILOGUE'
}

export interface CombatLogEntry {
  id: string;
  message: string;
  type: 'player' | 'enemy' | 'system';
}

export type CombatAction = 'ATTACK' | 'POWER_STRIKE' | 'GUARD' | 'POTION';
