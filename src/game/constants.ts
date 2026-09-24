import { BiomeConfig, BiomeId, Weapon, UpgradeBoon, PlayerStats } from '../types/game';

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
export const GRAVITY = 0.58;
export const FRICTION = 0.82;

export const BIOMES: Record<BiomeId, BiomeConfig> = {
  ruined_bastion: {
    id: 'ruined_bastion',
    name: 'Разрушенный Замок',
    nameEn: 'The Ruined Bastion',
    subtitle: 'Древняя цитадель рыцарей пепла, поглощенная безмолвием',
    palette: {
      skyTop: '#0a0a14',
      skyBottom: '#221528',
      mountainFar: '#181226',
      mountainMid: '#2d1b3e',
      structures: '#3f2955',
      groundMain: '#1c1524',
      groundAccent: '#543d6a',
      glow: '#e11d48',
      ambient: 'rgba(225, 29, 72, 0.08)'
    },
    roomCount: 7,
    bgParticles: 'cinders',
    hazards: ['spikes', 'swinging_blades'],
    bossName: 'Гаргулья-Колосс',
    bossTitle: 'Страж Пепельных Врат'
  },
  sunken_catacombs: {
    id: 'sunken_catacombs',
    name: 'Подземные Катакомбы',
    nameEn: 'Sunken Catacombs',
    subtitle: 'Склепы забытой династии, пропитанные биолюминесценцией',
    palette: {
      skyTop: '#031416',
      skyBottom: '#072b2b',
      mountainFar: '#0b3536',
      mountainMid: '#0e4a4b',
      structures: '#125c5d',
      groundMain: '#092122',
      groundAccent: '#14b8a6',
      glow: '#06b6d4',
      ambient: 'rgba(6, 182, 212, 0.08)'
    },
    roomCount: 8,
    bgParticles: 'drips',
    hazards: ['spikes', 'falling_stalactites'],
    bossName: 'Некро-Монарх Малахор',
    bossTitle: 'Повелитель Утопших Костей'
  },
  blightwood_mire: {
    id: 'blightwood_mire',
    name: 'Заражённый Лес',
    nameEn: 'Blightwood Mire',
    subtitle: 'Тернистые заросли, распыляющие мутагенные ядовитые споры',
    palette: {
      skyTop: '#0c1a0c',
      skyBottom: '#182b13',
      mountainFar: '#1f3818',
      mountainMid: '#2b4d21',
      structures: '#3b682e',
      groundMain: '#142412',
      groundAccent: '#84cc16',
      glow: '#a3e635',
      ambient: 'rgba(163, 230, 53, 0.08)'
    },
    roomCount: 8,
    bgParticles: 'spores',
    hazards: ['poison_vents', 'spikes'],
    bossName: 'Ткач Чёрных Спор',
    bossTitle: 'Сердце Гнилого Древа'
  },
  ashen_borough: {
    id: 'ashen_borough',
    name: 'Заброшенный Город',
    nameEn: 'Ashen Borough',
    subtitle: 'Ржавеющие часовые мануфактуры и улицы, полные автоматонов',
    palette: {
      skyTop: '#170c08',
      skyBottom: '#2d180f',
      mountainFar: '#3e2316',
      mountainMid: '#58321e',
      structures: '#754327',
      groundMain: '#24140c',
      groundAccent: '#f97316',
      glow: '#fb923c',
      ambient: 'rgba(251, 146, 60, 0.08)'
    },
    roomCount: 9,
    bgParticles: 'ashes',
    hazards: ['swinging_blades', 'spikes'],
    bossName: 'Механический Инквизитор',
    bossTitle: 'Шедевр Забытого Часовщика'
  },
  sanctum_aethel: {
    id: 'sanctum_aethel',
    name: 'Древний Храм',
    nameEn: 'Sanctum of Aethel',
    subtitle: 'Золотые обсидиановые залы солнечной верховной жрицы',
    palette: {
      skyTop: '#0a1024',
      skyBottom: '#1a224a',
      mountainFar: '#253366',
      mountainMid: '#394c8c',
      structures: '#526bb8',
      groundMain: '#121733',
      groundAccent: '#eab308',
      glow: '#fbbf24',
      ambient: 'rgba(250, 204, 21, 0.09)'
    },
    roomCount: 9,
    bgParticles: 'runes',
    hazards: ['void_rifts', 'swinging_blades'],
    bossName: 'Серафим Первородного Пламени',
    bossTitle: 'Арбитр Солнечной Клятвы'
  },
  void_nexus: {
    id: 'void_nexus',
    name: 'Финальная Область: Разлом Пустоты',
    nameEn: 'The Void Nexus',
    subtitle: 'Конец мироздания, где реальность распадается на чистую тьму',
    palette: {
      skyTop: '#05020c',
      skyBottom: '#160829',
      mountainFar: '#280c4a',
      mountainMid: '#3d1270',
      structures: '#5c1b9b',
      groundMain: '#110520',
      groundAccent: '#a855f7',
      glow: '#d946ef',
      ambient: 'rgba(217, 70, 239, 0.12)'
    },
    roomCount: 6,
    bgParticles: 'void_crystals',
    hazards: ['void_rifts', 'spikes'],
    bossName: 'Архонт Затмения',
    bossTitle: 'Владыка Вечного Заката'
  }
};

