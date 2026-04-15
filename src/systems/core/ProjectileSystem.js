import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.geometry = new THREE.SphereGeometry(0.1, 8, 8);
        this.enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        this.playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    }

    spawn(position, direction, speed, damage, isEnemy = true) {
        const material = isEnemy ? this.enemyMaterial : this.playerMaterial;
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.copy(position);
        
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
