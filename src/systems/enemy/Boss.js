import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Enemy } from './Enemy.js';
import { modelCache } from '../../utils/ModelCache.js';
import gsap from 'gsap';

export class Boss extends Enemy { // Tạo lớp Boss kế thừa từ lớp Enemy
    constructor(scene, projectileSystem, itemSystem, type = 'BOSS_1', musicSystem = null) {
        super(scene, projectileSystem, itemSystem, type, null, musicSystem);
        this.hp = CONFIG.ENEMIES[type]?.HP || 500;
        this.maxHP = this.hp;
        this.moveDirection = 1; // Hướng di chuyển ngang (1 là sang phải, -1 là sang trái)
        this.moveSpeed = 0.1; // Tốc độ di chuyển cơ bản của Boss

        // --- LOGIC CHIẾN ĐẤU MỚI (LEVEL 1) ---
        this.state = 'FIGHTING'; // Trạng thái: FIGHTING, RETREATING, HIDDEN
        this.shootTimer = 0;
        this.laserTimer = 0; // Thêm bộ đếm bắn laser
        this.isCastingLaser = false; // Cờ đánh dấu đang bắn laser
        this.laserCastTimer = 0; // Đếm ngược thời gian đứng yên
        this.shootCount = 0;
        this.hasRetreated = false; // Đánh dấu đã từng bỏ chạy chưa
        this.onRetreatComplete = null; // Callback khi Boss chạy trốn thành công
    }

