import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Patterns } from './Patterns.js';

export class Enemy {
    constructor(scene, projectileSystem, itemSystem, type = 'QUAI_1') {
        this.scene = scene; // Lưu tham chiếu đến cảnh 3D
        this.projectileSystem = projectileSystem; // Lưu tham chiếu đến hệ thống đạn (để quái bắn hoặc tương tác đạn)
        this.itemSystem = itemSystem; // Tham chiếu đến ItemSystem để rơi đồ
        this.type = type; // Loại quái (mặc định là QUAI_1)
        this.maxHP = CONFIG.ENEMIES[type]?.HP || 50; // Lưu lượng máu tối đa
        this.hp = this.maxHP;
        this.damage = CONFIG.ENEMIES[type]?.DAMAGE || 10; // Lấy sát thương từ file CONFIG

        this.mesh = null; // Biến lưu hình ảnh 3D (Mesh) của quái
        this.isDead = false; // Trạng thái còn sống hay đã chết
        this.isLoaded = false; // Trạng thái đã tải xong model hay chưa

        // Vận tốc di chuyển ngẫu nhiên theo trục X và Y
        this.randomVel = {
            x: (Math.random() - 0.5) * 10, // Giá trị từ -5 đến 5
            y: (Math.random() - 0.5) * 10
        };

        // Các thông số để tạo chuyển động uốn lượn (sin/cos)
        this.randomOffset = {
            x: Math.random() * Math.PI * 2, // Độ lệch pha ngẫu nhiên
            y: Math.random() * Math.PI * 2
        };
        this.moveFreq = 0.5 + Math.random(); // Tần suất dao động (nhanh hay chậm)
        this.moveAmp = 2 + Math.random() * 3; // Biên độ dao động (xa hay gần)

        // Khoảng cách Z mục tiêu (con quái sẽ bay đến vị trí này trước mặt người chơi rồi dừng lại)
        this.targetZ = -15 - Math.random() * 20;

        this.loader = new GLTFLoader(); // Khởi tạo bộ tải model 3D
        this.loadModel(); // Gọi hàm tải model
    }
    // Hàm tải model
    loadModel() {
        const modelPath = CONFIG.ASSETS.MODELS.ENEMY_1; // Lấy đường dẫn file 3D
        this.loader.load(modelPath, (glb) => { // Thực hiện tải file
            this.mesh = glb.scene; // Gán model vào mesh
            this.mesh.scale.set(1.5, 1.5, 1.5); // Chỉnh kích thước to gấp 1.5 lần
            this.scene.add(this.mesh); // Thêm vào cảnh 3D
            this.isLoaded = true; // Đánh dấu đã tải xong
            if (this.onLoadComplete) this.onLoadComplete(); // Gọi hàm thông báo tải xong (nếu có)
        }, undefined, (err) => {
            console.error("Lỗi khi tải model Monster 1:", err);
            // Fallback: Nếu lỗi tải file, tạo một khối lập phương đỏ thay thế
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        });
    }
    // Hàm cập nhật logic
    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return; // Nếu chưa tải xong hoặc đã chết thì không làm gì


        // --- SHOOT LASER ---
        this.shootTimer = (this.shootTimer || 0) + delta;
        const cooldownMulti = this.shootCooldownMultiplier || 1.0; // Wave 2 sẽ gán hệ số này < 1
        if (this.shootTimer > (2.0 + Math.random() * 2.0) * cooldownMulti) { // Quái bắn ngẫu nhiên
            this.shootTimer = 0;
            this.shootLaser(playerPos);
        }

        // --- DI CHUYỂN TRỤC Z (TIẾN VỀ PHÍA TRƯỚC) ---
        if (this.mesh.position.z < this.targetZ) {
            this.mesh.position.z += delta * 20; // Bay tiến lên với tốc độ 20
            if (this.mesh.position.z > this.targetZ) this.mesh.position.z = this.targetZ; // Dừng tại vị trí đích
        } else {
            // Khi đã đến đích, quái sẽ bay nhấp nhô nhẹ theo trục Z để trông sinh động hơn
            this.mesh.position.z += Math.sin(Date.now() * 0.001) * 0.02;
        }

