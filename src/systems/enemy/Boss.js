import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Enemy } from './Enemy.js';
import { modelCache } from '../../utils/ModelCache.js';
import gsap from 'gsap';

export class Boss extends Enemy {
    constructor(scene, projectileSystem, itemSystem, type = 'BOSS_1', musicSystem = null) {
        super(scene, projectileSystem, itemSystem, type, null, musicSystem);
        this.hp = CONFIG.ENEMIES[type]?.HP || 2000;
        this.maxHP = this.hp;
        this.moveDirection = 1;
        this.moveSpeed = (CONFIG.ENEMIES.BOSS_1?.MOVE_SPEED || 3.0) / 30;

        this.state = 'FIGHTING';
        this.shootTimer = 0;
        this.laserTimer = 0;
        this.isCastingLaser = false;
        this.laserCastTimer = 0;
        this.shootCount = 0;
        this.hasRetreated = false;
        this.onRetreatComplete = null;
        this.isAimingLaser = false;
        this.aimingTimer = 0;
    }

    loadModel() {
        const cachedModel = modelCache.getModel('boss_1');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(13, 13, 13);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 1] Fallback model used.");
            const geo = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }
    }

    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return;

        // Xử lý rút lui
        if (this.state === 'RETREATING') {
            this.mesh.position.z -= delta * 100;
            const newScale = Math.max(0, this.mesh.scale.x - delta * 1.5);
            this.mesh.scale.set(newScale, newScale, newScale);

            if (this.mesh.position.z < -250 || newScale <= 0) {
                this.state = 'HIDDEN';
                if (this.onRetreatComplete) {
                    this.onRetreatComplete();
                }
            }
            return;
        }

        if (this.state === 'HIDDEN') return;

        // Xử lý ngắm bắn Laser
        if (this.isAimingLaser) {
            this.aimingTimer -= delta;
            this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, playerPos.x, 0.1);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, playerPos.y, 0.1);

            if (this.aimingTimer <= 0) {
                this.isAimingLaser = false;
                this.isCastingLaser = true;
                this.laserCastTimer = 3.0;
                this.shootLaser(playerPos);
            }
            return;
        }

        // Xử lý đang bắn Laser
        if (this.isCastingLaser) {
            this.laserCastTimer -= delta;
            this.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.01;

            if (this.laserCastTimer <= 0) {
                this.isCastingLaser = false;
            }
            return;
        }

        // Di chuyển vào vị trí chiến đấu
        const bossTargetZ = -35;
        if (this.mesh.position.z < bossTargetZ) {
            this.mesh.position.z += delta * 15;
            if (this.mesh.position.z > bossTargetZ) this.mesh.position.z = bossTargetZ;
        } else if (this.mesh.position.z > bossTargetZ + 5) {
            this.mesh.position.z -= delta * 5;
        }

        // Di chuyển qua lại theo trục X
        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 60;

        const limitX = 35;
        const limitY = 20;
        const distSq = Math.pow(this.mesh.position.x / limitX, 2) + Math.pow(this.mesh.position.y / limitY, 2);

        if (distSq > 1) {
            const angle = Math.atan2(this.mesh.position.y, this.mesh.position.x);
            const tx = Math.cos(angle) * limitX * 0.95;
            const ty = Math.sin(angle) * limitY * 0.95;
            this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, tx, 0.05);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, ty, 0.05);
            this.moveDirection *= -1;
        }

        this.mesh.position.y += Math.sin(Date.now() * 0.001) * 0.05;

        // Tấn công thường
        this.shootTimer += delta;
        if (this.shootTimer >= (CONFIG.ENEMIES.BOSS_1?.ATTACK_INTERVAL || 2.0)) {
            this.shootTimer = 0;
            this.shootSphere(playerPos);
            this.shootCount++;
        }

        // Chu kỳ bắn Laser
        this.laserTimer += delta;
        if (this.laserTimer >= 6.0 && !this.isAimingLaser && !this.isCastingLaser) {
            this.isAimingLaser = true;
            this.aimingTimer = 1.2;
            this.laserTimer = 0;
            if (this.uiManager) this.uiManager.showMessage("BOSS: LOCKING ON!", "#ffcc00", 1000);
        }

        // Kiểm tra ngưỡng rút lui (50% HP)
        if (this.state === 'FIGHTING' && this.hp <= this.maxHP * 0.5 && !this.hasRetreated) {
            this.state = 'RETREATING';
            this.hasRetreated = true;
        }
    }

    shoot(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.BULLET_SPEED || 0.4;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage, true);
    }

    shootHoming(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.HOMING_SPEED || 0.6;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage * 0.8, true);
    }

    shootLaser(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        if (this.musicSystem) this.musicSystem.playSound('HIEU_UNG_LAZE_BAN');
        const direction = new THREE.Vector3(0, 0, 1);
        const speed = 0;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage * 1.2, true, 'BOSS_LASER', this.mesh);
    }

    shootSphere(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.BULLET_SPEED || 0.4;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage, true, 'SPHERE');
    }
}

