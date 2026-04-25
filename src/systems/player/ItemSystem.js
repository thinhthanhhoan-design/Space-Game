import * as THREE from 'three';
import gsap from 'gsap';
import { CONFIG } from '../../utils/CONFIG.JS';

export class ItemSystem {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;
        this.inventory = [];
        this.activeItems = []; // Lưu trữ các item 3D đang hiển thị trên màn hình

        this.textureLoader = new THREE.TextureLoader();

        // Tải texture hào quang
        this.glowTexture = this.textureLoader.load(CONFIG.ASSETS.TEXTURES.PARTICLE || '');

        // Map loại item sang đường dẫn texture trong CONFIG
        this.itemTextures = {
            'HEALTH': CONFIG.ASSETS.TEXTURES.ITEM_HP,
            'AMMO': CONFIG.ASSETS.TEXTURES.ITEM_DAN,
            'SHIELD': CONFIG.ASSETS.TEXTURES.ITEM_SECURITY,
            'WEAPON_LOCK': CONFIG.ASSETS.TEXTURES.ITEM_KHOA_VK,
            'DOUBLE_FIRE': CONFIG.ASSETS.TEXTURES.ITEM_Sung2,
            'TRIPLE_FIRE': CONFIG.ASSETS.TEXTURES.ITEM_Sung3,
            'ASTEROID_ITEM': CONFIG.ASSETS.TEXTURES.ITEM_THIEN_THACH
        };
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setAsteroidSystem(asteroidSystem) {
        this.asteroidSystem = asteroidSystem;
    }

