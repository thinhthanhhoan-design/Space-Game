import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { modelCache } from '../../utils/ModelCache.js';

export class AsteroidSystem {
    constructor(scene, particleSystem, player, camera) {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.player = player;
        this.camera = camera;

        this.asteroids = [];

        this.spawnTimer = 0;
        this.currentLevelKey = 'LEVEL_1';

        this.updateConfig();
        this.fireTexture = this.createFireTexture();

        // Multipliers cho hiệu ứng từ Items (Debuff)
        this.speedMultiplier = 1.0;
        this.densityMultiplier = 1.0;
    }

    createFireTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');

        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 50, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
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

    spawn() {
        const cachedModel = modelCache.getModel('asteroid');

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

        const scale = 0.15 + Math.random() * 0.3;
        asteroid.scale.set(scale, scale, scale);

        // Tính toán kích thước model để xử lý va chạm và hiệu ứng
        const box = new THREE.Box3().setFromObject(asteroid);
        const size = new THREE.Vector3();
        box.getSize(size);
        asteroid.userData.diameter = Math.max(size.x, size.y);

        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        };

        asteroid.userData.damage = this.baseDamage;

        asteroid.userData.particleData = [];

        this.createAura(asteroid);
        this.createTrail(asteroid);

        this.scene.add(asteroid);
        this.asteroids.push(asteroid);
    }

    createAura(asteroid) {
        const color = 0xffaa33; // Non-toxic orange aura

        const count = 1000; // Tối ưu số lượng hạt để đảm bảo hiệu năng
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 0.6 + Math.random() * 0.4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color,
            size: 0.08,
            opacity: 0.6,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const aura = new THREE.Points(geometry, material);
        asteroid.add(aura);
    }

    createTrail(asteroid) {
        const count = 150; 
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const particleData = [];

        const diameter = asteroid.userData.diameter || 2;

        for (let i = 0; i < count; i++) {
            positions[i * 3] = asteroid.position.x;
            positions[i * 3 + 1] = asteroid.position.y;
            positions[i * 3 + 2] = asteroid.position.z;

            particleData.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    -2 
                ),
                life: Math.random() * 10,
                maxLife: 4 + Math.random() * 3 
            });
        }

        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: diameter * 0.4,
            map: this.fireTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            vertexColors: true
        });

        const trail = new THREE.Points(trailGeometry, material);
        this.scene.add(trail);
        asteroid.userData.trail = trail;
        asteroid.userData.particleData = particleData;
    }

    update(delta) {
        this.spawnTimer += delta;
        // Áp dụng densityMultiplier vào mật độ sinh thiên thạch
        const currentDensity = this.baseDensity * this.densityMultiplier;
        const spawnInterval = 1 / currentDensity;

        if (this.spawnTimer > spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // Áp dụng speedMultiplier vào tốc độ bay
        const asteroidSpeedZ = (this.baseSpeed * this.speedMultiplier) * 4000;

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const a = this.asteroids[i];
            if (!a) continue;

            const oldZ = a.position.z;
            a.position.z += delta * asteroidSpeedZ;
            const distTraveled = a.position.z - oldZ;

            a.rotation.x += a.userData.rotationSpeed.x;
            a.rotation.y += a.userData.rotationSpeed.y;

            if (a.userData.trail && a.userData.particleData) {
                const trailGeometry = a.userData.trail.geometry;
                const positions = trailGeometry.attributes.position.array;
                const colors = trailGeometry.attributes.color.array;
                const particleData = a.userData.particleData;
                const particleCount = trailGeometry.attributes.position.count;
                const diameter = a.userData.diameter || 2;

                for (let j = 0; j < particleCount; j++) {
                    let pd = particleData[j];
                    pd.life += delta * 400; 

                    let idx = j * 3;

                    positions[idx] += pd.velocity.x;
                    positions[idx + 1] += pd.velocity.y;
                    positions[idx + 2] += pd.velocity.z * delta * 50;

                    if (pd.life >= pd.maxLife) {
                        pd.life = 0;
                        // Reset vị trí hạt về thiên thạch với độ lệch ngẫu nhiên
                        const lerpZ = Math.random() * distTraveled;
                        const radius = diameter * 0.45;
                        const angle = Math.random() * Math.PI * 2;
                        const offX = Math.cos(angle) * Math.random() * radius;
                        const offY = Math.sin(angle) * Math.random() * radius;

                        positions[idx] = a.position.x + offX;
                        positions[idx + 1] = a.position.y + offY;
                        positions[idx + 2] = a.position.z - lerpZ;

                        pd.velocity.x = (Math.random() - 0.5) * (diameter * 0.1);
                        pd.velocity.y = (Math.random() - 0.5) * (diameter * 0.1);
                    }

                    const ratio = pd.life / pd.maxLife;
                    const invRatio = 1 - ratio;
                    const fade = invRatio * invRatio;

                    // Hiệu ứng hình nón thu hẹp dần về cuối đuôi
                    const coneFactor = (1 - ratio);
                    positions[idx] = THREE.MathUtils.lerp(positions[idx], a.position.x, 0.05);
                    positions[idx + 1] = THREE.MathUtils.lerp(positions[idx + 1], a.position.y, 0.05);

                    colors[idx] = 1.0 * fade;
                    colors[idx + 1] = (1.0 - ratio) * fade;
                    colors[idx + 2] = (0.5 - ratio) * fade;
                }

                trailGeometry.attributes.position.needsUpdate = true;
                trailGeometry.attributes.color.needsUpdate = true;
            }

            if (a.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z || a.userData.markedForDeletion) {
                if (a.userData.trail) this.scene.remove(a.userData.trail);
                this.scene.remove(a);
                this.asteroids.splice(i, 1);
            }
        }
    }
}