export class Boss2 extends Enemy {
    constructor(scene, projectileSystem, itemSystem, enemyManager, musicSystem = null) {
        super(scene, projectileSystem, itemSystem, 'BOSS_2', null, musicSystem);
        this.hp = CONFIG.ENEMIES.BOSS_2?.HP || 5000;
        this.maxHP = this.hp;
        this.moveDirection = 1;
        this.moveSpeed = 0.15;

        this.state = 'FIGHTING';
        this.shootTimer = 0;
        this.spreadTimer = 0;
        this.spawnTimer = 0;
        this.enemyManager = enemyManager;

        this.targetZ = -30;
    }

    loadModel() {
        const cachedModel = modelCache.getModel('boss_2');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(1.5, 1.5, 1.5);
            this.mesh.rotation.y = Math.PI;
            this.mesh.position.set(0, 10, -50);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 2] Fallback model used.");
            const geo = new THREE.BoxGeometry(4, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }
    }

    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return;

        if (this.mesh.position.z < this.targetZ) {
            this.mesh.position.z += delta * 20;
            if (this.mesh.position.z > this.targetZ) this.mesh.position.z = this.targetZ;
        } else if (this.mesh.position.z > this.targetZ + 5) {
            this.mesh.position.z -= delta * 8;
        }

        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 80;

        const limitX = 40;
        const limitY = 25;
        const distSq = Math.pow(this.mesh.position.x / limitX, 2) + Math.pow(this.mesh.position.y / limitY, 2);

        if (distSq > 1) {
            const angle = Math.atan2(this.mesh.position.y, this.mesh.position.x);
            const tx = Math.cos(angle) * limitX * 0.95;
            const ty = Math.sin(angle) * limitY * 0.95;
            this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, tx, 0.05);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, ty, 0.05);
            this.moveDirection *= -1;
        }

        this.mesh.position.y += Math.sin(Date.now() * 0.002) * 0.08;

        this.spreadTimer += delta;
        if (this.spreadTimer >= (CONFIG.ENEMIES.BOSS_2?.ATTACK_INTERVAL || 3.5)) {
            this.spreadTimer = 0;
            this.shootSpread(playerPos);
        }

        this.spawnTimer += delta;
        const spawnInterval = CONFIG.ENEMIES.BOSS_2?.SPAWN_INTERVAL || 15;
        if (this.spawnTimer >= spawnInterval && this.enemyManager) {
            this.spawnTimer = 0;
            this.spawnMinions();
        }
    }

    shootSpread(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const baseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_2?.BULLET_SPEED || 0.6;
        const dmg = CONFIG.ENEMIES.BOSS_2?.SPREAD_DAMAGE || 20;

        const angles = [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7];
        const axis = new THREE.Vector3(0, 1, 0);

        angles.forEach(angle => {
            const dir = baseDir.clone().applyAxisAngle(axis, angle);
            this.projectileSystem.spawn(this.mesh.position, dir, speed, dmg, true, 'SPHERE');
        });
    }

    spawnMinions() {
        if (!this.enemyManager || !this.scene) return;
        const minion = new Enemy(this.scene, this.projectileSystem, this.itemSystem, 'QUAI_1', this.mesh.position);
        minion.isOrbitalShield = true;
        minion.shieldTarget = this;
        minion.onLoadComplete = () => {
            minion.mesh.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z + 6);
        };
        minion.maxHP = CONFIG.ENEMIES.QUAI_1?.HP || 50;
        minion.hp = minion.maxHP;
        minion.isBossMinion = true;
        this.enemyManager.enemies.push(minion);
    }

    die() {
        super.die();
        if (this.enemyManager && this.enemyManager.enemies) {
            this.enemyManager.enemies.forEach(enemy => {
                if (enemy.isBossMinion && !enemy.isDead) {
                    enemy.die();
                }
            });
        }
    }
}

