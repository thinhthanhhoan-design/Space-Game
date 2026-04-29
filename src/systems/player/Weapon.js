import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

function createBulletTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 256);
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 150, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 120, 0, 0.9)');
    gradient.addColorStop(0.7, 'rgba(150, 0, 0, 0.3)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);
    return new THREE.CanvasTexture(canvas);
}

export class Weapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.bullets = [];
        
        this.currentGun = 'GUN_1';
        this.updateConfig();
        
        this.lastFireTime = 0;
        this.bulletGeometry = new THREE.CylinderGeometry(0.6, 0.05, 6.0, 12);
        this.bulletGeometry.rotateX(-Math.PI / 2);

        this.bulletMaterial = new THREE.MeshBasicMaterial({ 
            map: createBulletTexture(), 
            color: 0xffffff, 
            transparent: true,
            opacity: 1.0, 
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        }); 

        this.isLocked = false;
        this.fireRateMultiplier = 1.0; // Hệ số nhân tốc độ bắn (1.0 là bình thường, >1 là chậm đi)
        this.musicSystem = null;
    }

    setMusicSystem(musicSystem) {
        this.musicSystem = musicSystem;
    }

    updateConfig() {
        this.config = CONFIG.PLAYER.WEAPONS[this.currentGun];
        this.damage = this.config.damage;
        this.fireRate = this.config.fireRate;
        this.ammoPerShot = this.config.ammo_per_shot;
        this.bulletSpeed = this.config.bullet_speed || 1.5;
    }

    setGun(gunKey) {
        if (CONFIG.PLAYER.WEAPONS[gunKey]) {
            this.currentGun = gunKey;
            this.updateConfig();
        }
    }

    fire() {
        if (this.isLocked) return;

        const now = performance.now() / 1000;
        const actualFireRate = this.fireRate * this.fireRateMultiplier;
        if (now - this.lastFireTime < actualFireRate) return;

        // Kiểm tra đạn
        if (this.player.ammo < this.ammoPerShot) return;

        this.lastFireTime = now;
        
        // Trừ đạn của người chơi
        this.player.ammo -= this.ammoPerShot;

        // Phát âm thanh bắn
        if (this.musicSystem) {
            this.musicSystem.playSound('PLAYER_BAN');
        }

        const bulletCount = this.config.bullet_count || 1;
        
        for (let i = 0; i < bulletCount; i++) {
            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial.clone());
            bullet.position.copy(this.player.mesh.position);
            
            let vx = 0;
            let vz = -this.bulletSpeed;

            if (this.currentGun === 'GUN_2') {
                // GUN 2: Parallel shots
                const offset = (i - (bulletCount - 1) / 2) * (this.config.parallel_offset || 2.0); 
                bullet.position.x += offset;
                bullet.material.color.setHex(0x00ff00); 
            } else if (this.currentGun === 'GUN_3') {
                // GUN 3: Parallel rays
                const offset = (i - (bulletCount - 1) / 2) * (this.config.parallel_offset || 2.8); 
                bullet.position.x += offset;
                bullet.material.color.setHex(0xff4500); 
            }

            bullet.userData = {
                damage: this.damage,
                vx: vx,
                vz: vz,
                markedForDeletion: false
            };
            
            this.scene.add(bullet);
            this.bullets.push(bullet);
        }
    }

    update(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Di chuyển đạn dựa trên vx và vz từ userData
            bullet.position.x += bullet.userData.vx * (delta * 60);
            bullet.position.z += bullet.userData.vz * (delta * 60);

            if (bullet.position.z < -200 || bullet.userData.markedForDeletion) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
}
