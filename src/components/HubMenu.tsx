import React, { useState } from 'react';
import { MetaUpgrades, Weapon } from '../types/game';
import { WEAPONS, BIOMES, BIOME_ORDER } from '../game/constants';
import { 
  Sparkles, Heart, Sword, FlaskConical, Eye, Coins, Play, 
  BookOpen, Shield, ChevronRight, Lock, CheckCircle2 
} from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface HubMenuProps {
  meta: MetaUpgrades;
  onUpdateMeta: (meta: MetaUpgrades) => void;
  onStartRun: () => void;
}

export const HubMenu: React.FC<HubMenuProps> = ({ meta, onUpdateMeta, onStartRun }) => {
  const [activeTab, setActiveTab] = useState<'altar' | 'armory' | 'world'>('altar');

  const upgradeCosts = {
    maxHp: (meta.maxHpLevel + 1) * 20,
    baseDamage: (meta.baseDamageLevel + 1) * 25,
    potionCount: (meta.potionCountLevel + 1) * 45,
    crit: (meta.critLevel + 1) * 30,
    shardBoost: (meta.shardBoostLevel + 1) * 20
  };

  const buyUpgrade = (type: keyof typeof upgradeCosts) => {
    const cost = upgradeCosts[type];
    if (meta.shards < cost) return;

    sound.playShardPickup();
    const updated = { ...meta, shards: meta.shards - cost };

    if (type === 'maxHp') updated.maxHpLevel += 1;
    if (type === 'baseDamage') updated.baseDamageLevel += 1;
    if (type === 'potionCount') updated.potionCountLevel += 1;
    if (type === 'crit') updated.critLevel += 1;
    if (type === 'shardBoost') updated.shardBoostLevel += 1;

    onUpdateMeta(updated);
  };

  const unlockWeapon = (w: Weapon, cost: number) => {
    if (meta.shards < cost || meta.unlockedWeapons.includes(w.id)) return;
    sound.playAbilityCast();
    onUpdateMeta({
      ...meta,
      shards: meta.shards - cost,
      unlockedWeapons: [...meta.unlockedWeapons, w.id],
      startingWeapon: w.id
    });
  };

  const selectStartingWeapon = (weaponId: string) => {
    if (!meta.unlockedWeapons.includes(weaponId)) return;
    sound.playDash();
    onUpdateMeta({
      ...meta,
      startingWeapon: weaponId
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-y-auto p-4 sm:p-8 font-sans">
      {/* Top Bar: Sanctuary Title & Shard Count */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            СВЯТИЛИЩЕ ПЕПЕЛЬНЫХ ВОИНОВ
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-wide text-neutral-100">
            ПРИБЕЖИЩЕ ИЗГНАННИКА
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Shard currency pill */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-purple-500/40 px-4 py-2 rounded-xl shadow-[0_0_16px_rgba(168,85,247,0.2)]">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-mono leading-none">ЭФИРНЫЕ ОСКОЛКИ</span>
              <span className="text-base sm:text-lg font-mono font-bold text-purple-300 leading-tight">
                {meta.shards}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Content: Tabs & Cards */}
      <div className="max-w-5xl w-full mx-auto my-6 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 mb-6">
          <button
            onClick={() => setActiveTab('altar')}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'altar'
                ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            АЛТАРЬ ПЕРЕРОЖДЕНИЯ
          </button>
          <button
            onClick={() => setActiveTab('armory')}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'armory'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sword className="w-4 h-4" />
            ОРУЖЕЙНЫЙ АРСЕНАЛ
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'world'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            ХРОНИКИ БИОМОВ (6)
          </button>
        </div>

        {/* Tab 1: Altar Upgrades */}
        {activeTab === 'altar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Health Upgrade */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-400">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold font-serif text-sm">Несокрушимая Жизнь</h4>
                  <p className="text-xs text-neutral-400">+15 к базовому запасу HP (Ур. {meta.maxHpLevel})</p>
                </div>
              </div>
              <button
                onClick={() => buyUpgrade('maxHp')}
                disabled={meta.shards < upgradeCosts.maxHp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 font-mono text-xs font-bold transition-colors cursor-pointer text-white"
              >
                <span>{upgradeCosts.maxHp}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>

            {/* Base Damage Upgrade */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-950/60 border border-sky-800 rounded-lg text-sky-400">
                  <Sword className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold font-serif text-sm">Закалка Клинка</h4>
                  <p className="text-xs text-neutral-400">+10% к базовому урону всех атак (Ур. {meta.baseDamageLevel})</p>
                </div>
              </div>
              <button
                onClick={() => buyUpgrade('baseDamage')}
                disabled={meta.shards < upgradeCosts.baseDamage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 font-mono text-xs font-bold transition-colors cursor-pointer text-white"
              >
                <span>{upgradeCosts.baseDamage}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>

            {/* Potion Charges Upgrade */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold font-serif text-sm">Эфирный Сосуд</h4>
                  <p className="text-xs text-neutral-400">+1 стартовый заряд лечебного зелья (Ур. {meta.potionCountLevel})</p>
                </div>
              </div>
              <button
                onClick={() => buyUpgrade('potionCount')}
                disabled={meta.shards < upgradeCosts.potionCount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 font-mono text-xs font-bold transition-colors cursor-pointer text-white"
              >
                <span>{upgradeCosts.potionCount}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>

            {/* Critical Strike Upgrade */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-lg text-amber-400">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold font-serif text-sm">Взгляд Бездны</h4>
                  <p className="text-xs text-neutral-400">+4% к шансу критического удара (Ур. {meta.critLevel})</p>
                </div>
              </div>
              <button
                onClick={() => buyUpgrade('crit')}
                disabled={meta.shards < upgradeCosts.crit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 font-mono text-xs font-bold transition-colors cursor-pointer text-white"
              >
                <span>{upgradeCosts.crit}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>

            {/* Shard Boost Upgrade */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-950/60 border border-purple-800 rounded-lg text-purple-400">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold font-serif text-sm">Притяжение Разлома</h4>
                  <p className="text-xs text-neutral-400">+15% к добыче осколков с врагов (Ур. {meta.shardBoostLevel})</p>
                </div>
              </div>
              <button
                onClick={() => buyUpgrade('shardBoost')}
                disabled={meta.shards < upgradeCosts.shardBoost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 font-mono text-xs font-bold transition-colors cursor-pointer text-white"
              >
                <span>{upgradeCosts.shardBoost}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Armory Selection */}
        {activeTab === 'armory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {WEAPONS.filter(w => w.type === 'melee').map((weapon) => {
              const isUnlocked = meta.unlockedWeapons.includes(weapon.id);
              const isEquipped = meta.startingWeapon === weapon.id;
              const unlockCost = 40;

              return (
                <div
                  key={weapon.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'border-sky-500 bg-sky-950/30 shadow-[0_0_16px_rgba(56,189,248,0.2)]'
                      : isUnlocked
                      ? 'border-neutral-700 bg-neutral-900/70 hover:border-neutral-500'
                      : 'border-neutral-800 bg-neutral-950/80 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
                        <Sword className="w-5 h-5" style={{ color: weapon.color }} />
                      </div>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-800">
                          <CheckCircle2 className="w-3 h-3" /> ЭКИПИРОВАН
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                          ОТКРЫТО
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" /> {unlockCost}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold font-serif text-sm text-neutral-100 mb-1">{weapon.name}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">{weapon.description}</p>
                    <div className="text-[11px] font-mono text-sky-300 mb-2">
                      Базовый Урон: {weapon.baseDamage} | Скорость: {weapon.attackSpeed}x
                    </div>
                    {weapon.specialEffect && (
                      <div className="text-[10px] font-mono text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/60">
                        {weapon.specialEffect}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800">
                    {isEquipped ? (
                      <button disabled className="w-full py-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 text-xs font-mono font-bold">
                        ВЫБРАНО
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => selectStartingWeapon(weapon.id)}
                        className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        ВЗЯТЬ В ЗАБЕГ
                      </button>
                    ) : (
                      <button
                        onClick={() => unlockWeapon(weapon, unlockCost)}
                        disabled={meta.shards < unlockCost}
                        className="w-full py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-mono font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        РАЗБЛОКИРОВАТЬ ({unlockCost})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: World Chronicles (6 Biomes) */}
        {activeTab === 'world' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            {BIOME_ORDER.map((biomeId, idx) => {
              const b = BIOMES[biomeId];
              return (
                <div
                  key={biomeId}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-neutral-400">РЕГИОН #{idx + 1}</span>
                      <span className="text-xs font-mono text-rose-400 font-bold">БОСС: {b.bossName}</span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-neutral-100 mb-1">{b.name}</h4>
                    <span className="text-xs font-mono text-sky-400 block mb-2">{b.nameEn}</span>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">{b.subtitle}</p>
                  </div>
                  <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                    <span>Ловушки: {b.hazards.join(', ')}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer: Start Run Action Button */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between border-t border-neutral-800/80 pt-4">
        <div className="text-xs font-mono text-neutral-400">
          Забегов начато: <span className="text-neutral-200 font-bold">{meta.totalRuns}</span>
        </div>

        <button
          onClick={() => {
            sound.playDash();
            onStartRun();
          }}
          className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-serif font-black tracking-wider text-base sm:text-lg shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:scale-104 active:scale-98 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          ВОЙТИ В РАЗЛОМ (START RUN)
        </button>
      </div>
    </div>
  );
};