export class Boss3 extends Enemy {
    constructor(scene, projectileSystem, itemSystem, player, musicSystem = null) {
        super(scene, projectileSystem, itemSystem, 'BOSS_3', null, musicSystem);
        this.player = player;
        this.hp = CONFIG.ENEMIES.BOSS_3?.HP || 8000;
        this.maxHP = this.hp;

        this.moveDirection = 1;
        this.moveDirectionY = 1;
        this.moveSpeed = 0.25;
        this.moveSpeedY = 0.3;

        this.dodgeCooldown = 0;
        this.shockwaveTimer = 0;
        this.isShockwaveActive = false;

        this.targetZ = -80;
        this.specialAttackTimer = 0;
        this.shockwaves = [];
    }

    loadModel() {
        const cachedModel = modelCache.getModel('boss_3');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(7, 7, 7);
            this.mesh.position.set(0, 10, -60);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 3] Fallback model used.");
            const geo = new THREE.OctahedronGeometry(3.5, 2);
            const mat = new THREE.MeshPhongMaterial({ color: 0x440088, shininess: 100 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -80);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }
    }

    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return;

        if (this.mesh.position.z < this.targetZ) {
            this.mesh.position.z += delta * 20;
            if (this.mesh.position.z > this.targetZ) this.mesh.position.z = this.targetZ;
        }

        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= delta;
        } else {
            this.checkAndDodge();
        }

        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 60;

        const limitX = 40;
        const limitY = 25;
        const distSq = Math.pow(this.mesh.position.x / limitX, 2) + Math.pow(this.mesh.position.y / limitY, 2);

        if (distSq > 1) {
            const angle = Math.atan2(this.mesh.position.y, this.mesh.position.x);
            const tx = Math.cos(angle) * limitX * 0.95;
            const ty = Math.sin(angle) * limitY * 0.95;
            this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, tx, 0.05);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, ty, 0.05);
            this.moveDirection *= -1;
            this.moveDirectionY *= -1;
        }

        if (Math.random() < 0.01) this.moveDirectionY *= -1;
        this.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.05;

        // Kích hoạt shockwave khi HP thấp
        if (this.hp <= this.maxHP * 0.7) {
            this.shockwaveTimer += delta;
            const cooldown = CONFIG.ENEMIES.BOSS_3?.SHOCKWAVE_COOLDOWN || 6;
            if (this.shockwaveTimer >= cooldown) {
                this.shockwaveTimer = 0;
                this.triggerShockwave();
            }
        }

        this.shootTimer = (this.shootTimer || 0) + delta;
        if (this.shootTimer >= 1.5) {
            this.shootTimer = 0;
            this.shootDoubleHoming(playerPos);
        }

        this.specialAttackTimer += delta;
        if (this.specialAttackTimer >= 3.0) {
            this.specialAttackTimer = 0;
            this.shootSpecialSpread(playerPos);
        }

        this.updateShockwaves(delta);
    }

    // Tự động né đạn người chơi
    checkAndDodge() {
        if (!this.projectileSystem || !this.mesh) return;
        const warningDist = 25;
        for (const p of this.projectileSystem.projectiles) {
            if (p.isEnemy || p.isDead) continue;
            const dist = this.mesh.position.distanceTo(p.mesh.position);
            if (dist < warningDist) {
                const dodgeDir = p.mesh.position.x > this.mesh.position.x ? -1 : 1;
                gsap.to(this.mesh.position, {
                    x: this.mesh.position.x + dodgeDir * 20,
                    duration: 0.3,
                    ease: "power2.out"
                });
                this.dodgeCooldown = 2.0;
                break;
            }
        }
    }

    triggerShockwave() {
        const bossConfig = CONFIG.ENEMIES.BOSS_3;
        const count = bossConfig?.SHOCKWAVE_COUNT || 5;
        const interval = (bossConfig?.SHOCKWAVE_INTERVAL || 0.25) * 1000;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.isDead || !this.scene) return;
                const geometry = new THREE.RingGeometry(0.95, 1.0, 64);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x398080,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(this.mesh.position);
                this.scene.add(mesh);

                const wave = {
                    mesh: mesh,
                    geometry: geometry,
                    material: material,
                    radius: 0,
                    maxRadius: bossConfig?.SHOCKWAVE_MAX_RADIUS || 150,
                    growthSpeed: bossConfig?.SHOCKWAVE_GROWTH_SPEED || 80,
                    zSpeed: bossConfig?.SHOCKWAVE_Z_SPEED || 60,
                    opacity: 1.0
                };
                this.shockwaves.push(wave);
            }, i * interval);
        }
        this.shockwaveTimer = 0;
    }

    updateShockwaves(delta) {
        if (!this.player || !this.shockwaves.length) return;
        this.shockwaves.forEach((wave, index) => {
            wave.radius += wave.growthSpeed * delta;
            wave.opacity -= 0.5 * delta;
            wave.mesh.scale.set(wave.radius, wave.radius, 1);
            wave.material.opacity = Math.max(0, wave.opacity);
            wave.mesh.position.z += delta * wave.zSpeed;

            const dist = this.player.mesh.position.distanceTo(wave.mesh.position);
            if (!wave.hasHit && Math.abs(dist - wave.radius) < 8 && wave.radius < wave.maxRadius) {
                this.player.applySlow(3.0, 0.05);
                this.player.applyJam(3.0);
                wave.hasHit = true;
            }

            if (wave.radius > wave.maxRadius || wave.opacity <= 0) {
                this.scene.remove(wave.mesh);
                wave.geometry.dispose();
                wave.material.dispose();
                this.shockwaves.splice(index, 1);
                this.player.slowMultiplier = 1.0;
            }
        });
    }

    shootDoubleHoming(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const leftPos = this.mesh.position.clone().add(new THREE.Vector3(-5, 0, 0));
        const rightPos = this.mesh.position.clone().add(new THREE.Vector3(5, 0, 0));
        const dirLeft = new THREE.Vector3().subVectors(playerPos, leftPos).normalize();
        const dirRight = new THREE.Vector3().subVectors(playerPos, rightPos).normalize();
        const speed = 0.8;
        const dmg = CONFIG.ENEMIES.BOSS_3?.DAMAGE_PER_HIT || 45;
        this.projectileSystem.spawn(leftPos, dirLeft, speed, dmg, true, 'SPHERE');
        this.projectileSystem.spawn(rightPos, dirRight, speed, dmg, true, 'SPHERE');
    }

    shootSpecialSpread(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const angles = [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7];
        const axis = new THREE.Vector3(0, 1, 0);
        const leftPos = this.mesh.position.clone().add(new THREE.Vector3(-8, 0, 2));
        const rightPos = this.mesh.position.clone().add(new THREE.Vector3(8, 0, 2));
        const baseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();

        angles.forEach(angle => {
            const dir = baseDir.clone().applyAxisAngle(axis, angle);
            this.projectileSystem.spawn(leftPos, dir, 0.6, 25, true, 'SPHERE');
            this.projectileSystem.spawn(rightPos, dir, 0.6, 25, true, 'SPHERE');
        });
        gsap.to(this.mesh.position, { z: this.mesh.position.z - 3, duration: 0.2, yoyo: true, repeat: 1 });
    }
}

