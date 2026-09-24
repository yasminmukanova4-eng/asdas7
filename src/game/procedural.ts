import { BiomeId, Room, Platform, Enemy, ChestOrShrine, RoomDoor, EnemyType } from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export function generateBiomeDungeon(biomeId: BiomeId, biomeIndex: number): Room[] {
  const rooms: Room[] = [];
  const roomCount = biomeId === 'void_nexus' ? 6 : 7;

  // Linear / branching dungeon grid: 0 (Start) -> 1 -> 2 (Shrine/Branch) -> 3 -> 4 (Hazard/Secret) -> 5 (Pre-Boss) -> (Boss)
  for (let i = 0; i < roomCount; i++) {
    const isStart = i === 0;
    const isBoss = i === roomCount - 1;
    const isShrine = i === 2;
    const isSecret = i === 4;
    const roomType = isStart ? 'start' : isBoss ? 'boss' : isShrine ? 'shrine' : isSecret ? 'secret' : 'combat';

    const width = isBoss ? CANVAS_WIDTH * 1.5 : CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    // Standard ground & borders
    const platforms: Platform[] = [
      // Floor
      { x: 0, y: height - 48, width: width, height: 48, type: 'solid' },
      // Left wall
      { x: 0, y: 0, width: 32, height: height, type: 'solid' },
      // Right wall
      { x: width - 32, y: 0, width: 32, height: height, type: 'solid' },
      // Ceiling
      { x: 0, y: 0, width: width, height: 32, type: 'solid' }
    ];

    // Generate room specific platforms & hazards
    if (isStart) {
      // Gentle start room platforms
      platforms.push(
        { x: 200, y: height - 130, width: 140, height: 16, type: 'one_way' },
        { x: 420, y: height - 190, width: 160, height: 16, type: 'one_way' },
        { x: 680, y: height - 140, width: 140, height: 16, type: 'one_way' }
      );
    } else if (isBoss) {
      // Boss arena: open combat floor with two elevated spectator/dodge perches
      platforms.push(
        { x: 180, y: height - 150, width: 160, height: 18, type: 'one_way' },
        { x: width - 340, y: height - 150, width: 160, height: 18, type: 'one_way' },
        { x: width / 2 - 100, y: height - 250, width: 200, height: 18, type: 'one_way' }
      );
    } else {
      // Procedural layout for combat & hazard rooms
      const layoutSeed = (i * 37 + biomeIndex * 19) % 4;

      if (layoutSeed === 0) {
        // Multi-tier climbing arena
        platforms.push(
          { x: 140, y: height - 140, width: 180, height: 16, type: 'one_way' },
          { x: 380, y: height - 210, width: 200, height: 16, type: 'one_way' },
          { x: 640, y: height - 140, width: 180, height: 16, type: 'one_way' },
          { x: 240, y: height - 290, width: 160, height: 16, type: 'one_way' },
          { x: 520, y: height - 290, width: 160, height: 16, type: 'one_way' }
        );
        // Spike pit in the center
        platforms.push({ x: 380, y: height - 48, width: 200, height: 16, type: 'hazard', hazardType: 'spikes' });
      } else if (layoutSeed === 1) {
        // Stepped duel bridge
        platforms.push(
          { x: 100, y: height - 120, width: 220, height: 20, type: 'solid' },
          { x: 340, y: height - 180, width: 280, height: 20, type: 'solid' },
          { x: 640, y: height - 120, width: 220, height: 20, type: 'solid' },
          { x: 400, y: height - 270, width: 160, height: 16, type: 'one_way' }
        );
      } else if (layoutSeed === 2) {
        // High vertical pillars
        platforms.push(
          { x: 260, y: height - 220, width: 44, height: 172, type: 'solid' },
          { x: 640, y: height - 220, width: 44, height: 172, type: 'solid' },
          { x: 140, y: height - 260, width: 140, height: 16, type: 'one_way' },
          { x: 360, y: height - 170, width: 220, height: 16, type: 'one_way' },
          { x: 660, y: height - 260, width: 140, height: 16, type: 'one_way' }
        );
        platforms.push({ x: 140, y: height - 48, width: 120, height: 16, type: 'hazard', hazardType: 'spikes' });
      } else {
        // Split floor with floating sanctuaries
        platforms.push(
          { x: 120, y: height - 150, width: 180, height: 16, type: 'one_way' },
          { x: width - 300, y: height - 150, width: 180, height: 16, type: 'one_way' },
          { x: width / 2 - 130, y: height - 220, width: 260, height: 18, type: 'one_way' }
        );
      }
    }

    // Doors
    const doors: RoomDoor[] = [];
    if (i > 0) {
      doors.push({
        direction: 'left',
        x: 0,
        y: height - 148,
        width: 32,
        height: 100,
        targetRoomIndex: i - 1,
        locked: false
      });
    }
    if (i < roomCount - 1) {
      doors.push({
        direction: 'right',
        x: width - 32,
        y: height - 148,
        width: 32,
        height: 100,
        targetRoomIndex: i + 1,
        locked: !isStart // Locked until room enemies are defeated
      });
    }

    // Enemies
    const enemies: Enemy[] = [];
    if (!isStart) {
      if (isBoss) {
        enemies.push(generateBossForBiome(biomeId, width, height));
      } else {
        const count = 2 + Math.min(4, Math.floor(i * 0.7));
        for (let k = 0; k < count; k++) {
          enemies.push(generateEnemyForBiome(biomeId, i, k, width, height));
        }
      }
    }

    // Interactables: Shrines, chests, portals
    const interactables: ChestOrShrine[] = [];
    if (isStart) {
      interactables.push({
        id: `shrine_start_${i}`,
        x: 320,
        y: height - 48 - 40,
        type: 'shrine',
        opened: false,
        rewardType: 'upgrade'
      });
    } else if (isShrine || isSecret) {
      interactables.push({
        id: `chest_${i}`,
        x: width / 2 - 20,
        y: height - 48 - 32,
        type: 'chest',
        opened: false,
        rewardType: Math.random() > 0.4 ? 'upgrade' : 'heal'
      });
    } else if (isBoss) {
      interactables.push({
        id: `portal_${i}`,
        x: width - 120,
        y: height - 48 - 60,
        type: 'portal',
        opened: false,
        rewardType: 'upgrade'
      });
    }

    // Dynamic torch / crystal lights
    const lights = [
      { x: 80, y: height - 120, radius: 130, color: 'rgba(251, 146, 60, 0.4)', flicker: 0 },
      { x: width - 80, y: height - 120, radius: 130, color: 'rgba(251, 146, 60, 0.4)', flicker: 0 },
      { x: width / 2, y: 120, radius: 160, color: 'rgba(168, 85, 247, 0.3)', flicker: 0 }
    ];

    rooms.push({
      index: i,
      gridX: i,
      gridY: 0,
      width,
      height,
      type: roomType,
      platforms,
      doors,
      enemies,
      interactables,
      cleared: isStart,
      visited: isStart,
      lights
    });
  }

  return rooms;
}