    loadModel() { // Hàm để tải hình ảnh 3D cho Boss
        const cachedModel = modelCache.getModel('boss_1');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(13, 13, 13);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 1] Model chưa nạp, dùng fallback.");
            const geo = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }
    }
    // 4. Logic cập nhật mỗi khung hình
    update(delta, playerPos) { // Hàm chạy liên tục để cập nhật vị trí Boss (delta là thời gian trôi qua giữa 2 khung hình)
        if (!this.mesh || this.isDead) return; // Nếu chưa có hình ảnh hoặc Boss đã chết thì không làm gì cả

        if (this.state === 'RETREATING') {
            // Di chuyển nhanh ra trục Z âm (tiến sâu vào màn hình)
            this.mesh.position.z -= delta * 100;

            // Thu nhỏ dần model cho tới mất
            const newScale = Math.max(0, this.mesh.scale.x - delta * 1.5);
            this.mesh.scale.set(newScale, newScale, newScale);

            // Khi đã khuất dạng thì kết thúc retreat
            if (this.mesh.position.z < -250 || newScale <= 0) {
                this.state = 'HIDDEN';
                if (this.onRetreatComplete) {
                    this.onRetreatComplete();
                }
            }
            return; // Đang chạy thì không bắn hay lượn lờ nữa
        }

        if (this.state === 'HIDDEN') return; // Đang ẩn thì bỏ qua

        // --- KIỂM TRA TRẠNG THÁI BẮN LASER (ĐỨNG YÊN) ---
        if (this.isCastingLaser) {
            this.laserCastTimer -= delta;
            // Boss đứng yên, chỉ nhấp nhô thật nhẹ
            this.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.01;

            if (this.laserCastTimer <= 0) {
                this.isCastingLaser = false;
            }
            return; // KHÔNG DI CHUYỂN, KHÔNG NHẢ ĐẠN THƯỜNG
        }

        // --- DI CHUYỂN THEO TRỤC Z (TIẾN/LÙI) ---
        const bossTargetZ = -35; // Khoảng cách lý tưởng mà Boss muốn duy trì so với người chơi
        if (this.mesh.position.z < bossTargetZ) { // Nếu Boss đang ở quá xa
            this.mesh.position.z += delta * 15; // Di chuyển tiến lên phía trước
            if (this.mesh.position.z > bossTargetZ) this.mesh.position.z = bossTargetZ; // Tránh đi quá điểm đích
        } else if (this.mesh.position.z > bossTargetZ + 5) { // Nếu Boss quá gần người chơi
            this.mesh.position.z -= delta * 5; // Boss lùi lại một chút để giữ khoảng cách an toàn
        }

        // --- DI CHUYỂN NGANG (TRỤC X) ---
        // Cập nhật vị trí X dựa trên hướng, tốc độ và thời gian delta (đảm bảo mượt ở mọi tốc độ khung hình)
        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 60;

        // --- GIỚI HẠN VÙNG DI CHUYỂN HÌNH ELÍP (Boss 1 - Đã làm mượt) ---
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

        // Hiệu ứng "nhấp nhô": Dùng hàm Sin để Boss bay lên xuống nhẹ nhàng như đang thở
        this.mesh.position.y += Math.sin(Date.now() * 0.001) * 0.05;

        // --- LOGIC NHẢ CẦU 5s ---
        this.shootTimer += delta;
        if (this.shootTimer >= 2.0) { // Mỗi 2s nhả quả cầu
            this.shootTimer = 0;
            this.shootSphere(playerPos);
            this.shootCount++;
        }

        // --- LOGIC BẮN LASER ---
        this.laserTimer += delta;
        if (this.laserTimer >= 6.0) { // Mỗi 10s bắn laser thẳng
            this.laserTimer = 0;
            this.isCastingLaser = true;
            this.laserCastTimer = 3.5; // Đứng yên trong 3.5s để xuất chiêu
            this.shootLaser(playerPos);
            return; // Dừng các hành động khác
        }

        // --- LOGIC RÚT LUI KHI MÁU <= 50% ---
        if (this.state === 'FIGHTING' && this.hp <= this.maxHP * 0.5 && !this.hasRetreated) {
            this.state = 'RETREATING'; // Rút lui
            this.hasRetreated = true; // Đánh dấu để lần sau quay lại không bỏ chạy nữa
        }
    }
    // 5. Hệ thống tấn công
    shoot(playerPos) { // Hàm bắn đạn thông thường
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        // Tính toán hướng bắn: Lấy vị trí người chơi trừ đi vị trí Boss và chuẩn hóa (normalize) về độ dài 1
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.BULLET_SPEED || 0.4;
        // Gọi hệ thống đạn tạo ra 1 viên đạn bắn về phía người chơi
        this.projectileSystem.spawn(this.mesh.position, direction, speed, this.damage, true);
    }

    shootHoming(playerPos) { // Hàm bắn đạn tầm nhiệt/tự nhắm (Homing)
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.HOMING_SPEED || 0.6;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, 20, true);
    }

    shootLaser(playerPos) { // Hàm bắn Laser
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        
        // Phát âm thanh bắn Laser
        if (this.musicSystem) this.musicSystem.playSound('HIEU_UNG_LAZE_BAN');

        // Bắt buộc hướng tia Laser phải luôn chĩa thẳng tắp xuống màn hình (Trục Z) 
        // để khi gắn vào Boss trông không bị lệch 
        const direction = new THREE.Vector3(0, 0, 1);
        const speed = 0; // Tốc độ = 0 vì tia sáng sẽ dính chặt vào Boss thay vì bay đi
        // Truyền this.mesh vào tham số attachedTo để Laser di chuyển cùng Boss
        this.projectileSystem.spawn(this.mesh.position, direction, speed, 35, true, 'BOSS_LASER', this.mesh);
    }

    shootSphere(playerPos) { // Boss nhả quả cầu sát thương lớn
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.BULLET_SPEED || 0.4;
        // Nhả cầu sát thương 30hp, tốc độ 0.4, loại 'SPHERE'
        this.projectileSystem.spawn(this.mesh.position, direction, speed, 30, true, 'SPHERE');
    }
}

