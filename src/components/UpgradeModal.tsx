import React, { useEffect } from 'react';
import { UpgradeBoon, UpgradeRarity } from '../types/game';
import { 
  Sword, Wind, Heart, Eye, Crosshair, Shield, Zap, Droplet, 
  FlaskConical, Sparkles, Flame, Biohazard, Repeat, Feather, 
  CircleDot, Sun, Crown 
} from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface UpgradeModalProps {
  options: UpgradeBoon[];
  sourceTitle: string;
  onSelect: (boon: UpgradeBoon) => void;
}

const RARITY_THEMES: Record<UpgradeRarity, {
  border: string;
  bg: string;
  text: string;
  badge: string;
  glow: string;
  label: string;
}> = {
  common: {
    border: 'border-neutral-700 hover:border-neutral-400',
    bg: 'bg-neutral-900/95',
    text: 'text-neutral-200',
    badge: 'bg-neutral-800 text-neutral-300',
    glow: 'shadow-neutral-900/50',
    label: 'ОБЫЧНОЕ'
  },
  rare: {
    border: 'border-sky-600/80 hover:border-sky-400',
    bg: 'bg-sky-950/90',
    text: 'text-sky-200',
    badge: 'bg-sky-900/80 text-sky-300',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    label: 'РЕДКОЕ'
  },
  epic: {
    border: 'border-purple-600/80 hover:border-purple-400',
    bg: 'bg-purple-950/90',
    text: 'text-purple-200',
    badge: 'bg-purple-900/80 text-purple-300',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.3)]',
    label: 'ЭПИЧЕСКОЕ'
  },
  legendary: {
    border: 'border-amber-500 hover:border-amber-300',
    bg: 'bg-amber-950/90',
    text: 'text-amber-100',
    badge: 'bg-amber-900/80 text-amber-300',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.45)]',
    label: 'ЛЕГЕНДАРНОЕ'
  }
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Sword: <Sword className="w-8 h-8" />,
  Wind: <Wind className="w-8 h-8" />,
  Heart: <Heart className="w-8 h-8" />,
  Eye: <Eye className="w-8 h-8" />,
  Crosshair: <Crosshair className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Droplet: <Droplet className="w-8 h-8" />,
  FlaskConical: <FlaskConical className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Flame: <Flame className="w-8 h-8" />,
  Biohazard: <Biohazard className="w-8 h-8" />,
  Repeat: <Repeat className="w-8 h-8" />,
  Feather: <Feather className="w-8 h-8" />,
  CircleDot: <CircleDot className="w-8 h-8" />,
  Sun: <Sun className="w-8 h-8" />,
  Crown: <Crown className="w-8 h-8" />
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ options, sourceTitle, onSelect }) => {
  useEffect(() => {
    sound.playShardPickup();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && options[0]) onSelect(options[0]);
      if (e.key === '2' && options[1]) onSelect(options[1]);
      if (e.key === '3' && options[2]) onSelect(options[2]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, onSelect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-4xl w-full flex flex-col items-center text-center">
        {/* Header */}
        <span className="text-xs font-mono tracking-widest text-sky-400 uppercase mb-1">
          {sourceTitle}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide mb-2">
          ВЫБЕРИТЕ ДАР РАЗЛОМА
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-8">
          Усильте своего воина. Комбинируйте благословения для создания смертоносных синергий.
        </p>

        {/* 3 Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {options.map((boon, idx) => {
            const theme = RARITY_THEMES[boon.rarity];
            return (
              <button
                key={boon.id}
                onClick={() => {
                  sound.playAbilityCast();
                  onSelect(boon);
                }}
                className={`flex flex-col items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left group hover:scale-104 ${theme.border} ${theme.bg} ${theme.glow}`}
              >
                <div className="flex flex-col items-center text-center w-full">
                  {/* Top Rarity & Key hint */}
                  <div className="flex items-center justify-between w-full mb-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                      {theme.label}
                    </span>
                    <span className="text-xs font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded">
                      [{idx + 1}]
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 mb-4 text-white group-hover:scale-110 transition-transform ${theme.text}`}>
                    {ICON_MAP[boon.icon] || <Sparkles className="w-8 h-8" />}
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg font-bold font-serif mb-2 ${theme.text}`}>
                    {boon.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    {boon.description}
                  </p>
                </div>

                {/* Tag & Action Button */}
                <div className="mt-6 w-full pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span className="uppercase text-[10px] text-neutral-400">#{boon.tag}</span>
                  <span className="text-sky-400 group-hover:text-white font-bold transition-colors">ВЫБРАТЬ →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