function generateEnemyForBiome(biomeId: BiomeId, roomIdx: number, slot: number, roomWidth: number, roomHeight: number): Enemy {
  const seed = roomIdx * 13 + slot * 7;
  const isAlt = seed % 2 === 1;

  let type: EnemyType = 'bastion_swordsman';
  let name = 'Страж Бастиона';
  let flying = false;
  let ranged = false;
  let shielded = false;
  let color = '#991b1b';
  let accentColor = '#f87171';
  let hp = 45;
  let damage = 12;
  let width = 34;
  let height = 50;

  switch (biomeId) {
    case 'ruined_bastion':
      if (isAlt) {
        type = 'gargoyle_stalker';
        name = 'Горгулья-Охотник';
        flying = true;
        color = '#475569';
        accentColor = '#e2e8f0';
        hp = 35;
        damage = 10;
        width = 38;
        height = 38;
      } else {
        type = 'bastion_swordsman';
        name = 'Рыцарь Пепла';
        shielded = true;
        hp = 50;
        damage = 14;
      }
      break;

    case 'sunken_catacombs':
      if (isAlt) {
        type = 'necro_specter';
        name = 'Призрак Катакомб';
        flying = true;
        ranged = true;
        color = '#0e7490';
        accentColor = '#22d3ee';
        hp = 38;
        damage = 14;
      } else {
        type = 'catacomb_crawler';
        name = 'Костяной Ползун';
        color = '#155e75';
        accentColor = '#67e8f9';
        hp = 48;
        damage = 12;
        width = 40;
        height = 36;
      }
      break;

    case 'blightwood_mire':
      if (isAlt) {
        type = 'thorn_spitter';
        name = 'Ядовитый Плевун';
        ranged = true;
        color = '#3f6212';
        accentColor = '#a3e635';
        hp = 44;
        damage = 15;
      } else {
        type = 'mire_sporehound';
        name = 'Споровый Зверь';
        color = '#4d7c0f';
        accentColor = '#bef264';
        hp = 56;
        damage = 16;
      }
      break;

    case 'ashen_borough':
      if (isAlt) {
        type = 'clockwork_sniper';
        name = 'Часовой Снайпер';
        ranged = true;
        color = '#9a3412';
        accentColor = '#fb923c';
        hp = 42;
        damage = 18;
      } else {
        type = 'ashen_automaton';
        name = 'Автоматон-Крушитель';
        shielded = true;
        color = '#7c2d12';
        accentColor = '#fdba74';
        hp = 70;
        damage = 20;
        width = 42;
        height = 54;
      }
      break;

    case 'sanctum_aethel':
      if (isAlt) {
        type = 'temple_acolyte';
        name = 'Жрец Солнечного Круга';
        flying = true;
        ranged = true;
        color = '#1e3a8a';
        accentColor = '#fbbf24';
        hp = 55;
        damage = 20;
      } else {
        type = 'celestial_sentinel';
        name = 'Небесный Страж';
        shielded = true;
        color = '#1d4ed8';
        accentColor = '#fef08a';
        hp = 85;
        damage = 22;
        width = 40;
        height = 56;
      }
      break;

    case 'void_nexus':
      if (isAlt) {
        type = 'void_orbiter';
        name = 'Орбитальная Аномалия';
        flying = true;
        ranged = true;
        color = '#581c87';
        accentColor = '#e879f9';
        hp = 65;
        damage = 24;
      } else {
        type = 'void_reaver';
        name = 'Жнец Разлома';
        color = '#6b21a8';
        accentColor = '#f0abfc';
        hp = 95;
        damage = 26;
        width = 42;
        height = 56;
      }
      break;
  }

  const spawnX = 240 + ((slot * 180 + roomIdx * 70) % (roomWidth - 480));
  const spawnY = flying ? roomHeight - 240 - (slot * 30) : roomHeight - 48 - height;

  return {
    id: `enemy_${roomIdx}_${slot}_${Date.now()}`,
    type,
    name,
    x: spawnX,
    y: spawnY,
    vx: 0,
    vy: 0,
    width,
    height,
    hp,
    maxHp: hp,
    damage,
    facing: slot % 2 === 0 ? -1 : 1,
    state: 'patrol',
    stateTimer: 1.5,
    attackCooldown: 1.2 + Math.random() * 0.8,
    isStunned: false,
    stunTimer: 0,
    parryable: true,
    color,
    accentColor,
    flying,
    ranged,
    shielded
  };
}

