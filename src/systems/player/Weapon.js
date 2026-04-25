import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

function createBulletTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Nền trong suốt
    ctx.clearRect(0, 0, 16, 256);
    
    // Gradient dọc từ đầu đến đuôi
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');   // Đầu đạn: Trắng chói
    gradient.addColorStop(0.1, 'rgba(255, 255, 150, 1)');   // Vàng sáng
    gradient.addColorStop(0.3, 'rgba(255, 120, 0, 0.9)');   // Thân: Cam
    gradient.addColorStop(0.7, 'rgba(150, 0, 0, 0.3)');     // Đuôi mờ dần: Đỏ tối
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');         // Trong suốt hoàn toàn

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);

    return new THREE.CanvasTexture(canvas);
}

export class Weapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.bullets = [];
        
        // Thiết lập súng mặc định 1 dựa trên CONFIG
        this.config = CONFIG.PLAYER.WEAPONS.GUN_1;
        this.damage = this.config.damage; // 25hp
        this.fireRate = this.config.fireRate; // 0.4s
        this.ammoPerShot = this.config.ammo_per_shot; // Mỗi lần bắn tiêu tốn bao nhiêu viên
        
        this.lastFireTime = 0;
        
        // Tạo hình khối 3D cho đạn: Đầu to (0.6), đuôi nhọn (0.05), dài 6.0
        // Khối 3D giúp đạn không bị dẹt khi nhìn từ góc chéo (sửa lỗi đạn phẳng)
        this.bulletGeometry = new THREE.CylinderGeometry(0.6, 0.05, 6.0, 12);
        
        // Xoay khối 3D sao cho đầu to (+Y) hướng về phía trước (-Z) 
        // Điều này giúp đạn "lao về phía trước" trong không gian 3D thay vì "chĩa lên trời"
        this.bulletGeometry.rotateX(-Math.PI / 2);

        this.bulletMaterial = new THREE.MeshBasicMaterial({ 
            map: createBulletTexture(), 
            color: 0xffffff, 
            transparent: true,
            opacity: 1.0, 
            blending: THREE.AdditiveBlending, // Hiệu ứng phát sáng
            depthWrite: false, // Ngăn lỗi che khuất Alpha
            side: THREE.DoubleSide
        }); 

        this.isLocked = false; // Trạng thái bị khóa súng (do Debuff)
    }

    fire() {
        // Nếu súng bị khóa (do Debuff), không thể bắn
        if (this.isLocked) return;

        // Kiểm tra thời gian hồi chiêu giữa 2 lần bắn (Fire Rate)
        const now = performance.now() / 1000;
        if (now - this.lastFireTime < this.fireRate) return;

        // Cơ chế giới hạn đạn
        if (this.player.ammo >= this.ammoPerShot) {
            // Trừ đạn của Player
            this.player.ammo -= this.ammoPerShot;
            console.log(`Bắn đạn! Sát thương: ${this.damage} HP | Số đạn còn: ${this.player.ammo}/${this.player.maxAmmo}`);
            
            // Cập nhật mốc thời gian bắn bắn gần nhất
            this.lastFireTime = now;

            // Tạo Mesh đạn 3D thực sự
            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
            
            // Đặt vị trí đạn trước mũi tàu để tránh va lầm player
            bullet.position.copy(this.player.mesh.position);
            bullet.position.z -= 1.5; 
            
            // Dữ liệu dùng cho xử lý va chạm
            bullet.userData = {
                damage: this.damage,
                speed: 0.5, // Vận tốc bay của đạn
                markedForDeletion: false
            };

            this.scene.add(bullet);
            this.bullets.push(bullet);

            // Tùy chọn: Thêm hiệu ứng âm thanh bắn tại đây
            // const sfx = new Audio(CONFIG.ASSETS.SOUNDS.SFX_LASER); 
            // sfx.play();
        } else {
            // Hết đạn, nếu đè phím Space có thể kêu tạch tạch báo hiệu
            // console.log("Hết đạn!");
        }
    }

    update(enemies = []) {
        // Di chuyển đạn mỗi khung hình
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Đạn bay tiến sâu vào trong màn hình theo trục -Z
            bullet.position.z -= bullet.userData.speed;

            // Dọn dẹp đạn nếu bay quá khỏi tầm nhìn (World spawn distance) hoặc đã va chạm trúng đích
            if (bullet.position.z < CONFIG.WORLD.SPAWN_DISTANCE_Z || bullet.userData.markedForDeletion) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
}
