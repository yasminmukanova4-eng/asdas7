/**
 * Umbrafall: Shattered Dominion - Game Types
 */

export type BiomeId = 
  | 'ruined_bastion'      // Разрушенный Замок
  | 'sunken_catacombs'    // Подземные Катакомбы
  | 'blightwood_mire'     // Заражённый Лес
  | 'ashen_borough'       // Заброшенный Город
  | 'sanctum_aethel'      // Древний Храм
  | 'void_nexus';         // Финальная Область (The Void Nexus)

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  nameEn: string;
  subtitle: string;
  palette: {
    skyTop: string;
    skyBottom: string;
    mountainFar: string;
    mountainMid: string;
    structures: string;
    groundMain: string;
    groundAccent: string;
    glow: string;
    ambient: string;
  };
  roomCount: number;
  bgParticles: 'ashes' | 'spores' | 'drips' | 'cinders' | 'runes' | 'void_crystals';
  hazards: ('spikes' | 'swinging_blades' | 'poison_vents' | 'falling_stalactites' | 'void_rifts')[];
  bossName: string;
  bossTitle: string;
}

export type WeaponType = 'melee' | 'ranged';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  description: string;
  baseDamage: number;
  attackSpeed: number; // multiplier, 1.0 is default
  range: number;
  energyCost?: number;
  icon: string;
  color: string;
  specialEffect?: string;
}

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface UpgradeBoon {
  id: string;
  name: string;
  rarity: UpgradeRarity;
  description: string;
  icon: string;
  tag: 'combat' | 'mobility' | 'vitality' | 'synergy';
  apply: (stats: PlayerStats) => void;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  speed: number;
  jumpForce: number;
  dashCooldown: number;
  dashCharges: number;
  meleeDamageMul: number;
  rangedDamageMul: number;
  critChance: number;
  critDamageMul: number;
  parryWindowMs: number;
  parryDamageMul: number;
  potionHeal: number;
  potionMaxCharges: number;
  potionCharges: number;
  // Synergy perks
  bleedChance: number;
  poisonTrail: boolean;
  shockOnHit: boolean;
  vampirismChance: number;
  voidBurstOnKill: boolean;
  doubleJumpAllowed: boolean;
  wallJumpAllowed: boolean;
  resurrectCount: number;
  projectileBounce: number;
}

export interface MetaUpgrades {
  shards: number;
  totalRuns: number;
  bossKills: number;
  maxHpLevel: number;
  baseDamageLevel: number;
  potionCountLevel: number;
  critLevel: number;
  shardBoostLevel: number;
  startingWeapon: string;
  unlockedWeapons: string[];
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  glow?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  color: string;
  bounces: number;
  pierce: number;
  effects?: string[];
  life: number;
  maxLife: number;
}

export type EnemyType = 
  | 'bastion_swordsman'
  | 'gargoyle_stalker'
  | 'catacomb_crawler'
  | 'necro_specter'
  | 'mire_sporehound'
  | 'thorn_spitter'
  | 'ashen_automaton'
  | 'clockwork_sniper'
  | 'temple_acolyte'
  | 'celestial_sentinel'
  | 'void_reaver'
  | 'void_orbiter'
  | 'boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  damage: number;
  facing: 1 | -1;
  state: 'patrol' | 'alert' | 'charge' | 'attack' | 'stunned' | 'cast' | 'dead';
  stateTimer: number;
  attackCooldown: number;
  isBoss?: boolean;
  bossPhase?: number;
  bossMaxPhases?: number;
  bossSpecialTimer?: number;
  isStunned: boolean;
  stunTimer: number;
  parryable: boolean;
  color: string;
  accentColor: string;
  flying?: boolean;
  ranged?: boolean;
  shielded?: boolean;
  deathAnimTimer?: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one_way' | 'hazard' | 'breakable';
  hazardType?: 'spikes' | 'poison' | 'void';
}

export interface RoomDoor {
  direction: 'left' | 'right' | 'top' | 'bottom';
  x: number;
  y: number;
  width: number;
  height: number;
  targetRoomIndex: number;
  locked: boolean;
}

export interface ChestOrShrine {
  id: string;
  x: number;
  y: number;
  type: 'chest' | 'shrine' | 'portal';
  opened: boolean;
  cost?: number;
  rewardType: 'upgrade' | 'shards' | 'heal';
}

export interface Room {
  index: number;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  type: 'start' | 'combat' | 'hazard' | 'shrine' | 'secret' | 'boss';
  platforms: Platform[];
  doors: RoomDoor[];
  enemies: Enemy[];
  interactables: ChestOrShrine[];
  cleared: boolean;
  visited: boolean;
  lights: { x: number; y: number; radius: number; color: string; flicker: number }[];
}

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  shakeTime: number;
  shakeIntensity: number;
}
