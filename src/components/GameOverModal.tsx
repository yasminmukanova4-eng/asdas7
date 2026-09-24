import React from 'react';
import { Sparkles, Skull, Trophy, RotateCcw, ShieldCheck } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface GameOverModalProps {
  won: boolean;
  stats: {
    shards: number;
    kills: number;
    biomes: number;
  };
  onReturnToHub: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ won, stats, onReturnToHub }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            won ? 'bg-amber-500/20' : 'bg-rose-600/20'
          }`}
        />

        {/* Icon */}
        <div
          className={`p-4 rounded-2xl border mb-4 ${
            won
              ? 'bg-amber-950/50 border-amber-500/40 text-amber-400'
              : 'bg-rose-950/50 border-rose-600/40 text-rose-500'
          }`}
        >
          {won ? <Trophy className="w-12 h-12" /> : <Skull className="w-12 h-12" />}
        </div>

        {/* Title */}
        <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-1">
          {won ? 'ВЕЛИКИЙ ТРИУМФ' : 'ИТОГИ ЗАБЕГА'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white mb-2">
          {won ? 'АРХОНТ ЗАТМЕНИЯ ПОВЕРЖЕН!' : 'ПЕПЕЛЬНЫЙ ВОИН ПАЛ'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6">
          {won
            ? 'Проклятие цитадели рассеяно. Ваши подвиги навечно вписаны в скрижали Этельгарда!'
            : 'Смерть — это лишь шаг на пути к совершенству. Соберите осколки и станьте сильнее в Святилище.'}
        </p>

        {/* Run Stats Summary */}
        <div className="w-full grid grid-cols-3 gap-3 bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl mb-8 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-neutral-400 mb-1">РЕГИОНОВ</span>
            <span className="text-base sm:text-lg font-bold text-neutral-100">{stats.biomes} / 6</span>
          </div>
          <div className="flex flex-col items-center border-x border-neutral-800">
            <span className="text-[10px] text-neutral-400 mb-1">УБИТО ВРАГОВ</span>
            <span className="text-base sm:text-lg font-bold text-rose-400">{stats.kills}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-neutral-400 mb-1">ДОБЫТО ЭФИРА</span>
            <div className="flex items-center gap-1 text-purple-400 font-bold text-base sm:text-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{stats.shards}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sound.playDash();
            onReturnToHub();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-serif font-black tracking-wide text-base shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          ВЕРНУТЬСЯ В ПРИБЕЖИЩЕ И УЛУЧШИТЬ ВОИНА
        </button>
      </div>
    </div>
  );
};
