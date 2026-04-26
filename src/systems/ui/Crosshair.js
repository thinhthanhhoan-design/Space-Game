import * as THREE from 'three';
import { MathUtils } from '../../utils/Math.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Crosshair {
    constructor(scene) {
        this.scene = scene;
        
        // Tạo một nhóm để chứa các tâm ngắm (Crosshairs)
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.indicators = [];
        this.maxIndicators = 3; // Hỗ trợ tối đa 3 tia đạn (cho Súng 2 và Súng 3)

        const geometry = new THREE.RingGeometry(0.8, 1.2, 32);
        const materialTemplate = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.8,
            depthTest: false 
        });

        for (let i = 0; i < this.maxIndicators; i++) {
            const mesh = new THREE.Mesh(geometry, materialTemplate.clone());
            mesh.visible = false;
            mesh.renderOrder = 999; // Đảm bảo hiện lên trên cùng
            this.group.add(mesh);
            this.indicators.push(mesh);
        }

        // Raycaster để kiểm tra va chạm với mesh (dùng cho Boss hoặc quái có hitbox phức tạp)
        this.raycaster = new THREE.Raycaster();
    }

    /**
     * Cập nhật hệ thống dự đoán tâm ngắm dựa trên loại súng hiện tại.
     * @param {THREE.Vector3} playerPos - Vị trí người chơi.
     * @param {string} gunType - Loại súng ('GUN_1', 'GUN_2', 'GUN_3').
     * @param {Array} enemies - Danh sách quái vật.
     */
    update(playerPos, gunType, enemies = []) {
        if (!playerPos) return;

        // Ẩn tất cả tâm ngắm trước khi tính toán lại
        this.indicators.forEach(ind => ind.visible = false);

        const weaponConfig = CONFIG.PLAYER.WEAPONS[gunType];
        if (!weaponConfig) return;

        const bulletCount = weaponConfig.bullet_count || 1;
        const weaponRays = [];

        // 1. Xác định các tia (Rays) cần dự đoán dựa trên loại súng
        for (let i = 0; i < bulletCount; i++) {
            const rayOrigin = playerPos.clone();
            const rayDir = new THREE.Vector3(0, 0, -1); // Mặc định bắn thẳng

            if (gunType === 'GUN_2') {
                const angleOffset = weaponConfig.spread_angle || 15;
                const angle = THREE.MathUtils.degToRad((i - 1) * angleOffset);
                rayDir.set(-Math.sin(angle), 0, -Math.cos(angle)).normalize();
            } else if (gunType === 'GUN_3') {
                const offset = (i - 1) * (weaponConfig.parallel_offset || 2.8);
                rayOrigin.x += offset;
            }

            weaponRays.push({ origin: rayOrigin, dir: rayDir, indicatorIdx: i });
        }

        // 2. Với mỗi tia, tìm quái vật gần nhất nằm trên đường đạn
        weaponRays.forEach(rayInfo => {
            let bestTarget = null;
            let minDistToPlayer = Infinity;

            enemies.forEach(enemy => {
                if (!enemy.mesh || enemy.isDead) return;
                
                // Chỉ xét quái ở phía trước
                if (enemy.mesh.position.z > playerPos.z) return;

                const isBoss = enemy.type && enemy.type.startsWith('BOSS');
                let isHit = false;

                if (isBoss) {
                    // Chỉ hiển thị tâm ngắm dự đoán cho Boss
                    const bossBox = new THREE.Box3().setFromObject(enemy.mesh);
                    const ray = new THREE.Ray(rayInfo.origin, rayInfo.dir);
                    if (ray.intersectsBox(bossBox)) {
                        isHit = true;
                    }
                }

                if (isHit) {
                    const distToPlayer = enemy.mesh.position.distanceTo(playerPos);
                    if (distToPlayer < minDistToPlayer) {
                        minDistToPlayer = distToPlayer;
                        bestTarget = enemy;
                    }
                }
            });

            // 3. Nếu tìm thấy mục tiêu, hiển thị tâm ngắm tại đó
            if (bestTarget && rayInfo.indicatorIdx < this.indicators.length) {
                const indicator = this.indicators[rayInfo.indicatorIdx];
                indicator.visible = true;
                
                // Vị trí tâm ngắm bám theo quái
                indicator.position.copy(bestTarget.mesh.position);
                indicator.position.z += 2;
                indicator.rotation.z += 0.05;

                // Đổi màu tâm ngắm theo loại súng
                if (gunType === 'GUN_2') indicator.material.color.setHex(0x00ff00); // Xanh lá
                else if (gunType === 'GUN_3') indicator.material.color.setHex(0xff4500); // Cam đỏ
                else indicator.material.color.setHex(0xff0000); // Đỏ
            }
        });
    }
}
