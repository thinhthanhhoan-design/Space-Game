import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class AsteroidSystem {
    constructor(scene) {
        this.scene = scene;
        this.asteroids = [];
        this.loader = new GLTFLoader();
        this.asteroidModel = null;
        
        // Phương án dự phòng: Tạo vật thể hình khối đá nếu không tải được model .glb
        this.fallbackGeometry = new THREE.IcosahedronGeometry(1, 0); // Hình khối góc cạnh
        this.fallbackMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x888888, 
            flatShading: true,
            shininess: 0 
        });

        // Chỉ thử tải model nếu nó không phải là "PROCEDURAL" (để tránh 404 trong Console)
        const assetPath = CONFIG.ASSETS.MODELS.ASTEROID;
        
        if (assetPath !== "PROCEDURAL") {
            this.loader.load(
                assetPath, 
                (glb) => {
                    this.asteroidModel = glb.scene;
                    console.log("Đã tải xong model thiên thạch!");
                },
                undefined,
                (err) => {
                    console.warn("Lỗi khi tải model asteroid.glb. Đang sử dụng fallback.");
                }
            );
        } else {
            console.log("Hệ thống: Đang sử dụng thiên thạch Procedural (Code-generated).");
        }

        this.spawnTimer = 0;
    }

    // Hàm tạo (spawn) một thiên thạch mới
    spawn() {
        let asteroid;
        
        if (this.asteroidModel) {
            asteroid = this.asteroidModel.clone();
        } else {
            // Tạo một 'khối đá' ngẫu nhiên từ geometry Icosahedron
            asteroid = new THREE.Mesh(this.fallbackGeometry, this.fallbackMaterial);
        }
        
        // Random vị trí xuất hiện trong 'Flight Envelope' nhưng ở xa (Z âm)
        // Cho biên spawn rộng hơn envelope một chút để tạo chiều sâu
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        
        asteroid.position.x = (Math.random() - 0.5) * envX * 3;
        asteroid.position.y = (Math.random() - 0.5) * envY * 3;
        asteroid.position.z = CONFIG.WORLD.SPAWN_DISTANCE_Z;

        // Random kích thước và rotations
        const scale = 0.4 + Math.random() * 2.0;
        asteroid.scale.set(scale, scale, scale);
        
        asteroid.rotation.x = Math.random() * Math.PI;
        asteroid.rotation.y = Math.random() * Math.PI;
        
        // Gán vận tốc xoay ngẫu nhiên
        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        };

        this.scene.add(asteroid);
        this.asteroids.push(asteroid);
    }

    update(delta) {
        // 1. Quản lý Spawn
        this.spawnTimer += delta;
        const density = CONFIG.WORLD.LEVEL_1.asteroid_density || 10;
        const spawnInterval = 1 / density;
        
        if (this.spawnTimer > spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // 2. Cập nhật vị trí
        const speedMultiplier = 60; // Tốc độ bay (tăng lên cho cảm giác nhanh hơn)
        
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            asteroid.position.z += delta * speedMultiplier;
            
            asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
            asteroid.rotation.y += asteroid.userData.rotationSpeed.y;

            // Xóa nếu vượt quá khoảng cách Despawn
            if (asteroid.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(asteroid);
                this.asteroids.splice(i, 1);
            }
        }
    }

    checkCollisions(playerMesh, onCollide) {
        if (!playerMesh || this.asteroids.length === 0) return;

        const playerPos = playerMesh.position;
        // Bán kính va chạm thu nhỏ lại cho khớp với model máy bay mới
        const playerRadius = 0.3; 

        this.asteroids.forEach(asteroid => {
            const dist = playerPos.distanceTo(asteroid.position);
            const asteroidRadius = asteroid.scale.x * 0.6;

            if (dist < (playerRadius + asteroidRadius)) {
                onCollide(asteroid);
                // Sau khi va chạm, đẩy thiên thạch đi để tránh loop va chạm
                asteroid.position.z = 100; 
            }
        });
    }
}
