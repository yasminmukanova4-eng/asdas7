import React from 'react';
import { PlayerStats, Weapon } from '../types/game';
import { Volume2, VolumeX, RotateCcw, Play, BookOpen, Shield } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface PauseModalProps {
  stats: PlayerStats;
  meleeWeapon: Weapon;
  rangedWeapon: Weapon;
  onResume: () => void;
  onSurrender: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onVolumeChange: (val: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  meleeWeapon,
  rangedWeapon,
  onResume,
  onSurrender,
  isMuted,
  onToggleSound,
  onVolumeChange
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150 font-sans">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-6 sm:p-8 flex flex-col shadow-2xl">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div>
            <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">ИГРА ПРИОСТАНОВЛЕНА</span>
            <h2 className="text-2xl font-serif font-black text-white">МЕНЮ ПАУЗЫ</h2>
          </div>
          <button
            onClick={onResume}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-white" />
            ПРОДОЛЖИТЬ
          </button>
        </div>

        {/* Current Build Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6 font-mono text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px]">МАКС. ХП</span>
            <span className="text-rose-400 font-bold text-sm">{stats.maxHp} HP</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">БЛИЖНИЙ УРОН</span>
            <span className="text-sky-400 font-bold text-sm">{Math.round(meleeWeapon.baseDamage * stats.meleeDamageMul)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">КРИТ. ШАНС</span>
            <span className="text-amber-400 font-bold text-sm">{Math.round(stats.critChance * 100)}%</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">РИПОСТ КРИТ</span>
            <span className="text-cyan-400 font-bold text-sm">x{stats.parryDamageMul.toFixed(1)}</span>
          </div>
        </div>

        {/* Audio Volume Controls */}
        <div className="flex items-center justify-between bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span>ГРОМКОСТЬ САУНДТРЕКА & SFX</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="0.6"
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
            <button
              onClick={onToggleSound}
              className="text-xs font-mono px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors cursor-pointer"
            >
              {isMuted ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>
        </div>

        {/* Controls Reference */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400 space-y-1.5 mb-6">
          <div className="font-bold text-neutral-200 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sky-400" />
            ПАМЯТКА УПРАВЛЕНИЯ:
          </div>
          <div className="flex justify-between"><span>Бег:</span> <span className="text-neutral-200">A / D или Стрелки</span></div>
          <div className="flex justify-between"><span>Прыжок / Двойной прыжок:</span> <span className="text-neutral-200">Space или W</span></div>
          <div className="flex justify-between"><span>Перекат / Рывок (I-frames):</span> <span className="text-neutral-200">Shift или K</span></div>
          <div className="flex justify-between"><span>Удар комбо:</span> <span className="text-neutral-200">J или ЛКМ</span></div>
          <div className="flex justify-between"><span>Парирование / Рипост:</span> <span className="text-neutral-200">L или ПКМ</span></div>
          <div className="flex justify-between"><span>Дальний выстрел:</span> <span className="text-neutral-200">I или U</span></div>
          <div className="flex justify-between"><span>Лечебный флакон:</span> <span className="text-neutral-200">R</span></div>
          <div className="flex justify-between"><span>Всплеск Пустоты (Навык):</span> <span className="text-neutral-200">Q</span></div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <button
            onClick={onSurrender}
            className="flex items-center gap-2 text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            СДАТЬСЯ И ВЕРНУТЬСЯ В ПРИБЕЖИЩЕ
          </button>
          <button
            onClick={onResume}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