export class Boss2 extends Enemy {
    constructor(scene, projectileSystem, itemSystem, enemyManager, musicSystem = null) {
        super(scene, projectileSystem, itemSystem, 'BOSS_2', null, musicSystem);
        this.hp = CONFIG.ENEMIES.BOSS_2?.HP || 800;
        this.maxHP = this.hp;
        this.moveDirection = 1;
        this.moveSpeed = 0.15; // Nhanh hơn Boss 1

        this.state = 'FIGHTING';
        this.shootTimer = 0;
        this.spreadTimer = 0;
        this.spawnTimer = 0;
        this.enemyManager = enemyManager; // Tham chiếu đến EnemyManager để đẻ quái

        this.targetZ = -30; // Boss 2 tiến lại gần hơn Boss 1 (-35) một chút
    }

    loadModel() {
        const cachedModel = modelCache.getModel('boss_2');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(1.5, 1.5, 1.5);
            this.mesh.rotation.y = Math.PI; // Quay mặt về phía người chơi
            this.mesh.position.set(0, 10, -50);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 2] Model chưa nạp, dùng fallback.");
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

        // DI CHUYỂN Z
        if (this.mesh.position.z < this.targetZ) {
            this.mesh.position.z += delta * 20;
            if (this.mesh.position.z > this.targetZ) this.mesh.position.z = this.targetZ;
        } else if (this.mesh.position.z > this.targetZ + 5) {
            this.mesh.position.z -= delta * 8;
        }

        // DI CHUYỂN X
        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 80;

        // --- GIỚI HẠN VÙNG DI CHUYỂN HÌNH ELÍP (Boss 2 - Đã làm mượt) ---
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

        // NHẤP NHÔ
        this.mesh.position.y += Math.sin(Date.now() * 0.002) * 0.08;

        // BẮN ĐẠN TỎA (Mỗi 3.5s - Tăng lên để giảm độ khó)
        this.spreadTimer += delta;
        if (this.spreadTimer >= 3.5) {
            this.spreadTimer = 0;
            this.shootSpread(playerPos);
        }

        // ĐẺ QUÁI (Mỗi SPAWN_INTERVAL s)
        this.spawnTimer += delta;
        const spawnInterval = CONFIG.ENEMIES.BOSS_2?.SPAWN_INTERVAL || 15;
        if (this.spawnTimer >= spawnInterval && this.enemyManager) {
            this.spawnTimer = 0;
            this.spawnMinions();
        }
    }

    shootLaser(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_2?.BULLET_SPEED || 0.6;
        const dmg = CONFIG.ENEMIES.BOSS_2?.LASER_DAMAGE || 15;
        this.projectileSystem.spawn(this.mesh.position, direction, speed, dmg, true, 'LASER');
    }

    shootSpread(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        // Quay trở lại nhắm thẳng vào tàu người chơi làm tâm của dải đạn tỏa
        const baseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_2?.BULLET_SPEED || 0.6;
        const dmg = CONFIG.ENEMIES.BOSS_2?.SPREAD_DAMAGE || 20;

        // Bắn 8 viên tủa ra (Tăng từ 6 lên 8)
        const angles = [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7];
        const axis = new THREE.Vector3(0, 1, 0); // Trục xoay ngang

        angles.forEach(angle => {
            const dir = baseDir.clone().applyAxisAngle(axis, angle);
            this.projectileSystem.spawn(this.mesh.position, dir, speed, dmg, true, 'SPHERE');
        });
    }

    spawnMinions() {
        if (!this.enemyManager || !this.scene) return;

        // Truyền vị trí của Boss vào ngay khi khởi tạo để quái xuất hiện từ Boss chui ra
        const minion = new Enemy(this.scene, this.projectileSystem, this.itemSystem, 'QUAI_1', this.mesh.position);

        minion.isOrbitalShield = true; // Kích hoạt chế độ lá chắn bảo vệ
        minion.shieldTarget = this;

        minion.onLoadComplete = () => {
            // Vị trí khởi tạo phía trước boss
            minion.mesh.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z + 6);
        };

        // Quái làm lá chắn có lượng máu vừa phải
        minion.maxHP = 40;
        minion.hp = 40;
        minion.isBossMinion = true;

        this.enemyManager.enemies.push(minion);
        console.log("🛡️ Boss 2: Đã đẻ 1 quái lá chắn!");
    }

    die() {
        super.die(); // Boss phát nổ và rơi đồ

        // Càn quét toàn bộ quái trên màn hình khi Boss chết
        if (this.enemyManager && this.enemyManager.enemies) {
            this.enemyManager.enemies.forEach(enemy => {
                if (enemy.isBossMinion && !enemy.isDead) {
                    enemy.die(); // Kích hoạt hiệu ứng nổ cho từng con quái boss tạo ra
                }
            });
        }
    }
}

