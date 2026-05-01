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
        this.bullets = []; // Chứa đạn đang bay (active)
        this.pool = [];    // Chứa đạn nhàn rỗi (inactive)
        this.maxPoolSize = 100;
        
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
        this.fireRateMultiplier = 1.0; 
        this.musicSystem = null;

        this.initPool();
    }

    // KHỞI TẠO HỒ CHỨA ĐẠN
    initPool() {
        for (let i = 0; i < this.maxPoolSize; i++) {
            const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial.clone());
            bullet.visible = false;
            bullet.userData = {
                damage: 0,
                vx: 0,
                vz: 0,
                markedForDeletion: false
            };
            this.scene.add(bullet);
            this.pool.push(bullet);
        }
    }

    // LẤY ĐẠN TỪ HỒ
    getBulletFromPool() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        // Fallback nếu bắn quá nhanh, tự nở pool
        const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial.clone());
        bullet.visible = false;
        bullet.userData = { damage: 0, vx: 0, vz: 0, markedForDeletion: false };
        this.scene.add(bullet);
        return bullet;
    }

    // TRẢ ĐẠN VỀ HỒ
    returnBulletToPool(bullet) {
        bullet.visible = false;
        bullet.userData.markedForDeletion = false;
        this.pool.push(bullet);
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

        if (this.player.ammo < this.ammoPerShot) return;

        this.lastFireTime = now;
        this.player.ammo -= this.ammoPerShot;

        if (this.musicSystem) {
            this.musicSystem.playSound('PLAYER_BAN');
        }

        const bulletCount = this.config.bullet_count || 1;
        
        for (let i = 0; i < bulletCount; i++) {
            const bullet = this.getBulletFromPool();
            bullet.position.copy(this.player.mesh.position);
            bullet.visible = true;
            
            let vx = 0;
            let vz = -this.bulletSpeed;

            if (this.currentGun === 'GUN_2') {
                const offset = (i - (bulletCount - 1) / 2) * (this.config.parallel_offset || 2.0); 
                bullet.position.x += offset;
                bullet.material.color.setHex(0x00ff00); 
            } else if (this.currentGun === 'GUN_3') {
                const offset = (i - (bulletCount - 1) / 2) * (this.config.parallel_offset || 2.8); 
                bullet.position.x += offset;
                bullet.material.color.setHex(0xff4500); 
            } else {
                bullet.material.color.setHex(0xffffff); // Default
            }

            bullet.userData.damage = this.damage;
            bullet.userData.vx = vx;
            bullet.userData.vz = vz;
            bullet.userData.markedForDeletion = false;
            
            this.bullets.push(bullet);
        }
    }

    update(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.position.x += bullet.userData.vx * (delta * 60);
            bullet.position.z += bullet.userData.vz * (delta * 60);

            if (bullet.position.z < -200 || bullet.userData.markedForDeletion) {
                // Thay vì remove, ta ném lại vào pool
                this.returnBulletToPool(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
}
