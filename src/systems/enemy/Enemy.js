import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Patterns } from './Patterns.js';
import { modelCache } from '../../utils/ModelCache.js';
import { MathUtils } from '../../utils/Math.js';
import { SwarmMovement } from './SwarmMovement.js';
export class Enemy {
    constructor(scene, projectileSystem, itemSystem, type = 'QUAI_1', spawnPos = null, musicSystem = null) {
        this.scene = scene;
        this.projectileSystem = projectileSystem;
        this.itemSystem = itemSystem;
        this.musicSystem = musicSystem;
        this.type = type;
        this.spawnPos = spawnPos; // Lưu vị trí spawn để gán ngay khi load model
        this.maxHP = CONFIG.ENEMIES[type]?.HP || 50;
        this.hp = this.maxHP;
        this.damage = CONFIG.ENEMIES[type]?.DAMAGE || 10;

        this.mesh = null;
        this.isDead = false;
        this.isLoaded = false;

        this.randomVel = {
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 6
        };
        // Shooting timer (seconds)
        this._shootTimer = 0;
        // Base cooldown (seconds) – có thể tùy chỉnh qua CONFIG
        this._shootCooldown = CONFIG.ENEMIES[this.type]?.SHOOT_COOLDOWN || 2;
        // Damage multiplier (if needed)
        this._damage = this.damage;

        this.randomOffset = {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2
        };
        this.moveFreq = 0.5 + Math.random();
        this.moveAmp = 1 + Math.random() * 2;

        this.targetZ = -15 - Math.random() * 20;

        // Phát âm thanh khi Boss xuất hiện
        if (this.musicSystem && this.type && this.type.startsWith('BOSS')) {
            this.musicSystem.playSound('NHAC_NEN_INTRO_MAT_TIN_HIEU_2');
        }

        this.loadModel();
    }

