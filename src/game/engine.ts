import { 
  Room, Camera, Enemy, Projectile, Particle, DamageNumber, 
  PlayerStats, Weapon, BiomeId, ChestOrShrine 
} from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, BIOMES, BIOME_ORDER, WEAPONS } from './constants';
import { generateBiomeDungeon } from './procedural';
import { sound } from '../audio/soundEngine';

export interface GameInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  attackMelee: boolean;
  attackRanged: boolean;
  dash: boolean;
  parry: boolean;
  ability: boolean;
  potion: boolean;
  interact: boolean;
  aimX: number;
  aimY: number;
}

export class GameEngine {
  public biomeId: BiomeId = 'ruined_bastion';
  public biomeIndex: number = 0;
  public rooms: Room[] = [];
  public currentRoomIndex: number = 0;

  // Player State
  public player = {
    x: 80,
    y: CANVAS_HEIGHT - 120,
    width: 28,
    height: 48,
    vx: 0,
    vy: 0,
    facing: 1 as 1 | -1,
    isGrounded: false,
    isOnWall: false,
    wallDirection: 0 as -1 | 0 | 1,
    canDoubleJump: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldownTimer: 0,
    currentDashCharges: 1,
    invincibleTimer: 0,
    isAttacking: false,
    attackCombo: 1,
    attackProgress: 0,
    attackDuration: 0.22,
    attackCooldown: 0,
    comboResetTimer: 0,
    isParrying: false,
    parryTimer: 0,
    parryCooldownTimer: 0,
    parryFlash: 0,
    abilityCooldownTimer: 0,
    activeMeleeWeapon: WEAPONS[0],
    activeRangedWeapon: WEAPONS[4]
  };

  public stats: PlayerStats;
  public camera: Camera;
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  
  public gameTime: number = 0;
  public hitStopTimer: number = 0;
  public runShardsEarned: number = 0;
  public enemiesKilledThisRun: number = 0;
  public comboCounter: number = 0;
  public comboTimer: number = 0;

  // Callbacks
  public onOpenUpgradeModal?: (source: 'shrine' | 'chest' | 'boss') => void;
  public onGameOver?: (won: boolean, stats: { shards: number; kills: number; biomes: number }) => void;
  public onRoomChange?: (roomIndex: number) => void;
  public onAdvanceBiome?: (nextBiomeId: BiomeId, nextBiomeIndex: number) => void;