function generateBossForBiome(biomeId: BiomeId, roomWidth: number, roomHeight: number): Enemy {
  let name = 'Гаргулья-Колосс';
  let color = '#7f1d1d';
  let accentColor = '#fca5a5';
  let hp = 420;
  let damage = 22;
  let width = 72;
  let height = 96;

  switch (biomeId) {
    case 'ruined_bastion':
      name = 'Гаргулья-Колосс';
      color = '#7f1d1d';
      accentColor = '#f87171';
      hp = 440;
      damage = 20;
      break;
    case 'sunken_catacombs':
      name = 'Некро-Монарх Малахор';
      color = '#155e75';
      accentColor = '#22d3ee';
      hp = 560;
      damage = 24;
      break;
    case 'blightwood_mire':
      name = 'Ткач Чёрных Спор';
      color = '#365314';
      accentColor = '#a3e635';
      hp = 680;
      damage = 26;
      break;
    case 'ashen_borough':
      name = 'Механический Инквизитор';
      color = '#7c2d12';
      accentColor = '#fb923c';
      hp = 820;
      damage = 28;
      break;
    case 'sanctum_aethel':
      name = 'Серафим Первородного Пламени';
      color = '#1e3a8a';
      accentColor = '#fbbf24';
      hp = 980;
      damage = 32;
      break;
    case 'void_nexus':
      name = 'Архонт Затмения';
      color = '#3b0764';
      accentColor = '#f472b6';
      hp = 1350;
      damage = 36;
      width = 86;
      height = 110;
      break;
  }

  return {
    id: `boss_${biomeId}_${Date.now()}`,
    type: 'boss',
    name,
    x: roomWidth - 280,
    y: roomHeight - 48 - height,
    vx: 0,
    vy: 0,
    width,
    height,
    hp,
    maxHp: hp,
    damage,
    facing: -1,
    state: 'alert',
    stateTimer: 1.0,
    attackCooldown: 1.5,
    isBoss: true,
    bossPhase: 1,
    bossMaxPhases: 3,
    bossSpecialTimer: 4.0,
    isStunned: false,
    stunTimer: 0,
    parryable: true,
    color,
    accentColor,
    flying: false,
    ranged: true
  };
}
