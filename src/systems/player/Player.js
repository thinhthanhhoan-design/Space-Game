import * as THREE from 'three'; 
import gsap from 'gsap'; 
import { CONFIG } from '../../utils/CONFIG.JS';
import { MathUtils } from '../../utils/Math.js'; 
import { Weapon } from './Weapon.js'; 
import { ItemSystem } from './ItemSystem.js'; 
import { Crosshair } from '../ui/Crosshair.js'; 
import { modelCache } from '../../utils/ModelCache.js';

export class Player { 
    constructor(scene) {
        this.scene = scene; 
        this.mesh = null;   
        this.shieldSphere = null; // visual shield

        this.hp = CONFIG.PLAYER.INITIAL_HP;
        this.ammo = CONFIG.PLAYER.WEAPONS.GUN_1.ammo; 
        this.maxAmmo = CONFIG.PLAYER.WEAPONS.GUN_1.ammo; 

        this.itemSystem = new ItemSystem(this, this.scene);
        this.weapon = new Weapon(this.scene, this);
        this.crosshair = new Crosshair(this.scene);

        this.modelKey = "PLAYER_V1"; 
        this.speed = CONFIG.ENGINE.FORWARD_SPEED; 
        this.slowMultiplier = 1.0; 
        this.slowTimer = 0; 

        // Các biến điều khiển di chuyển
        this.velocity = new THREE.Vector3();
        this.keys = {
            w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            Space: false
        };

        this.initEventListeners();
    }

