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
        this.shieldSphere = null;

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

        // Trạng thái di chuyển
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
                // Loại bỏ xung đột hướng ngược nhau
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
        
        // Reset phím khi mất focus cửa sổ
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
        } else {
            console.error("[Player] Failed to load 'ship' model");
        }
    }

    update(delta, enemies) {
        if (!this.mesh) return; 

        const moveX = (this.keys.d || this.keys.ArrowRight ? 1 : 0) - (this.keys.a || this.keys.ArrowLeft ? 1 : 0);
        const moveY = (this.keys.w || this.keys.ArrowUp ? 1 : 0) - (this.keys.s || this.keys.ArrowDown ? 1 : 0);

        const targetVelX = moveX * this.speed * this.slowMultiplier;
        const targetVelY = moveY * this.speed * this.slowMultiplier;

        // Nội suy vận tốc (Damping)
        const damping = 1 - Math.pow(0.001, delta);
        this.velocity.x += (targetVelX - this.velocity.x) * damping;
        this.velocity.y += (targetVelY - this.velocity.y) * damping;
        
        const deadzone = 0.001;
        if (Math.abs(this.velocity.x) < deadzone) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < deadzone) this.velocity.y = 0;

        this.mesh.position.x += this.velocity.x * (delta * 60);
        this.mesh.position.y += this.velocity.y * (delta * 60);

        // Giới hạn vùng di chuyển
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -envX, envX);
        this.mesh.position.y = THREE.MathUtils.clamp(this.mesh.position.y, -envY, envY);

        // Hiệu ứng nghiêng tàu (Roll/Pitch)
        const rotLimits = CONFIG.ENGINE.ROTATION_LIMITS || { ROLL: Math.PI/4, PITCH: Math.PI/8, LERP: 0.15 };
        const targetRoll = - 1 * THREE.MathUtils.clamp(moveX * rotLimits.ROLL, -rotLimits.ROLL, rotLimits.ROLL);
        const targetPitch = THREE.MathUtils.clamp(moveY * rotLimits.PITCH, -rotLimits.PITCH, rotLimits.PITCH);
        const targetYaw = moveX * 0.1;

        const rotLerp = 1 - Math.pow(1 - (rotLimits.LERP * 3.0), delta * 60);
        
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetRoll, rotLerp);
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, targetPitch, rotLerp);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetYaw, rotLerp);
        
        if (this.velocity.x === 0 && Math.abs(this.mesh.rotation.z) < 0.01) this.mesh.rotation.z = 0;
        if (this.velocity.y === 0 && Math.abs(this.mesh.rotation.x) < 0.01) this.mesh.rotation.x = 0;

        // Bắn súng
        if (this.keys.Space && this.ammo > 0) {
            this.weapon.fire();
        }

        this.weapon.update(delta);
        this.crosshair.update(this.mesh.position, this.weapon.currentGun, enemies);
        this.itemSystem.update(delta);

        if (this.shieldSphere) {
            this.shieldSphere.position.copy(this.mesh.position);
        }        

        if (this.slowTimer > 0) {
            this.slowTimer -= delta;
            if (this.slowTimer <= 0) this.slowMultiplier = 1.0;
        }
    }

    resetControls() {
        for (let key in this.keys) this.keys[key] = false;
        this.velocity.set(0, 0, 0);
        if (this.mesh) {
            this.mesh.rotation.set(0, 0, 0);
            const innerMesh = this.mesh.children.find(c => c.name === "InnerShip");
            if (innerMesh) innerMesh.rotation.y = Math.PI;
            else this.mesh.rotation.y = 0;
        }
    }

    takeDamage(amount) {
        if (this.isShieldActive || this.isInvincible) return;
        this.hp -= amount;

        // Giảm cấp vũ khí khi trúng đạn
        if (this.weapon && this.weapon.currentGun !== 'GUN_1') {
            this.weapon.setGun('GUN_1');
        }
    }

    applySlow(duration, multiplier) {
        this.slowTimer = duration;
        this.slowMultiplier = multiplier;
    }

    applyJam(duration) {
        if (this.weapon) {
            this.weapon.fireRateMultiplier = 3.0; 
            setTimeout(() => { 
                this.weapon.fireRateMultiplier = 1.0; 
            }, duration * 1000);
        }
    }

    setShield(active) {
        this.isShieldActive = active;
        if (active) {
            // Tạo visual shield
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
            // Gỡ bỏ visual shield
            if (this.shieldSphere) {
                this.scene.remove(this.shieldSphere);
                if (this.shieldSphere.geometry) this.shieldSphere.geometry.dispose();
                if (this.shieldSphere.material) this.shieldSphere.material.dispose();
                this.shieldSphere = null;
            }
        }
    }
}
