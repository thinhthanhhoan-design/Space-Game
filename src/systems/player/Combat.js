import * as THREE from 'three';
import { MathUtils } from '../../utils/Math.js';

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
    update(player, enemies = [], asteroids = []) {
        if (!player.mesh) return;

        const playerPos = player.mesh.position;

        // 1. Va chạm Người chơi vs quái
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy.mesh && !enemy.isDead && !enemy.userData?.markedForDeletion) {
                if (MathUtils.checkSphereCollisionSq(playerPos, enemy.mesh.position, this.playerHitboxRadiusSq, this.enemyHitboxRadiusSq)) {
                    console.log("⚠️ Player đâm trúng tàu địch!");
                    player.takeDamage(enemy.damage || 15);
                    enemy.die(); // Gọi hàm die() của Enemy class
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
                    console.log("⚠️ Player đâm trúng thiên thạch!");
                    player.takeDamage(userData.damage || 10);
                    userData.markedForDeletion = true;
                    astMesh.position.z = 100; // Đẩy thiên thạch ra xa chờ hủy
                }
            }
        }

        // 3. Đạn của Player trúng mục tiêu (Kích hoạt khi player có weapon và fire)
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
                        if (MathUtils.checkSphereCollisionSq(bulletPos, enemy.mesh.position, this.bulletHitboxRadiusSq, this.enemyHitboxRadiusSq)) {
                            console.log(`💥 Đạn bắn trúng Enemy, gây ${bullet.userData.damage} DMG!`);
                            if (typeof enemy.takeDamage === 'function') {
                                enemy.takeDamage(bullet.userData.damage);
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
                            console.log("💥 Đạn đập trúng thiên thạch!");
                            userData.markedForDeletion = true;
                            astMesh.position.z = 100; // Xóa thiên thạch
                            bullet.userData.markedForDeletion = true;
                            break;
                        }
                    }
                }
            }
        }
    }


}
