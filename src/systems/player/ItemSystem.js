import * as THREE from 'three';
import gsap from 'gsap';
import { CONFIG } from '../../utils/CONFIG.JS';
import { MathUtils } from '../../utils/Math.js';

export class ItemSystem {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;
        this.inventory = [];
        this.activeItems = []; 
        this.onCollectScore = null;

        this.textureLoader = new THREE.TextureLoader();
        this.glowTexture = this.createProceduralGlow();
        
        // Map textures từ CONFIG
        this.itemTextures = {};
        for (const [key, config] of Object.entries(CONFIG.ITEMS.TYPES)) {
            this.itemTextures[key] = CONFIG.ASSETS.TEXTURES[config.texture];
        }
        
        this.currentLevel = 'LEVEL_1';
    }

    // Tạo texture hào quang bằng canvas
    createProceduralGlow() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    setLevel(levelKey) {
        this.currentLevel = levelKey;
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

    setScoreCallback(callback) {
        this.onCollectScore = callback;
    }

    setMusicSystem(musicSystem) {
        this.musicSystem = musicSystem;
    }

    spawnItem(type = null, position = null) {
        if (!type) {
            let possibleTypes = [];
            for (const [key, config] of Object.entries(CONFIG.ITEMS.TYPES)) {
                if (config.min_level) {
                    const currentLvlNum = parseInt(this.currentLevel.split('_')[1]);
                    const minLvlNum = parseInt(config.min_level.split('_')[1]);
                    if (currentLvlNum < minLvlNum) continue;
                }
                possibleTypes.push(key);
            }
            type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
        }

        const group = new THREE.Group();
        if (!position) {
            const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
            const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
            const rangeFactor = CONFIG.ITEMS.SPAWN_RANGE_FACTOR || 1.8;
            group.position.set(
                (Math.random() - 0.5) * envX * rangeFactor,
                (Math.random() - 0.5) * envY * rangeFactor,
                -200
            );
        } else {
            group.position.copy(position);
        }

        const texturePath = this.itemTextures[type];
        if (!texturePath) {
            console.warn(`ItemSystem: No texture found for type ${type}.`);
            return null;
        }
        const texture = this.textureLoader.load(texturePath);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
        const sprite = new THREE.Sprite(material);
        const baseScale = CONFIG.ITEMS.SCALE_BASE || 3;
        const scaleFactor = 1.5; 
        sprite.scale.set(baseScale * scaleFactor, baseScale * scaleFactor, 1);
        group.add(sprite);

        const glowMat = new THREE.SpriteMaterial({ 
            map: this.glowTexture, 
            color: 0xffffff, 
            transparent: true, 
            opacity: CONFIG.ITEMS.GLOW_OPACITY || 0.6, 
            blending: THREE.AdditiveBlending 
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(baseScale * 2.5 * scaleFactor, baseScale * 2.5 * scaleFactor, 1);
        group.add(glow);

        const itemConfig = CONFIG.ITEMS.TYPES[type] || {};
        const expireAt = itemConfig.duration ? Date.now() + itemConfig.duration * 1000 : null;
        group.userData = { type, sprite, glow, isCollected: false, expireAt };
        this.scene.add(group);
        this.activeItems.push(group);
        return group;
    }

    // Tự động thả đạn khi người chơi hết đạn
    updateEmergencyAmmo(delta) {
        if (this.player.ammo <= 0) {
            this.emergencyAmmoTimer = (this.emergencyAmmoTimer || 0) + delta;
            if (this.emergencyAmmoTimer >= 8.0) {
                this.spawnItem('AMMO');
                this.emergencyAmmoTimer = 0;
            }
        } else {
            this.emergencyAmmoTimer = 0;
        }
    }

    update(delta) {
        this.updateEmergencyAmmo(delta);
        const speed = 60.0 * (CONFIG.ITEMS.SPEED_FACTOR || 0.5);
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            item.position.z += speed * delta;

            if (item.userData.expireAt && Date.now() > item.userData.expireAt) {
                this.scene.remove(item);
                this.activeItems.splice(i, 1);
                continue;
            }

            if (item.position.z > 20) {
                this.scene.remove(item);
                this.activeItems.splice(i, 1);
                continue;
            }

            // Kiểm tra va chạm với người chơi
            if (this.player.mesh && !item.userData.isCollected) {
                const dist = item.position.distanceTo(this.player.mesh.position);
                const collectionRadius = MathUtils.scaleItemRadius(CONFIG.ITEMS.COLLECTION_RADIUS || 4);
                if (dist < collectionRadius) {
                    this.collectItem(item.userData.type);
                    item.userData.isCollected = true;
                    this.scene.remove(item);
                    this.activeItems.splice(i, 1);
                }
            }
        }
    }

    collectItem(type) {
        const itemConfig = CONFIG.ITEMS.TYPES[type];
        if (!itemConfig) return;

        if (this.musicSystem) {
            this.musicSystem.playSound('HIEU_UNG_NHAT_VAT_PHAM');
        }

        if (this.onCollectScore) {
            let pts = itemConfig.POINTS;
            if (pts === undefined) {
                const isBad = type === 'WEAPON_LOCK' || type === 'ASTEROID_ITEM';
                pts = isBad ? CONFIG.SCORING.ITEM_BAD : CONFIG.SCORING.ITEM_GOOD;
            }
            this.onCollectScore(pts);
        }

        switch (type) {
            case 'HEALTH':
                const healVal = itemConfig.value || 100;
                this.player.hp = Math.min(this.player.hp + healVal, CONFIG.PLAYER.INITIAL_HP);
                if (this.uiManager) this.uiManager.showMessage(`+${healVal} HP`, "#00ff00");
                break;
            case 'AMMO':
                const percent = itemConfig.refill_percent || 0.5;
                const refillAmount = Math.floor(this.player.maxAmmo * percent);
                this.player.ammo = Math.min(this.player.ammo + refillAmount, this.player.maxAmmo);
                if (this.uiManager) this.uiManager.showMessage(`AMMO +${Math.floor(percent * 100)}%`, "#ffff00");
                break;
            case 'SHIELD':
                if (this.uiManager) this.uiManager.showMessage("🛡️ Barrier", "#00ffff");
                if (this.player.setShield) this.player.setShield(true);
                setTimeout(() => { 
                    if (this.player.setShield) this.player.setShield(false);
                    if (this.uiManager) this.uiManager.showMessage("SHIELD EXPIRED", "#aaaaaa", 1000);
                }, itemConfig.duration);
                break;
            case 'WEAPON_2':
            case 'WEAPON_3':
                if (this.uiManager) this.uiManager.showMessage(`🔫 NEW WEAPON: ${itemConfig.gun_key}`, "#00ff00", 2000);
                if (this.player.weapon) {
                    const previousGun = this.player.weapon.currentGun;
                    this.player.weapon.setGun(itemConfig.gun_key);
                    setTimeout(() => {
                        if (this.player.weapon && this.player.weapon.currentGun === itemConfig.gun_key) {
                            this.player.weapon.setGun(previousGun);
                            if (this.uiManager) this.uiManager.showMessage(`🔫 REVERT TO ${previousGun}`, "#ffff00", 1500);
                        }
                    }, (itemConfig.duration || 10) * 1000);
                }
                const refillAmt = Math.floor(this.player.maxAmmo * 0.3);
                this.player.ammo = Math.min(this.player.ammo + refillAmt, this.player.maxAmmo);
                break;
            case 'WEAPON_LOCK':
                if (this.uiManager) this.uiManager.showMessage("⚠️ WEAPON LOCKED!", "#ff0000", 3000);
                if (this.player.weapon) this.player.weapon.isLocked = true;
                setTimeout(() => { if (this.player.weapon) this.player.weapon.isLocked = false; }, itemConfig.duration);
                break;
            case 'ASTEROID_ITEM':
                if (this.uiManager) this.uiManager.showMessage("🌪️ ASTEROID STORM!", "#ff6600", 3000);
                if (this.camera) {
                    const originalPos = this.camera.position.clone();
                    gsap.to(this.camera.position, {
                        x: `+=${CONFIG.ITEMS.SHAKE_INTENSITY}`, y: `+=${CONFIG.ITEMS.SHAKE_INTENSITY}`,
                        duration: 0.1, repeat: 20, yoyo: true, ease: "none",
                        onComplete: () => { this.camera.position.copy(originalPos); }
                    });
                }
                if (this.asteroidSystem) {
                    this.asteroidSystem.speedMultiplier = itemConfig.SPEED_MULT;
                    this.asteroidSystem.densityMultiplier = itemConfig.DENSITY_MULT;
                    setTimeout(() => {
                        this.asteroidSystem.speedMultiplier = 1.0;
                        this.asteroidSystem.densityMultiplier = 1.0;
                        if (this.uiManager) this.uiManager.showMessage("STORM CLEARED", "#00ff00", 2000);
                    }, itemConfig.duration);
                }
                break;
        }
    }
}
