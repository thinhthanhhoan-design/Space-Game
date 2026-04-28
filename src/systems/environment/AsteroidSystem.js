import * as THREE from 'three';
import gsap from 'gsap';
import { CONFIG } from '../../utils/CONFIG.JS';
import { assetLoader } from '../../utils/AssetLoader.js';

export class AsteroidSystem {
    constructor(scene, particleSystem, player, camera) {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.player = player;
        this.camera = camera;

        this.asteroids = [];
        this.bubbles = [];

        this.spawnTimer = 0;
        this.currentLevelKey = 'LEVEL_1';

        this.updateConfig();
    }

    setLevel(levelKey) {
        this.currentLevelKey = levelKey;
        this.updateConfig();
    }

    updateConfig() {
        this.levelConfig = CONFIG.WORLD[this.currentLevelKey] || CONFIG.WORLD.LEVEL_1;
        this.baseDensity = this.levelConfig.asteroid_density || 10;
        this.baseSpeed = this.levelConfig.asteroid_speed || 0.015;
        this.baseDamage = this.levelConfig.asteroid_damage || 50;
    }

    // ================= SPAWN =================
    spawn() {

        const cachedModel = assetLoader.cloneModel('asteroid');

        let asteroid = cachedModel || new THREE.Mesh(
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );

        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;

        asteroid.position.set(
            (Math.random() - 0.5) * envX * 3,
            (Math.random() - 0.5) * envY * 3,
            CONFIG.WORLD.SPAWN_DISTANCE_Z
        );

        const scale = 1.5 + Math.random() * 3;
        asteroid.scale.set(scale, scale, scale);

        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        };

        asteroid.userData.damage = this.baseDamage;
        asteroid.userData.bubbleTimer = Math.random() * 2;

        // ⭐ init trail history
        asteroid.userData.trailHistory = [];

        this.createAura(asteroid);
        this.createTrail(asteroid);

        this.scene.add(asteroid);
        this.asteroids.push(asteroid);
    }

    // ================= AURA =================
    createAura(asteroid) {

        const isToxic = this.currentLevelKey === 'LEVEL_2';
        const color = isToxic ? 0x39ff14 : 0xffaa33;

        const count = 350;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {

            const radius = 1.05 + Math.random() * 0.8;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color,
            size: isToxic ? 0.28 : 0.14,
            opacity: isToxic ? 1 : 0.95,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const aura = new THREE.Points(geometry, material);

        asteroid.add(aura);
        asteroid.userData.aura = aura;
    }

    // ================= TRAIL (NATURAL HISTORY) =================
    createTrail(asteroid) {

        const isToxic = this.currentLevelKey === 'LEVEL_2';
        const color = isToxic ? 0x39ff14 : 0xffcc66;

        const count = 25;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color,
            size: isToxic ? 0.22 : 0.14,
            opacity: isToxic ? 0.9 : 0.7,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const trail = new THREE.Points(geometry, material);

        asteroid.add(trail);
        asteroid.userData.trail = trail;
    }

    // ================= UPDATE =================
    update(delta) {

        this.spawnTimer += delta;

        const spawnInterval = 1 / this.baseDensity;

        if (this.spawnTimer > spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        const speed = this.baseSpeed * 4000;

        for (let i = this.asteroids.length - 1; i >= 0; i--) {

            const a = this.asteroids[i];

            a.position.z += delta * speed;

            a.rotation.x += a.userData.rotationSpeed.x;
            a.rotation.y += a.userData.rotationSpeed.y;

            // ================= AURA =================
            if (a.userData.aura) {
                a.userData.aura.rotation.y += 0.002;
                a.userData.aura.rotation.x += 0.001;
            }

            // ================= TRAIL HISTORY (FIX) =================
            if (a.userData.trail) {

                const history = a.userData.trailHistory;

                history.unshift(a.position.clone());

                if (history.length > 25) history.pop();

                const positions = a.userData.trail.geometry.attributes.position.array;

                for (let j = 0; j < history.length; j++) {

                    const p = history[j];

                    positions[j * 3] = p.x;
                    positions[j * 3 + 1] = p.y;
                    positions[j * 3 + 2] = p.z;
                }

                a.userData.trail.geometry.attributes.position.needsUpdate = true;
            }

            // ================= LEVEL 2 BUBBLE =================
            if (this.currentLevelKey === 'LEVEL_2') {

                a.userData.bubbleTimer -= delta;

                if (a.userData.bubbleTimer <= 0) {
                    this.spawnBubble(a.position);
                    a.userData.bubbleTimer = 2 + Math.random();
                }
            }

            if (a.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(a);
                this.asteroids.splice(i, 1);
            }
        }

        // ================= BUBBLE =================
        for (let i = this.bubbles.length - 1; i >= 0; i--) {

            const b = this.bubbles[i];

            b.position.z += delta * 20;

            if (this.player && this.player.mesh) {

                const dist = b.position.distanceTo(this.player.mesh.position);

                if (dist < 1.2) {

                    this.player.takeDamage(20);

                    this.particleSystem.explodeAt(
                        b.position,
                        0x00ffcc,
                        80,
                        2
                    );

                    this.scene.remove(b);
                    this.bubbles.splice(i, 1);
                    continue;
                }
            }

            if (b.position.z > 50) {
                this.scene.remove(b);
                this.bubbles.splice(i, 1);
            }
        }
    }

    // ================= BUBBLE =================
    spawnBubble(position) {

        const geo = new THREE.SphereGeometry(0.3, 8, 8);

        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });

        const bubble = new THREE.Mesh(geo, mat);
        bubble.position.copy(position);

        this.scene.add(bubble);
        this.bubbles.push(bubble);
    }

    // ================= COLLISION =================
    checkCollisions(playerMesh, onCollide) {

        if (!playerMesh) return;

        const playerPos = playerMesh.position;
        const playerRadius = 0.3;

        this.asteroids.forEach((a) => {

            const dist = playerPos.distanceTo(a.position);
            const r = a.scale.x * 0.6;

            if (dist < playerRadius + r) {

                if (onCollide) onCollide(a);

                this.particleSystem.explodeAt(
                    a.position,
                    0xffaa33,
                    120,
                    3
                );

                this.scene.remove(a);
                this.asteroids = this.asteroids.filter(x => x !== a);
            }
        });
    }
}