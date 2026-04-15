import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';
import { Patterns } from './Patterns.js';

export class Enemy {
    constructor(scene, projectileSystem, type = 'QUAI_1') {
        this.scene = scene;
        this.projectileSystem = projectileSystem;
        this.type = type;
        this.hp = CONFIG.ENEMIES[type]?.HP || 50;
        this.damage = CONFIG.ENEMIES[type]?.DAMAGE || 10;

        this.mesh = null;
        this.isDead = false;
        this.isLoaded = false;

        // Vận tốc di chuyển random X, Y
        this.randomVel = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };

        // Random movement parameters
        this.randomOffset = {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2
        };
        this.moveFreq = 0.5 + Math.random();
        this.moveAmp = 2 + Math.random() * 3;

        this.loader = new GLTFLoader();
        this.loadModel();
    }

    loadModel() {
        const modelPath = CONFIG.ASSETS.MODELS.ENEMY_1;
        this.loader.load(modelPath, (glb) => {
            this.mesh = glb.scene;
            this.mesh.scale.set(1.5, 1.5, 1.5);
            this.scene.add(this.mesh);
            this.isLoaded = true;
            if (this.onLoadComplete) this.onLoadComplete();
        }, undefined, (err) => {
            console.error("Lỗi khi tải model Monster 1:", err);
            // Fallback
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.scene.add(this.mesh);
            this.isLoaded = true;
        });
    }

    update(delta, playerPos) {
        if (!this.mesh || this.isDead) return;

        // Tiến về phía người chơi (Z tăng)
        this.mesh.position.z += delta * 15;

        // Di chuyển random X, Y (Leader logic)
        this.mesh.position.x += this.randomVel.x * delta;
        this.mesh.position.y += this.randomVel.y * delta;

        // Chặn biên để quái không bay ra khỏi màn hình
        const limitX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X * 1.5;
        const limitY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y * 1.5;
        if (Math.abs(this.mesh.position.x) > limitX) this.randomVel.x *= -1;
        if (Math.abs(this.mesh.position.y) > limitY) this.randomVel.y *= -1;

        // Di chuyển random X, Y (Sine-based oscillation)
        const time = Date.now() * 0.001;
        this.mesh.position.x += Math.sin(time * this.moveFreq + this.randomOffset.x) * 0.05;
        this.mesh.position.y += Math.cos(time * this.moveFreq + this.randomOffset.y) * 0.05;

        // Tự hủy nếu bay quá xa
        if (this.mesh.position.z > 20) {
            this.die();
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.die();
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}

export class EnemyManager {
    constructor(scene, projectileSystem) {
        this.scene = scene;
        this.projectileSystem = projectileSystem;
        this.enemies = [];
        this.currentWave = 0;
        this.waveInProgress = false;
        this.spawnedInWave = 0;
        this.isAllWavesCleared = false;
    }

    startWaveSystem() {
        if (this.waveInProgress) return;
        this.currentWave = 1;
        this.spawnWave(1);
    }

    spawnWave(waveNum) {
        this.waveInProgress = true;
        this.spawnedInWave = 0;
        const count = 10;

        const spawnInterval = setInterval(() => {
            if (this.spawnedInWave >= count) {
                clearInterval(spawnInterval);
                return;
            }

            const enemy = new Enemy(this.scene, this.projectileSystem);
            const index = this.spawnedInWave;

            enemy.onLoadComplete = () => {
                if (waveNum === 1) {
                    enemy.mesh.position.copy(Patterns.FORMATION_WAVE_1(index, count));
                } else {
                    enemy.mesh.position.copy(Patterns.getRandomTopPosition());
                }
            };

            this.enemies.push(enemy);
            this.spawnedInWave++;
        }, 800);
    }

    update(delta, playerPos) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, playerPos);

            if (this.currentWave === 2 && enemy.isLoaded) {
                Patterns.updateRandomMovement(enemy.mesh.position, delta, 2);
            }

            if (enemy.isDead) {
                this.enemies.splice(i, 1);
            }
        }

        if (this.waveInProgress && this.spawnedInWave === 10 && this.enemies.length === 0) {
            if (this.currentWave === 1) {
                this.currentWave = 2;
                this.spawnedInWave = 0;
                setTimeout(() => this.spawnWave(2), 3000);
            } else {
                this.waveInProgress = false;
                this.isAllWavesCleared = true;
                console.log("Đã dọn sạch 2 wave quái!");
            }
        }
    }
}
