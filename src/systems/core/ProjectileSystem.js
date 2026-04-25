import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

function createBossBulletTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Nền trong suốt
    ctx.clearRect(0, 0, 16, 256);

    // Gradient dọc từ đầu đến đuôi (Kéo dài dải màu để thấy rõ phần đuôi dài)
    const gradient = ctx.createLinearGradient(0, 256, 0, 0); 
    gradient.addColorStop(0.0, 'rgba(255, 255, 200, 1)');   // Lõi trắng vàng rực rỡ (Head)
    gradient.addColorStop(0.1, 'rgba(255, 180, 0, 1)');    // Quầng cam lửa
    gradient.addColorStop(0.3, 'rgba(255, 0, 150, 0.9)');   // Thân hồng rực
    gradient.addColorStop(0.6, 'rgba(100, 0, 200, 0.4)');   // Phần đuôi bắt đầu mờ
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');         // Kết thúc ở 1.0 để dùng hết chiều dài đạn

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 256);

    return new THREE.CanvasTexture(canvas);
}

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];

        // Geometry cho đạn
        // --- TẠO HÌNH GIỌT NƯỚC SIÊU DÀI (LONG TEARDROP) ---
        const pts = [];
        // Phần đầu tròn - Làm thon hơn nữa (1.0 -> 0.8)
        for (let i = 0; i <= 15; i++) {
            const a = (i / 15) * Math.PI * 0.5;
            pts.push(new THREE.Vector2(Math.sin(a) * 0.8, Math.cos(a) * 0.8));
        }
        // Phần đuôi vuốt nhọn SIÊU DÀI (từ 8 lên 15) để ra dáng giọt nước phim ảnh
        pts.push(new THREE.Vector2(0, -15));
        this.sphereGeo = new THREE.LatheGeometry(pts, 16);
        this.sphereGeo.rotateX(Math.PI / 2); // Xoay để đầu tròn hướng về phía trước (trục Z)

        this.laserGeo = new THREE.CylinderGeometry(0.3, 0.3, 4.0, 8); // Tia laser của quái
        this.laserGeo.rotateX(Math.PI / 2); // Xoay để nòng tia nằm dọc theo trục Z

        this.bossLaserGeo = new THREE.CylinderGeometry(1.5, 1.5, 80.0, 8); // Laser khổng lồ của Boss 1
        this.bossLaserGeo.rotateX(Math.PI / 2);

        // Material phát sáng
        this.enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        this.bossLaserMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }); // Màu xanh lơ (Cyan)

        // Material đạn Boss dùng Texture giọt nước
        this.bossSphereMat = new THREE.MeshBasicMaterial({
            map: createBossBulletTexture(),
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    spawn(position, direction, speed, damage, isEnemy = true, type = 'LASER', attachedTo = null) {
        let material, geometry;
        if (type === 'LASER') {
            material = this.enemyLaserMat;
            geometry = this.laserGeo;
        } else if (type === 'BOSS_LASER') {
            material = this.bossLaserMat;
            geometry = this.bossLaserGeo;
        } else {
            material = this.bossSphereMat;
            geometry = this.sphereGeo;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        if (type === 'BOSS_LASER') {
            // Đẩy tâm của tia laser (dài 80) tiến về phía trước 38 đơn vị để gốc tia sáng dính vào Boss
            // và phần ngọn kéo dài xuyên qua màn hình tới Player
            mesh.position.add(direction.clone().multiplyScalar(38));
        } else if (direction.z > 0) {
            // Đẩy viên đạn ra phía trước một chút để không bị lấp vào trong thân model của quái
            mesh.position.z += 2;
        }

        // Xoay khối 3D đạn hướng đúng theo vector di chuyển (direction)
        // Áp dụng cho mọi loại đạn (kể cả đạn giọt nước của Boss) để chúng luôn chĩa nhọn về phía trước
        const lookTarget = mesh.position.clone().add(direction);
        mesh.lookAt(lookTarget);

        const velocity = direction.clone().normalize().multiplyScalar(speed);

        const projectile = {
            mesh: mesh,
            velocity: velocity,
            direction: direction, // Lưu hướng bắn để cập nhật tia laze dính
            damage: damage,
            isEnemy: isEnemy,
            type: type,
            attachedTo: attachedTo,
            duration: type === 'BOSS_LASER' ? 3.5 : Infinity, // Boss laser tồn tại 3.5s
            hitTimer: 0 // Thời gian chờ để gây sát thương (tránh 1s bị trừ máu 60 lần)
        };

        this.scene.add(mesh);
        this.projectiles.push(projectile);
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.hitTimer > 0) p.hitTimer -= delta;

            // Xóa tia laser khi hết thời gian
            if (p.duration !== Infinity) {
                p.duration -= delta;
                if (p.duration <= 0) {
                    this.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Nếu đạn bị dính vào một thực thể (ví dụ: mắt Boss)
            if (p.attachedTo) {
                p.mesh.position.copy(p.attachedTo.position);
                if (p.type === 'BOSS_LASER') {
                    p.mesh.position.add(p.direction.clone().multiplyScalar(38)); // Đẩy ra phía trước
                }
            } else {
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta * 60));
            }

            // Despawn logic (Chỉ áp dụng cho đạn không dính)
            if (!p.attachedTo && (p.mesh.position.z > 50 || p.mesh.position.z < -200 ||
                Math.abs(p.mesh.position.x) > 100 || Math.abs(p.mesh.position.y) > 100)) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollision(targetMesh, radius = 1) {
        if (!targetMesh) return null;
        const targetPos = targetMesh.position;
        // Sử dụng Box3 bao quanh Player để xét va chạm chính xác hơn với tia laser siêu dài
        const targetBox = new THREE.Box3().setFromCenterAndSize(targetPos, new THREE.Vector3(radius * 2.5, radius * 2.5, radius * 2.5));

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (!p.isEnemy) continue; // Chỉ xét đạn địch

            // Dùng Box3 bao quanh viên đạn/tia laser
            const bulletBox = new THREE.Box3().setFromObject(p.mesh);

            if (bulletBox.intersectsBox(targetBox)) {
                if (p.type === 'BOSS_LASER') {
                    if (p.hitTimer <= 0) {
                        p.hitTimer = 0.5; // Laser liên tục gây sát thương mỗi 0.5 giây
                        return p.damage;
                    }
                } else {
                    const damage = p.damage;
                    this.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                    return damage;
                }
            }
        }
        return null;
    }
}
