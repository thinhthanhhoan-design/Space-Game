import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

/**
 * Tạo texture gradient cho đạn Boss
 */
function createBossBulletTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 16, 256);

    // Gradient dọc tạo hiệu ứng đuôi dài
    const gradient = ctx.createLinearGradient(0, 256, 0, 0); 
    gradient.addColorStop(0.0, 'rgba(255, 255, 200, 1)');   // Lõi trắng vàng (Đầu)
    gradient.addColorStop(0.1, 'rgba(255, 180, 0, 1)');    // Quầng cam
    gradient.addColorStop(0.3, 'rgba(255, 0, 150, 0.9)');   // Thân hồng
    gradient.addColorStop(0.6, 'rgba(100, 0, 200, 0.4)');   // Đuôi mờ
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');         // Kết thúc

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);

    return new THREE.CanvasTexture(canvas);
}

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = []; // Đạn đang active
        this.pool = [];        // Đạn nhàn rỗi
        this.maxPoolSize = 200;

        // Khởi tạo hình học cho các loại đạn
        const pts = [];
        for (let i = 0; i <= 15; i++) {
            const a = (i / 15) * Math.PI * 0.5;
            pts.push(new THREE.Vector2(Math.sin(a) * 0.8, Math.cos(a) * 0.8));
        }
        pts.push(new THREE.Vector2(0, -15));
        this.sphereGeo = new THREE.LatheGeometry(pts, 16);
        this.sphereGeo.rotateX(Math.PI / 2);

        this.laserGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.0, 8);
        this.laserGeo.rotateX(Math.PI / 2);

        this.bossLaserGeo = new THREE.CylinderGeometry(1.5, 1.5, 80.0, 8);
        this.bossLaserGeo.rotateX(Math.PI / 2);

        // Khởi tạo vật liệu
        this.enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        this.bossLaserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });

        this.bossSphereMat = new THREE.MeshBasicMaterial({
            map: createBossBulletTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.initPool();
    }

    initPool() {
        for (let i = 0; i < this.maxPoolSize; i++) {
            const mesh = new THREE.Mesh(this.laserGeo, this.enemyLaserMat);
            mesh.visible = false;
            this.scene.add(mesh);
            
            this.pool.push({
                mesh: mesh,
                velocity: new THREE.Vector3(),
                direction: new THREE.Vector3(),
                damage: 0,
                isEnemy: true,
                type: 'LASER',
                attachedTo: null,
                duration: Infinity,
                hitTimer: 0
            });
        }
    }

    getFromPool() {
        if (this.pool.length > 0) return this.pool.pop();
        
        // Fallback mở rộng pool nếu cần
        const mesh = new THREE.Mesh(this.laserGeo, this.enemyLaserMat);
        mesh.visible = false;
        this.scene.add(mesh);
        return {
            mesh: mesh,
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
            damage: 0,
            isEnemy: true,
            type: 'LASER',
            attachedTo: null,
            duration: Infinity,
            hitTimer: 0
        };
    }

    returnToPool(p) {
        p.mesh.visible = false;
        p.attachedTo = null;
        this.pool.push(p);
    }

    /**
     * Tạo đạn mới trong scene từ Pool
     */
    spawn(position, direction, speed, damage, isEnemy = true, type = 'LASER', attachedTo = null) {
        const p = this.getFromPool();

        // Gán đúng hình học và vật liệu
        if (type === 'LASER') {
            p.mesh.material = this.enemyLaserMat;
            p.mesh.geometry = this.laserGeo;
        } else if (type === 'BOSS_LASER') {
            p.mesh.material = this.bossLaserMat;
            p.mesh.geometry = this.bossLaserGeo;
        } else {
            p.mesh.material = this.bossSphereMat;
            p.mesh.geometry = this.sphereGeo;
        }

        p.mesh.position.copy(position);

        if (type === 'BOSS_LASER') {
            // Đẩy laser ra phía trước boss
            p.mesh.position.add(direction.clone().multiplyScalar(38));
        } else if (direction.z > 0) {
            p.mesh.position.z += 2;
        }

        const lookTarget = p.mesh.position.clone().add(direction);
        p.mesh.lookAt(lookTarget);

        p.velocity.copy(direction).normalize().multiplyScalar(speed);
        p.direction.copy(direction);
        p.damage = damage;
        p.isEnemy = isEnemy;
        p.type = type;
        p.attachedTo = attachedTo;
        p.duration = type === 'BOSS_LASER' ? 3.5 : Infinity;
        p.hitTimer = 0;
        p.mesh.visible = true;

        this.projectiles.push(p);
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.hitTimer > 0) p.hitTimer -= delta;

            if (p.duration !== Infinity) {
                p.duration -= delta;
                if (p.duration <= 0) {
                    this.returnToPool(p);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (p.attachedTo) {
                p.mesh.position.copy(p.attachedTo.position);
                if (p.type === 'BOSS_LASER') {
                    p.mesh.position.add(p.direction.clone().multiplyScalar(38));
                }
            } else {
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta * 60));
            }

            // Thu hồi đạn khi ra khỏi biên
            if (!p.attachedTo && (p.mesh.position.z > 50 || p.mesh.position.z < -200 ||
                Math.abs(p.mesh.position.x) > 100 || Math.abs(p.mesh.position.y) > 100)) {
                this.returnToPool(p);
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Kiểm tra va chạm đạn với mục tiêu
     */
    checkCollision(targetMesh, radius = 1) {
        if (!targetMesh) return null;
        const targetPos = targetMesh.position;
        const targetBox = new THREE.Box3().setFromCenterAndSize(targetPos, new THREE.Vector3(radius * 2.5, radius * 2.5, radius * 2.5));

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.isEnemy) continue;

            const bulletBox = new THREE.Box3().setFromObject(p.mesh);

            if (bulletBox.intersectsBox(targetBox)) {
                if (p.type === 'BOSS_LASER') {
                    if (p.hitTimer <= 0) {
                        p.hitTimer = 0.5;
                        return p.damage;
                    }
                } else {
                    const damage = p.damage;
                    this.returnToPool(p);
                    this.projectiles.splice(i, 1);
                    return damage;
                }
            }
        }
        return null;
    }
}
