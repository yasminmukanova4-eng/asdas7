import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameInput } from './game/engine';
import { GameRenderer } from './game/renderer';
import { generateBiomeDungeon } from './game/procedural';
import { BIOMES, BIOME_ORDER, INITIAL_PLAYER_STATS, UPGRADE_POOL, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS } from './game/constants';
import { BiomeId, MetaUpgrades, UpgradeBoon } from './types/game';
import { GameHUD } from './components/GameHUD';
import { UpgradeModal } from './components/UpgradeModal';
import { HubMenu } from './components/HubMenu';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './audio/soundEngine';
import { Play, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'umbrafall_meta_save_v1';

const DEFAULT_META: MetaUpgrades = {
  shards: 45, // Starting bonus for immediate fun
  totalRuns: 0,
  bossKills: 0,
  maxHpLevel: 0,
  baseDamageLevel: 0,
  potionCountLevel: 0,
  critLevel: 0,
  shardBoostLevel: 0,
  startingWeapon: 'katana',
  unlockedWeapons: ['katana', 'zweihander']
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Game UI State
  const [gameState, setGameState] = useState<'title' | 'hub' | 'playing' | 'paused' | 'upgrade' | 'game_over'>('title');
  const [meta, setMeta] = useState<MetaUpgrades>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_META;
  });

  // Active in-game HUD sync state
  const [hudState, setHudState] = useState<{
    hp: number;
    maxHp: number;
    potionCharges: number;
    potionMaxCharges: number;
    dashCooldownProgress: number;
    abilityCooldownProgress: number;
    shards: number;
    comboCount: number;
    currentRoomIndex: number;
    biomeId: BiomeId;
  }>({
    hp: 100,
    maxHp: 100,
    potionCharges: 2,
    potionMaxCharges: 2,
    dashCooldownProgress: 0,
    abilityCooldownProgress: 0,
    shards: 0,
    comboCount: 0,
    currentRoomIndex: 0,
    biomeId: 'ruined_bastion'
  });

  const [activeUpgradeOptions, setActiveUpgradeOptions] = useState<UpgradeBoon[]>([]);
  const [upgradeSourceTitle, setUpgradeSourceTitle] = useState<string>('АЛТАРЬ РАЗЛОМА');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameOverStats, setGameOverStats] = useState<{ won: boolean; shards: number; kills: number; biomes: number }>({
    won: false,
    shards: 0,
    kills: 0,
    biomes: 1
  });

  // Inputs
  const inputRef = useRef<GameInput>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    attackMelee: false,
    attackRanged: false,
    dash: false,
    parry: false,
    ability: false,
    potion: false,
    interact: false,
    aimX: 0,
    aimY: 0
  });

  // Save meta to localStorage
  const updateMeta = useCallback((newMeta: MetaUpgrades) => {
    setMeta(newMeta);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMeta));
    } catch {
      // ignore
    }
  }, []);

  // Initialize a new run
  const startRun = useCallback(() => {
    // Compute upgraded base stats
    const stats = {
      ...INITIAL_PLAYER_STATS,
      maxHp: INITIAL_PLAYER_STATS.maxHp + meta.maxHpLevel * 15,
      hp: INITIAL_PLAYER_STATS.maxHp + meta.maxHpLevel * 15,
      meleeDamageMul: 1.0 + meta.baseDamageLevel * 0.1,
      critChance: INITIAL_PLAYER_STATS.critChance + meta.critLevel * 0.04,
      potionMaxCharges: INITIAL_PLAYER_STATS.potionMaxCharges + meta.potionCountLevel,
      potionCharges: INITIAL_PLAYER_STATS.potionMaxCharges + meta.potionCountLevel
    };

    const firstBiomeId = BIOME_ORDER[0];
    const initialDungeon = generateBiomeDungeon(firstBiomeId, 0);

    const engine = new GameEngine(stats, meta.startingWeapon);
    engine.initDungeon(firstBiomeId, initialDungeon);

    // Callbacks
    engine.onOpenUpgradeModal = (source) => {
      // Draw 3 distinct random boons
      const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, 3);
      setActiveUpgradeOptions(chosen);
      setUpgradeSourceTitle(source === 'shrine' ? 'ДАР АЛТАРЯ' : source === 'boss' ? 'ТРОФЕЙ БОССА' : 'ТАЙНЫЙ СУНДУК');
      setGameState('upgrade');
    };

    // Biome Advancement Handler
    engine.onAdvanceBiome = (nextBiomeId, nextIndex) => {
      const nextDungeon = generateBiomeDungeon(nextBiomeId, nextIndex);
      engine.initDungeon(nextBiomeId, nextDungeon);
      setHudState(prev => ({
        ...prev,
        biomeId: nextBiomeId,
        currentRoomIndex: 0
      }));
    };

    engine.onGameOver = (won, endStats) => {
      // Add earned shards to permanent meta
      const shardMultiplier = 1.0 + meta.shardBoostLevel * 0.15;
      const finalShards = Math.round(endStats.shards * shardMultiplier);

      const updatedMeta: MetaUpgrades = {
        ...meta,
        shards: meta.shards + finalShards,
        totalRuns: meta.totalRuns + 1,
        bossKills: meta.bossKills + (won ? 1 : 0)
      };
      updateMeta(updatedMeta);

      setGameOverStats({
        won,
        shards: finalShards,
        kills: endStats.kills,
        biomes: endStats.biomes
      });
      setGameState('game_over');
    };

    engineRef.current = engine;
    setGameState('playing');
    sound.startMusic();
  }, [meta, updateMeta]);

  // Handle Boon Selection
  const handleSelectBoon = (boon: UpgradeBoon) => {
    if (engineRef.current) {
      boon.apply(engineRef.current.stats);
    }
    setGameState('playing');
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const inp = inputRef.current;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inp.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inp.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') { inp.up = true; }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inp.down = true;
      if (e.code === 'Space') {
        inp.jump = true;
        inp.jumpPressed = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') inp.dash = true;
      if (e.code === 'KeyJ') inp.attackMelee = true;
      if (e.code === 'KeyL') inp.parry = true;
      if (e.code === 'KeyI' || e.code === 'KeyU') inp.attackRanged = true;
      if (e.code === 'KeyQ') inp.ability = true;
      if (e.code === 'KeyR') inp.potion = true;

      // Handle Interact key: support English, Russian, Enter, F
      const k = e.key ? e.key.toLowerCase() : '';
      if (
        e.code === 'KeyE' || 
        e.code === 'KeyF' || 
        e.code === 'Enter' ||
        k === 'e' || 
        k === 'у' || 
        k === 'f' || 
        k === 'а'
      ) {
        inp.interact = true;
      }

      // Escape toggles pause
      if (e.code === 'Escape') {
        setGameState(prev => {
          if (prev === 'playing') return 'paused';
          if (prev === 'paused') return 'playing';
          return prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inp.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inp.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') inp.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inp.down = false;
      if (e.code === 'Space') inp.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') inp.dash = false;
      if (e.code === 'KeyJ') inp.attackMelee = false;
      if (e.code === 'KeyL') inp.parry = false;
      if (e.code === 'KeyI' || e.code === 'KeyU') inp.attackRanged = false;
      if (e.code === 'KeyQ') inp.ability = false;
      if (e.code === 'KeyR') inp.potion = false;
      const k = e.key ? e.key.toLowerCase() : '';
      if (
        e.code === 'KeyE' || 
        e.code === 'KeyF' || 
        e.code === 'Enter' ||
        k === 'e' || 
        k === 'у' || 
        k === 'f' || 
        k === 'а'
      ) {
        inp.interact = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.attackMelee = true;
      if (e.button === 2) {
        e.preventDefault();
        inputRef.current.parry = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.attackMelee = false;
      if (e.button === 2) inputRef.current.parry = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer && gameState === 'playing') {
        // Engine update step
        engine.update(dt, inputRef.current);
        // Reset single-frame triggers
        inputRef.current.jumpPressed = false;
        inputRef.current.interact = false;

        const currentRoom = engine.getCurrentRoom();
        const biome = BIOMES[engine.biomeId];

        // Renderer draw step
        renderer.render(
          biome,
          currentRoom,
          engine.camera,
          {
            x: engine.player.x,
            y: engine.player.y,
            width: engine.player.width,
            height: engine.player.height,
            vx: engine.player.vx,
            vy: engine.player.vy,
            facing: engine.player.facing,
            isGrounded: engine.player.isGrounded,
            isDashing: engine.player.isDashing,
            isParrying: engine.player.isParrying,
            parryFlash: engine.player.parryFlash,
            isAttacking: engine.player.isAttacking,
            attackCombo: engine.player.attackCombo,
            attackProgress: engine.player.attackProgress,
            invincibleTimer: engine.player.invincibleTimer,
            activeWeaponColor: engine.player.activeMeleeWeapon.color
          },
          currentRoom.enemies,
          engine.projectiles,
          engine.particles,
          engine.damageNumbers,
          engine.gameTime
        );

        // Sync HUD
        setHudState({
          hp: engine.stats.hp,
          maxHp: engine.stats.maxHp,
          potionCharges: engine.stats.potionCharges,
          potionMaxCharges: engine.stats.potionMaxCharges,
          dashCooldownProgress: Math.max(0, engine.player.dashCooldownTimer / engine.stats.dashCooldown),
          abilityCooldownProgress: Math.max(0, engine.player.abilityCooldownTimer / 4.0),
          shards: engine.runShardsEarned,
          comboCount: engine.comboCounter,
          currentRoomIndex: engine.currentRoomIndex,
          biomeId: engine.biomeId
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState]);

  // Touch handlers for mobile
  const handleTouchInput = (key: string, pressed: boolean) => {
    const inp = inputRef.current;
    if (key === 'left') inp.left = pressed;
    if (key === 'right') inp.right = pressed;
    if (key === 'jump') {
      inp.jump = pressed;
      if (pressed) inp.jumpPressed = true;
    }
    if (key === 'dash') inp.dash = pressed;
    if (key === 'parry') inp.parry = pressed;
    if (key === 'attackMelee') inp.attackMelee = pressed;
  };

  const currentEngine = engineRef.current;
  const currentRoom = currentEngine?.getCurrentRoom();
  const activeBoss = currentRoom?.enemies.find(e => e.isBoss && e.hp > 0);
  const activeBiome = BIOMES[hudState.biomeId] || BIOMES.ruined_bastion;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 flex items-center justify-center select-none font-sans">
      {/* 2D Canvas with smooth anti-aliased high-def rendering */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain max-w-[1920px] max-h-[1080px] shadow-2xl"
      />

      {/* In-Game HUD */}
      {gameState === 'playing' && currentEngine && currentRoom && (
        <GameHUD
          stats={{
            ...currentEngine.stats,
            hp: hudState.hp,
            maxHp: hudState.maxHp,
            potionCharges: hudState.potionCharges,
            potionMaxCharges: hudState.potionMaxCharges
          }}
          biome={activeBiome}
          currentRoom={currentRoom}
          allRooms={currentEngine.rooms}
          activeBoss={activeBoss}
          activeMelee={currentEngine.player.activeMeleeWeapon}
          activeRanged={currentEngine.player.activeRangedWeapon}
          dashCooldownProgress={hudState.dashCooldownProgress}
          abilityCooldownProgress={hudState.abilityCooldownProgress}
          shards={hudState.shards}
          comboCount={hudState.comboCount}
          onPause={() => setGameState('paused')}
          onToggleSound={() => setIsMuted(sound.toggleMute())}
          isMuted={isMuted}
          nearbyInteractable={currentEngine.getNearbyInteractable()}
          onTouchInput={handleTouchInput}
        />
      )}

      {/* Roguelite Boon / Upgrade Drawer */}
      {gameState === 'upgrade' && (
        <UpgradeModal
          options={activeUpgradeOptions}
          sourceTitle={upgradeSourceTitle}
          onSelect={handleSelectBoon}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && currentEngine && (
        <PauseModal
          stats={currentEngine.stats}
          meleeWeapon={currentEngine.player.activeMeleeWeapon}
          rangedWeapon={currentEngine.player.activeRangedWeapon}
          onResume={() => setGameState('playing')}
          onSurrender={() => {
            sound.stopMusic();
            setGameState('hub');
          }}
          isMuted={isMuted}
          onToggleSound={() => setIsMuted(sound.toggleMute())}
          onVolumeChange={(v) => {
            sound.setMusicVolume(v);
            sound.setSfxVolume(v);
          }}
        />
      )}

      {/* Sanctuary / Hub Menu */}
      {gameState === 'hub' && (
        <HubMenu
          meta={meta}
          onUpdateMeta={updateMeta}
          onStartRun={startRun}
        />
      )}

      {/* Game Over / Victory Screen */}
      {gameState === 'game_over' && (
        <GameOverModal
          won={gameOverStats.won}
          stats={gameOverStats}
          onReturnToHub={() => {
            sound.stopMusic();
            setGameState('hub');
          }}
        />
      )}

      {/* Title / Main Intro Screen */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-2xl flex flex-col items-center">
            {/* Title Glow Tag */}
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-sky-400 bg-sky-950/80 border border-sky-800/80 px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ROGUELITE ACTION-PLATFORMER</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-400 tracking-wider mb-3 drop-shadow-[0_0_35px_rgba(56,189,248,0.3)]">
              UMBRAFALL
            </h1>
            <h2 className="text-lg sm:text-xl font-serif text-rose-400 tracking-widest mb-6 uppercase">
              SHATTERED DOMINION
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg leading-relaxed mb-8">
              Исследуйте процедурный готический замок и 6 мрачных биомов. Парируйте атаки врагов, 
              комбинируйте холодное и дальнобойное оружие, открывайте древние синергии и сокрушите Архонта Затмения!
            </p>

            {/* Start / Hub Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={startRun}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-serif font-black tracking-wide text-base shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:scale-104 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                НАЧАТЬ ЗАБЕГ
              </button>

              <button
                onClick={() => setGameState('hub')}
                className="py-4 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                СВЯТИЛИЩЕ (HUB)
              </button>
            </div>

            {/* Quick Controls Info */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-neutral-400 border-t border-neutral-800 pt-6">
              <span>WASD: Бег / Прыжок</span>
              <span>·</span>
              <span>Shift: Перекат</span>
              <span>·</span>
              <span>J: Атака комбо</span>
              <span>·</span>
              <span>L: Парирование</span>
              <span>·</span>
              <span>I: Выстрел</span>
              <span>·</span>
              <span>R: Лечение</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
