import * as THREE from 'three'; 
import { CONFIG } from '../../utils/CONFIG.JS'; 
import { assetLoader } from '../../utils/AssetLoader.js';

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

        this.scene.add(asteroid); 
        this.asteroids.push(asteroid); 
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

            if (asteroid.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(asteroid); 
                this.asteroids.splice(i, 1); 
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
}