    loadModel() {
        // Sử dụng modelCache để lấy bản sao (clone) từ cache
        const cachedModel = modelCache.getModel('enemy_1');

        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(1.5, 1.5, 1.5);
            
            // Nếu có vị trí spawn, gán ngay lập tức trước khi add vào scene
            if (this.spawnPos) {
                this.mesh.position.copy(this.spawnPos);
            }

            this.scene.add(this.mesh);
            this.isLoaded = true;
            if (this.onLoadComplete) this.onLoadComplete();
        } else {
            // Fallback: Nếu cache chưa có, tạo khối hộp tạm thời
            console.warn("[Enemy] Model chưa nạp, dùng fallback.");
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }
    }

    update(delta, playerPos) {
        if (!this.isLoaded || !this.mesh || this.isDead) return;

        // ---------------------------------------------------
        // 0️⃣ LOGIC LÁ CHẮN BAY LƯỢN MƯỢT MÀ (Smooth Orbital Shield)
        // ---------------------------------------------------
        if (this.isOrbitalShield && this.shieldTarget && !this.shieldTarget.isDead) {
            this.shieldRandomTimer = (this.shieldRandomTimer || 0) + delta;

            // Khởi tạo các biến offset nếu chưa có
            if (!this.currentShieldOffset) this.currentShieldOffset = new THREE.Vector3(0, 0, 6);
            if (!this.targetShieldOffset) this.targetShieldOffset = new THREE.Vector3(0, 0, 6);

            // Mỗi 1.5 giây chọn một vị trí ngẫu nhiên mới (tăng thời gian để bay mượt hơn)
            if (this.shieldRandomTimer >= 1.5) {
                this.shieldRandomTimer = 0;
                this.targetShieldOffset.set(
                    (Math.random() - 0.5) * 30, // Độ rộng X
                    (Math.random() - 0.5) * 20, // Độ rộng Y
                    7                           // Khoảng cách Z phía trước Boss
                );
            }

            // 1. Nội suy offset để điểm mục tiêu di chuyển mượt mà
            this.currentShieldOffset.lerp(this.targetShieldOffset, delta * 2);

            // 2. Thêm hiệu ứng bồng bềnh (Sine drift)
            const time = performance.now() * 0.0015;
            const drift = new THREE.Vector3(
                Math.sin(time) * 3,
                Math.cos(time * 0.8) * 3,
                Math.sin(time * 0.5) * 2
            );

            const targetWorldPos = this.shieldTarget.mesh.position.clone()
                .add(this.currentShieldOffset)
                .add(drift);

            // 3. Cho quái lướt tới vị trí mục tiêu cuối cùng
            this.mesh.position.lerp(targetWorldPos, delta * 6);

            // (Đã xóa cơ chế lookAt theo yêu cầu)

            // Vẫn cho phép quái này bắn đạn như quái thường
            this._shootTimer += delta;
            if (this._shootTimer >= this._shootCooldown) {
                this.shootLaser(playerPos);
                this._shootTimer = 0;
            }
            return; // Thoát sớm để SwarmMovement không ghi đè vị trí
        }

        // ---------------------------------------------------
        // 1️⃣ Shooting logic (only for normal enemies QUAI_1)
        // ---------------------------------------------------
        if (this.type === 'QUAI_1') {
            this._shootTimer += delta;
            if (this._shootTimer >= this._shootCooldown) {
                this.shootLaser(playerPos);
                this._shootTimer = 0;
            }
        }
        // ---------------------------------------------------
        // 2️⃣ Other state handling (if needed) – di chuyển được SwarmMovement thực hiện.
        // ---------------------------------------------------
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.die();
    }

    shootLaser(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        // Bắn thẳng tắp theo trục Z (hướng về phía người chơi nhưng không nhắm mục tiêu cụ thể)
        const direction = new THREE.Vector3(0, 0, 1);
        const speed = CONFIG.ENEMIES[this.type]?.BULLET_SPEED || 0.5;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage, true, 'LASER');
    }

    die(silent = false) {
        if (this.isDead) return;
        this.isDead = true;

        // Phát âm thanh nổ (chỉ khi không ở chế độ silent)
        if (!silent && this.musicSystem) {
            const isBoss = this.type && this.type.startsWith('BOSS');
            const soundKey = isBoss ? 'HIEU_UNG_BOSS_NO_TUNG' : 'HIEU_UNG_QUAI_THIEN_THACH_NO';
            this.musicSystem.playSound(soundKey);
        }

        if (this.mesh) {
            this.scene.remove(this.mesh);

            if (this.itemSystem && !silent) {
                const isBoss = this.type && this.type.startsWith('BOSS');
                const diePos = this.mesh.position.clone();

                if (isBoss) {
                    for (let i = 0; i < 3; i++) {
                        const types = ['HEALTH', 'AMMO', 'SHIELD', 'WEAPON_2', 'WEAPON_2', 'WEAPON_3', 'WEAPON_3'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        const offset = new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0);
                        this.itemSystem.spawnItem(type, diePos.clone().add(offset));
                    }
                } else {
                    const rand = Math.random();
                    const buffChance = 0.4;
                    const debuffChance = 0.1;

                    if (rand < buffChance) {
                        const buffTypes = ['HEALTH', 'AMMO', 'SHIELD', 'WEAPON_2', 'WEAPON_2', 'WEAPON_3', 'WEAPON_3'];
                        const type = buffTypes[Math.floor(Math.random() * buffTypes.length)];
                        this.itemSystem.spawnItem(type, diePos);
                    } else if (rand < buffChance + debuffChance) {
                        const debuffTypes = ['WEAPON_LOCK', 'ASTEROID_ITEM'];
                        const type = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];
                        this.itemSystem.spawnItem(type, diePos);
                    }
                }
            }
        }
    }
}

export class EnemyManager {
    constructor(scene, projectileSystem, itemSystem, musicSystem) {
        this.scene = scene;
        this.projectileSystem = projectileSystem;
        this.itemSystem = itemSystem;
        this.musicSystem = musicSystem;
        this.enemies = [];
        this.currentWave = 0;
        this.waveInProgress = false;
        this.isAllWavesCleared = false;
        this.maxWaves = 1;
        this.currentLevel = 1;
        this.isSpawning = false;
        this.activeInterval = null;
        this.spawnedInWave = 0;
        this._waitingNextWave = false; // Cờ chống gọi wave trùng lặp
        this.swarm = new SwarmMovement();
    }

    // Lấy số quái cho wave cụ thể (waveNum bắt đầu từ 1)
    _getWaveCount(level, waveNum) {
        const cfg = CONFIG.LEVELS[level];
        if (!cfg || !cfg.waves) return 10;
        const idx = waveNum - 1;
        if (idx < 0 || idx >= cfg.waves.length) return 10;
        return cfg.waves[idx][0];
    }

    // Lấy tổng số wave của level
    _getMaxWaves(level) {
        const cfg = CONFIG.LEVELS[level];
        return cfg ? cfg.waves.length : 1;
    }

    startWaveSystem(levelId = 1) {
        if (this.waveInProgress) return;
        this.currentLevel = levelId;
        this.maxWaves = this._getMaxWaves(levelId);
        this.currentWave = 1;
        this.spawnedInWave = 0;
        this.isAllWavesCleared = false;
        this.waveInProgress = true;
        this._waitingNextWave = false;
        
        const label = CONFIG.LEVELS[levelId]?.label || `Level ${levelId}`;
        console.log(`[EnemyManager] >>> BẮT ĐẦU: ${label} (Tổng ${this.maxWaves} wave)`);
        this.spawnWave(1);
    }

