import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

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
        
        // Tối ưu: Dùng chung 1 Geometry và Material cho tất cả đạn
        this.bulletGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3.0, 8); // Tăng kích thước (radius 0.2, dài 3.0) để nhìn rõ tia laser
        this.bulletGeometry.rotateX(Math.PI / 2); // Xoay để nòng đạn hướng về phía trước theo trục Z

        this.bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, // Xanh cyan laser
            transparent: true,
            opacity: 0.9, // Tăng độ đậm của đạn
            blending: THREE.AdditiveBlending // Chế độ hòa trộn cộng sáng để tạo hiệu ứng phát sáng (Glow)
        }); 
    }

    fire() {
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

            // Tạo mesh viêm đạn
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