export class Boss3 extends Enemy {
    constructor(scene, projectileSystem, itemSystem, player, musicSystem = null) {
        super(scene, projectileSystem, itemSystem, 'BOSS_3', null, musicSystem);
        this.player = player; // Lưu tham chiếu đến người chơi để làm chậm
        this.hp = CONFIG.ENEMIES.BOSS_3?.HP || 1200;
        this.maxHP = this.hp;

        this.moveDirection = 1;
        this.moveDirectionY = 1; // Hướng di chuyển trục Y
        this.moveSpeed = 0.25; // Tăng tốc độ ngang
        this.moveSpeedY = 0.3; // Tăng tốc độ dọc đáng kể để dễ thấy hơn

        this.dodgeCooldown = 0; // Thời gian hồi chiêu né đạn
        this.shockwaveTimer = 0; // Bộ đếm 6s cho sóng âm
        this.isShockwaveActive = false; // Trạng thái kích hoạt sóng âm (khi máu < 2/3)

        this.targetZ = -80;

        this.specialAttackTimer = 0; // Bộ đếm 3s cho đòn bắn tỏa đặc biệt
        this.shockwaves = []; // Danh sách các vòng sóng đang lan tỏa (để xử lý logic vật lý)
    }

    loadModel() {
        const cachedModel = modelCache.getModel('boss_3');
        if (cachedModel) {
            this.mesh = cachedModel;
            this.mesh.scale.set(7, 7, 7); // Boss 3 nhỏ gọn, khó bắn hơn
            this.mesh.position.set(0, 10, -60);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        } else {
            console.warn("[Boss 3] Model chưa nạp, dùng fallback.");
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

        // --- DI CHUYỂN Z ---
        if (this.mesh.position.z < this.targetZ) {
            this.mesh.position.z += delta * 20;
            if (this.mesh.position.z > this.targetZ) this.mesh.position.z = this.targetZ;
        }

        // --- AI NÉ ĐẠN (DODGE) ---
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= delta;
        } else {
            this.checkAndDodge();
        }

        // --- DI CHUYỂN NGANG (X) ---
        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 60;

        // --- GIỚI HẠN VÙNG DI CHUYỂN HÌNH ELÍP (Boss 3 - Đã làm mượt) ---
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

        // Thỉnh thoảng đổi hướng dọc ngẫu nhiên để khó bắn hơn
        if (Math.random() < 0.01) this.moveDirectionY *= -1;

        // Nhấp nhô nhẹ bổ trợ thêm
        this.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.05;

        // --- CƠ CHẾ SÓNG ÂM (SHOCKWAVE) ---
        // Kích hoạt khi máu dưới 840 HP
        if (this.hp <= 840) {
            this.shockwaveTimer += delta;
            const cooldown = CONFIG.ENEMIES.BOSS_3?.SHOCKWAVE_COOLDOWN || 6;
            if (this.shockwaveTimer >= cooldown) {
                this.shockwaveTimer = 0;
                this.triggerShockwave();
            }
        }

        // --- TẤN CÔNG THƯỜNG (Bắn 2 phát cùng lúc) ---
        this.shootTimer = (this.shootTimer || 0) + delta;
        if (this.shootTimer >= 1.5) {
            this.shootTimer = 0;
            this.shootDoubleHoming(playerPos);
        }

        // --- ĐÒN BẮN TỎA ĐẶC BIỆT (Mỗi 3 giây) ---
        this.specialAttackTimer += delta;
        if (this.specialAttackTimer >= 3.0) {
            this.specialAttackTimer = 0;
            this.shootSpecialSpread(playerPos);
        }

        // --- CẬP NHẬT LOGIC VẬT LÝ SÓNG ÂM ---
        this.updateShockwaves(delta);
    }

