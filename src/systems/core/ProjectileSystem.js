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
        this.projectiles = [];

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
    }

    /**
     * Tạo đạn mới trong scene
     */
    spawn(position, direction, speed, damage, isEnemy = true, type = 'LASER', attachedTo = null) {
        let material, geometry;
        if (type === 'LASER') {
            material = this.enemyLaserMat;
            geometry = this.laserGeo;
        } else if (type === 'BOSS_LASER') {
            material = this.bossLaserMat;
            geometry = this.bossLaserGeo;
        } else {
            material = this.bossSphereMat;
            geometry = this.sphereGeo;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        if (type === 'BOSS_LASER') {
            // Đẩy laser ra phía trước boss
            mesh.position.add(direction.clone().multiplyScalar(38));
        } else if (direction.z > 0) {
            mesh.position.z += 2;
        }

        const lookTarget = mesh.position.clone().add(direction);
        mesh.lookAt(lookTarget);

        const velocity = direction.clone().normalize().multiplyScalar(speed);

        const projectile = {
            mesh: mesh,
            velocity: velocity,
            direction: direction,
            damage: damage,
            isEnemy: isEnemy,
            type: type,
            attachedTo: attachedTo,
            duration: type === 'BOSS_LASER' ? 3.5 : Infinity,
            hitTimer: 0
        };

        this.scene.add(mesh);
        this.projectiles.push(projectile);
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.hitTimer > 0) p.hitTimer -= delta;

            if (p.duration !== Infinity) {
                p.duration -= delta;
                if (p.duration <= 0) {
                    this.scene.remove(p.mesh);
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

            // Xóa đạn khi ra khỏi biên
            if (!p.attachedTo && (p.mesh.position.z > 50 || p.mesh.position.z < -200 ||
                Math.abs(p.mesh.position.x) > 100 || Math.abs(p.mesh.position.y) > 100)) {
                this.scene.remove(p.mesh);
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
                    this.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                    return damage;
                }
            }
        }
        return null;
    }
}
