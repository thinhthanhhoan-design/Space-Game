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

    shootSphere(playerPos) { // Boss nhả quả cầu sát thương lớn
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        const speed = CONFIG.ENEMIES.BOSS_1?.BULLET_SPEED || 0.4;
        // Nhả cầu sát thương 30hp, tốc độ 0.4, loại 'SPHERE'
        this.projectileSystem.spawn(this.mesh.position, direction, speed, 30, true, 'SPHERE');
    }
}