        // --- DI CHUYỂN X & Y (CHUYỂN ĐỘNG PHỨC TẠP) ---
        if (this.isBossMinion && this.shieldTarget && this.shieldTarget.mesh) {
            // --- LOGIC BAY QUANH BOSS (GUARD MODE) ---
            const time = Date.now() * 0.001;
            // Dao động ngẫu nhiên nhẹ xung quanh vị trí bảo vệ của Boss
            const localOscX = Math.sin(time * 2.5 + this.randomOffset.x) * 3.0;
            const localOscY = Math.cos(time * 2.5 + this.randomOffset.y) * 3.0;

            const targetX = this.shieldTarget.mesh.position.x + (this.shieldOffsetX || 0) + localOscX;
            const targetY = this.shieldTarget.mesh.position.y + localOscY;

            this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, targetX, 0.1);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, targetY, 0.1);
            
            // Luôn duy trì ở phía trước Boss (trục Z)
            this.targetZ = this.shieldTarget.mesh.position.z + 7;
        } else {
            const time = Date.now() * 0.001;
            const oscX = Math.sin(time * this.moveFreq + this.randomOffset.x) * (this.moveAmp * delta);
            const oscY = Math.cos(time * this.moveFreq * 0.8 + this.randomOffset.y) * (this.moveAmp * delta);

            this.mesh.position.x += oscX + this.randomVel.x * delta * 0.5;
            this.mesh.position.y += oscY + this.randomVel.y * delta * 0.5;

            // --- KIỂM TRA BIÊN CHUYỂN ĐỘNG ---
            const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
            const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;

            if (this.mesh.position.x > envX) {
                this.mesh.position.x = envX;
                this.randomVel.x = -Math.abs(this.randomVel.x) * 1.1;
            } else if (this.mesh.position.x < -envX) {
                this.mesh.position.x = -envX;
                this.randomVel.x = Math.abs(this.randomVel.x) * 1.1;
            }

            if (this.mesh.position.y > envY) {
                this.mesh.position.y = envY;
                this.randomVel.y = -Math.abs(this.randomVel.y) * 1.1;
            } else if (this.mesh.position.y < -envY) {
                this.mesh.position.y = -envY;
                this.randomVel.y = Math.abs(this.randomVel.y) * 1.1;
            }

            const maxVel = 15;
            this.randomVel.x = THREE.MathUtils.clamp(this.randomVel.x, -maxVel, maxVel);
            this.randomVel.y = THREE.MathUtils.clamp(this.randomVel.y, -maxVel, maxVel);
        }

        // Hiện tại z despawn là 20, nhưng ta đã chặn ở targetZ. 
        // Nếu game có mechanic khác để chúng đi qua thì giữ lại logic, nhưng ở đây ta chặn rồi.
    }
    // Hàm nhận sát thương và chết
    takeDamage(amount) {
        this.hp -= amount; // Trừ máu
        if (this.hp <= 0) this.die(); // Nếu hết máu thì chết
    }

    shootLaser(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;

        // Quái nhỏ bắn tia laser dọc theo trục Z (tiến về phía màn hình / người chơi)
        const direction = new THREE.Vector3(0, 0, 1);

        const speed = CONFIG.ENEMIES[this.type]?.BULLET_SPEED || 0.5;
        // Gọi spawn với loại đạn là 'LASER'
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage, true, 'LASER');
    }

    die() {
        if (this.isDead) return;
        this.isDead = true; // Đánh dấu đã chết
        if (this.mesh) {
            const diePos = this.mesh.position.clone();
            this.scene.remove(this.mesh); // Xóa hình ảnh khỏi cảnh 3D

            // Cơ chế rơi vật phẩm (Drop Item logic)
            if (this.itemSystem) {
                const rand = Math.random();
                const buffChance = CONFIG.ITEMS.DROP_CHANCE.ENEMY_BUFF || 0.3;
                const debuffChance = CONFIG.ITEMS.DROP_CHANCE.ENEMY_DEBUFF || 0.1;

                if (rand < buffChance) { // Rơi Buff
                    const type = Math.random() > 0.5 ? 'HEALTH' : 'AMMO';
                    this.itemSystem.spawnItem(type, diePos);
                } else if (rand < buffChance + debuffChance) { // Rơi Debuff
                    const type = Math.random() > 0.5 ? 'WEAPON_LOCK' : 'ASTEROID_ITEM';
                    this.itemSystem.spawnItem(type, diePos);
                }
            }
        }
    }
}
// 2. Quản lý các đợt quái (wave-system)
// Khởi tạo
export class EnemyManager {
    constructor(scene, projectileSystem, itemSystem) {
        this.scene = scene;
        this.projectileSystem = projectileSystem;
        this.itemSystem = itemSystem;
        this.enemies = []; // Mảng chứa danh sách các con quái đang hoạt động
        this.currentWave = 0; // Đợt quái hiện tại
        this.waveInProgress = false; // Đang trong đợt quái hay không
        this.spawnedInWave = 0; // Số lượng quái đã được sinh ra trong đợt này
        this.isAllWavesCleared = false; // Đã thắng hết các đợt chưa
        this.maxWaves = 2; // Số lượng wave tối đa (mặc định là 2)
        this.currentLevel = 1; // Màn chơi hiện tại
    }
    // Hệ thống wave
    startWaveSystem(maxWaves = 2, level = 1) {
        if (this.waveInProgress) return;
        this.maxWaves = maxWaves;
        this.currentLevel = level;
        this.currentWave = 1;
        this.spawnWave(1);
    }

