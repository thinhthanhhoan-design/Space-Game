import * as THREE from 'three'; 
import { CONFIG } from '../../utils/CONFIG.JS'; 
import { assetLoader } from '../../utils/AssetLoader.js';
import gsap from 'gsap';

export class AsteroidSystem { 
    constructor(scene) { 
        this.scene = scene; 
        this.asteroids = []; 
        
        this.fallbackGeometry = new THREE.IcosahedronGeometry(1, 0); 
        this.fallbackMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x888888, 
            flatShading: true, 
            shininess: 0 
        });

        this.spawnTimer = 0; 
        this.speedMultiplier = 1.0;
        this.densityMultiplier = 1.0;
        this.currentLevelKey = 'LEVEL_1';
        this.gasBubbles = [];
        this.bubbleTexture = new THREE.TextureLoader().load(
            CONFIG.ASSETS.TEXTURES.BUBBLE,
            undefined,
            undefined,
            () => {}
        );
        this.updateConfig();
    }

    setLevel(levelKey) {
        if (CONFIG.WORLD[levelKey]) {
            this.currentLevelKey = levelKey;
            this.updateConfig();
        }
    }

    updateConfig() {
        this.levelConfig = CONFIG.WORLD[this.currentLevelKey] || CONFIG.WORLD.LEVEL_1;
        this.baseDensity = this.levelConfig.asteroid_density || 10;
        this.baseSpeed = this.levelConfig.asteroid_speed || 0.015;
        this.baseDamage = this.levelConfig.asteroid_damage || 50;
    }

    spawn() {
        // Sử dụng AssetLoader để lấy bản sao (clone) từ cache ngầm
        const cachedModel = assetLoader.cloneModel('asteroid');
        let asteroid;
        
        if (cachedModel) { 
            asteroid = cachedModel; 
        } else { 
            asteroid = new THREE.Mesh(this.fallbackGeometry, this.fallbackMaterial);
        }
        
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        
        asteroid.position.x = (Math.random() - 0.5) * envX * 3;
        asteroid.position.y = (Math.random() - 0.5) * envY * 3;
        asteroid.position.z = CONFIG.WORLD.SPAWN_DISTANCE_Z;

        const scale = 1.5 + Math.random() * 3.0;
        asteroid.scale.set(scale, scale, scale);
        
        asteroid.rotation.x = Math.random() * Math.PI;
        asteroid.rotation.y = Math.random() * Math.PI;
        
        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        };
        asteroid.userData.damage = this.baseDamage;
        asteroid.userData.levelKey = this.currentLevelKey;
        asteroid.userData.bubbleTimer = 0;

        this.applyLevelVisuals(asteroid);

        this.scene.add(asteroid); 
        this.asteroids.push(asteroid); 
    }

    applyLevelVisuals(asteroid) {
        asteroid.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            node.material = node.material.clone();
            node.material.transparent = false;
        });

        if (this.currentLevelKey === 'LEVEL_1') {
            this.applyLevel1FireLook(asteroid);
        } else if (this.currentLevelKey === 'LEVEL_2') {
            this.applyLevel2ToxicLook(asteroid);
        }
    }

    applyLevel1FireLook(asteroid) {
        asteroid.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            node.material.color.setHex(0x2a1a16);
            node.material.emissive = new THREE.Color(0xff3d00);
            node.material.emissiveIntensity = 0.9;
            node.material.roughness = 0.85;
            node.material.metalness = 0.1;
        });

        const emberCount = 14;
        const emberGeo = new THREE.BufferGeometry();
        const emberPos = [];
        for (let i = 0; i < emberCount; i++) {
            emberPos.push(
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 2.2
            );
        }
        emberGeo.setAttribute('position', new THREE.Float32BufferAttribute(emberPos, 3));
        const emberMat = new THREE.PointsMaterial({
            color: 0xff5e00,
            size: 0.18,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const emberPoints = new THREE.Points(emberGeo, emberMat);
        asteroid.add(emberPoints);

        gsap.to(emberMat, {
            opacity: 0.25,
            duration: 0.25 + Math.random() * 0.35,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    applyLevel2ToxicLook(asteroid) {
        asteroid.traverse((node) => {
            if (!node.isMesh || !node.material) return;
            node.material.color.setHex(0x1a4d1f);
            node.material.emissive = new THREE.Color(0x00ff7f);
            node.material.emissiveIntensity = 0.45;
            node.material.roughness = 0.7;
            node.material.metalness = 0.05;
        });

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.38, 10, 10),
            new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.75
            })
        );
        asteroid.add(core);
        gsap.to(core.material, {
            opacity: 0.2,
            duration: 0.45,
            repeat: -1,
            yoyo: true
        });
    }

    spawnGasBubble(asteroid) {
        const bubble = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.bubbleTexture,
                color: 0x66ff99,
                transparent: true,
                opacity: 0.8,
                depthWrite: false
            })
        );
        bubble.position.copy(asteroid.position);
        bubble.position.x += (Math.random() - 0.5) * asteroid.scale.x;
        bubble.position.y += (Math.random() - 0.5) * asteroid.scale.y;
        bubble.scale.setScalar(1 + Math.random() * 1.2);

        bubble.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            0.6 + Math.random() * 0.8,
            15 + Math.random() * 12
        );
        bubble.userData.life = 1.6;
        bubble.userData.damage = this.levelConfig.bubble_dmg || 5;

        this.scene.add(bubble);
        this.gasBubbles.push(bubble);
    }

    update(delta) { 
        this.spawnTimer += delta; 
        
        const density = this.baseDensity * this.densityMultiplier; 
        const spawnInterval = 1 / density; 
        
        if (this.spawnTimer > spawnInterval) { 
            this.spawn(); 
            this.spawnTimer = 0; 
        }

        const speedMultiplier = (this.baseSpeed * 4000) * this.speedMultiplier;
        
        for (let i = this.asteroids.length - 1; i >= 0; i--) { 
            const asteroid = this.asteroids[i];
            asteroid.position.z += delta * speedMultiplier; 
            
            asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
            asteroid.rotation.y += asteroid.userData.rotationSpeed.y;

            if (asteroid.userData.levelKey === 'LEVEL_2') {
                asteroid.userData.bubbleTimer += delta;
                if (asteroid.userData.bubbleTimer >= 0.65) {
                    this.spawnGasBubble(asteroid);
                    asteroid.userData.bubbleTimer = 0;
                }
            }

            if (asteroid.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(asteroid); 
                this.asteroids.splice(i, 1); 
            }
        }

        for (let i = this.gasBubbles.length - 1; i >= 0; i--) {
            const bubble = this.gasBubbles[i];
            bubble.userData.life -= delta;
            bubble.position.addScaledVector(bubble.userData.velocity, delta);
            bubble.material.opacity = Math.max(0, bubble.userData.life / 1.6);

            if (bubble.userData.life <= 0 || bubble.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(bubble);
                this.gasBubbles.splice(i, 1);
            }
        }
    } 

    checkCollisions(playerMesh, onCollide) { 
        if (!playerMesh || this.asteroids.length === 0) return; 

        const playerPos = playerMesh.position; 
        const playerRadius = 0.3; 

        this.asteroids.forEach(asteroid => { 
            const dist = playerPos.distanceTo(asteroid.position); 
            const asteroidRadius = asteroid.scale.x * 0.6; 

            if (dist < (playerRadius + asteroidRadius)) {
                onCollide(asteroid); 
                asteroid.position.z = 100; 
            }
        }); 
    } 

    checkBubbleCollisions(playerMesh, onBubbleHit) {
        if (!playerMesh || this.gasBubbles.length === 0) return;

        const playerRadius = 0.7;
        for (let i = this.gasBubbles.length - 1; i >= 0; i--) {
            const bubble = this.gasBubbles[i];
            const hitDist = playerMesh.position.distanceTo(bubble.position);
            const bubbleRadius = Math.max(0.6, bubble.scale.x * 0.55);
            if (hitDist <= playerRadius + bubbleRadius) {
                onBubbleHit?.(bubble.userData.damage || 5, bubble.position);
                this.scene.remove(bubble);
                this.gasBubbles.splice(i, 1);
            }
        }
    }
}