    resetAndStartWaveSystem(levelId = 1) {
        // Dọn sạch trước khi bắt đầu lại
        if (this.activeInterval) { clearInterval(this.activeInterval); this.activeInterval = null; }
        this.isSpawning = false;
        this._waitingNextWave = false;
        this.isAllWavesCleared = false;
        this.currentWave = 0;
        this.spawnedInWave = 0;
        this.waveInProgress = false;
        // Xóa quái cũ khỏi scene
        this.enemies.forEach(e => { this.swarm.unregister(e); e.die(true); });
        this.enemies = [];
        this.startWaveSystem(levelId);
    }

    spawnWave(waveNum) {
        this.isSpawning = true;
        this._waitingNextWave = false;
        this.spawnedInWave = 0;
        this.waveInProgress = true;

        const count = this._getWaveCount(this.currentLevel, waveNum);
        console.log(`[EnemyManager] >>> Gọi Wave ${waveNum}/${this.maxWaves} – Số quái: ${count}`);

        if (this.activeInterval) { clearInterval(this.activeInterval); this.activeInterval = null; }

        this.activeInterval = setInterval(() => {
            if (this.spawnedInWave >= count) {
                clearInterval(this.activeInterval);
                this.activeInterval = null;
                this.isSpawning = false;
                console.log(`[EnemyManager] Wave ${waveNum} đã spawn xong ${count} con. Chờ diệt hết...`);
                return;
            }

            const enemy = new Enemy(this.scene, this.projectileSystem, this.itemSystem, 'QUAI_1', null, this.musicSystem);

            // Cài đặt độ khó dựa trên Level (Lấy từ CONFIG)
            const levelCfg = CONFIG.LEVELS[this.currentLevel];
            if (levelCfg) {
                enemy.speedMultiplier = levelCfg.speedMultiplier || 1.0;
                enemy._shootCooldown = levelCfg.shootCooldown || 2.0;
            }

            this.swarm.register(enemy);
            const index = this.spawnedInWave;

            // Đặt vị trí xuất hiện
            const setPosition = () => {
                if (waveNum === 1) {
                    enemy.mesh.position.copy(Patterns.FORMATION_WAVE_1(index, count));
                } else {
                    enemy.mesh.position.copy(Patterns.getRandomTopPosition());
                }
            };

            if (enemy.isLoaded) {
                setPosition();
            } else {
                enemy.onLoadComplete = setPosition;
            }

            this.enemies.push(enemy);
            this.spawnedInWave++;
        }, 800);
    }

    clearAllEnemies(skipAll = false) {
        console.log(`[K] ${skipAll ? 'Skip All Waves' : 'Clear Current'}...`);

        if (this.activeInterval) { clearInterval(this.activeInterval); this.activeInterval = null; }

        this.enemies.forEach(e => { this.swarm.unregister(e); e.die(true); });
        this.enemies = [];

        this.isSpawning = false;
        this._waitingNextWave = false;
        this.waveInProgress = true;

        if (skipAll) {
            this.currentWave = this.maxWaves;
            this.isAllWavesCleared = true; // Báo hiệu đã dọn xong toàn bộ wave
        }
    }

    update(delta, playerPos) {
        // 1. Cập nhật từng con quái, loại bỏ quái đã chết
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, playerPos);
            if (enemy.isDead) {
                this.swarm.unregister(enemy);
                this.enemies.splice(i, 1);
            }
        }

        // 2. Cập nhật chuyển động bầy
        this.swarm.update(this.enemies, delta, playerPos);

        // 3. Kiểm tra chuyển wave
        //    Điều kiện: đang trong trận + đã spawn xong + không còn quái + chưa đang chờ
        if (this.waveInProgress && !this.isSpawning && !this._waitingNextWave && this.enemies.length === 0) {
            if (this.currentWave < this.maxWaves) {
                // Còn wave tiếp → chờ 2 giây rồi gọi
                this._waitingNextWave = true;
                const nextWave = this.currentWave + 1;
                console.log(`[EnemyManager] ✅ Wave ${this.currentWave} hết quái! Chờ 2s rồi gọi Wave ${nextWave}...`);
                setTimeout(() => {
                    this.currentWave = nextWave;
                    this.spawnWave(nextWave);
                }, 2000);
            } else {
                // Hết wave → kết thúc level
                this.waveInProgress = false;
                this.isAllWavesCleared = true;
                console.log(`[EnemyManager] 🏆 Level ${this.currentLevel} hoàn thành!`);
            }
        }
    }
}
