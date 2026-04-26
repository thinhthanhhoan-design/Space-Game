import * as THREE from 'three';
import { MathUtils } from '../../utils/Math.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Combat {
    constructor() {
        // Tối ưu hiệu suất: Bounding Sphere/Radius thay cho Box3 setFromObject.
        this.playerHitboxRadiusSq = 1.0;
        this.enemyHitboxRadiusSq = 1.5;
        this.asteroidHitboxRadiusSq = 2.0;

        // Tính toán va chạm và trúng mục tiêu
        this.bulletHitboxRadiusSq = 12.0;
    }

    /**
     * Cập nhật logic va chạm tổng thể.
     */
    update(player, enemies = [], asteroids = [], explosionSystem = null, particleSystem = null, sceneController = null) {
        if (!player.mesh) return;

        const playerPos = player.mesh.position;

        // 1. Va chạm Người chơi vs quái
        // ... (existing code for enemies)
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy.mesh && !enemy.isDead && !enemy.userData?.markedForDeletion) {
                const isBoss = enemy.type && enemy.type.startsWith('BOSS');

                let isCrash = false;
                if (isBoss) {
                    const bossBox = new THREE.Box3().setFromObject(enemy.mesh);
                    if (bossBox.containsPoint(playerPos)) {
                        isCrash = true;
                    }
                } else {
                    if (MathUtils.checkSphereCollisionSq(playerPos, enemy.mesh.position, this.playerHitboxRadiusSq, 1.5 * 1.5)) {
                        isCrash = true;
                    }
                }

                if (isCrash) {
                    console.log("⚠️ Player va chạm tàu địch!");

                    // Kiểm tra giáp bảo vệ
                    if (player.hasShield) {
                        console.log("🛡️ Shield đã chặn sát thương!");
                    } else {
                        player.takeDamage(enemy.damage || 15);
                        if (explosionSystem) explosionSystem.startWarning(0.4);
                        if (sceneController) sceneController.triggerShake(0.4, 0.2);
                    }

                    if (explosionSystem) explosionSystem.spawnShipImpact(playerPos);
                    enemy.die();
                }
            }
        }

        // 2. Va chạm Người chơi vs Thiên thạch
        for (let i = 0; i < asteroids.length; i++) {
            const ast = asteroids[i];
            const astMesh = ast.isMesh ? ast : ast.mesh;
            const userData = astMesh.userData || {};

            if (astMesh && !userData.markedForDeletion) {
                if (MathUtils.checkSphereCollisionSq(playerPos, astMesh.position, this.playerHitboxRadiusSq, this.asteroidHitboxRadiusSq)) {
                    console.log("⚠️ Player va chạm thiên thạch!");

                    // Kiểm tra giáp bảo vệ
                    if (player.hasShield) {
                        console.log("🛡️ Shield đã chặn sát thương từ thiên thạch!");
                    } else {
                        player.takeDamage(userData.damage || 10);
                        if (explosionSystem) explosionSystem.startWarning(0.4);
                        if (sceneController) sceneController.triggerShake(0.4, 0.2);
                    }

                    if (explosionSystem) explosionSystem.spawnAsteroidImpact(astMesh.position);
                    userData.markedForDeletion = true;
                    astMesh.position.z = 100;
                }
            }
        }

        // 3. Đạn của Player trúng mục tiêu
        if (player.weapon) {
            const bullets = player.weapon.bullets;
            for (let i = 0; i < bullets.length; i++) {
                const bullet = bullets[i];
                if (bullet.userData.markedForDeletion) continue;

                let hit = false;
                const bulletPos = bullet.position;

                // 3.1 Đạn trúng Quái
                for (let j = 0; j < enemies.length; j++) {
                    const enemy = enemies[j];
                    if (enemy.mesh && !enemy.isDead && !enemy.userData?.markedForDeletion) {
                        // Xác định xem có phải Boss không
                        const isBoss = enemy.type && enemy.type.startsWith('BOSS');

                        let isHit = false;
                        if (isBoss) {
                            // Dùng Box3 (Bounding Box) thực tế để bao quát toàn bộ khối lượng của Boss
                            // Việc này giải quyết triệt để lỗi tâm mô hình (Origin) bị lệch trong file GLB
                            const bossBox = new THREE.Box3().setFromObject(enemy.mesh);
                            if (bossBox.containsPoint(bulletPos)) {
                                isHit = true;
                            }
                        } else {
                            // Quái thường vẫn dùng SphereCollision để tối ưu hiệu suất
                            if (MathUtils.checkSphereCollisionSq(bulletPos, enemy.mesh.position, this.bulletHitboxRadiusSq, 1.5 * 1.5)) {
                                isHit = true;
                            }
                        }

                        if (isHit) {
                            console.log(`💥 Bắn trúng! Kẻ địch: ${enemy.type}, Máu trước: ${enemy.hp}`);
                            if (explosionSystem) {
                                explosionSystem.spawnHitFlash(bulletPos, 1.2);
                                explosionSystem.spawnShipImpact(bulletPos); // Nổ ngay tại điểm đạn chạm vào Boss
                            }

                            if (typeof enemy.takeDamage === 'function') {
                                enemy.takeDamage(bullet.userData.damage);
                                console.log(`🩸 Đã trừ máu. Máu sau: ${enemy.hp}`);
                            } else {
                                enemy.die();
                            }

                            bullet.userData.markedForDeletion = true;
                            hit = true;
                            break;
                        }
                    }
                }

                if (hit) continue;

                // 3.2 Đạn trúng Thiên thạch
                for (let k = 0; k < asteroids.length; k++) {
                    const ast = asteroids[k];
                    const astMesh = ast.isMesh ? ast : ast.mesh;
                    const userData = astMesh.userData || {};

                    if (astMesh && !userData.markedForDeletion) {
                        if (MathUtils.checkSphereCollisionSq(bulletPos, astMesh.position, this.bulletHitboxRadiusSq, this.asteroidHitboxRadiusSq)) {
                            if (explosionSystem) explosionSystem.spawnAsteroidImpact(astMesh.position);

                            // Rơi đồ từ thiên thạch
                            const astDropChance = CONFIG.ITEMS.TYPES.ASTEROID_ITEM ? (CONFIG.ITEMS.DROP_CHANCE?.ASTEROID || 0.2) : 0.2;
                            if (player.itemSystem && Math.random() < astDropChance) {
                                const type = Math.random() > 0.5 ? 'HEALTH' : 'AMMO';
                                player.itemSystem.spawnItem(type, astMesh.position.clone());
                            }

                            userData.markedForDeletion = true;
                            astMesh.position.z = 100;
                            bullet.userData.markedForDeletion = true;
                            hit = true;
                            break;
                        }
                    }
                }

                if (hit) continue;

                // 3.3 Đạn trúng Item (Làm vỡ và làm mất vật phẩm nếu bị bắn trúng)
                if (player.itemSystem && player.itemSystem.activeItems) {
                    const items = player.itemSystem.activeItems;
                    for (let l = items.length - 1; l >= 0; l--) {
                        const item = items[l];
                        if (item.userData.collected) continue;

                        if (MathUtils.checkSphereCollisionSq(bulletPos, item.position, this.bulletHitboxRadiusSq, 4.0)) {
                            // Tạo hiệu ứng vỡ vụn nhưng KHÔNG thu thập (không hồi máu/đạn)
                            if (particleSystem) {
                                particleSystem.explodeAt(item.position, 0x888888); // Màu xám vỡ vụn
                            }
                            
                            // Xóa vật phẩm ngay lập tức khỏi màn hình
                            item.userData.collected = true; // Đánh dấu để không bị tàu nhặt nữa
                            if (item.parent) player.itemSystem.scene.remove(item);
                            items.splice(l, 1);
                            
                            // Phá hủy đạn
                            bullet.userData.markedForDeletion = true;
                            hit = true;
                            break;
                        }
                    }
                }

                // 4. Va chạm Người chơi vs Vật phẩm (Items)
                if (player.itemSystem && player.itemSystem.activeItems) {
                    const items = player.itemSystem.activeItems;
                    const itemColors = CONFIG.ITEMS.COLORS || { BUFF: 0x00ff00, DEBUFF: 0xff2200 };

                    for (let i = items.length - 1; i >= 0; i--) {
                        const item = items[i];
                        if (item.userData.collected) continue;

                        // Tăng mạnh phạm vi nhặt đồ: Dựa trên tỷ lệ scale hiện tại của item
                        // Nếu item to (scale ~9), vùng nhặt sẽ cực rộng. 
                        const baseRadius = CONFIG.ITEMS.COLLECTION_RADIUS || 5;
                        const dynamicRadius = (item.scale.x * 1.2) + baseRadius;
                        const dynamicRadiusSq = dynamicRadius * dynamicRadius;

                        if (MathUtils.checkSphereCollisionSq(playerPos, item.position, this.playerHitboxRadiusSq, dynamicRadiusSq)) {
                            item.userData.collected = true;
                            const itemType = item.userData.type;
                            const isBuff = ['HEALTH', 'AMMO', 'SHIELD'].includes(itemType);

                            // --- VISUAL SEQUENCE ---
                            if (player.itemSystem.triggerCollisionEffect) {
                                player.itemSystem.triggerCollisionEffect(item, isBuff ? 'Buff' : 'Debuff');
                            }

                            // Bước 2: Ẩn Sprite ngay lập tức
                            if (item.children) {
                                item.children.forEach(child => {
                                    if (child.material) child.material.opacity = 0;
                                });
                            }

                            // Bước 3: Tạo vụ nổ hạt
                            if (particleSystem) {
                                const explodeColor = isBuff ? itemColors.BUFF : itemColors.DEBUFF;
                                particleSystem.explodeAt(item.position, explodeColor);
                            }

                            // --- LOGIC ACTION ---
                            player.itemSystem.collectItem(itemType);

                            // Xóa item sau khi hiệu ứng hoàn tất
                            setTimeout(() => {
                                if (item.parent) {
                                    player.itemSystem.scene.remove(item);
                                    const idx = player.itemSystem.activeItems.indexOf(item);
                                    if (idx > -1) player.itemSystem.activeItems.splice(idx, 1);
                                }
                            }, 1200);
                        }
                    }
                }
            }
        }
    }
}