    resetAndStartWaveSystem(maxWaves = 2, level = 1) {
        this.isAllWavesCleared = false;
        this.currentWave = 1;
        this.spawnedInWave = 0;
        this.waveInProgress = false;
        this.enemies = [];
        this.startWaveSystem(maxWaves, level); // Sửa lỗi: Truyền tham số level xuống startWaveSystem
    }

    spawnWave(waveNum) {
        this.waveInProgress = true;
        this.spawnedInWave = 0;
        let count = 10;
        if (this.currentLevel === 3) count = 20;
        else if (this.currentLevel === 2) count = 15;

        // Sử dụng Interval để cứ 0.8 giây lại sinh ra một con quái (không xuất hiện cùng lúc cả 10 con)
        this.activeInterval = setInterval(() => {
            if (this.spawnedInWave >= count) { // Nếu đã sinh đủ 10 con
                clearInterval(this.activeInterval); // Ngừng đếm thời gian
                this.activeInterval = null;
                return;
            }

            const enemy = new Enemy(this.scene, this.projectileSystem, this.itemSystem); // Tạo quái mới
            const index = this.spawnedInWave;

            if (this.currentLevel === 3) {
                enemy.moveFreq *= 2.0; // Bay cực nhanh
                enemy.moveAmp *= 2.0;
                enemy.shootCooldownMultiplier = 0.35; // Xả đạn liên tục
                enemy.randomVel.x *= 2.2;
                enemy.randomVel.y *= 2.2;
            } else if (waveNum === 2) {
                enemy.isRandomTopMove = true;
                enemy.moveFreq *= 1.5; // Bay lượn nhanh hơn
                enemy.moveAmp *= 1.5; // Đảo vị trí xa hơn (lạng lách tinh ranh)
                enemy.shootCooldownMultiplier = 0.5; // Bắn nhanh gấp đôi
                enemy.randomVel.x *= 1.5;
                enemy.randomVel.y *= 1.5;
            }

            // Đợi model tải xong rồi mới đặt vị trí để tránh lỗi giật hình
            enemy.onLoadComplete = () => {
                if (waveNum === 1) {
                    // Nếu là wave 1, xếp quái theo đội hình (Formation)
                    enemy.mesh.position.copy(Patterns.FORMATION_WAVE_1(index, count));
                } else {
                    // Nếu là wave khác, lấy vị trí ngẫu nhiên ở phía trên
                    enemy.mesh.position.copy(Patterns.getRandomTopPosition());
                }
            };

            this.enemies.push(enemy); // Thêm vào danh sách quản lý
            this.spawnedInWave++;
        }, 800);
    }
    // Dẹp quái
    clearAllEnemies() {
        console.log("🛠️ Debug: Đang dọn sạch toàn bộ quái...");

        // Dừng việc sinh quái nếu đang sinh dở
        if (this.activeInterval) {
            clearInterval(this.activeInterval);
            this.activeInterval = null;
        }

        this.enemies.forEach(enemy => enemy.die()); // Cho tất cả quái hiện tại "chết"
        this.enemies = []; // Xóa mảng
        let finalCount = 10;
        if (this.currentLevel === 3) finalCount = 20;
        else if (this.currentLevel === 2) finalCount = 15;
        this.spawnedInWave = finalCount; // Đánh dấu là đã xong số lượng quái
        this.waveInProgress = true;

        console.log("✅ Đã dọn xong. Chờ hệ thống kích hoạt Wave tiếp theo...");
    }
    // Cập nhật và chuyển wave
    update(delta, playerPos) {
        // Duyệt ngược mảng quái để cập nhật (duyệt ngược để khi xóa phần tử không bị lỗi chỉ số)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, playerPos);

            if (enemy.isDead) {
                this.enemies.splice(i, 1); // Xóa khỏi danh sách nếu quái đã chết
            }
        }

        let requiredCount = 10;
        if (this.currentLevel === 3) requiredCount = 20;
        else if (this.currentLevel === 2) requiredCount = 15;

        // Logic chuyển Wave: Kiểm tra xem đã hết quái và đã sinh đủ số lượng chưa
        if (this.waveInProgress && this.spawnedInWave >= requiredCount && this.enemies.length === 0) {
            if (this.currentWave < this.maxWaves) {
                const nextWave = this.currentWave + 1;
                this.currentWave = nextWave;
                this.spawnedInWave = 0;
                // Chờ 3 giây rồi mới bắt đầu Wave tiếp theo
                setTimeout(() => this.spawnWave(nextWave), 3000);
            } else {
                // Nếu đã xong tất cả các wave theo kịch bản
                this.waveInProgress = false;
                this.isAllWavesCleared = true;
                console.log(`Đã dọn sạch ${this.maxWaves} wave quái!`);
            }
        }
    }
}