export const BIOME_ORDER: BiomeId[] = [
  'ruined_bastion',
  'sunken_catacombs',
  'blightwood_mire',
  'ashen_borough',
  'sanctum_aethel',
  'void_nexus'
];

export const WEAPONS: Weapon[] = [
  {
    id: 'katana',
    name: 'Лунный Клинок',
    type: 'melee',
    description: 'Быстрые и точные удары с повышенным шансом критического урона.',
    baseDamage: 22,
    attackSpeed: 1.25,
    range: 62,
    icon: 'Sword',
    color: '#38bdf8',
    specialEffect: '+15% Крит. шанс'
  },
  {
    id: 'zweihander',
    name: 'Крушитель Пепла',
    type: 'melee',
    description: 'Тяжелый двуручный меч. Медленный замах, колоссальный урон и сбивание с ног.',
    baseDamage: 44,
    attackSpeed: 0.78,
    range: 82,
    icon: 'Hammer',
    color: '#fb923c',
    specialEffect: 'Оглушение врагов и пробитие щитов'
  },
  {
    id: 'daggers',
    name: 'Парные Клинки Тени',
    type: 'melee',
    description: 'Молниеносные парные кинжалы, вызывающие кровотечение при серии ударов.',
    baseDamage: 14,
    attackSpeed: 1.6,
    range: 48,
    icon: 'Zap',
    color: '#ec4899',
    specialEffect: 'Каждый 3-й удар накладывает кровотечение'
  },
  {
    id: 'scythe',
    name: 'Коса Эфира',
    type: 'melee',
    description: 'Широкий полумесяц пустоты. Смертельные удары восстанавливают часть здоровья.',
    baseDamage: 30,
    attackSpeed: 1.0,
    range: 75,
    icon: 'Moon',
    color: '#a855f7',
    specialEffect: '5% шанс вампиризма при добивании'
  },
  // Ranged Weapons
  {
    id: 'phantom_bow',
    name: 'Призрачный Лук',
    type: 'ranged',
    description: 'Стреляет пронзающими стрелами из духовной энергии.',
    baseDamage: 18,
    attackSpeed: 1.1,
    range: 450,
    icon: 'Crosshair',
    color: '#34d399',
    specialEffect: 'Пронзает первого врага'
  },
  {
    id: 'void_crossbow',
    name: 'Арбалет Разлома',
    type: 'ranged',
    description: 'Стреляет тяжелыми болтами пустоты, взрывающимися при столкновении.',
    baseDamage: 32,
    attackSpeed: 0.7,
    range: 400,
    icon: 'Target',
    color: '#c084fc',
    specialEffect: 'Взрывной урон по области'
  },
  {
    id: 'throwing_glaive',
    name: 'Бумеранг-Глефа',
    type: 'ranged',
    description: 'Вращающееся лезвие, отскакивающее между стенами и врагами.',
    baseDamage: 20,
    attackSpeed: 1.0,
    range: 380,
    icon: 'Disc',
    color: '#facc15',
    specialEffect: 'Рикошет от поверхностей'
  }
];

