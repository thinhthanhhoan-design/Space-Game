import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        
        // Geometry cho đạn
        this.sphereGeo = new THREE.SphereGeometry(1.5, 16, 16); // Cầu của Boss (to)
        this.laserGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.0, 8); // Tia laser của quái
        this.laserGeo.rotateX(Math.PI / 2); // Xoay để nòng tia nằm dọc theo trục Z

        // Material phát sáng
        this.enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        this.bossSphereMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    }

    spawn(position, direction, speed, damage, isEnemy = true, type = 'LASER') {
        let material, geometry;
        if (type === 'LASER') {
            material = this.enemyLaserMat;
            geometry = this.laserGeo;
        } else {
            material = this.bossSphereMat;
            geometry = this.sphereGeo;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        // Đẩy viên đạn ra phía trước một chút để không bị lấp vào trong thân model của quái
        if (direction.z > 0) {
            mesh.position.z += 2;
        }
        
        const velocity = direction.clone().normalize().multiplyScalar(speed);
        
        const projectile = {
            mesh: mesh,
            velocity: velocity,
            damage: damage,
            isEnemy: isEnemy
        };
        
        this.scene.add(mesh);
        this.projectiles.push(projectile);
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta * 60));

            // Despawn logic
            if (p.mesh.position.z > 50 || p.mesh.position.z < -200 || 
                Math.abs(p.mesh.position.x) > 100 || Math.abs(p.mesh.position.y) > 100) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollision(targetMesh, radius = 1) {
        if (!targetMesh) return null;
        const targetPos = targetMesh.position;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const dist = p.mesh.position.distanceTo(targetPos);
            
            if (dist < radius) {
                const damage = p.damage;
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
                return damage;
            }
        }
        return null;
    }
}
