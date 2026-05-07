import * as THREE from 'three';
import { MathUtils } from '../../utils/Math.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Combat {
    constructor() {
        // Khai báo bán kính Hitbox trực tiếp thay vì bình phương
        this.playerRadius = 1.0;
        this.enemyRadius = 1.22;
        this.asteroidRadius = 1.41;
        this.bulletRadius = 3.46;
        
        // Bình phương bán kính để dùng cho các hàm Sq
        this.playerHitboxRadiusSq = this.playerRadius * this.playerRadius;
        this.bulletHitboxRadiusSq = this.bulletRadius * this.bulletRadius;
        this.asteroidHitboxRadiusSq = this.asteroidRadius * this.asteroidRadius;
        this.itemBulletRadius = 5.0; // Bán kính ưu tiên khi đạn bắn trúng vật phẩm
    }

    update(player, enemies = [], asteroids = [], explosionSystem = null, particleSystem = null, sceneController = null, musicSystem = null, addScore = null) {
        if (!player.mesh) return;

        const playerPos = player.mesh.position;

        // 1. Xử lý va chạm: Người chơi vs Kẻ địch
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy.mesh && !enemy.isDead && !enemy.userData?.markedForDeletion) {
                const isBoss = enemy.type && enemy.type.startsWith('BOSS');
                let isCrash = false;

                if (isBoss) {
                    const bossBox = new THREE.Box3().setFromObject(enemy.mesh);
                    if (bossBox.containsPoint(playerPos)) isCrash = true;
                } else {
                    // TỐI ƯU HÓA: Sử dụng collisionSphere để tránh gọi Math.sqrt()
                    // 1.5 ở đây là bán kính thực của Enemy (trước đó dùng 2.25 là bình phương)
                    if (MathUtils.collisionSphere(playerPos, this.playerRadius, enemy.mesh.position, 1.5)) {
                        isCrash = true;
                    }
                }

                if (isCrash) {
                    if (!player.hasShield) {
                        player.takeDamage(enemy.damage || 15);
                        if (musicSystem) musicSystem.playSound('HIEU_UNG_TAU_TRUNG_DON');
                        if (explosionSystem) explosionSystem.startWarning(0.4);
                        if (sceneController) sceneController.triggerShake(0.4, 0.2);
                    }
                    if (explosionSystem) explosionSystem.spawnShipImpact(playerPos);
                    const pts = CONFIG.ENEMIES[enemy.type]?.POINTS || CONFIG.SCORING.ENEMY_DEFAULT;
                    if (addScore) addScore(pts);
                    enemy.die();
                }
            }
        }

        // 2. Xử lý va chạm: Người chơi vs Thiên thạch
        for (let i = 0; i < asteroids.length; i++) {
            const ast = asteroids[i];
            if (ast && !ast.userData?.markedForDeletion) {
                if (MathUtils.collisionSphere(playerPos, this.playerRadius, ast.position, this.asteroidRadius)) {
                    if (!player.hasShield) {
                        player.takeDamage(ast.userData?.damage || 10);
                        if (musicSystem) musicSystem.playSound('HIEU_UNG_TAU_TRUNG_DON');
                        if (explosionSystem) explosionSystem.startWarning(0.4);
                        if (sceneController) sceneController.triggerShake(0.4, 0.2);
                    }
                    if (explosionSystem) explosionSystem.spawnAsteroidImpact(ast.position);
                    if (musicSystem) musicSystem.playSound('HIEU_UNG_QUAI_THIEN_THACH_NO');
                    if (addScore && CONFIG.SCORING.ASTEROID > 0) addScore(CONFIG.SCORING.ASTEROID);
                    ast.userData.markedForDeletion = true;
                    ast.position.z = 100;
                }
            }
        }

        // 3. Xử lý va chạm: Đạn của người chơi
        if (player.weapon && player.weapon.bullets) {
            const bullets = player.weapon.bullets;
            for (let i = 0; i < bullets.length; i++) {
                const bullet = bullets[i];
                if (!bullet || bullet.userData.markedForDeletion) continue;

                let hit = false;
                const bulletPos = bullet.position;

                // 3.1 Đạn trúng Kẻ địch
                for (let j = 0; j < enemies.length; j++) {
                    const enemy = enemies[j];
                    if (enemy.mesh && !enemy.isDead && !enemy.userData?.markedForDeletion) {
                        const isBoss = enemy.type && enemy.type.startsWith('BOSS');
                        let isHit = false;

                        if (isBoss) {
                            const bossBox = new THREE.Box3().setFromObject(enemy.mesh);
                            if (bossBox.containsPoint(bulletPos)) isHit = true;
                        } else {
                            if (MathUtils.collisionSphere(bulletPos, this.bulletRadius, enemy.mesh.position, 1.5)) {
                                isHit = true;
                            }
                        }

                        if (isHit) {
                            if (explosionSystem) {
                                explosionSystem.spawnHitFlash(bulletPos, 1.2);
                                explosionSystem.spawnShipImpact(bulletPos);
                            }
                            if (typeof enemy.takeDamage === 'function') {
                                const oldHP = enemy.hp;
                                enemy.takeDamage(bullet.userData.damage);
                                if (enemy.hp <= 0 && oldHP > 0) {
                                    const pts = CONFIG.ENEMIES[enemy.type]?.POINTS || CONFIG.SCORING.ENEMY_DEFAULT;
                                    if (addScore) addScore(pts);
                                }
                            } else {
                                const pts = CONFIG.ENEMIES[enemy.type]?.POINTS || CONFIG.SCORING.ENEMY_DEFAULT;
                                if (addScore) addScore(pts);
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
                    if (ast && !ast.userData?.markedForDeletion) {
                        if (MathUtils.checkSphereCollisionSq(bulletPos, ast.position, this.bulletHitboxRadiusSq, this.asteroidHitboxRadiusSq)) {
                            if (explosionSystem) explosionSystem.spawnAsteroidImpact(ast.position);
                            if (musicSystem) musicSystem.playSound('HIEU_UNG_QUAI_THIEN_THACH_NO');
                            if (addScore && CONFIG.SCORING.ASTEROID > 0) addScore(CONFIG.SCORING.ASTEROID);
                            
                            const dropChance = 0.2;
                            if (player.itemSystem && Math.random() < dropChance) {
                                const type = Math.random() > 0.5 ? 'HEALTH' : 'AMMO';
                                player.itemSystem.spawnItem(type, ast.position.clone());
                            }

                            ast.userData.markedForDeletion = true;
                            ast.position.z = 100;
                            bullet.userData.markedForDeletion = true;
                            hit = true;
                            break;
                        }
                    }
                }

                if (hit) continue;

                // 3.3 Đạn trúng Vật phẩm
                if (player.itemSystem && player.itemSystem.activeItems) {
                    const items = player.itemSystem.activeItems;
                    for (let l = 0; l < items.length; l++) {
                        const item = items[l];
                        if (item.userData.isCollected) continue;

                        // TỐI ƯU HÓA: Sử dụng collisionSphere với bán kính lớn hơn (itemBulletRadius) 
                        // để đạn dễ dàng kích hoạt vật phẩm hơn
                        if (MathUtils.collisionSphere(bulletPos, this.bulletRadius, item.position, this.itemBulletRadius)) {
                            item.userData.isCollected = true;
                            const isBuff = ['HEALTH', 'AMMO', 'SHIELD', 'WEAPON_2', 'WEAPON_3'].includes(item.userData.type);

                            if (player.itemSystem.triggerCollisionEffect) {
                                player.itemSystem.triggerCollisionEffect(item, isBuff ? 'Buff' : 'Debuff');
                            }

                            if (item.children) {
                                item.children.forEach(child => { if (child.material) child.material.opacity = 0; });
                            }

                            if (particleSystem) {
                                const color = isBuff ? 0x00ff00 : 0xff2200;
                                particleSystem.explodeAt(item.position, color);
                            }

                            player.itemSystem.collectItem(item.userData.type);
                            
                            setTimeout(() => {
                                if (item.parent) {
                                    player.itemSystem.scene.remove(item);
                                    const idx = player.itemSystem.activeItems.indexOf(item);
                                    if (idx > -1) player.itemSystem.activeItems.splice(idx, 1);
                                }
                            }, 1200);

                            bullet.userData.markedForDeletion = true;
                            hit = true;
                            break;
                        }
                    }
                }
            }
        }

        // 4. Xử lý va chạm: Người chơi vs Vật phẩm (Nhặt đồ trực tiếp)
        if (player.itemSystem && player.itemSystem.activeItems) {
            const items = player.itemSystem.activeItems;
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                if (item.userData.isCollected) continue;

                const baseRadius = CONFIG.ITEMS?.COLLECTION_RADIUS || 5;
                const dynamicRadius = (item.scale.x * 1.2) + baseRadius;
                const dynamicRadiusSq = dynamicRadius * dynamicRadius;

                if (MathUtils.checkSphereCollisionSq(playerPos, item.position, this.playerHitboxRadiusSq, dynamicRadiusSq)) {
                    item.userData.isCollected = true;
                    const isBuff = ['HEALTH', 'AMMO', 'SHIELD', 'WEAPON_2', 'WEAPON_3'].includes(item.userData.type);

                    if (player.itemSystem.triggerCollisionEffect) {
                        player.itemSystem.triggerCollisionEffect(item, isBuff ? 'Buff' : 'Debuff');
                    }

                    if (item.children) {
                        item.children.forEach(child => { if (child.material) child.material.opacity = 0; });
                    }

                    if (particleSystem) {
                        const color = isBuff ? 0x00ff00 : 0xff2200;
                        particleSystem.explodeAt(item.position, color);
                    }

                    player.itemSystem.collectItem(item.userData.type);

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
