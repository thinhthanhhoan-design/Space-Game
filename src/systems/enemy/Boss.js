import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Enemy } from './Enemy.js';

export class Boss extends Enemy { // Tạo lớp Boss kế thừa từ lớp Enemy
    constructor(scene, projectileSystem, itemSystem) { // Thêm itemSystem vào tham số
        // Lỗi cũ: super(scene, projectileSystem, 'BOSS_1'); -> Truyền nhầm 'BOSS_1' vào chỗ của itemSystem!
        super(scene, projectileSystem, itemSystem, 'BOSS_1');
        this.hp = CONFIG.ENEMIES.BOSS_1?.HP || 500;
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
        const modelPath = CONFIG.ASSETS.MODELS.BOSS_1; // Lấy đường dẫn file 3D từ cấu hình
        this.loader.load(modelPath, (glb) => { // Bắt đầu tải model
            this.mesh = glb.scene; // Gán mô hình đã tải vào biến this.mesh
            this.mesh.scale.set(10, 10, 10); // Phóng to Boss lên 6 lần
            this.mesh.position.set(0, 10, -40); // Đặt vị trí ban đầu (cao 10, cách xa người chơi 40 đơn vị)
            this.scene.add(this.mesh); // Thêm Boss vào cảnh 3D để nhìn thấy được
            this.isLoaded = true; // Đánh dấu đã tải xong để bắt đầu cập nhật logic
        }, undefined, (err) => { // Nếu tải file 3D bị lỗi (sai đường dẫn, mất mạng...)
            console.error("Lỗi khi tải model Boss 1.2:", err);
            // Fallback: Tạo một khối hình nút thắt (TorusKnot) màu hồng để thay thế nếu không tải được model
            // const geo = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
            // const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            // this.mesh = new THREE.Mesh(geo, mat);
            // this.mesh.position.set(0, 10, -40);
            // this.scene.add(this.mesh);
            // this.isLoaded = true;
        });
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

        // --- KIỂM TRA BIÊN NGANG TƯƠNG ĐỐI (GIỮ BOSS TRONG MÀN HÌNH) ---
        const viewLimitX = 18; // Bán kính di chuyển ngang của Boss so với Player
        const minX = playerPos.x - viewLimitX;
        const maxX = playerPos.x + viewLimitX;

        if (this.mesh.position.x > maxX) {
            this.mesh.position.x = maxX;
            this.moveDirection = -1; // Đổi hướng sang trái
        } else if (this.mesh.position.x < minX) {
            this.mesh.position.x = minX;
            this.moveDirection = 1; // Đổi hướng sang phải
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

        // --- LOGIC RÚT LUI KHI MÁU <= 200 ---
        if (this.state === 'FIGHTING' && this.hp <= 200 && !this.hasRetreated) {
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
    constructor(scene, projectileSystem, itemSystem, enemyManager) {
        super(scene, projectileSystem, itemSystem, 'BOSS_2');
        this.hp = CONFIG.ENEMIES.BOSS_2?.HP || 1000;
        this.maxHP = this.hp;
        this.moveDirection = 1;
        this.moveSpeed = 0.15; // Nhanh hơn Boss 1

        this.state = 'FIGHTING';
        this.shootTimer = 0;
        this.spreadTimer = 0;
        this.spawnTimer = -5.0; // Bắt đầu từ số âm để trì hoãn đợt đẻ quái đầu tiên (đợi 5s + spawnInterval)
        this.enemyManager = enemyManager; // Tham chiếu đến EnemyManager để đẻ quái

        this.targetZ = -30; // Boss 2 tiến lại gần hơn Boss 1 (-35) một chút
    }

    loadModel() {
        const modelPath = CONFIG.ASSETS.MODELS.BOSS_2;
        this.loader.load(modelPath, (glb) => {
            this.mesh = glb.scene;
            // File Boss_2.glb có thể rất to nên không scale lên 10 như Boss 1 nữa
            this.mesh.scale.set(1.5, 1.5, 1.5);
            this.mesh.rotation.y = Math.PI; // Quay mặt về phía người chơi
            this.mesh.position.set(0, 10, -50); // Lùi ra xa hơn một chút khi vừa spawn
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }, undefined, (err) => {
            console.error("Lỗi khi tải model Boss 2:", err);
            const geo = new THREE.BoxGeometry(4, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        });
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

        // Giới hạn bay trong FLIGHT_ENVELOPE của tàu
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const minX = -envX;
        const maxX = envX;

        if (this.mesh.position.x > maxX) {
            this.mesh.position.x = maxX;
            this.moveDirection = -1;
        } else if (this.mesh.position.x < minX) {
            this.mesh.position.x = minX;
            this.moveDirection = 1;
        }

        // NHẤP NHÔ
        this.mesh.position.y += Math.sin(Date.now() * 0.002) * 0.08;

        // BẮN ĐẠN TỎA (Mỗi 3.5s)
        this.spreadTimer += delta;
        if (this.spreadTimer >= 1.5) {
            this.spreadTimer = 0;
            this.shootSpread(playerPos);
        }

        // ĐẺ QUÁI (Mỗi SPAWN_INTERVAL s)
        this.spawnTimer += delta;
        const spawnInterval = CONFIG.ENEMIES.BOSS_2?.SPAWN_INTERVAL || 10;
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
        const count = CONFIG.ENEMIES.BOSS_2?.SPAWN_QUAI_COUNT || 3;

        for (let i = 0; i < count; i++) {
            // Sử dụng class Enemy có sẵn qua EnemyManager
            const minion = new Enemy(this.scene, this.projectileSystem, this.itemSystem);

            const offsetX = (i - Math.floor(count / 2)) * 6; // Xếp dàn ngang hẹp hơn để che chắn tốt hơn
            minion.shieldTarget = this; // Đặt mục tiêu bảo vệ là chính Boss 2
            minion.shieldOffsetX = offsetX;

            minion.onLoadComplete = () => {
                minion.mesh.position.set(this.mesh.position.x + offsetX, this.mesh.position.y, this.mesh.position.z + 5);
            };

            // Quái do boss sinh ra máu ít hơn nhưng đủ để làm lá chắn
            minion.maxHP = 30;
            minion.hp = 30;
            minion.isBossMinion = true; // Quái Boss tạo ra

            this.enemyManager.enemies.push(minion);
        }
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
    constructor(scene, projectileSystem, itemSystem, player) {
        super(scene, projectileSystem, itemSystem, 'BOSS_3');
        this.player = player; // Lưu tham chiếu đến người chơi để làm chậm
        this.hp = CONFIG.ENEMIES.BOSS_3?.HP || 600;
        this.maxHP = this.hp;

        this.moveDirection = 1;
        this.moveSpeed = 0.2; // Tốc độ di chuyển cơ bản nhanh hơn

        this.dodgeCooldown = 0; // Thời gian hồi chiêu né đạn
        this.shockwaveTimer = 0; // Bộ đếm 6s cho sóng âm
        this.isShockwaveActive = false; // Trạng thái kích hoạt sóng âm (khi máu < 2/3)

        this.targetZ = -80;

        this.specialAttackTimer = 0; // Bộ đếm 3s cho đòn bắn tỏa đặc biệt
    }

    loadModel() {
        const modelPath = CONFIG.ASSETS.MODELS.BOSS_3;
        this.loader.load(modelPath, (glb) => {
            this.mesh = glb.scene;
            this.mesh.scale.set(7, 7, 7); // Boss 3 nhỏ gọn, khó bắn hơn
            this.mesh.position.set(0, 10, -60);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }, undefined, (err) => {
            console.error("Lỗi khi tải model Boss 3:", err);
            const geo = new THREE.OctahedronGeometry(3.5, 2);
            const mat = new THREE.MeshPhongMaterial({ color: 0x440088, shininess: 100 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -80);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        });
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

        // Giới hạn biên
        const viewLimitX = 25;
        const minX = playerPos.x - viewLimitX;
        const maxX = playerPos.x + viewLimitX;

        if (this.mesh.position.x > maxX) {
            this.mesh.position.x = maxX;
            this.moveDirection = -1;
        } else if (this.mesh.position.x < minX) {
            this.mesh.position.x = minX;
            this.moveDirection = 1;
        }

        // Nhấp nhô sinh động
        this.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.1;

        // --- CƠ CHẾ SÓNG ÂM (SHOCKWAVE) ---
        // Kích hoạt khi máu mất 1/3 (còn lại <= 2/3)
        if (this.hp <= this.maxHP * (2 / 3)) {
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
    }

    checkAndDodge() {
        if (!this.projectileSystem) return;

        // Quét tìm đạn của người chơi đang bay tới gần
        const warningDist = 15;
        for (const p of this.projectileSystem.projectiles) {
            if (p.isEnemy || p.isDead) continue; // Bỏ qua đạn của quái

            const dist = this.mesh.position.distanceTo(p.mesh.position);
            if (dist < warningDist) {
                // Thực hiện né: Dash sang hướng ngược lại với đạn hoặc ngẫu nhiên
                const dodgeDir = Math.random() > 0.5 ? 1 : -1;
                gsap.to(this.mesh.position, {
                    x: this.mesh.position.x + dodgeDir * 15,
                    duration: 0.4,
                    ease: "power2.out"
                });
                this.dodgeCooldown = 2.0; // Nghỉ 2s mới né tiếp
                console.log("⚡ Boss 3: Đã né đạn!");
                break;
            }
        }
    }

    triggerShockwave() {
        console.log("🔊 Boss 3: PHÁT SÓNG ÂM!");

        // 1. Hiệu ứng thị giác (3D Sonic Wave Fronts)
        if (this.scene) {
            // Tạo các mặt sóng cong (Hemisphere/Cap) để có chiều sâu thực sự
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    // Tạo một phần mặt cầu (Cap) để trông như mặt sóng 3D
                    // SphereGeometry(radius, widthSeg, heightSeg, phiStart, phiLength, thetaStart, thetaLength)
                    const waveGeo = new THREE.SphereGeometry(2, 32, 20, 0, Math.PI * 2, 0, 0.8);
                    const waveMat = new THREE.MeshBasicMaterial({
                        color: 0x00f0ff,
                        transparent: true,
                        opacity: 0.6,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                        wireframe: true // Thêm wireframe để nhìn rõ các đường vân sóng âm
                    });
                    const wave = new THREE.Mesh(waveGeo, waveMat);
                    
                    wave.position.copy(this.mesh.position);
                    // Xoay mặt cầu hướng về phía người chơi
                    wave.rotation.x = Math.PI / 2;
                    
                    this.scene.add(wave);

                    // Hiệu ứng: Mặt sóng nở to cực đại và lao về phía màn hình
                    gsap.to(wave.scale, { x: 60, y: 60, z: 20, duration: 2.0, ease: "power1.out" });
                    gsap.to(wave.position, { z: 40, duration: 2.0, ease: "none" });
                    gsap.to(waveMat, {
                        opacity: 0, duration: 2.0, onComplete: () => {
                            this.scene.remove(wave);
                            waveGeo.dispose();
                            waveMat.dispose();
                        }
                    });
                }, i * 400);
            }
        }

        // 2. Gây hiệu ứng làm chậm lên người chơi
        if (this.player && this.player.applySlow) {
            const slowFactor = CONFIG.ENEMIES.BOSS_3?.SLOW || 0.5;
            this.player.applySlow(3.5, slowFactor); // Làm chậm trong 3.5 giây
        }
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

