import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Enemy } from './Enemy.js';

export class Boss extends Enemy {
    constructor(scene, projectileSystem) {
        super(scene, projectileSystem, 'BOSS_1');
        this.hp = CONFIG.ENEMIES.BOSS_1.HP || 500;
        this.moveDirection = 1; // 1 for right, -1 for left
        this.moveSpeed = 0.1;
    }

    loadModel() {
        const modelPath = CONFIG.ASSETS.MODELS.BOSS_1;
        this.loader.load(modelPath, (glb) => {
            this.mesh = glb.scene;
            this.mesh.scale.set(3, 3, 3);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        }, undefined, (err) => {
            console.error("Lỗi khi tải model Boss 1.2:", err);
            // Fallback
            const geo = new THREE.TorusKnotGeometry(2, 0.5, 100, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(0, 10, -40);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        });
    }

    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return;

        // Phase 1: Di chuyển ngang
        this.mesh.position.x += this.moveDirection * this.moveSpeed * delta * 60;

        // Chặn biên ngang
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        if (this.mesh.position.x > envX * 0.8) this.moveDirection = -1;
        if (this.mesh.position.x < -envX * 0.8) this.moveDirection = 1;
    }

    shoot(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        // Boss vẫn bắn nhắm vào người chơi
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        this.projectileSystem.spawn(this.mesh.position, direction, 0.4, this.damage, true);
    }

    shootHoming(playerPos) {
        if (!playerPos || !this.mesh || !this.projectileSystem) return;
        // Thực tế homing logic sẽ nằm ở ProjectileSystem nếu nó hỗ trợ
        // Ở đây ta chỉ bắn đạn nhắm trúng player tại thời điểm bắn (auto-aim)
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        this.projectileSystem.spawn(this.mesh.position, direction, 0.6, 20, true);
    }
}