    checkAndDodge() {
        if (!this.projectileSystem || !this.mesh) return;

        // Tăng tầm quét đạn để Boss phản ứng sớm hơn (từ 15 lên 25)
        const warningDist = 25;
        for (const p of this.projectileSystem.projectiles) {
            if (p.isEnemy || p.isDead) continue;

            const dist = this.mesh.position.distanceTo(p.mesh.position);
            if (dist < warningDist) {
                // Thực hiện né: Dash xa hơn (từ 15 lên 20) để người chơi thấy rõ
                const dodgeDir = p.mesh.position.x > this.mesh.position.x ? -1 : 1;

                gsap.to(this.mesh.position, {
                    x: this.mesh.position.x + dodgeDir * 20,
                    duration: 0.3, // Dash nhanh hơn
                    ease: "power2.out"
                });
                this.dodgeCooldown = 2.0; // Nghỉ 2s mới né tiếp
                console.log("⚡ Boss 3: Đã né đạn!");
                break;
            }
        }
    }

    triggerShockwave() {
        console.log("🔊 Boss 3: PHÁT SÓNG ÂM SONAR!");
        const bossConfig = CONFIG.ENEMIES.BOSS_3;
        const count = bossConfig?.SHOCKWAVE_COUNT || 5;
        const interval = (bossConfig?.SHOCKWAVE_INTERVAL || 0.25) * 1000;

        // Tạo chuỗi vòng sóng dựa trên cấu hình
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
            // 1. Cập nhật kích thước và độ mờ dựa trên config
            wave.radius += wave.growthSpeed * delta;
            wave.opacity -= 0.5 * delta;

            wave.mesh.scale.set(wave.radius, wave.radius, 1);
            wave.material.opacity = Math.max(0, wave.opacity);

            // 2. Di chuyển về phía người chơi dựa trên config
            wave.mesh.position.z += delta * wave.zSpeed;

            // 3. Logic va chạm
            const dist = this.player.mesh.position.distanceTo(wave.mesh.position);
            if (!wave.hasHit && Math.abs(dist - wave.radius) < 8 && wave.radius < wave.maxRadius) {
                this.player.applySlow(3.0, 0.05);
                this.player.applyJam(3.0);
                wave.hasHit = true;
            }

            // 4. Xóa sóng
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
        console.log("🚀 Boss 3: Bắn 2 phát tầm nhiệt!");
    }

    shootSpecialSpread(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;

        // Bắn 8 viên từ bên trái và 8 viên từ bên phải (tổng 16 viên), nhắm về phía tàu
        const angles = [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7];
        const axis = new THREE.Vector3(0, 1, 0);

        const leftPos = this.mesh.position.clone().add(new THREE.Vector3(-8, 0, 2));
        const rightPos = this.mesh.position.clone().add(new THREE.Vector3(8, 0, 2));

        // Nhắm hướng trung tâm về phía người chơi
        const baseDir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();

        angles.forEach(angle => {
            const dir = baseDir.clone().applyAxisAngle(axis, angle);
            this.projectileSystem.spawn(leftPos, dir, 0.6, 25, true, 'SPHERE');
            this.projectileSystem.spawn(rightPos, dir, 0.6, 25, true, 'SPHERE');
        });

        console.log("🔥 Boss 3: Bắn tỏa đặc biệt (16 viên)!");

        // Hiệu ứng giật lùi nhẹ của Boss khi bắn đòn mạnh
        gsap.to(this.mesh.position, { z: this.mesh.position.z - 3, duration: 0.2, yoyo: true, repeat: 1 });
    }
}

