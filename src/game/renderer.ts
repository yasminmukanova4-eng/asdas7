import { Room, Camera, Enemy, Projectile, Particle, DamageNumber, BiomeConfig } from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  public render(
    biome: BiomeConfig,
    room: Room,
    camera: Camera,
    player: {
      x: number;
      y: number;
      width: number;
      height: number;
      vx: number;
      vy: number;
      facing: 1 | -1;
      isGrounded: boolean;
      isDashing: boolean;
      isParrying: boolean;
      parryFlash: number;
      isAttacking: boolean;
      attackCombo: number;
      attackProgress: number;
      invincibleTimer: number;
      activeWeaponColor: string;
    },
    enemies: Enemy[],
    projectiles: Projectile[],
    particles: Particle[],
    damageNumbers: DamageNumber[],
    gameTime: number
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Screen shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (camera.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * camera.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * camera.shakeIntensity * 2;
    }

    // Clear background
    ctx.fillStyle = biome.palette.skyTop;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Render Atmospheric Parallax Background
    this.renderParallaxBackground(biome, camera, gameTime);

    // Camera transform for in-world elements
    ctx.save();
    ctx.translate(Math.round(-camera.x + shakeX), Math.round(-camera.y + shakeY));

    // 2. Room Architecture & Platforms
    this.renderRoomPlatforms(ctx, room, biome, gameTime);

    // 3. Interactables (Shrines, Chests, Portals, Doors)
    this.renderInteractables(ctx, room, gameTime);

    // 4. Enemies & Bosses
    this.renderEnemies(ctx, enemies, gameTime);

    // 5. Player Character (Smooth Dark Gothic Warrior)
    this.renderPlayer(ctx, player, gameTime);

    // 6. Projectiles with Light Ribbons
    this.renderProjectiles(ctx, projectiles);

    // 7. Particles
    this.renderParticles(ctx, particles);

    // 8. Damage numbers
    this.renderDamageNumbers(ctx, damageNumbers);

    ctx.restore();

    // 9. Volumetric Lighting & Atmospheric Vignette
    this.renderLightingOverlay(ctx, biome, room, camera, player, projectiles, gameTime);

    ctx.restore();
  }

  // --- PARALLAX BACKGROUND ---
  private renderParallaxBackground(biome: BiomeConfig, camera: Camera, time: number) {
    const ctx = this.ctx;

    // Atmospheric deep gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, biome.palette.skyTop);
    skyGrad.addColorStop(0.65, biome.palette.skyBottom);
    skyGrad.addColorStop(1, '#090812');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Celestial Moon / Eclipse
    const moonX = CANVAS_WIDTH * 0.75 - camera.x * 0.03;
    const moonY = 110;
    const moonRadius = 46;

    // Outer moon corona bloom
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 2.8);
    moonGlow.addColorStop(0, 'rgba(241, 245, 249, 0.25)');
    moonGlow.addColorStop(0.5, biome.palette.glow + '18');
    moonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Moon body with dark eclipse silhouette
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eclipse shadow disc
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(moonX - 14, moonY - 6, moonRadius * 0.94, 0, Math.PI * 2);
    ctx.fill();

    // Far Layer: Gothic Cathedral Spires & Tower Silhouettes (Slowest parallax 0.08)
    ctx.fillStyle = biome.palette.mountainFar;
    ctx.beginPath();
    const farOffset = -camera.x * 0.08;
    for (let x = -100; x < CANVAS_WIDTH + 150; x += 180) {
      const rx = x + (farOffset % 180);
      const baseH = 260;
      // Cathedral roof and spires
      ctx.moveTo(rx, CANVAS_HEIGHT);
      ctx.lineTo(rx, CANVAS_HEIGHT - baseH);
      ctx.lineTo(rx + 45, CANVAS_HEIGHT - baseH - 90); // Spire peak
      ctx.lineTo(rx + 90, CANVAS_HEIGHT - baseH);
      ctx.lineTo(rx + 140, CANVAS_HEIGHT - baseH + 30);
      ctx.lineTo(rx + 180, CANVAS_HEIGHT);
    }
    ctx.closePath();
    ctx.fill();

    // Mid Layer: Gothic Arched Colonnades & Ruined Ramparts (Parallax 0.16)
    ctx.fillStyle = biome.palette.mountainMid;
    ctx.beginPath();
    const midOffset = -camera.x * 0.16;
    for (let x = -80; x < CANVAS_WIDTH + 160; x += 140) {
      const mx = x + (midOffset % 140);
      const wallH = 180;
      ctx.moveTo(mx, CANVAS_HEIGHT);
      ctx.lineTo(mx, CANVAS_HEIGHT - wallH);
      // Crenellations & battlements
      ctx.lineTo(mx + 25, CANVAS_HEIGHT - wallH);
      ctx.lineTo(mx + 25, CANVAS_HEIGHT - wallH + 18);
      ctx.lineTo(mx + 45, CANVAS_HEIGHT - wallH + 18);
      ctx.lineTo(mx + 45, CANVAS_HEIGHT - wallH);
      ctx.lineTo(mx + 70, CANVAS_HEIGHT - wallH);
      ctx.lineTo(mx + 70, CANVAS_HEIGHT - wallH + 18);
      ctx.lineTo(mx + 90, CANVAS_HEIGHT - wallH + 18);
      ctx.lineTo(mx + 90, CANVAS_HEIGHT - wallH);
      ctx.lineTo(mx + 140, CANVAS_HEIGHT - wallH);
      ctx.lineTo(mx + 140, CANVAS_HEIGHT);
    }
    ctx.closePath();
    ctx.fill();

    // Near Atmospheric Fog Band (Volumetric drifting haze)
    const fogGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 160, 0, CANVAS_HEIGHT);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(0.5, biome.palette.ambient);
    fogGrad.addColorStop(1, 'rgba(5, 5, 10, 0.7)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - 160, CANVAS_WIDTH, 160);

    // Drifting background dust/cinders
    this.renderAmbientDust(ctx, time, biome.palette.glow);
  }

  private renderAmbientDust(ctx: CanvasRenderingContext2D, time: number, color: string) {
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const seed = i * 47.3;
      const x = ((seed * 19 + time * 25) % (CANVAS_WIDTH + 40)) - 20;
      const y = ((seed * 31 + Math.sin(time + seed) * 30) % (CANVAS_HEIGHT - 60)) + 30;
      const r = 1 + (i % 3) * 0.8;
      const alpha = 0.2 + (Math.sin(time * 2 + seed) * 0.5 + 0.5) * 0.4;

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- ROOM ARCHITECTURE & PLATFORMS ---
  private renderRoomPlatforms(ctx: CanvasRenderingContext2D, room: Room, biome: BiomeConfig, time: number) {
    room.platforms.forEach(plat => {
      ctx.save();

      if (plat.type === 'hazard') {
        this.renderHazardPlatform(ctx, plat, biome, time);
        ctx.restore();
        return;
      }

      if (plat.type === 'one_way') {
        // Floating Ancient Slate Slab with Ornate Carvings & Corbels
        // Top highlight bevel
        ctx.fillStyle = '#475569';
        ctx.fillRect(plat.x, plat.y, plat.width, 2);

        // Slate Body with gradient
        const slateGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
        slateGrad.addColorStop(0, '#1e293b');
        slateGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = slateGrad;
        ctx.fillRect(plat.x, plat.y + 2, plat.width, plat.height - 2);

        // Gold / Azure runic edge inlay
        ctx.strokeStyle = biome.palette.structures;
        ctx.lineWidth = 1;
        ctx.strokeRect(plat.x + 3, plat.y + 3, plat.width - 6, plat.height - 6);

        // Hanging ornate gothic stone brackets / corbels
        for (let bx = plat.x + 16; bx < plat.x + plat.width - 12; bx += 40) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(bx, plat.y + plat.height);
          ctx.lineTo(bx + 12, plat.y + plat.height);
          ctx.lineTo(bx + 6, plat.y + plat.height + 8);
          ctx.closePath();
          ctx.fill();
        }

        // Soft underside shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(plat.x, plat.y + plat.height, plat.width, 6);

        ctx.restore();
        return;
      }

      // Solid Stone Architecture (Floor, Walls, Columns)
      // Base dark stone fill
      const wallGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
      wallGrad.addColorStop(0, biome.palette.groundAccent);
      wallGrad.addColorStop(0.12, biome.palette.groundMain);
      wallGrad.addColorStop(1, '#08060c');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Top flagstone cap
      ctx.fillStyle = '#475569';
      ctx.fillRect(plat.x, plat.y, plat.width, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(plat.x, plat.y + 3, plat.width, 4);

      // Clean Ashlar Masonry Stone Seams (Subtle, elegant mortar joints)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = 1.5;

      const blockSizeX = 48;
      const blockSizeY = 24;

      // Horizontal masonry courses
      for (let y = plat.y + 12; y < plat.y + plat.height; y += blockSizeY) {
        ctx.beginPath();
        ctx.moveTo(plat.x, y);
        ctx.lineTo(plat.x + plat.width, y);
        ctx.stroke();

        // Vertical block seams with alternating brick bond
        const row = Math.floor((y - plat.y) / blockSizeY);
        const offsetX = (row % 2 === 0) ? 0 : blockSizeX / 2;
        for (let x = plat.x + offsetX; x < plat.x + plat.width; x += blockSizeX) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + blockSizeY);
          ctx.stroke();
        }
      }

      // Subtle volumetric ambient occlusion corner shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(plat.x, plat.y, plat.width, 8);

      ctx.restore();
    });
  }

  private renderHazardPlatform(ctx: CanvasRenderingContext2D, plat: { x: number; y: number; width: number; height: number; hazardType?: string }, biome: BiomeConfig, time: number) {
    if (plat.hazardType === 'spikes') {
      // Forged Gothic Steel Spikes with Metallic Highlights
      const spikeW = 14;
      const numSpikes = Math.floor(plat.width / spikeW);

      for (let i = 0; i < numSpikes; i++) {
        const sx = plat.x + i * spikeW;
        const sy = plat.y + plat.height;
        const apexY = plat.y - 4;

        // Left dark facet
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + spikeW / 2, apexY);
        ctx.lineTo(sx + spikeW / 2, sy);
        ctx.closePath();
        ctx.fill();

        // Right gleaming steel facet
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(sx + spikeW / 2, sy);
        ctx.lineTo(sx + spikeW / 2, apexY);
        ctx.lineTo(sx + spikeW, sy);
        ctx.closePath();
        ctx.fill();

        // Crimson glint on spike tip
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(sx + spikeW / 2, apexY + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Toxic / Void Mist Basin
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      const alpha = 0.5 + Math.sin(time * 5 + plat.x) * 0.25;
      ctx.fillStyle = `rgba(163, 230, 53, ${alpha})`;
      ctx.fillRect(plat.x, plat.y, plat.width, 4);

      // Rising toxic bubbles
      for (let b = 0; b < 4; b++) {
        const bx = plat.x + ((b * 47 + time * 30) % plat.width);
        const by = plat.y - ((b * 12 + time * 20) % 18);
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- INTERACTABLES & DOORS ---
  private renderInteractables(ctx: CanvasRenderingContext2D, room: Room, time: number) {
    // 1. Doors & Arched Portals
    room.doors.forEach(door => {
      ctx.save();
      const hw = door.width / 2;

      if (door.locked) {
        // Heavy Iron Portcullis with Glowing Crimson Seal
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Vertical iron bars
        for (let bx = door.x + 6; bx < door.x + door.width; bx += 8) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(bx, door.y, 3, door.height);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(bx, door.y, 1, door.height);
        }

        // Glowing crimson lock sigil
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(door.x + hw, door.y + door.height / 2, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(door.x + hw, door.y + door.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Open Ethereal Gothic Portal Archway
        const archGrad = ctx.createLinearGradient(door.x, door.y, door.x + door.width, door.y);
        archGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        archGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.45)');
        archGrad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
        ctx.fillStyle = archGrad;
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Guiding luminous directional chevron
        const pulse = Math.sin(time * 6) * 5;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        if (door.direction === 'right') {
          ctx.moveTo(door.x + 8 + pulse, door.y + door.height / 2 - 12);
          ctx.lineTo(door.x + 24 + pulse, door.y + door.height / 2);
          ctx.lineTo(door.x + 8 + pulse, door.y + door.height / 2 + 12);
        } else {
          ctx.moveTo(door.x + door.width - 8 - pulse, door.y + door.height / 2 - 12);
          ctx.lineTo(door.x + door.width - 24 - pulse, door.y + door.height / 2);
          ctx.lineTo(door.x + door.width - 8 - pulse, door.y + door.height / 2 + 12);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. Shrines, Chests & Void Nexus Portals
    room.interactables.forEach(item => {
      ctx.save();
      const hoverY = Math.sin(time * 4) * 5;

      if (item.type === 'shrine') {
        // Altar of Transcendence: Carved Obsidian Pedestal + Hovering Runic Octahedron
        // Ornate pedestal
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(item.x - 8, item.y + 12, 48, 20); // Plinth
        ctx.fillStyle = '#334155';
        ctx.fillRect(item.x - 4, item.y, 40, 12); // Capital

        // Volumetric ascending light pillar
        if (!item.opened) {
          const beamGrad = ctx.createLinearGradient(0, item.y - 120, 0, item.y + 10);
          beamGrad.addColorStop(0, 'transparent');
          beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
          beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');
          ctx.fillStyle = beamGrad;
          ctx.fillRect(item.x - 6, item.y - 120, 44, 130);
        }

        // Floating Runic Octahedron Crystal
        const cx = item.x + 16;
        const cy = item.y - 14 + hoverY;

        ctx.fillStyle = item.opened ? '#475569' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx + 14, cy);
        ctx.lineTo(cx, cy + 20);
        ctx.lineTo(cx - 14, cy);
        ctx.closePath();
        ctx.fill();

        // Specular inner diamond
        ctx.fillStyle = item.opened ? '#64748b' : '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx, cy + 20);
        ctx.closePath();
        ctx.fill();

        // Orbiting ethereal ring
        if (!item.opened) {
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 22, 7, time * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (item.type === 'chest') {
        // Ancient Gilded Reliquary
        const cx = item.x;
        const cy = item.y;

        // Chest body
        ctx.fillStyle = item.opened ? '#334155' : '#78350f';
        ctx.beginPath();
        ctx.roundRect(cx, cy + 6, 36, 22, [0, 0, 4, 4]);
        ctx.fill();

        // Ornate Curved Chest Lid
        ctx.fillStyle = item.opened ? '#475569' : '#92400e';
        ctx.beginPath();
        ctx.roundRect(cx - 2, cy, 40, 10, [6, 6, 0, 0]);
        ctx.fill();

        // Gold Trim & Royal Seal
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx + 16, cy, 4, 28);
        ctx.fillRect(cx + 2, cy + 8, 32, 2.5);

        // Gem clasp
        ctx.fillStyle = item.opened ? '#64748b' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx + 18, cy + 12, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'portal') {
        // Biome Transition Portal: Swirling Dark-Star Singularity with Accretion Disk
        const px = item.x + 24;
        const py = item.y + 8;
        const r = 38 + Math.sin(time * 4) * 4;

        // Outer cosmic accretion halo
        const haloGrad = ctx.createRadialGradient(px, py, 10, px, py, r * 1.8);
        haloGrad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        haloGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
        haloGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.2)');
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Swirling concentric energy rings
        for (let ring = 0; ring < 3; ring++) {
          const ringAngle = time * (3 - ring) * 0.8;
          ctx.strokeStyle = ring === 0 ? '#e0e7ff' : ring === 1 ? '#38bdf8' : '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(px, py, r - ring * 7, (r - ring * 7) * 0.5, ringAngle, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Deep Event Horizon (Black Void Core)
        ctx.fillStyle = '#05030a';
        ctx.beginPath();
        ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- PLAYER CHARACTER (ASHEN WARRIOR) ---
  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    p: {
      x: number;
      y: number;
      width: number;
      height: number;
      vx: number;
      vy: number;
      facing: 1 | -1;
      isGrounded: boolean;
      isDashing: boolean;
      isParrying: boolean;
      parryFlash: number;
      isAttacking: boolean;
      attackCombo: number;
      attackProgress: number;
      invincibleTimer: number;
      activeWeaponColor: string;
    },
    time: number
  ) {
    ctx.save();

    // Invincibility flicker
    if (p.invincibleTimer > 0 && Math.floor(time * 30) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(p.facing, 1);

    // 1. Dash Spectral After-Images
    if (p.isDashing) {
      for (let s = 1; s <= 2; s++) {
        ctx.save();
        ctx.translate(-p.vx * s * 2, 0);
        ctx.globalAlpha = 0.35 / s;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Flowing Spectral Cloak (Cloth simulation spline behind player)
    const runLean = p.vx !== 0 ? Math.sign(p.vx * p.facing) * 0.15 : 0;
    const flap = Math.sin(time * 12) * 5 + (p.vx !== 0 ? -12 : -2);

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.quadraticCurveTo(-14 + flap * 0.5, 4, -18 + flap, 20); // Outer edge
    ctx.lineTo(-6, 22);
    ctx.quadraticCurveTo(-6, 4, 4, -10); // Return
    ctx.closePath();
    ctx.fill();

    // Luminous ethereal hem glow on cape
    ctx.strokeStyle = p.activeWeaponColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18 + flap, 20);
    ctx.lineTo(-6, 22);
    ctx.stroke();
    ctx.restore();

    // 3. Legs & Greaves
    const legPhase = p.isGrounded && Math.abs(p.vx) > 0.5 ? Math.sin(time * 15) * 8 : 0;

    // Back leg
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-8 - legPhase * 0.5, 8, 7, 16, 3);
    ctx.fill();

    // Front leg
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(1 + legPhase * 0.5, 8, 7, 16, 3);
    ctx.fill();

    // Steel sabatons (armored boots)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(1 + legPhase * 0.5, 21, 9, 3.5);

    // 4. Gothic Torso / Engraved Cuirass
    ctx.save();
    ctx.rotate(runLean);

    // Under-tunic
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 22, 4);
    ctx.fill();

    // Silver-embossed chest cuirass
    const chestGrad = ctx.createLinearGradient(-6, -10, 6, 6);
    chestGrad.addColorStop(0, '#64748b');
    chestGrad.addColorStop(0.5, '#334155');
    chestGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = chestGrad;
    ctx.beginPath();
    ctx.roundRect(-6, -10, 14, 16, 3);
    ctx.fill();

    // Shoulder pauldron
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(2, -10, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hooded Cowl & Glowing Ethereal Visor
    // Dark cowl hood
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Pointed hood peak
    ctx.beginPath();
    ctx.moveTo(-6, -24);
    ctx.lineTo(2, -26);
    ctx.lineTo(8, -18);
    ctx.closePath();
    ctx.fill();

    // Deep shadow under hood
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(3, -18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilliant glowing cyan visor / slit eye (Ethereal Ashen Warrior signature)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(3, -19, 6, 2.5, 1);
    ctx.fill();

    // Visor eye flare bloom
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(6, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // restore torso rotation

    // 6. Active Weapon & Dynamic Crescent Slash Ribbon
    if (p.isAttacking) {
      const progress = p.attackProgress;
      const angle = -Math.PI * 0.45 + progress * Math.PI * 0.95;

      ctx.save();
      ctx.translate(6, 0);
      ctx.rotate(angle);

      // Katana / Blade Hilt & Guard
      ctx.fillStyle = '#d97706'; // Gold habaki
      ctx.fillRect(0, -2, 6, 4);
      ctx.fillStyle = '#1e293b'; // Tsuka handle
      ctx.fillRect(-10, -1.5, 10, 3);

      // Curved steel Katana blade
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(6, -1.5);
      ctx.lineTo(38, -2.5);
      ctx.lineTo(44, 0);
      ctx.lineTo(6, 1.5);
      ctx.closePath();
      ctx.fill();

      // Incandescent glowing blade cutting edge
      ctx.fillStyle = p.activeWeaponColor;
      ctx.fillRect(10, -2.5, 32, 1.5);

      ctx.restore();

      // Breathtaking Crescent Energy Slash Arc
      const arcRadius = 46;
      const arcGrad = ctx.createLinearGradient(0, -arcRadius, arcRadius, arcRadius);
      arcGrad.addColorStop(0, p.activeWeaponColor);
      arcGrad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = arcGrad;
      ctx.lineWidth = p.attackCombo === 3 ? 8 : 5;
      ctx.beginPath();
      ctx.arc(8, 0, arcRadius, -Math.PI * 0.55, Math.PI * 0.35);
      ctx.stroke();

      // Inner white-hot cutting core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, arcRadius, -Math.PI * 0.45, Math.PI * 0.25);
      ctx.stroke();
    } else {
      // Sheathed Katana at Hip with Gilded Saya
      ctx.fillStyle = '#0f172a'; // Saya scabbard
      ctx.fillRect(-14, 0, 4, 20);
      ctx.fillStyle = '#d97706'; // Gold tsuba & pommel
      ctx.fillRect(-15, -4, 6, 3);
      ctx.fillRect(-14, -8, 4, 4);
    }

    // 7. Celestial Parry Energy Barrier
    if (p.isParrying || p.parryFlash > 0) {
      ctx.save();
      const alpha = p.parryFlash > 0 ? 0.95 : 0.65;
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(14, 0, 28, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.stroke();

      // Radiant energy fill
      ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(14, 0, 26, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.fill();

      // Sacred Runic Node Spikes
      for (let a = -0.4; a <= 0.4; a += 0.4) {
        const nx = 14 + Math.cos(a) * 28;
        const ny = Math.sin(a) * 28;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // --- ENEMIES & BOSSES ---
  private renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], time: number) {
    enemies.forEach(enemy => {
      if (enemy.hp <= 0 && (!enemy.deathAnimTimer || enemy.deathAnimTimer <= 0)) return;

      ctx.save();
      ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      ctx.scale(enemy.facing, 1);

      // Stun wobble
      if (enemy.isStunned) {
        ctx.translate((Math.random() - 0.5) * 3, 0);
        // Stun celestial stars
        for (let i = 0; i < 3; i++) {
          const starAngle = time * 7 + (i * Math.PI * 2) / 3;
          const sx = Math.cos(starAngle) * 18;
          const sy = -enemy.height / 2 - 14 + Math.sin(starAngle) * 4;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Attack telegraph alert flare
      if (enemy.state === 'alert' || (enemy.attackCooldown < 0.35 && enemy.attackCooldown > 0)) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -enemy.height / 2 - 10, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1.5, -enemy.height / 2 - 14, 3, 5);
        ctx.fillRect(-1.5, -enemy.height / 2 - 7, 3, 2.5);
      }

      if (enemy.isBoss) {
        this.renderBossSprite(ctx, enemy, time);
      } else if (enemy.flying) {
        this.renderFlyingEnemySprite(ctx, enemy, time);
      } else {
        this.renderGroundEnemySprite(ctx, enemy, time);
      }

      ctx.restore();

      // Overhead enemy health bar
      this.renderEnemyHealthBar(ctx, enemy);
    });
  }

  private renderGroundEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    const hw = enemy.width / 2;
    const hh = enemy.height / 2;

    // 1. Armored Body with Metallic Shading
    const armorGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    armorGrad.addColorStop(0, enemy.color);
    armorGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 8, enemy.width, enemy.height - 8, 4);
    ctx.fill();

    // 2. Gothic Horned Barbute Helmet
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-hw + 3, -hh - 2, enemy.width - 6, 14, [4, 4, 1, 1]);
    ctx.fill();

    // Helmet horns / crest
    ctx.fillStyle = enemy.accentColor;
    ctx.beginPath();
    ctx.moveTo(-hw + 4, -hh - 2);
    ctx.lineTo(-hw - 2, -hh - 8);
    ctx.lineTo(-hw + 7, -hh);
    ctx.closePath();
    ctx.fill();

    // 3. Menacing Glowing Red Visor Slit
    ctx.fillStyle = enemy.accentColor;
    ctx.fillRect(1, -hh + 3, 6, 2.5);

    // 4. Heavy Gothic Shield or Polearm
    if (enemy.shielded) {
      // Curved Kite Shield with Heraldic Trim
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(hw - 8, -hh + 4);
      ctx.lineTo(hw + 4, -hh + 4);
      ctx.lineTo(hw + 4, hh - 6);
      ctx.lineTo(hw - 2, hh);
      ctx.lineTo(hw - 8, hh - 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = enemy.accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Gleaming Halberd / Steel Blade
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(hw - 3, -hh - 6, 4, enemy.height + 10);
      ctx.fillStyle = enemy.accentColor;
      ctx.beginPath();
      ctx.moveTo(hw - 5, -hh - 12);
      ctx.lineTo(hw + 9, -hh - 4);
      ctx.lineTo(hw - 1, -hh + 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderFlyingEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    const hw = enemy.width / 2;
    const hh = enemy.height / 2;
    const flap = Math.sin(time * 12) * 10;

    // 1. Organic Membranous Bat Wings with Bone Ribs
    ctx.fillStyle = enemy.accentColor;
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.quadraticCurveTo(-hw - 12, -hh - flap - 8, -hw - 18, -hh - flap);
    ctx.quadraticCurveTo(-hw - 8, 2, 0, 4);
    ctx.closePath();
    ctx.fill();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.quadraticCurveTo(hw + 12, -hh - flap - 8, hw + 18, -hh - flap);
    ctx.quadraticCurveTo(hw + 8, 2, 0, 4);
    ctx.closePath();
    ctx.fill();

    // 2. Obsidian Demon / Gargoyle Torso
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, hw * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // 3. Glowing Occult Core Eye
    ctx.fillStyle = enemy.accentColor;
    ctx.beginPath();
    ctx.arc(3, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBossSprite(ctx: CanvasRenderingContext2D, boss: Enemy, time: number) {
    const hw = boss.width / 2;
    const hh = boss.height / 2;
    const auraPulse = Math.sin(time * 5) * 8;

    // 1. Grand Outer Volumetric Boss Aura
    const auraGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, hw + 36 + auraPulse);
    auraGrad.addColorStop(0, boss.accentColor + '55');
    auraGrad.addColorStop(0.6, boss.accentColor + '22');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hw + 36 + auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Multi-Layer Grand Gothic Wings
    const wingFlap = Math.sin(time * 6) * 10;
    ctx.fillStyle = boss.accentColor;
    for (let side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(side * (hw + 30), -hh - 15 - wingFlap);
      ctx.lineTo(side * (hw + 45), -hh + 10 - wingFlap);
      ctx.lineTo(side * (hw + 20), hh - 10);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Massive Armored Boss Torso
    const bossGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    bossGrad.addColorStop(0, boss.color);
    bossGrad.addColorStop(1, '#090812');
    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 14, boss.width, boss.height - 14, 8);
    ctx.fill();

    // 4. Ornate Gold / Blood Carved Filigree Armor
    ctx.strokeStyle = boss.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-hw + 8, -hh + 20, boss.width - 16, boss.height - 30, 4);
    ctx.stroke();

    // 5. Crown of the Eclipse / Spiked Demonic Diadem
    ctx.fillStyle = boss.accentColor;
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 14);
    ctx.lineTo(-hw - 2, -hh - 18);
    ctx.lineTo(-hw + 14, -hh + 4);
    ctx.lineTo(0, -hh - 28); // Towering center spike
    ctx.lineTo(hw - 14, -hh + 4);
    ctx.lineTo(hw + 2, -hh - 18);
    ctx.lineTo(hw - 6, -hh + 14);
    ctx.closePath();
    ctx.fill();

    // 6. Three Brilliant Glowing Red Visor Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -hh + 8, 8, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, -hh + 8, 6, 4);
    ctx.fillRect(-14, -hh + 8, 6, 4);

    // 7. Colossal Greatblade
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(hw - 4, -hh - 24, 8, boss.height + 36);
    ctx.fillStyle = boss.accentColor;
    ctx.fillRect(hw - 9, -hh - 30, 18, 14);
  }

  private renderEnemyHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    if (enemy.isBoss || enemy.hp >= enemy.maxHp) return;

    const barW = Math.max(36, enemy.width);
    const barH = 5;
    const bx = enemy.x + (enemy.width - barW) / 2;
    const by = enemy.y - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 2);
    ctx.fill();

    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * hpPercent, barH, 1.5);
    ctx.fill();
  }

  // --- PROJECTILES & PARTICLES ---
  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    projectiles.forEach(p => {
      ctx.save();

      // Glowing outer projectile halo
      const glow = ctx.createRadialGradient(p.x, p.y, p.radius * 0.4, p.x, p.y, p.radius * 2.2);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Projectile tail ribbon
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
      ctx.stroke();

      // White-hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderDamageNumbers(ctx: CanvasRenderingContext2D, numbers: DamageNumber[]) {
    ctx.save();
    numbers.forEach(dn => {
      ctx.font = dn.isCrit ? 'bold 15px "JetBrains Mono", monospace' : 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = dn.color;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, dn.opacity);

      // Soft text outline
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#05030a';
      ctx.strokeText(dn.text, dn.x, dn.y);
      ctx.fillText(dn.text, dn.x, dn.y);
    });
    ctx.restore();
  }

  // --- VOLUMETRIC LIGHTING & AMBIENT VIGNETTE ---
  private renderLightingOverlay(
    ctx: CanvasRenderingContext2D,
    biome: BiomeConfig,
    room: Room,
    camera: Camera,
    player: { x: number; y: number; width: number; height: number; activeWeaponColor: string },
    projectiles: Projectile[],
    time: number
  ) {
    ctx.save();

    // Soft Cinematic Vignette on Viewport Edges
    const vigGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.45,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.65
    );
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(3, 2, 6, 0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.restore();
  }
}