export const UPGRADE_POOL: UpgradeBoon[] = [
  // Common
  {
    id: 'blade_edge',
    name: 'Заточенная Кромка',
    rarity: 'common',
    description: 'Увеличивает урон ближнего боя на +20%.',
    icon: 'Sword',
    tag: 'combat',
    apply: (s) => { s.meleeDamageMul += 0.2; }
  },
  {
    id: 'feather_step',
    name: 'Поступь Ветра',
    rarity: 'common',
    description: 'Увеличивает скорость передвижения на +15%.',
    icon: 'Wind',
    tag: 'mobility',
    apply: (s) => { s.speed *= 1.15; }
  },
  {
    id: 'iron_vitality',
    name: 'Железная Воля',
    rarity: 'common',
    description: 'Увеличивает максимальное здоровье на +25 HP и восстанавливает 25 HP.',
    icon: 'Heart',
    tag: 'vitality',
    apply: (s) => { s.maxHp += 25; s.hp = Math.min(s.maxHp, s.hp + 25); }
  },
  {
    id: 'keen_eye',
    name: 'Взгляд Хищника',
    rarity: 'common',
    description: 'Повышает шанс критического удара на +10%.',
    icon: 'Eye',
    tag: 'combat',
    apply: (s) => { s.critChance += 0.10; }
  },
  {
    id: 'spectral_fletching',
    name: 'Эфирное Оперение',
    rarity: 'common',
    description: 'Увеличивает урон дальнего боя на +25%.',
    icon: 'Crosshair',
    tag: 'combat',
    apply: (s) => { s.rangedDamageMul += 0.25; }
  },

  // Rare
  {
    id: 'crimson_riposte',
    name: 'Багровый Рипост',
    rarity: 'rare',
    description: 'Идеальное парирование оглушает противников дольше и наносит на +60% больше урона.',
    icon: 'Shield',
    tag: 'combat',
    apply: (s) => { s.parryDamageMul += 0.6; s.parryWindowMs += 40; }
  },
  {
    id: 'shadow_dash',
    name: 'Пепельный Рывок',
    rarity: 'rare',
    description: 'Добавляет +1 дополнительный заряд переката/рывка и снижает его кулдаун.',
    icon: 'Zap',
    tag: 'mobility',
    apply: (s) => { s.dashCharges += 1; s.dashCooldown = Math.max(0.4, s.dashCooldown * 0.85); }
  },
  {
    id: 'vampiric_edge',
    name: 'Вампирический Алтарь',
    rarity: 'rare',
    description: 'Атаки ближнего боя с вероятностью 8% восстанавливают 4 единицы здоровья.',
    icon: 'Droplet',
    tag: 'synergy',
    apply: (s) => { s.vampirismChance += 0.08; }
  },
  {
    id: 'alchemist_pouch',
    name: 'Сумка Алхимика',
    rarity: 'rare',
    description: 'Дает +1 максимальный заряд лечебного флакона и усиливает лечение на +15 HP.',
    icon: 'FlaskConical',
    tag: 'vitality',
    apply: (s) => { s.potionMaxCharges += 1; s.potionCharges += 1; s.potionHeal += 15; }
  },
  {
    id: 'shock_strike',
    name: 'Статический Разряд',
    rarity: 'rare',
    description: 'Критические удары вызывают цепную молнию по 2 соседним врагам.',
    icon: 'Sparkles',
    tag: 'synergy',
    apply: (s) => { s.shockOnHit = true; s.critChance += 0.05; }
  },

  // Epic
  {
    id: 'executioner_sigil',
    name: 'Печать Палача',
    rarity: 'epic',
    description: 'Враги с уровнем здоровья ниже 35% получают утроенный урон.',
    icon: 'Flame',
    tag: 'combat',
    apply: (s) => { s.meleeDamageMul += 0.35; s.critDamageMul += 0.5; }
  },
  {
    id: 'toxic_recoil',
    name: 'Чумная Завеса',
    rarity: 'epic',
    description: 'Каждый перекат оставляет след из ядовитых спор, травящих преследователей.',
    icon: 'Biohazard',
    tag: 'synergy',
    apply: (s) => { s.poisonTrail = true; }
  },
  {
    id: 'ricochet_mastery',
    name: 'Траектория Рикошета',
    rarity: 'epic',
    description: 'Все стрелы и снаряды отскакивают дополнительно +2 раза от стен.',
    icon: 'Repeat',
    tag: 'synergy',
    apply: (s) => { s.projectileBounce += 2; s.rangedDamageMul += 0.2; }
  },
  {
    id: 'wings_of_ashen',
    name: 'Крылья Пепельного Воина',
    rarity: 'epic',
    description: 'Увеличивает высоту прыжка и дает постоянную способность отталкиваться от стен.',
    icon: 'Feather',
    tag: 'mobility',
    apply: (s) => { s.jumpForce *= 1.12; s.wallJumpAllowed = true; }
  },

  // Legendary
  {
    id: 'void_rupture',
    name: 'Коллапс Пустоты',
    rarity: 'legendary',
    description: 'Убийство врага вызывает сингулярность, затягивающую и взрывающую ближайших существ.',
    icon: 'CircleDot',
    tag: 'synergy',
    apply: (s) => { s.voidBurstOnKill = true; s.meleeDamageMul += 0.25; }
  },
  {
    id: 'phoenix_ember',
    name: 'Перо Феникса',
    rarity: 'legendary',
    description: 'Однократное воскрешение при смертельном ударе с восстановлением 50% здоровья.',
    icon: 'Sun',
    tag: 'vitality',
    apply: (s) => { s.resurrectCount += 1; }
  },
  {
    id: 'blade_dance',
    name: 'Танец Затмения',
    rarity: 'legendary',
    description: '+40% к урону ближнего боя, +25% к шансу крита, идеальное парирование восстанавливает рывок.',
    icon: 'Crown',
    tag: 'combat',
    apply: (s) => { s.meleeDamageMul += 0.4; s.critChance += 0.25; s.critDamageMul += 0.6; }
  }
];

export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 100,
  hp: 100,
  speed: 4.8,
  jumpForce: 13.5,
  dashCooldown: 0.75,
  dashCharges: 1,
  meleeDamageMul: 1.0,
  rangedDamageMul: 1.0,
  critChance: 0.12,
  critDamageMul: 1.8,
  parryWindowMs: 220,
  parryDamageMul: 2.2,
  potionHeal: 45,
  potionMaxCharges: 2,
  potionCharges: 2,
  bleedChance: 0,
  poisonTrail: false,
  shockOnHit: false,
  vampirismChance: 0,
  voidBurstOnKill: false,
  doubleJumpAllowed: true,
  wallJumpAllowed: true,
  resurrectCount: 0,
  projectileBounce: 0
};