    /**
     * Spawn một item mới vào thế giới 3D.
     * @param {string} type - 'HEALTH', 'AMMO', 'SHIELD', v.v.
     * @param {THREE.Vector3} position - Vị trí spawn (mặc định z = -150)
     */
    spawnItem(type, position = null) {
        const group = new THREE.Group();

        // Thiết lập vị trí spawn ngẫu nhiên tương đương quái nếu không có position truyền vào
        if (!position) {
            const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
            const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
            const rangeFactor = CONFIG.ITEMS.SPAWN_RANGE_FACTOR || 1.8;
            // Thu hẹp phạm vi để đảm bảo item nằm trong tầm nhặt của người chơi
            group.position.set(
                (Math.random() - 0.5) * envX * rangeFactor,
                (Math.random() - 0.5) * envY * rangeFactor,
                CONFIG.WORLD.SPAWN_DISTANCE_Z || -150
            );
        } else {
            group.position.copy(position);
        }

        group.userData.type = type;

        // ... (icon, glow, light creation omitted but preserve original logic)
        const texturePath = this.itemTextures[type] || this.itemTextures['HEALTH'];
        const itemTexture = this.textureLoader.load(texturePath);
        const itemMat = new THREE.SpriteMaterial({ map: itemTexture, transparent: true });
        const itemIcon = new THREE.Sprite(itemMat);
        itemIcon.scale.set(1.5, 1.5, 1);
        group.add(itemIcon);

        const spriteMat = new THREE.SpriteMaterial({
            map: this.glowTexture,
            color: 0xff0000,
            transparent: true,
            opacity: CONFIG.ITEMS.GLOW_OPACITY || 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(4, 4, 1);
        sprite.position.z = -0.1;
        group.add(sprite);

        const edgeGlowMat = new THREE.SpriteMaterial({
            map: this.glowTexture,
            color: 0xffffff,
            transparent: true,
            opacity: CONFIG.ITEMS.EDGE_GLOW_OPACITY || 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const edgeGlow = new THREE.Sprite(edgeGlowMat);
        edgeGlow.scale.set(7, 7, 1); //  kích thước hào quang viền
        edgeGlow.position.z = -0.2;
        group.add(edgeGlow);

        const light = new THREE.PointLight(
            0xff0000,
            CONFIG.ITEMS.LIGHT_INTENSITY || 10,
            CONFIG.ITEMS.LIGHT_RANGE || 25
        );
        group.add(light);

        group.userData.glowSprite = sprite;
        group.userData.glowLight = light;
        group.userData.pulsePhase = Math.random() * Math.PI * 2;

        this.scene.add(group);
        this.activeItems.push(group);

        return group;
    }

    // ... (update method stays same as before)
    update(delta) {
        const speedFactor = CONFIG.ITEMS.SPEED_FACTOR || 0.5;
        const speed = ((CONFIG.WORLD.LEVEL_1.asteroid_speed || 0.03) * 4000) * speedFactor;
        const time = Date.now() * 0.005;

        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            item.position.z += delta * speed;
            const spawnZ = CONFIG.WORLD.SPAWN_DISTANCE_Z || -150;
            const despawnZ = CONFIG.WORLD.DESPAWN_DISTANCE_Z || 20;
            const progress = (item.position.z - spawnZ) / (despawnZ - spawnZ);
            const scaleBase = CONFIG.ITEMS.SCALE_BASE || 1.5;
            const scale = (0.5 + progress * 2.5) * scaleBase;
            item.scale.set(scale, scale, scale);
            if (!item.userData.effectTriggered) {
                const pulse = (Math.sin(time + item.userData.pulsePhase) + 1) / 2;
                item.userData.glowSprite.material.opacity = 0.4 + pulse * 0.6;
                item.userData.glowLight.intensity = 2 + pulse * 6;
            }
            item.rotation.y += delta * 2;
            item.rotation.x += delta * 1;
            if (item.position.z > despawnZ) {
                this.scene.remove(item);
                this.activeItems.splice(i, 1);
            }
        }
    }

    /**
     * Kích hoạt hiệu ứng đổi màu khi va chạm.
     */
    triggerCollisionEffect(item, type) {
        if (!item || item.userData.effectTriggered) return;
        item.userData.effectTriggered = true;

        const colors = CONFIG.ITEMS.COLORS || { BUFF: 0x00ff00, DEBUFF: 0xff2200 };
        const targetColor = type === 'Buff' ? new THREE.Color(colors.BUFF) : new THREE.Color(colors.DEBUFF);
        const duration = CONFIG.ITEMS.ANIM_DURATION || 0.2;

        gsap.to(item.userData.glowSprite.material.color, {
            r: targetColor.r, g: targetColor.g, b: targetColor.b,
            duration: duration,
            ease: "power2.out"
        });

        gsap.to(item.userData.glowLight.color, {
            r: targetColor.r, g: targetColor.g, b: targetColor.b,
            duration: duration,
            ease: "power2.out"
        });

        gsap.to(item.userData.glowLight, {
            intensity: 15,
            duration: duration,
            yoyo: true, repeat: 1
        });
    }

    // Cơ chế quản lý ITEMS: Hồi máu
    heal(amount) {
        const healVal = amount || CONFIG.ITEMS.HEALTH_VALUE || 100;
        this.player.hp = Math.min(this.player.hp + healVal, CONFIG.PLAYER.INITIAL_HP);
        if (this.uiManager) this.uiManager.showMessage(`+${healVal} HP`, "#00ff00");
    }

    // Cơ chế quản lý ITEMS: Nạp đạn (Hồi 50% theo yêu cầu)
    refillAmmo() {
        const percent = CONFIG.ITEMS.AMMO_REFILL_PERCENT || 0.5;
        const refillAmount = Math.floor(this.player.maxAmmo * percent);
        this.player.ammo = Math.min(this.player.ammo + refillAmount, this.player.maxAmmo);
        if (this.uiManager) this.uiManager.showMessage(`AMMO +${Math.floor(percent * 100)}%`, "#ffff00");
    }

    // Hàm cổng giao tiếp đón nhận Item từ map rơi ra
    collectItem(itemType) {
        this.inventory.push(itemType);

        const lockDuration = CONFIG.ITEMS.WEAPON_LOCK_DURATION || 5000;
        const shieldDuration = CONFIG.ITEMS.SHIELD_DURATION || 10000;
        const disorderDuration = CONFIG.ITEMS.ENV_DISORDER_DURATION || 6000;

        switch (itemType) {
            case 'HEALTH':
                this.heal();
                break;
            case 'AMMO':
                this.refillAmmo();
                break;
            case 'SHIELD':
                if (this.uiManager) this.uiManager.showMessage("🛡️ BARRIER UP!", "#00ffff", 3000);
                if (this.player.addShieldTime) {
                    this.player.addShieldTime(shieldDuration);
                }
                break;
            case 'WEAPON_LOCK':
                if (this.uiManager) this.uiManager.showMessage("⚠️ WEAPON LOCKED!", "#ff0000", 3000);
                if (this.player.weapon) this.player.weapon.isLocked = true;
                setTimeout(() => { if (this.player.weapon) this.player.weapon.isLocked = false; }, lockDuration);
                break;
            case 'ASTEROID_ITEM':
                if (this.uiManager) this.uiManager.showMessage("🌪️ ASTEROID STORM!", "#ff6600", 3000);

                // Hiệu ứng rung camera
                if (this.camera) {
                    const originalPos = this.camera.position.clone();
                    const intensity = CONFIG.ITEMS.SHAKE_INTENSITY || 1.5;
                    gsap.to(this.camera.position, {
                        x: `+=${intensity}`, y: `+=${intensity}`,
                        duration: 0.1, repeat: 20, yoyo: true, ease: "none",
                        onComplete: () => { this.camera.position.copy(originalPos); }
                    });
                }

                // Logic Thiên thạch rơi nhiều và nhanh
                if (this.asteroidSystem) {
                    const storm = CONFIG.ITEMS.ASTEROID_STORM;
                    this.asteroidSystem.speedMultiplier = storm.SPEED_MULT || 2.5;
                    this.asteroidSystem.densityMultiplier = storm.DENSITY_MULT || 4.0;

                    setTimeout(() => {
                        this.asteroidSystem.speedMultiplier = 1.0;
                        this.asteroidSystem.densityMultiplier = 1.0;
                        if (this.uiManager) this.uiManager.showMessage("STORM CLEARED", "#00ff00", 2000);
                    }, disorderDuration);
                }
                break;
            case 'DOUBLE_FIRE':
                if (this.uiManager) this.uiManager.showMessage("🔥 DOUBLE FIRE!", "#ffaa00", 3000);
                if (this.player.activateDoubleFire) {
                    this.player.activateDoubleFire();
                }
                break;
            case 'TRIPLE_FIRE':
                if (this.uiManager) this.uiManager.showMessage("⚡ TRIPLE FIRE!", "#00ffff", 3000);
                if (this.player.activateTripleFire) {
                    this.player.activateTripleFire();
                }
                break;
        }
    }
}