  constructor(initialStats: PlayerStats, startingWeaponId?: string) {
    this.stats = { ...initialStats };
    if (startingWeaponId) {
      const found = WEAPONS.find(w => w.id === startingWeaponId);
      if (found) this.player.activeMeleeWeapon = found;
    }
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      zoom: 1.0,
      shakeTime: 0,
      shakeIntensity: 0
    };
  }

  public initDungeon(biomeId: BiomeId, rooms: Room[]) {
    this.biomeId = biomeId;
    this.biomeIndex = BIOME_ORDER.indexOf(biomeId);
    this.rooms = rooms;
    this.currentRoomIndex = 0;
    this.projectiles = [];
    this.particles = [];
    this.damageNumbers = [];

    // Reset player position to start room
    this.player.x = 80;
    this.player.y = CANVAS_HEIGHT - 120;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.currentDashCharges = this.stats.dashCharges;

    sound.setMusicMood('ambient', this.biomeIndex);
  }

  public getCurrentRoom(): Room {
    return this.rooms[this.currentRoomIndex] || this.rooms[0];
  }

  public update(dt: number, input: GameInput) {
    this.gameTime += dt;

    // Hit-stop effect (frame freeze on solid impacts)
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // Camera shake decay
    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
    }

    // Combo counter decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCounter = 0;
      }
    }

    const currentRoom = this.getCurrentRoom();

    // 1. Update Player Physics & Input
    this.updatePlayer(dt, input, currentRoom);

    // 2. Update Room Enemies
    this.updateEnemies(dt, currentRoom);

    // 3. Update Projectiles
    this.updateProjectiles(dt, currentRoom);

    // 4. Update Particles & Damage Numbers
    this.updateParticlesAndNumbers(dt);

    // 5. Update Camera Target
    this.updateCamera(dt, currentRoom);

    // 6. Check Room Cleared status & Music mood
    this.checkRoomProgression(currentRoom);

    // 7. Check Ambient Hazards
    this.checkHazardCollisions(currentRoom);
  }

  private updatePlayer(dt: number, input: GameInput, room: Room) {
    const p = this.player;
    const s = this.stats;

    // Timers
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
    if (p.parryFlash > 0) p.parryFlash -= dt;
    if (p.dashCooldownTimer > 0) p.dashCooldownTimer -= dt;
    if (p.parryCooldownTimer > 0) p.parryCooldownTimer -= dt;
    if (p.abilityCooldownTimer > 0) p.abilityCooldownTimer -= dt;
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer -= dt;

    if (input.jumpPressed) {
      p.jumpBufferTimer = 0.12;
    }

    // Dashing
    if (p.isDashing) {
      p.dashTimer -= dt;
      p.invincibleTimer = 0.1;
      p.vx = p.facing * s.speed * 2.8;
      p.vy = 0; // suspend gravity during dash

      // Spawn dash particles
      if (Math.random() > 0.4) {
        this.spawnParticle(
          p.x + p.width / 2 + (Math.random() - 0.5) * 16,
          p.y + p.height / 2 + (Math.random() - 0.5) * 20,
          -p.facing * (Math.random() * 2 + 1),
          (Math.random() - 0.5) * 2,
          s.poisonTrail ? '#a3e635' : '#38bdf8',
          Math.random() * 3 + 2,
          0.3,
          0
        );
      }

      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      // Normal Horizontal Movement
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;

      if (moveDir !== 0) {
        p.facing = moveDir as 1 | -1;
        p.vx = moveDir * s.speed;

        // Dust particles when running on ground
        if (p.isGrounded && Math.random() > 0.6) {
          this.spawnParticle(
            p.x + p.width / 2,
            p.y + p.height,
            -moveDir * Math.random() * 1.5,
            -Math.random() * 1.5,
            '#94a3b8',
            Math.random() * 2 + 2,
            0.2,
            GRAVITY * 0.3
          );
        }
      } else {
        p.vx *= FRICTION;
      }

      // Gravity
      if (!p.isGrounded) {
        p.vy += GRAVITY;
        // Cap terminal velocity
        if (p.vy > 14) p.vy = 14;

        // Wall sliding
        if (p.isOnWall && p.vy > 0 && s.wallJumpAllowed) {
          p.vy = Math.min(p.vy, 3.0); // slower slide
          if (Math.random() > 0.7) {
            this.spawnParticle(
              p.wallDirection === 1 ? p.x + p.width : p.x,
              p.y + p.height / 2,
              p.wallDirection * 1,
              -1,
              '#cbd5e1',
              2,
              0.2,
              GRAVITY * 0.5
            );
          }
        }
      }

      // Jump Execution (Ground Jump, Coyote Time, or Buffered)
      if (p.jumpBufferTimer > 0) {
        if (p.isGrounded || p.coyoteTimer > 0) {
          p.vy = -s.jumpForce;
          p.isGrounded = false;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.canDoubleJump = s.doubleJumpAllowed;
          sound.playJump(false);
          this.spawnBurst(p.x + p.width / 2, p.y + p.height, '#cbd5e1', 6, 2);
        } else if (p.isOnWall && s.wallJumpAllowed) {
          // Wall Jump
          p.vy = -s.jumpForce * 0.95;
          p.vx = -p.wallDirection * s.speed * 1.3;
          p.facing = -p.wallDirection as 1 | -1;
          p.jumpBufferTimer = 0;
          p.canDoubleJump = s.doubleJumpAllowed;
          sound.playJump(false);
          this.spawnBurst(p.x + (p.wallDirection === 1 ? p.width : 0), p.y + p.height / 2, '#cbd5e1', 6, 2);
        } else if (p.canDoubleJump) {
          // Double Jump (Spectral Wings Burst)
          p.vy = -s.jumpForce * 0.9;
          p.canDoubleJump = false;
          p.jumpBufferTimer = 0;
          sound.playJump(true);
          this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 12, 3.5);
        }
      }

      // Variable jump height: release jump button early to truncate upward velocity
      if (!input.jump && p.vy < -3) {
        p.vy *= 0.6;
      }

      // Dash Trigger
      if (input.dash && p.dashCooldownTimer <= 0) {
        p.isDashing = true;
        p.dashTimer = 0.2;
        p.dashCooldownTimer = s.dashCooldown;
        p.invincibleTimer = 0.25;
        sound.playDash();
        this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 10, 4);

        if (s.poisonTrail) {
          // Poison spores
          this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#a3e635', 8, 2);
        }
      }
    }

    // Parrying Action
    if (input.parry && p.parryCooldownTimer <= 0 && !p.isAttacking) {
      p.isParrying = true;
      p.parryTimer = s.parryWindowMs / 1000;
      p.parryCooldownTimer = 0.6;
      sound.playDash();
    }
    if (p.isParrying) {
      p.parryTimer -= dt;
      if (p.parryTimer <= 0) {
        p.isParrying = false;
      }
    }

    // Melee Attack Action
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.comboResetTimer > 0) {
      p.comboResetTimer -= dt;
      if (p.comboResetTimer <= 0) {
        p.attackCombo = 1;
      }
    }

    if (input.attackMelee && p.attackCooldown <= 0 && !p.isDashing) {
      this.executeMeleeAttack();
    }

    if (p.isAttacking) {
      p.attackProgress += dt / p.attackDuration;
      if (p.attackProgress >= 1) {
        p.isAttacking = false;
      }
    }

    // Ranged Attack Action
    if (input.attackRanged && p.attackCooldown <= 0 && !p.isDashing) {
      this.executeRangedAttack();
    }

    // Active Ability Action
    if (input.ability && p.abilityCooldownTimer <= 0) {
      this.executeActiveAbility();
    }

    // Potion Flask Action
    if (input.potion && s.potionCharges > 0 && s.hp < s.maxHp) {
      s.potionCharges -= 1;
      s.hp = Math.min(s.maxHp, s.hp + s.potionHeal);
      sound.playPotion();
      this.spawnDamageNumber(p.x + p.width / 2, p.y - 10, `+${s.potionHeal} HP`, '#4ade80', false);
      this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#4ade80', 14, 3);
    }

    // Interact Action (Shrines, Chests, Portals, Doors)
    if (input.interact) {
      this.handleInteraction(room);
    }

    // Apply Position & Check Collisions with Platforms
    this.movePlayerAndResolveCollisions(dt, room);
  }

  private executeMeleeAttack() {
    const p = this.player;
    const s = this.stats;
    const w = p.activeMeleeWeapon;

    p.isAttacking = true;
    p.attackProgress = 0;
    p.attackDuration = 0.2 / w.attackSpeed;
    p.attackCooldown = 0.22 / w.attackSpeed;
    p.comboResetTimer = 0.8;

    sound.playSlash(p.attackCombo);

    // Compute attack arc hitbox in front of player
    const hitW = w.range;
    const hitH = p.height + 16;
    const hitX = p.facing === 1 ? p.x + p.width : p.x - hitW;
    const hitY = p.y - 8;

    // Check hit on enemies in room
    const room = this.getCurrentRoom();
    let hitAny = false;

    room.enemies.forEach(enemy => {
      if (enemy.hp <= 0) return;

      const collides = (
        hitX < enemy.x + enemy.width &&
        hitX + hitW > enemy.x &&
        hitY < enemy.y + enemy.height &&
        hitY + hitH > enemy.y
      );

      if (collides) {
        hitAny = true;
        let baseDmg = w.baseDamage * s.meleeDamageMul;
        // 3rd combo step multiplier
        if (p.attackCombo === 3) baseDmg *= 1.6;

        const isCrit = Math.random() < s.critChance;
        if (isCrit) baseDmg *= s.critDamageMul;

        // If enemy is stunned from parry, bonus riposte damage
        if (enemy.isStunned) {
          baseDmg *= s.parryDamageMul;
        }

        const finalDmg = Math.round(baseDmg);
        this.damageEnemy(enemy, finalDmg, isCrit, p.facing);

        // Weapon special effects
        if (w.id === 'daggers' && p.attackCombo === 3) {
          // Bleed effect
          this.applyBleedToEnemy(enemy);
        } else if (w.id === 'scythe' && Math.random() < 0.2) {
          // Lifesteal
          const heal = 4;
          s.hp = Math.min(s.maxHp, s.hp + heal);
          this.spawnDamageNumber(p.x, p.y - 12, `+${heal}`, '#22c55e', false);
        }

        if (s.shockOnHit && isCrit) {
          this.triggerShockNova(enemy.x, enemy.y);
        }

        // Hit-stop pause for heavy impact feel
        this.hitStopTimer = p.attackCombo === 3 ? 0.06 : 0.035;
        this.camera.shakeTime = 0.12;
        this.camera.shakeIntensity = p.attackCombo === 3 ? 4 : 2;
      }
    });

    // Advance combo step
    p.attackCombo = p.attackCombo >= 3 ? 1 : p.attackCombo + 1;
  }

  private executeRangedAttack() {
    const p = this.player;
    const s = this.stats;
    const w = p.activeRangedWeapon;

    p.attackCooldown = 0.35 / w.attackSpeed;
    sound.playRangedShoot();

    const spawnX = p.facing === 1 ? p.x + p.width + 4 : p.x - 4;
    const spawnY = p.y + p.height * 0.45;
    const speed = 12;

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      x: spawnX,
      y: spawnY,
      vx: p.facing * speed,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 6,
      damage: Math.round(w.baseDamage * s.rangedDamageMul),
      isPlayer: true,
      color: w.color,
      bounces: s.projectileBounce,
      pierce: w.id === 'phantom_bow' ? 1 : 0,
      life: 0,
      maxLife: 1.5
    });

    this.spawnBurst(spawnX, spawnY, w.color, 4, 1.5);
  }

  private executeActiveAbility() {
    const p = this.player;
    const s = this.stats;
    p.abilityCooldownTimer = 4.0;
    sound.playAbilityCast();

    // Void Stomp / Spectral Rupture
    this.camera.shakeTime = 0.25;
    this.camera.shakeIntensity = 6;
    this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#d946ef', 24, 6);

    const room = this.getCurrentRoom();
    room.enemies.forEach(enemy => {
      const dist = Math.hypot(enemy.x + enemy.width / 2 - (p.x + p.width / 2), enemy.y + enemy.height / 2 - (p.y + p.height / 2));
      if (dist < 180) {
        const dmg = Math.round(45 * s.meleeDamageMul);
        this.damageEnemy(enemy, dmg, true, enemy.x > p.x ? 1 : -1);
        enemy.isStunned = true;
        enemy.stunTimer = 1.4;
      }
    });
  }

  public getNearbyInteractable(): {
    type: 'portal' | 'shrine' | 'chest' | 'door';
    label: string;
    action: () => void;
  } | null {
    const room = this.getCurrentRoom();
    const p = this.player;

    // 1. Check Portals, Shrines, Chests
    for (const item of room.interactables) {
      if (item.type !== 'portal' && item.opened) continue;
      const dist = Math.hypot(item.x + 16 - (p.x + p.width / 2), item.y + 16 - (p.y + p.height / 2));
      if (dist < 85) {
        if (item.type === 'portal') {
          return {
            type: 'portal',
            label: 'ВОЙТИ В ПОРТАЛ (СЛЕДУЮЩИЙ БИОМ)',
            action: () => this.advanceToNextBiome()
          };
        }
        if (item.type === 'shrine') {
          return {
            type: 'shrine',
            label: 'МОЛИТВА У АЛТАРЯ (ПОЛУЧИТЬ ДАР)',
            action: () => this.triggerInteractable(item)
          };
        }
        return {
          type: 'chest',
          label: 'ОТКРЫТЬ ТАЙНЫЙ СУНДУК',
          action: () => this.triggerInteractable(item)
        };
      }
    }

    // 2. Check Doors
    for (const door of room.doors) {
      if (door.locked) continue;
      const dist = Math.hypot(door.x + door.width / 2 - (p.x + p.width / 2), door.y + door.height / 2 - (p.y + p.height / 2));
      if (dist < 90) {
        return {
          type: 'door',
          label: 'ВОЙТИ В ДВЕРЬ',
          action: () => this.transitionToRoom(door.targetRoomIndex, door.direction)
        };
      }
    }

    return null;
  }

  public triggerInteractable(item: ChestOrShrine) {
    if (item.opened && item.type !== 'portal') return;
    const p = this.player;

    if (item.type === 'portal') {
      this.advanceToNextBiome();
      return;
    }

    item.opened = true;
    sound.playShardPickup();

    if (item.rewardType === 'upgrade') {
      if (this.onOpenUpgradeModal) {
        this.onOpenUpgradeModal(item.type);
      }
    } else if (item.rewardType === 'heal') {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 50);
      this.spawnDamageNumber(p.x, p.y - 20, '+50 HP', '#22c55e', false);
    } else {
      const shards = 25;
      this.runShardsEarned += shards;
      this.spawnDamageNumber(item.x, item.y - 20, `+${shards} ОСКОЛКОВ`, '#38bdf8', true);
    }
  }

  private handleInteraction(room: Room) {
    const nearby = this.getNearbyInteractable();
    if (nearby) {
      nearby.action();
    }
  }

  public transitionToRoom(targetIndex: number, entryFrom: 'left' | 'right' | 'top' | 'bottom') {
    if (targetIndex < 0 || targetIndex >= this.rooms.length) return;
    this.currentRoomIndex = targetIndex;
    const targetRoom = this.getCurrentRoom();
    targetRoom.visited = true;

    // Reposition player near matching door
    if (entryFrom === 'right') {
      this.player.x = 50;
    } else {
      this.player.x = targetRoom.width - 70;
    }
    this.player.y = CANVAS_HEIGHT - 120;
    this.player.vx = 0;
    this.player.vy = 0;

    // Reset projectiles in room
    this.projectiles = [];

    // Sound cue
    sound.playDash();

    // Check music state
    if (targetRoom.type === 'boss') {
      sound.setMusicMood('boss', this.biomeIndex);
      sound.playBossRoar();
    } else if (!targetRoom.cleared && targetRoom.enemies.length > 0) {
      sound.setMusicMood('combat', this.biomeIndex);
    } else {
      sound.setMusicMood('ambient', this.biomeIndex);
    }

    if (this.onRoomChange) {
      this.onRoomChange(targetIndex);
    }
  }

  public advanceToNextBiome() {
    const nextIndex = this.biomeIndex + 1;
    sound.playAbilityCast();

    if (nextIndex >= BIOME_ORDER.length) {
      // Victory! Conquered all 6 biomes!
      if (this.onGameOver) {
        this.onGameOver(true, {
          shards: this.runShardsEarned,
          kills: this.enemiesKilledThisRun,
          biomes: BIOME_ORDER.length
        });
      }
      return;
    }

    const nextBiomeId = BIOME_ORDER[nextIndex];
    if (this.onAdvanceBiome) {
      this.onAdvanceBiome(nextBiomeId, nextIndex);
    } else {
      this.initDungeon(nextBiomeId, generateBiomeDungeon(nextBiomeId, nextIndex));
    }
  }

  private movePlayerAndResolveCollisions(dt: number, room: Room) {
    const p = this.player;

    // Move X
    p.x += p.vx;
    p.isOnWall = false;
    p.wallDirection = 0;

    // Wall & Platform Collisions X
    room.platforms.forEach(plat => {
      if (plat.type === 'one_way' || plat.type === 'hazard') return;

      if (
        p.x < plat.x + plat.width &&
        p.x + p.width > plat.x &&
        p.y < plat.y + plat.height &&
        p.y + p.height > plat.y
      ) {
        if (p.vx > 0) {
          p.x = plat.x - p.width;
          p.isOnWall = true;
          p.wallDirection = 1;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.width;
          p.isOnWall = true;
          p.wallDirection = -1;
        }
        p.vx = 0;
      }
    });

    // Move Y
    p.y += p.vy;
    const wasGrounded = p.isGrounded;
    p.isGrounded = false;

    // Platform Collisions Y
    room.platforms.forEach(plat => {
      if (plat.type === 'hazard') return;

      if (plat.type === 'one_way') {
        // Drop-through one-way platforms: only land on top when falling downward
        const isLanding = (
          p.vy >= 0 &&
          p.y + p.height >= plat.y &&
          p.y + p.height - p.vy <= plat.y + 10 &&
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width
        );

        if (isLanding) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          p.canDoubleJump = this.stats.doubleJumpAllowed;
        }
      } else {
        // Solid Platforms
        if (
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          p.y < plat.y + plat.height &&
          p.y + p.height > plat.y
        ) {
          if (p.vy > 0) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = this.stats.doubleJumpAllowed;
          } else if (p.vy < 0) {
            p.y = plat.y + plat.height;
            p.vy = 0;
          }
        }
      }
    });

    // Coyote time trigger when leaving ground without jumping
    if (wasGrounded && !p.isGrounded && p.vy >= 0) {
      p.coyoteTimer = 0.1;
    }

    // Automatic door transition when running into open doorway
    room.doors.forEach(door => {
      if (door.locked) return;
      const isNearDoorX = door.direction === 'left' ? p.x <= 48 : (p.x + p.width >= room.width - 48);
      const isNearDoorY = p.y + p.height >= door.y && p.y <= door.y + door.height;
      if (isNearDoorX && isNearDoorY) {
        this.transitionToRoom(door.targetRoomIndex, door.direction);
      }
    });

    // Screen bounds clamp
    if (p.x < 32) p.x = 32;
    if (p.x + p.width > room.width - 32) p.x = room.width - 32 - p.width;
  }

  private updateEnemies(dt: number, room: Room) {
    const p = this.player;

    room.enemies.forEach(enemy => {
      if (enemy.hp <= 0) {
        if (enemy.deathAnimTimer !== undefined && enemy.deathAnimTimer > 0) {
          enemy.deathAnimTimer -= dt;
        }
        return;
      }

      // Stun timer
      if (enemy.isStunned) {
        enemy.stunTimer -= dt;
        if (enemy.stunTimer <= 0) {
          enemy.isStunned = false;
        }
        return;
      }

      // Attack cooldown
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= dt;
      }

      // Boss special timers
      if (enemy.isBoss && enemy.bossSpecialTimer !== undefined) {
        enemy.bossSpecialTimer -= dt;
        if (enemy.bossSpecialTimer <= 0) {
          this.triggerBossSpecialAttack(enemy, room);
          enemy.bossSpecialTimer = 4.5 - (enemy.bossPhase || 1) * 0.8;
        }
      }

      const distToPlayer = Math.hypot(p.x + p.width / 2 - (enemy.x + enemy.width / 2), p.y + p.height / 2 - (enemy.y + enemy.height / 2));
      const dirX = p.x > enemy.x ? 1 : -1;
      enemy.facing = dirX as 1 | -1;

      // Enemy AI Behavior
      if (enemy.flying) {
        // Flying AI: Hover and dive or shoot
        const targetY = enemy.ranged ? CANVAS_HEIGHT - 220 : p.y - 20;
        enemy.vy += (targetY - enemy.y) * 0.02;
        enemy.vy *= 0.92;
        enemy.vx += (p.x - enemy.x) * 0.015;
        enemy.vx *= 0.9;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        if (enemy.ranged && enemy.attackCooldown <= 0 && distToPlayer < 400) {
          this.enemyShootProjectile(enemy, p.x + p.width / 2, p.y + p.height / 2);
          enemy.attackCooldown = 2.2;
        }
      } else {
        // Ground AI
        if (distToPlayer < 350) {
          // Chase player
          enemy.vx = dirX * 2.2;

          // Melee attack if close
          if (distToPlayer < enemy.width + 30 && enemy.attackCooldown <= 0) {
            this.enemyMeleeAttack(enemy);
            enemy.attackCooldown = 1.4;
          }
        } else {
          // Idle patrol
          enemy.stateTimer -= dt;
          if (enemy.stateTimer <= 0) {
            enemy.stateTimer = 2.0;
            enemy.facing = (enemy.facing * -1) as 1 | -1;
          }
          enemy.vx = enemy.facing * 0.8;
        }

        // Apply ground gravity
        enemy.vy += GRAVITY;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Platform collisions for ground enemies
        room.platforms.forEach(plat => {
          if (plat.type === 'hazard') return;
          if (
            enemy.x < plat.x + plat.width &&
            enemy.x + enemy.width > plat.x &&
            enemy.y < plat.y + plat.height &&
            enemy.y + enemy.height > plat.y
          ) {
            if (enemy.vy > 0) {
              enemy.y = plat.y - enemy.height;
              enemy.vy = 0;
            }
          }
        });
      }
    });
  }

  private enemyMeleeAttack(enemy: Enemy) {
    const p = this.player;
    // Check if player parried
    if (p.isParrying) {
      this.triggerParrySuccess(enemy);
      return;
    }

    // Damage player
    if (p.invincibleTimer <= 0 && !p.isDashing) {
      this.damagePlayer(enemy.damage);
    }
  }

  private enemyShootProjectile(enemy: Enemy, targetX: number, targetY: number) {
    const angle = Math.atan2(targetY - (enemy.y + enemy.height / 2), targetX - (enemy.x + enemy.width / 2));
    const speed = 5.5;

    this.projectiles.push({
      id: `enemy_proj_${Date.now()}_${Math.random()}`,
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      damage: enemy.damage,
      isPlayer: false,
      color: enemy.accentColor,
      bounces: 0,
      pierce: 0,
      life: 0,
      maxLife: 3.5
    });

    sound.playRangedShoot();
  }

  private triggerBossSpecialAttack(boss: Enemy, room: Room) {
    sound.playBossRoar();
    this.camera.shakeTime = 0.3;
    this.camera.shakeIntensity = 5;

    // Radially burst 6-8 projectiles
    const count = 7 + (boss.bossPhase || 1) * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 4.2;
      this.projectiles.push({
        id: `boss_orb_${Date.now()}_${i}`,
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        damage: Math.round(boss.damage * 0.9),
        isPlayer: false,
        color: boss.accentColor,
        bounces: 0,
        pierce: 0,
        life: 0,
        maxLife: 3.0
      });
    }

    this.spawnBurst(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.accentColor, 18, 5);
  }

  public triggerParrySuccess(enemy?: Enemy, proj?: Projectile) {
    const p = this.player;
    p.parryFlash = 0.3;
    p.invincibleTimer = 0.5;
    this.hitStopTimer = 0.12; // slow-motion crunch

    sound.playParry();
    this.spawnBurst(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8', 20, 6);
    this.spawnDamageNumber(p.x, p.y - 24, 'ПАРИРОВАНИЕ!', '#38bdf8', true);

    if (enemy) {
      enemy.isStunned = true;
      enemy.stunTimer = 1.8;
      enemy.vx = -enemy.facing * 4;
      this.spawnDamageNumber(enemy.x, enemy.y - 12, 'ОГЛУШЁН!', '#facc15', true);
    }

    if (proj) {
      // Deflect projectile back to enemy with boosted speed & damage
      proj.isPlayer = true;
      proj.vx = -proj.vx * 1.8;
      proj.vy = -proj.vy * 1.8;
      proj.damage *= 2.5;
      proj.color = '#38bdf8';
    }
  }

  private updateProjectiles(dt: number, room: Room) {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life += dt;
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Despawn on max life
      if (proj.life >= proj.maxLife) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with platforms
      let hitPlatform = false;
      for (const plat of room.platforms) {
        if (plat.type === 'hazard') continue;
        if (
          proj.x > plat.x && proj.x < plat.x + plat.width &&
          proj.y > plat.y && proj.y < plat.y + plat.height
        ) {
          hitPlatform = true;
          break;
        }
      }

      if (hitPlatform) {
        if (proj.bounces > 0) {
          proj.bounces -= 1;
          proj.vx = -proj.vx;
          proj.vy = -proj.vy + (Math.random() - 0.5) * 2;
          this.spawnBurst(proj.x, proj.y, proj.color, 4, 2);
        } else {
          this.spawnBurst(proj.x, proj.y, proj.color, 6, 2);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Player Projectiles hitting Enemies
      if (proj.isPlayer) {
        let hitEnemy = false;
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0) continue;
          if (
            proj.x > enemy.x && proj.x < enemy.x + enemy.width &&
            proj.y > enemy.y && proj.y < enemy.y + enemy.height
          ) {
            hitEnemy = true;
            this.damageEnemy(enemy, proj.damage, false, proj.vx > 0 ? 1 : -1);
            if (proj.pierce > 0) {
              proj.pierce -= 1;
            } else {
              break;
            }
          }
        }
        if (hitEnemy && proj.pierce <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy Projectiles hitting Player
        const collidesWithPlayer = (
          proj.x > p.x && proj.x < p.x + p.width &&
          proj.y > p.y && proj.y < p.y + p.height
        );

        if (collidesWithPlayer) {
          if (p.isParrying) {
            // Deflect!
            this.triggerParrySuccess(undefined, proj);
            continue;
          } else if (p.invincibleTimer <= 0 && !p.isDashing) {
            this.damagePlayer(proj.damage);
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  public damagePlayer(amount: number) {
    const s = this.stats;
    s.hp -= amount;
    this.player.invincibleTimer = 0.8;
    this.camera.shakeTime = 0.2;
    this.camera.shakeIntensity = 5;
    sound.playHitImpact(false);

    this.spawnDamageNumber(this.player.x + this.player.width / 2, this.player.y, `-${amount}`, '#ef4444', false);
    this.spawnBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ef4444', 8, 3);

    // Check Death
    if (s.hp <= 0) {
      if (s.resurrectCount > 0) {
        // Phoenix resurrection
        s.resurrectCount -= 1;
        s.hp = Math.round(s.maxHp * 0.5);
        this.player.invincibleTimer = 2.0;
        sound.playAbilityCast();
        this.spawnDamageNumber(this.player.x, this.player.y - 30, 'ВОСКРЕШЕНИЕ!', '#f59e0b', true);
        this.spawnBurst(this.player.x, this.player.y, '#f59e0b', 30, 8);
      } else {
        s.hp = 0;
        sound.playEnemyDeath();
        if (this.onGameOver) {
          this.onGameOver(false, {
            shards: this.runShardsEarned,
            kills: this.enemiesKilledThisRun,
            biomes: this.biomeIndex + 1
          });
        }
      }
    }
  }

  public damageEnemy(enemy: Enemy, amount: number, isCrit: boolean, knockbackDir: 1 | -1) {
    enemy.hp -= amount;
    enemy.vx = knockbackDir * 4;
    sound.playHitImpact(isCrit);

    // Combo counter
    this.comboCounter += 1;
    this.comboTimer = 2.0;

    // Damage number
    const color = isCrit ? '#facc15' : '#f8fafc';
    this.spawnDamageNumber(enemy.x + enemy.width / 2, enemy.y - 10, `${amount}${isCrit ? '!' : ''}`, color, isCrit);
    this.spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.accentColor, isCrit ? 12 : 6, isCrit ? 4 : 2);

    // Boss phase transitions
    if (enemy.isBoss && enemy.bossMaxPhases) {
      const hpPercent = enemy.hp / enemy.maxHp;
      if (hpPercent < 0.35 && enemy.bossPhase === 2) {
        enemy.bossPhase = 3;
        this.triggerBossPhaseShift(enemy);
      } else if (hpPercent < 0.68 && enemy.bossPhase === 1) {
        enemy.bossPhase = 2;
        this.triggerBossPhaseShift(enemy);
      }
    }

    // Check Death
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.deathAnimTimer = 0.3;
      this.enemiesKilledThisRun += 1;
      sound.playEnemyDeath();

      // Shard drops
      const shards = enemy.isBoss ? 80 : Math.floor(Math.random() * 4) + 3;
      this.runShardsEarned += shards;
      this.spawnDamageNumber(enemy.x, enemy.y - 20, `+${shards} ЭФИРА`, '#38bdf8', true);

      // Void burst on kill perk
      if (this.stats.voidBurstOnKill) {
        this.triggerShockNova(enemy.x, enemy.y);
      }

      // Check if boss defeated: open victory portal
      if (enemy.isBoss) {
        const room = this.getCurrentRoom();
        room.interactables.push({
          id: `portal_win_${Date.now()}`,
          x: enemy.x,
          y: CANVAS_HEIGHT - 48 - 60,
          type: 'portal',
          opened: false,
          rewardType: 'upgrade'
        });
      }
    }
  }

  private triggerBossPhaseShift(boss: Enemy) {
    sound.playBossRoar();
    this.camera.shakeTime = 0.4;
    this.camera.shakeIntensity = 8;
    this.spawnBurst(boss.x + boss.width / 2, boss.y + boss.height / 2, '#d946ef', 30, 8);
    this.spawnDamageNumber(boss.x, boss.y - 30, `ФАЗА ${boss.bossPhase}!`, '#d946ef', true);
  }

  private applyBleedToEnemy(enemy: Enemy) {
    const bleedTick = 4;
    let ticks = 3;
    const interval = setInterval(() => {
      if (enemy.hp > 0 && ticks > 0) {
        ticks--;
        enemy.hp -= bleedTick;
        this.spawnDamageNumber(enemy.x + 10, enemy.y - 10, `${bleedTick}`, '#ef4444', false);
        this.spawnBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444', 3, 1.5);
      } else {
        clearInterval(interval);
      }
    }, 400);
  }

  private triggerShockNova(x: number, y: number) {
    this.spawnBurst(x, y, '#38bdf8', 16, 5);
    const room = this.getCurrentRoom();
    room.enemies.forEach(e => {
      if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < 140) {
        e.hp -= 18;
        this.spawnDamageNumber(e.x, e.y, '18⚡', '#38bdf8', true);
      }
    });
  }

  private checkHazardCollisions(room: Room) {
    const p = this.player;
    if (p.invincibleTimer > 0 || p.isDashing) return;

    room.platforms.forEach(plat => {
      if (plat.type === 'hazard') {
        if (
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          p.y + p.height > plat.y &&
          p.y < plat.y + plat.height
        ) {
          // Hazard hit
          this.damagePlayer(15);
          p.vy = -8; // bounce off spikes
        }
      }
    });
  }

  private checkRoomProgression(room: Room) {
    if (!room.cleared) {
      const activeEnemies = room.enemies.filter(e => e.hp > 0);
      if (activeEnemies.length === 0) {
        room.cleared = true;
        // Unlock doors
        room.doors.forEach(d => { d.locked = false; });
        sound.playShardPickup();
        this.spawnDamageNumber(CANVAS_WIDTH / 2, 100, 'КОМНАТА ЗАЧИЩЕНА!', '#facc15', true);
        sound.setMusicMood('ambient', this.biomeIndex);
      }
    }
  }

  private updateCamera(dt: number, room: Room) {
    const p = this.player;
    // Smooth follow with lookahead
    const lookAhead = p.facing * 50;
    this.camera.targetX = p.x + p.width / 2 + lookAhead - CANVAS_WIDTH / 2;
    this.camera.targetY = p.y + p.height / 2 - CANVAS_HEIGHT / 2;

    // Clamp camera within room bounds
    this.camera.targetX = Math.max(0, Math.min(room.width - CANVAS_WIDTH, this.camera.targetX));
    this.camera.targetY = Math.max(0, Math.min(room.height - CANVAS_HEIGHT, this.camera.targetY));

    // Smooth Lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.12;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.12;
  }

  private updateParticlesAndNumbers(dt: number) {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += part.gravity;
      part.alpha -= part.decay;
      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life += dt;
      dn.x += dn.vx;
      dn.y += dn.vy;
      dn.opacity = 1.0 - dn.life / dn.maxLife;
      if (dn.life >= dn.maxLife) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public spawnParticle(x: number, y: number, vx: number, vy: number, color: string, size: number, decay: number, gravity: number) {
    this.particles.push({ x, y, vx, vy, color, size, alpha: 1.0, decay, gravity });
  }

  public spawnBurst(x: number, y: number, color: string, count: number, maxSpeed: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * maxSpeed + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        gravity: GRAVITY * 0.2
      });
    }
  }

  public spawnDamageNumber(x: number, y: number, text: string, color: string, isCrit: boolean) {
    this.damageNumbers.push({
      id: `dn_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      isCrit,
      opacity: 1.0,
      vx: (Math.random() - 0.5) * 1.2,
      vy: isCrit ? -2.2 : -1.4,
      life: 0,
      maxLife: 0.9
    });
  }
}
