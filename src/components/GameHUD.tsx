import React from 'react';
import { PlayerStats, BiomeConfig, Room, Enemy, Weapon } from '../types/game';
import { Heart, Shield, Sparkles, Crosshair, Sword, Disc, RefreshCw, Zap, MapPin } from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  biome: BiomeConfig;
  currentRoom: Room;
  allRooms: Room[];
  activeBoss?: Enemy;
  activeMelee: Weapon;
  activeRanged: Weapon;
  dashCooldownProgress: number; // 0 to 1
  abilityCooldownProgress: number; // 0 to 1
  shards: number;
  comboCount: number;
  onPause: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  nearbyInteractable?: {
    type: 'portal' | 'shrine' | 'chest' | 'door';
    label: string;
    action: () => void;
  } | null;
  // Touch event callbacks for mobile
  onTouchInput?: (key: string, pressed: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  biome,
  currentRoom,
  allRooms,
  activeBoss,
  activeMelee,
  activeRanged,
  dashCooldownProgress,
  abilityCooldownProgress,
  shards,
  comboCount,
  onPause,
  onToggleSound,
  isMuted,
  nearbyInteractable,
  onTouchInput
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 font-sans">
      {/* Top Header: Player status, Biome info, Minimap, Options */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Health, Flask, Dash */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-neutral-900/90 border border-neutral-700/80 flex items-center justify-center text-rose-500 shadow-md">
              <Heart className="w-5 h-5 fill-rose-500/30" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1 px-1">
                <span className="font-semibold text-neutral-200">ЗДОРОВЬЕ</span>
                <span className="text-rose-400 font-bold">{Math.ceil(stats.hp)} / {stats.maxHp}</span>
              </div>
              <div className="w-48 sm:w-64 h-4 bg-neutral-950/90 rounded-full border border-neutral-800 p-0.5 relative overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-rose-700 via-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Flask Charges & Dash Indicators */}
          <div className="flex items-center gap-3 pl-11">
            {/* Potion Flask */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-md px-2.5 py-1">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-300 font-bold">
                {stats.potionCharges} / {stats.potionMaxCharges}
              </span>
              <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1 rounded ml-1 font-mono">[R]</span>
            </div>

            {/* Dash Charge Pip */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-md px-2.5 py-1">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <div className="w-10 h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-sky-400 transition-all duration-75"
                  style={{ width: `${(1 - dashCooldownProgress) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1 rounded font-mono">[Shift]</span>
            </div>

            {/* Shard currency */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-purple-500/30 rounded-md px-2.5 py-1 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono font-bold text-purple-300">
                {shards}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Biome Title & Combo Counter */}
        <div className="hidden md:flex flex-col items-center text-center">
          <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            {biome.nameEn}
          </span>
          <h2 className="text-base sm:text-lg font-black tracking-wider text-neutral-100 font-serif">
            {biome.name}
          </h2>
          {comboCount > 1 && (
            <div className="mt-1 bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-0.5 text-amber-300 font-mono text-xs font-bold animate-pulse">
              КОМБО x{comboCount}!
            </div>
          )}
        </div>

        {/* Right: Minimap & Quick Settings */}
        <div className="flex items-start gap-3 pointer-events-auto">
          {/* Minimap Box */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-2 rounded-lg shadow-lg flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono mb-1.5">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span>КАРТА ЗАМКА</span>
            </div>
            {/* Grid of rooms */}
            <div className="flex items-center gap-1">
              {allRooms.map((r) => {
                const isCurrent = r.index === currentRoom.index;
                const isVisited = r.visited;
                const isBossRoom = r.type === 'boss';
                const isShrineRoom = r.type === 'shrine';

                let bg = 'bg-neutral-900 border-neutral-800';
                if (isCurrent) {
                  bg = 'bg-sky-500 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse';
                } else if (isVisited) {
                  if (isBossRoom) bg = 'bg-rose-900/60 border-rose-500/70';
                  else if (isShrineRoom) bg = 'bg-amber-900/60 border-amber-500/70';
                  else bg = 'bg-neutral-700/80 border-neutral-600';
                }

                return (
                  <div
                    key={r.index}
                    className={`w-4 h-4 rounded-xs border text-[8px] flex items-center justify-center font-mono font-bold ${bg} text-neutral-200 transition-colors`}
                    title={`Комната ${r.index + 1}: ${r.type}`}
                  >
                    {isBossRoom ? '💀' : isShrineRoom ? '★' : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pause & Mute buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onPause}
              className="w-8 h-8 rounded-lg bg-neutral-900/90 border border-neutral-700 hover:border-neutral-500 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Пауза / Меню (Esc)"
            >
              ⏸
            </button>
            <button
              onClick={onToggleSound}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                  : 'bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="Звук / Музыка"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Boss Health Bar if Boss is Active */}
      {activeBoss && activeBoss.hp > 0 && (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center pointer-events-auto mt-2">
          <div className="flex items-center justify-between w-full text-xs font-mono mb-1 px-2">
            <span className="text-rose-400 font-bold tracking-wider uppercase">{activeBoss.name}</span>
            <span className="text-neutral-400">
              {Math.ceil(activeBoss.hp)} / {activeBoss.maxHp} [Фаза {activeBoss.bossPhase || 1}/3]
            </span>
          </div>
          <div className="w-full h-3.5 bg-neutral-950 rounded-full border border-rose-900/80 p-0.5 overflow-hidden shadow-[0_0_16px_rgba(225,29,72,0.4)]">
            <div
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-rose-700 via-rose-600 to-amber-500 shadow-sm"
              style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive Context Action Prompt: Visible and Clickable */}
      {nearbyInteractable && (
        <div className="w-full flex justify-center my-2 pointer-events-auto">
          <button
            onClick={nearbyInteractable.action}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-mono text-xs sm:text-sm font-bold shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse ${
              nearbyInteractable.type === 'portal'
                ? 'bg-purple-950/95 border-purple-400 text-purple-100 shadow-[0_0_30px_rgba(168,85,247,0.6)] ring-2 ring-purple-500/40'
                : nearbyInteractable.type === 'shrine'
                ? 'bg-amber-950/95 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-2 ring-amber-500/40'
                : nearbyInteractable.type === 'chest'
                ? 'bg-sky-950/95 border-sky-400 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.5)] ring-2 ring-sky-500/40'
                : 'bg-neutral-900/95 border-neutral-400 text-neutral-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            <span className="bg-white/20 border border-white/40 px-2 py-0.5 rounded text-[11px] font-mono font-black text-white">
              [E] / КЛИК
            </span>
            <span className="tracking-wide uppercase font-serif">{nearbyInteractable.label}</span>
          </button>
        </div>
      )}

      {/* Bottom Bar: Weapon Slots & Active Abilities */}
      <div className="flex items-end justify-between w-full">
        {/* Weapons & Skills */}
        <div className="flex items-center gap-2 pointer-events-auto bg-neutral-950/80 border border-neutral-800/80 p-2 rounded-xl backdrop-blur-sm">
          {/* Melee Weapon */}
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-sky-500/40 rounded-lg p-2 relative shadow-md">
            <div className="w-8 h-8 rounded bg-sky-950/60 border border-sky-800 flex items-center justify-center text-sky-400">
              <Sword className="w-4 h-4" />
            </div>
            <div className="flex flex-col pr-1">
              <div className="text-[10px] text-neutral-400 font-mono leading-none">БЛИЖНИЙ [J/ЛКМ]</div>
              <div className="text-xs font-bold text-neutral-100">{activeMelee.name}</div>
              <div className="text-[10px] text-sky-300 font-mono">{activeMelee.baseDamage} Урона</div>
            </div>
          </div>

          {/* Ranged Weapon */}
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-emerald-500/40 rounded-lg p-2 relative shadow-md">
            <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="flex flex-col pr-1">
              <div className="text-[10px] text-neutral-400 font-mono leading-none">ДАЛЬНИЙ [I/U]</div>
              <div className="text-xs font-bold text-neutral-100">{activeRanged.name}</div>
              <div className="text-[10px] text-emerald-300 font-mono">{activeRanged.baseDamage} Урона</div>
            </div>
          </div>

          {/* Special Ability */}
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-purple-500/40 rounded-lg p-2 relative shadow-md">
            <div className="w-8 h-8 rounded bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 relative overflow-hidden">
              <Disc className="w-4 h-4" />
              {abilityCooldownProgress > 0 && (
                <div
                  className="absolute inset-0 bg-neutral-950/70"
                  style={{ height: `${abilityCooldownProgress * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-col pr-1">
              <div className="text-[10px] text-neutral-400 font-mono leading-none">НАВЫК [Q]</div>
              <div className="text-xs font-bold text-neutral-100">Всплеск Пустоты</div>
              <div className="text-[10px] text-purple-300 font-mono">
                {abilityCooldownProgress > 0 ? 'Перезарядка...' : 'ГОТОВ'}
              </div>
            </div>
          </div>

          {/* Parry Shield */}
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-cyan-500/40 rounded-lg p-2 relative shadow-md">
            <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col pr-1">
              <div className="text-[10px] text-neutral-400 font-mono leading-none">ПАРИРОВАНИЕ [L/ПКМ]</div>
              <div className="text-xs font-bold text-neutral-100">Блок & Рипост</div>
              <div className="text-[10px] text-cyan-300 font-mono">Крит x{stats.parryDamageMul.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Controls Cheatsheet for PC */}
        <div className="hidden lg:flex flex-col items-end gap-1 text-[11px] font-mono text-neutral-400 bg-neutral-950/70 border border-neutral-800/80 p-2.5 rounded-xl">
          <div className="text-neutral-300 font-bold">УПРАВЛЕНИЕ:</div>
          <div>WASD / Стрелки : Движение & Прыжок</div>
          <div>Space : Прыжок / Двойной прыжок</div>
          <div>Shift / K : Перекат / Рывок (I-frames)</div>
          <div>J / ЛКМ : Атака комбо</div>
          <div>L / ПКМ : Парирование</div>
          <div>I / E : Выстрел</div>
          <div>E : Взаимодействие (Алтарь/Двери)</div>
        </div>
      </div>

      {/* On-screen touch buttons for mobile/tablets */}
      <div className="flex md:hidden justify-between w-full pointer-events-auto mt-2 select-none">
        {/* D-Pad */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => onTouchInput?.('left', true)}
            onPointerUp={() => onTouchInput?.('left', false)}
            className="w-13 h-13 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-200 text-lg flex items-center justify-center active:bg-sky-700"
          >
            ←
          </button>
          <button
            onPointerDown={() => onTouchInput?.('right', true)}
            onPointerUp={() => onTouchInput?.('right', false)}
            className="w-13 h-13 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-200 text-lg flex items-center justify-center active:bg-sky-700"
          >
            →
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={() => onTouchInput?.('dash', true)}
            onPointerUp={() => onTouchInput?.('dash', false)}
            className="w-11 h-11 rounded-full bg-sky-950/80 border border-sky-600 text-sky-300 text-xs font-bold flex items-center justify-center active:bg-sky-600"
          >
            DASH
          </button>
          <button
            onPointerDown={() => onTouchInput?.('parry', true)}
            onPointerUp={() => onTouchInput?.('parry', false)}
            className="w-11 h-11 rounded-full bg-cyan-950/80 border border-cyan-600 text-cyan-300 text-xs font-bold flex items-center justify-center active:bg-cyan-600"
          >
            PARRY
          </button>
          <button
            onPointerDown={() => onTouchInput?.('jump', true)}
            onPointerUp={() => onTouchInput?.('jump', false)}
            className="w-13 h-13 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold flex items-center justify-center active:bg-emerald-600"
          >
            JUMP
          </button>
          <button
            onPointerDown={() => onTouchInput?.('attackMelee', true)}
            onPointerUp={() => onTouchInput?.('attackMelee', false)}
            className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-sm font-bold flex items-center justify-center active:bg-rose-600"
          >
            SLASH
          </button>
        </div>
      </div>
    </div>
  );
};
