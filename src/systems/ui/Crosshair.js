import * as THREE from 'three';

export class Crosshair {
    constructor(scene) {
        this.scene = scene;
        
        this.geometry = new THREE.RingGeometry(0.8, 1.2, 32);
        this.material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Màu đỏ nổi bật
            transparent: true, 
            opacity: 0.9,
            depthTest: false // Luôn render lên trên cùng để làm UI, không bị che khuất
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.visible = false; // Ẩn mặc định, chỉ hiện khi lock mục tiêu
        
        this.scene.add(this.mesh);
    }

    update(playerPos, enemies = []) {
        if (!playerPos) return;

        let isLocked = false;
        let lockedTarget = null;

        // Quét tìm mục tiêu nằm thẳng phía trước (trên trục Z)
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.mesh || enemy.isDead) continue;
            
            // Chỉ xét quái nằm phía trước máy bay (Z âm hơn)
            if (enemy.mesh.position.z > playerPos.z) continue;

            const dx = enemy.mesh.position.x - playerPos.x;
            const dy = enemy.mesh.position.y - playerPos.y;
            const distSq = dx * dx + dy * dy;

            // Nếu khoảng cách X,Y giữa tia đạn thẳng và quái <= 14.0 (bán kính ~3.7) -> Trùng mục tiêu (Aim Assist)
            if (distSq <= 14.0) {
                isLocked = true;
                lockedTarget = enemy;
                break; // Ưu tiên con quái đầu tiên lọt vào tầm ngắm
            }
        }

        if (isLocked && lockedTarget) {
            this.mesh.visible = true; // Hiện tâm đỏ
            
            // Bám sát vị trí của quái vật bị nhắm trúng
            this.mesh.position.x = lockedTarget.mesh.position.x;
            this.mesh.position.y = lockedTarget.mesh.position.y;
            this.mesh.position.z = lockedTarget.mesh.position.z + 2; // Đẩy lên trước quái một chút để không bị xuyên model
            
            // Tạo hiệu ứng chớp tắt hoặc xoay nhẹ nếu muốn
            this.mesh.rotation.z += 0.05; 
        } else {
            this.mesh.visible = false; // Tắt hoàn toàn khi không nhắm trúng ai
        }
    }
}
