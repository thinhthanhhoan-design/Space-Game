import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Crosshair {
    constructor(scene) {
        this.scene = scene;
        
        this.geometry = new THREE.RingGeometry(0.8, 1.2, 32);
        this.material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.9,
            depthTest: false 
        });
        
        this.meshes = [];
        // Tạo sẵn tối đa 3 tâm ngắm cho súng 3 nòng
        for (let i = 0; i < 3; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material);
            mesh.visible = false;
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }

        this.lockedTargets = []; // Mảng chứa các mục tiêu bị khóa tương ứng với từng nòng

        // Khởi tạo hệ thống Raycaster vô hình
        this.raycaster = new THREE.Raycaster();
    }

    update(playerPos, currentGun, enemies = []) {
        if (!playerPos) return;

        // Reset trạng thái
        this.lockedTargets = [];
        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].visible = false;
        }

        // Lấy cấu hình súng hiện tại để tính số tia (Ray)
        const gunConfig = CONFIG.PLAYER.WEAPONS[currentGun] || CONFIG.PLAYER.WEAPONS['GUN_1'];
        const bulletCount = gunConfig.bullet_count || 1;

        // Chỉ xét quái nằm trước mặt người chơi
        const validEnemies = enemies.filter(e => e.mesh && !e.isDead && e.mesh.position.z < playerPos.z);

        // Hướng bắn luôn là đi thẳng về phía trước (trục -Z)
        const direction = new THREE.Vector3(0, 0, -1);

        // Phóng tia ray tương ứng với số nòng súng
        for (let i = 0; i < bulletCount; i++) {
            const origin = playerPos.clone();
            
            // Tính toán khoảng cách hai bên của từng nòng súng
            if (currentGun === 'GUN_2') {
                const offset = (i - (bulletCount - 1) / 2) * (gunConfig.parallel_offset || 2.0); 
                origin.x += offset;
            } else if (currentGun === 'GUN_3') {
                const offset = (i - (bulletCount - 1) / 2) * (gunConfig.parallel_offset || 2.8); 
                origin.x += offset;
            }

            this.raycaster.set(origin, direction);
            
            let closestDist = Infinity;
            let lockedEnemy = null;

            // Quét tìm mục tiêu cho tia số i
            for (const enemy of validEnemies) {
                // Tạo một hình cầu đại diện cho quái vật (tương đương với Hitbox)
                const sphere = new THREE.Sphere(enemy.mesh.position, 3.5); // Bán kính hitbox ~ 3.5
                const ray = this.raycaster.ray;
                
                // Kiểm tra xem tia Ray có cắt qua Hitbox hình cầu của quái không
                const intersectionPoint = new THREE.Vector3();
                if (ray.intersectSphere(sphere, intersectionPoint)) {
                    const dist = origin.distanceTo(intersectionPoint);
                    if (dist < closestDist) {
                        closestDist = dist;
                        lockedEnemy = enemy;
                    }
                }
            }

            // Ghi nhận mục tiêu của tia này
            this.lockedTargets[i] = lockedEnemy;

            // Cập nhật hiển thị tâm ngắm số i
            if (lockedEnemy && this.meshes[i]) {
                this.meshes[i].visible = true; 
                this.meshes[i].position.x = lockedEnemy.mesh.position.x;
                this.meshes[i].position.y = lockedEnemy.mesh.position.y;
                this.meshes[i].position.z = lockedEnemy.mesh.position.z + 2; 
                this.meshes[i].rotation.z += 0.05; 
            }
        }
    }
}