    setMusicSystem(musicSystem) {
        this.musicSystem = musicSystem;
        if (this.itemSystem) this.itemSystem.setMusicSystem(musicSystem);
        if (this.weapon) this.weapon.setMusicSystem(musicSystem);
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
                // Clear opposite direction to prevent conflict
                if (e.key === 'a') this.keys.d = false;
                if (e.key === 'd') this.keys.a = false;
                if (e.key === 'ArrowLeft') this.keys.ArrowRight = false;
                if (e.key === 'ArrowRight') this.keys.ArrowLeft = false;
                if (e.key === 'w') this.keys.s = false;
                if (e.key === 's') this.keys.w = false;
                if (e.key === 'ArrowUp') this.keys.ArrowDown = false;
                if (e.key === 'ArrowDown') this.keys.ArrowUp = false;
            }
            if (e.code === 'Space') this.keys.Space = true;
        });
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
            if (e.code === 'Space') this.keys.Space = false;
        });
        
        // Reset phím khi cửa sổ mất focus (tránh bị dính phím)
        window.addEventListener('blur', () => {
            for (let key in this.keys) {
                this.keys[key] = false;
            }
        });
    }

    initMesh() {
        if (this.mesh) return; 

        const cachedModel = modelCache.getModel('ship');
        if (cachedModel) {
            this.mesh = new THREE.Group();
            const innerMesh = cachedModel;
            innerMesh.scale.set(1.0, 1.0, 1.0);
            innerMesh.rotation.y = Math.PI; 

            this.mesh.add(innerMesh);
            this.mesh.position.y = 0;
            this.mesh.visible = false;
            this.scene.add(this.mesh);
            console.log("🚀 [Player] Mesh đã được khởi tạo thành công!");
        } else {
            console.error("❌ [Player] Lỗi: Không thể lấy model 'ship' từ AssetLoader!");
        }
    }

    update(delta, enemies) {
        if (!this.mesh) return; 

        // --- LOGIC DI CHUYỂN ---
        const moveX = (this.keys.d || this.keys.ArrowRight ? 1 : 0) - (this.keys.a || this.keys.ArrowLeft ? 1 : 0);
        const moveY = (this.keys.w || this.keys.ArrowUp ? 1 : 0) - (this.keys.s || this.keys.ArrowDown ? 1 : 0);

        const targetVelX = moveX * this.speed * this.slowMultiplier;
        const targetVelY = moveY * this.speed * this.slowMultiplier;

        // Nội suy vận tốc để di chuyển mượt mà hơn (Tăng tốc độ phản hồi để tránh bị "dính" cảm giác lái)
        const damping = 1 - Math.pow(0.001, delta); // Tăng cường độ damping (phản hồi nhanh hơn)
        this.velocity.x += (targetVelX - this.velocity.x) * damping;
        this.velocity.y += (targetVelY - this.velocity.y) * damping;
        
        // Chống trôi (Dập tắt các vận tốc siêu nhỏ để tránh bị "dính" góc nghiêng nhẹ)
        const deadzone = 0.001; // giảm deadzone tối đa để tránh việc velocity bị zero quá sớm
        if (Math.abs(this.velocity.x) < deadzone) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < deadzone) this.velocity.y = 0;

        this.mesh.position.x += this.velocity.x * (delta * 60);
        this.mesh.position.y += this.velocity.y * (delta * 60);

        // Giới hạn vùng bay (Flight Envelope)
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -envX, envX);
        this.mesh.position.y = THREE.MathUtils.clamp(this.mesh.position.y, -envY, envY);

        // --- HIỆU ỨNG NGHIÊNG TÀU (BANKING & PITCH) ---
        const rotLimits = CONFIG.ENGINE.ROTATION_LIMITS || { ROLL: Math.PI/4, PITCH: Math.PI/8, LERP: 0.15 };
        
        // Tính toán góc mục tiêu (Kẹp chặt giới hạn)
        // Sử dụng giá trị di chuyển ngang (moveX) và dọc (moveY) trực tiếp để tính roll/pitch, tránh phụ thuộc vào velocity dư thừa
        const targetRoll = - 1 * THREE.MathUtils.clamp(moveX * rotLimits.ROLL, -rotLimits.ROLL, rotLimits.ROLL);
        const targetPitch = THREE.MathUtils.clamp(moveY * rotLimits.PITCH, -rotLimits.PITCH, rotLimits.PITCH);
        const targetYaw = moveX * 0.1;


        // Sử dụng delta-based lerp mạnh mẽ hơn
        const rotLerp = 1 - Math.pow(1 - (rotLimits.LERP * 3.0), delta * 60); // Tăng tốc hồi về ngang, giảm dính nghiêng
        
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetRoll, rotLerp);
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetPitch, rotLerp);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetYaw, rotLerp);
        
        // Force reset về 0 tuyệt đối nếu vận tốc bằng 0 (Giải quyết triệt để lỗi "dính nghiêng")
        if (this.velocity.x === 0 && Math.abs(this.mesh.rotation.z) < 0.01) this.mesh.rotation.z = 0;
        if (this.velocity.y === 0 && Math.abs(this.mesh.rotation.x) < 0.01) this.mesh.rotation.x = 0;

        // --- LOGIC CHIẾN ĐẤU ---
        if (this.keys.Space && this.ammo > 0) {
            this.weapon.fire();
        }

        this.weapon.update(delta);
        this.crosshair.update(this.mesh.position, this.weapon.currentGun, enemies);
        this.itemSystem.update(delta);
        // Update shield visual position to follow ship
        if (this.shieldSphere) {
            this.shieldSphere.position.copy(this.mesh.position);
        }        
        if (this.slowTimer > 0) {
            this.slowTimer -= delta;
            if (this.slowTimer <= 0) this.slowMultiplier = 1.0;
        }
    }

    resetControls() {
        // Reset trạng thái phím và vận tốc về 0 (Dùng khi chuyển cảnh hoặc Skip)
        for (let key in this.keys) this.keys[key] = false;
        this.velocity.set(0, 0, 0);
        if (this.mesh) {
            this.mesh.rotation.set(0, 0, 0);
            // Nếu có innerMesh xoay 180 độ thì giữ lại
            const innerMesh = this.mesh.children.find(c => c.name === "InnerShip");
            if (innerMesh) innerMesh.rotation.y = Math.PI;
            else this.mesh.rotation.y = 0; // Fallback
        }
    }

    takeDamage(amount) {
        if (this.isShieldActive) return;
        this.hp -= amount;

        // Nếu bị trúng đạn thì mất chức năng súng nâng cấp (về lại GUN_1)
        if (this.weapon && this.weapon.currentGun !== 'GUN_1') {
            this.weapon.setGun('GUN_1');
            console.log("💥 Player damaged: Weapon downgraded to GUN_1");
        }

        if (this.hp <= 0) {
            console.log("PLAYER DIED");
        }
    }

    applySlow(duration, multiplier) {
        this.slowTimer = duration;
        this.slowMultiplier = multiplier;
    }

    applyJam(duration) {
        if (this.weapon) {
            // Thay vì khóa súng hoàn toàn (isLocked), ta làm chậm tốc độ bắn đi 2 lần
            this.weapon.fireRateMultiplier = 3.0; 
            
            // Hiển thị cảnh báo nhỏ cho người chơi nếu cần
            console.log("⚠️ CẢNH BÁO: Vũ khí bị nhiễu sóng! Tốc độ bắn giảm 3 lần.");

            setTimeout(() => { 
                this.weapon.fireRateMultiplier = 1.0; 
            }, duration * 1000);
        }
    }

    setShield(active) {
        this.isShieldActive = active;
        if (active) {
            // Create visual shield sphere if not already present
            if (!this.shieldSphere && this.mesh) {
                const radius = MathUtils.calculateShieldRadius(this.mesh);
                const geometry = new THREE.SphereGeometry(radius, 32, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.35,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.name = 'ShieldSphere';
                sphere.position.copy(this.mesh.position);
                this.scene.add(sphere);
                this.shieldSphere = sphere;
            }
        } else {
            // Remove visual shield
            if (this.shieldSphere) {
                this.scene.remove(this.shieldSphere);
                if (this.shieldSphere.geometry) this.shieldSphere.geometry.dispose();
                if (this.shieldSphere.material) this.shieldSphere.material.dispose();
                this.shieldSphere = null;
            }
        }
    }
}
