import * as THREE from 'three';
import { SceneController } from './SceneController.js'; // Nhập lớp quản lý cảnh 3D (Camera, Ánh sáng, Renderer)
import { GameLoop } from './GameLoop.js'; // Nhập lớp vòng lặp điều khiển tiến trình trò chơi (60fps)
import gsap from 'gsap';
import { StateManager } from './StateManager.js'; // Nhập lớp quản lý các trạng thái game (Intro, Playing, v.v.)
import { Intro } from '../ui/Intro.js'; // Nhập hệ thống UI giới thiệu và hoạt cảnh đầu game
import { Story } from '../ui/Story.js';
import { Player } from '../player/Player.js'; // Nhập lớp Người chơi để khởi tạo phi thuyền UETE-3637
import { Background } from '../environment/Background.js'; // Nhập hệ thống môi trường, nền vũ trụ, tinh vân
import { CinematicEffects } from '../effects/CinematicEffects.js';
import { ProjectileSystem } from '../core/ProjectileSystem.js';
import { EnemyManager } from '../enemy/Enemy.js';
import { Boss, Boss2, Boss3 } from '../enemy/Boss.js';
import { AsteroidSystem } from '../environment/AsteroidSystem.js';
import { Combat } from '../player/Combat.js';
import { UIManager } from '../ui/UIManager.js';
import { EndingUI } from '../ui/EndingUI.js';
import { ExplosionSystem } from '../effects/Explosion.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { Splash } from '../ui/Splash.js';

import { assetLoader } from '../../utils/AssetLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập đối tượng cấu hình trung tâm cho toàn bộ dự án
import { MusicSystem } from '../audio/music.js';

export class GameManager { // Khai báo lớp GameManager - "Bộ não" tổng chỉ huy của trò chơi
    constructor() { // Hàm khởi tạo thực thể GameManager
        this.sceneController = new SceneController(); // Khởi tạo bộ điều khiển đồ họa (scene, máy ảnh, renderer)
        this.stateManager = new StateManager(); // Khởi tạo bộ phận quản lý trạng thái trò chơi (bật/tắt các giai đoạn)
        this.gameLoop = new GameLoop(this.sceneController, this); // Tạo vòng lặp game chính, kết nối với scene và logic GameManager

        this.intro = new Intro(this.sceneController); // Khởi tạo hoạt cảnh giới thiệu, dùng chung camera từ core
        this.player = new Player(this.sceneController.scene); // Khởi tạo tàu người chơi và đặt nó vào không gian 3D của scene
        this.background = new Background(); // Khởi tạo đối tượng quản lý nền trời vũ trụ và các vì sao

        this.cinematicEffects = new CinematicEffects(this.sceneController.scene, this.sceneController.camera);
        this.projectileSystem = new ProjectileSystem(this.sceneController.scene);
        this.enemyManager = new EnemyManager(this.sceneController.scene, this.projectileSystem, this.player.itemSystem);
        this.asteroidSystem = new AsteroidSystem(this.sceneController.scene);
        this.combat = new Combat();
        this.explosionSystem = new ExplosionSystem(this.sceneController.scene, this.sceneController.camera);
        this.particleSystem = new ParticleSystem(this.sceneController.scene);
        this.uiManager = new UIManager();
        this.endingUI = new EndingUI();

        // Kết nối ItemSystem với UI, Camera và AsteroidSystem để hiển thị thông báo và hiệu ứng
        this.player.itemSystem.setUIManager(this.uiManager);
        this.player.itemSystem.setCamera(this.sceneController.camera);
        this.player.itemSystem.setAsteroidSystem(this.asteroidSystem);

        this.boss = null;
        this._bossHandled = false;
        this.currentLevelKey = 'LEVEL_1'; // Theo dõi màn chơi hiện tại
        this.gamePlayState = 'WAVES'; // 'WAVES', 'ASTEROIDS', 'BOSS', 'TRANSITION', 'VICTORY'
        this.isGameOver = false;
        this._victoryTriggered = false;
        this.hasPlayedStoryLV2 = false;

        // --- ITEM SPAWN SYSTEM ---
        this.itemSpawnTimer = 0;
        this.itemSpawnInterval = CONFIG.ITEMS.SPAWN_INTERVAL || 6.5;

        // --- AUDIO SYSTEM ---
        this.musicSystem = new MusicSystem(this.sceneController.camera);
        window.GameAudio = this.musicSystem;
        this.musicSystem.init(); // Tải file nhạc nền

        // --- SPLASH SCREEN & LAUNCH LOGIC ---
        new Splash(() => {
            // Callback này chạy ngay khi người dùng click vào màn hình Splash
            if (this.musicSystem) this.musicSystem.play();
            this.startIntroSequence();
        });

        // --- DEBUG SHORTCUTS ---
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyK') {
                this.handleSkip();
            }
        });
    }

    startIntroSequence() {
        if (this._introStarted) return;
        this._introStarted = true;

        // Bắt đầu chuỗi hoạt động của phần giới thiệu (Intro)
        this.intro.init((logoPoints) => {
            const checkModel = setInterval(() => {
                if (this.player.mesh) {
                    clearInterval(checkModel);
                    if (this.stateManager.isGameStarted) return;

                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => {
                        if (this.stateManager.isGameStarted) return;
                        this.player.mesh.visible = true;
                        
                        // DỪNG NHẠC KHI TÀU TỤ XONG ĐỂ VÀO ĐOẠN PHIM DẪN TRUYỆN
                        if (this.musicSystem) this.musicSystem.stop();
                        
                        this.cinematicEffects.startSpeedLines();
                        setTimeout(() => {
                            if (this.stateManager.isGameStarted) return;

                            this.cinematicEffects.runShortFilm(CONFIG.CINEMATIC.SHOTS, () => {
                                if (this.stateManager.isGameStarted) return;
                                this.cinematicEffects.warningEffect();
                                this.cinematicEffects.showText(CONFIG.STRINGS.WARNING_BLACKHOLE, 2.5);
                                setTimeout(() => {
                                    if (this.stateManager.isGameStarted) return;

                                    this.cinematicEffects.stopAll(); // Dừng mọi hiệu ứng cũ
                                    this.cinematicEffects.triggerBlackHole(this.player.mesh, () => {
                                        if (this.stateManager.isGameStarted) return;

                                        this.cinematicEffects.startTunnelEffect(this.player.mesh, () => {
                                            if (this.stateManager.isGameStarted) return;
                                            this.stateManager.setGameStarted(true);
                                            this.uiManager.show(); // Hiển thị HUD người chơi
                                            this.enemyManager.startWaveSystem(1); // Màn 1
                                            if (this.musicSystem) this.musicSystem.play(); // CHẠY LẠI NHẠC NỀN
                                        });
                                    });
                                }, 1500);
                            });
                        }, 1000);
                    });
                }
            }, 100);
        }, () => {
            // Callback này sẽ chạy NGAY LẬP TỨC khi bấm nút Start
            if (this.musicSystem) this.musicSystem.play();
        });
    }

    handleSkip() {
        const now = Date.now();
        if (this.lastSkipTime && now - this.lastSkipTime < 1500) return; // Chống spam phím K
        this.lastSkipTime = now;

        console.log(">>> [K] SMART SKIP TRIGGERED");

        // KIỂM TRA TẢI TÀI NGUYÊN (Asset Guard)
        if (!assetLoader.isLoaded) {
            console.warn("[K] Chờ chút, tài nguyên đang nạp...");
            if (this.uiManager) this.uiManager.showMessage(CONFIG.STRINGS.LOADING_DATA, "#ffaa00", 2000);
            return;
        }

        // 1. Skip Intro Cinematic
        if (!this.stateManager.isGameStarted) {
            console.log("[K] Skipping Intro...");
            if (this.cinematicEffects) this.cinematicEffects.stopAll();
            if (this.intro) this.intro.abort();

            this.stateManager.setGameStarted(true);
            this.uiManager.show();
            if (this.player.mesh) this.player.mesh.visible = true;
            this.player.resetControls();

            this.currentLevelKey = 'LEVEL_1';
            this.player.itemSystem.setLevel(this.currentLevelKey);
            this.gamePlayState = 'WAVES';
            this.enemyManager.startWaveSystem(1); // Màn 1
            if (this.musicSystem) this.musicSystem.play(); // CHẠY LẠI NHẠC NỀN
            return;
        }

        // 2. Skip Waves -> Next Wave
        if (this.gamePlayState === 'WAVES') {
            console.log("[K] Skipping Current Wave...");
            this.player.resetControls();
            this.enemyManager.clearAllEnemies(false);
            return;
        }

        // 3. Skip Boss -> Next Level
        if (this.gamePlayState === 'BOSS' && this.boss) {
            console.log("[K] Killing Boss...");
            this.boss.takeDamage(99999);
            return;
        }

        // 4. Skip Transition/Tunnel
        if (this.gamePlayState === 'TRANSITION') {
            console.log("[K] Skipping Tunnel...");
            if (this.cinematicEffects) this.cinematicEffects.stopAll();
            this.finishTransition();
            return;
        }
    }

    nextLevel() {
        if (this._bossHandled) return;
        this._bossHandled = true;

        this.uiManager.hideBossHP();
        if (this.explosionSystem) {
            this.explosionSystem.spawnBossExplosion(this.boss.mesh.position);
        }
        this.sceneController.triggerShake(1.5, 0.8);

        const explosionDelay = 2000; // đợi boss nổ xong

        setTimeout(() => {
            if (this.currentLevelKey === 'LEVEL_1') {
                console.log("Tiến vào LEVEL 2!");
                if (!this.hasPlayedStoryLV2) {
                    this.hasPlayedStoryLV2 = true;
                    const story = new Story();
                    story.play('LV1_INTRO', () => {
                        this.musicSystem.playLevelUpSound();
                        this.startLevelTransition('LEVEL_2');
                        this.cinematicEffects?.showText("LEVEL 2 - CẨN THẬN!", 3);
                    });
                }
            } else if (this.currentLevelKey === 'LEVEL_2') {
                console.log("Tiến vào LEVEL 3!");
                const story = new Story();
                story.playLevel3Transition(this, () => {
                    this.musicSystem.playLevelUpSound();
                    this.startLevelTransition('LEVEL_3');
                    this.cinematicEffects?.showText(CONFIG.STORY.LV2_TRANSITION.ui_text, 3);
                });
            } else {
                // KHI DIỆT XONG BOSS 3 (LEVEL CUỐI)
                if (this._victoryTriggered) return;
                this._victoryTriggered = true;

                this.gamePlayState = 'VICTORY';
                this.uiManager.hide();
                const victoryStory = new Story();
                this.musicSystem.playVictorySound(); // Chạy nhạc thắng cuộc
                victoryStory.playVictoryEnding(() => {
                    this.endingUI.show('WIN'); 
                });
            }
        }, explosionDelay);
    }

    startLevelTransition(nextLevelKey) {
        this.currentLevelKey = nextLevelKey;
        this.uiManager.showMessage(`TIẾN VÀO ${this.currentLevelKey}...`, "#00ffff", 3000);
        this.gamePlayState = 'TRANSITION';
        if (this.asteroidSystem) this.asteroidSystem.setLevel(this.currentLevelKey);
        if (this.player.itemSystem) this.player.itemSystem.setLevel(this.currentLevelKey);

        // Hồi máu và đạn như phần thưởng thắng Boss
        this.player.hp = Math.min(this.player.hp + 100, CONFIG.PLAYER.MAX_HP || 300);
        this.player.ammo = this.player.maxAmmo;
        if (this.uiManager) this.uiManager.update(this.player, this.currentLevelKey);

        if (this.cinematicEffects) {
            this.cinematicEffects.startTunnelEffect(this.player.mesh, () => {
                this.finishTransition();
            });
        }
    }

    finishTransition() {
        this.gamePlayState = 'WAVES';
        if (this.boss) {
            this.boss.die(true); // Xóa mesh của boss cũ khỏi scene
            this.boss = null;
        }
        this._bossHandled = false; // Reset flag cho level mới
        const levelNum = parseInt(this.currentLevelKey.split('_')[1]);
        this.enemyManager.resetAndStartWaveSystem(levelNum);
    }

    init() { // Hàm khởi tạo chính để nạp tài nguyên và bắt đầu khởi chạy luồng game
        // Bắt đầu nạp ngầm toàn bộ Model (Background Preloading)
        assetLoader.preloadAllModels(() => {
            console.log("--- TẤT CẢ MODEL ĐÃ SẴN SÀNG ---");
            if (this.player) this.player.initMesh();
        });

        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG; // Lấy đường dẫn ảnh nền vũ trụ từ file cấu hình chung
        this.background.init(this.sceneController.scene, bgUrl); // Truyền cảnh và đường dẫn ảnh để Background nạp textures


        this.gameLoop.start(); // Chính thức kích hoạt vòng lặp game liên tục (requestAnimationFrame)
    }

    update(elapsedTime, delta) { // Hàm cập nhật logic game
        this.uiManager.updateFPS(delta); // Luôn cập nhật FPS ở mọi trạng thái

        if (!this.stateManager.isGameStarted) {
            this.intro.update(elapsedTime); // Chỉ cập nhật Intro khi game chưa bắt đầu
            this.background.update(delta);
            return;
        }

        if (this.player && this.player.mesh) { // Đảm bảo mô hình tàu đã sẵn sàng
            // === KIỂM TRA GAME OVER ===
            if (this.player.hp <= 0 && !this.isGameOver) {
                this.isGameOver = true;
                this.uiManager.hide(); // Ẩn các thanh máu, đạn
                this.musicSystem.playGameOverSound(); // Chạy nhạc thất bại
                this.endingUI.show('GAME_OVER'); // Hiện màn hình thua
                return;
            }

            this.player.mesh.visible = true;
            let currentEnemies = [];
            if (this.gamePlayState === 'WAVES') {
                currentEnemies = this.enemyManager.enemies;
            } else if (this.gamePlayState === 'BOSS' && this.boss) {
                currentEnemies = [this.boss, ...this.enemyManager.enemies];
            }

            this.player.update(delta, currentEnemies);

            // --- LOGIC HORIZON BANKING ---
            const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
            let xRatio = this.player.mesh.position.x / envX;
            xRatio = Math.max(-1.8, Math.min(1.8, xRatio));
            const targetBgRoll = -xRatio * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT;
            this.background.setRoll(targetBgRoll, CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS);

            // --- LOGIC GAMEPLAY SEQUENCE ---
            this.projectileSystem.update(delta);
            this.asteroidSystem.update(delta);
            this.explosionSystem.update(delta);

            // Kiểm tra va chạm đạn với người chơi
            const dmg = this.projectileSystem.checkCollision(this.player.mesh, 1.2);
            if (dmg) {
                this.player.takeDamage(dmg);
                this.sceneController.triggerShake(0.3, 0.2); // Rung camera nhẹ khi trúng đạn
                if (this.explosionSystem) {
                    this.explosionSystem.spawnShipImpact(this.player.mesh.position);
                    this.explosionSystem.spawnShockwave(this.player.mesh.position, 0xff0000, 5); // Sóng đỏ cảnh báo
                }
                this.explosionSystem.startWarning(0.4); // Nháy đỏ nhẹ màn hình khi bị thương
            }

            // --- Cập nhật Items tự do ---
            this.itemSpawnTimer += delta;
            if (this.itemSpawnTimer > this.itemSpawnInterval) {
                this.itemSpawnTimer = 0;
                const itemTypes = [
                    'HEALTH', 'HEALTH',
                    'AMMO',
                    'SHIELD', 'SHIELD', 'SHIELD',
                    'WEAPON_LOCK',
                    'ASTEROID_ITEM',
                    'WEAPON_2', 'WEAPON_2',
                    'WEAPON_3', 'WEAPON_3'
                ];
                const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                this.player.itemSystem.spawnItem(type);
            }

            if (this.gamePlayState === 'WAVES') {
                this.enemyManager.update(delta, this.player.mesh.position);
                this.combat.update(this.player, this.enemyManager.enemies, this.asteroidSystem.asteroids, this.explosionSystem, this.particleSystem, this.sceneController);

                if (this.enemyManager.isAllWavesCleared && this.enemyManager.enemies.length === 0) {
                    this.gamePlayState = 'BOSS';
                    if (!this.boss || this.boss.isDead) {
                        this._bossHandled = false;
                        if (this.currentLevelKey === 'LEVEL_1') {
                            this.boss = new Boss(this.sceneController.scene, this.projectileSystem, this.player.itemSystem);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.35, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("TRÙM KHÔNG GIAN V1");

                            this.boss.onRetreatComplete = () => {
                                if (this.uiManager.hideBossHP) this.uiManager.hideBossHP();
                                this.gamePlayState = 'WAVES';
                                this.enemyManager.resetAndStartWaveSystem(1, 1);
                            };
                        } else if (this.currentLevelKey === 'LEVEL_2') {
                            this.boss = new Boss2(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.enemyManager);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.5, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("KẺ HỦY DIỆT V2");
                        } else if (this.currentLevelKey === 'LEVEL_3') {
                            this.boss = new Boss3(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.player);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.6, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("CHÚA TỂ BÓNG TỐI V3");
                        }
                    } else {
                        if (this.currentLevelKey === 'LEVEL_1') {
                            this.explosionSystem.startWarning(2.0);
                            this.sceneController.triggerShake(0.5, 2.0);
                            this.uiManager.showBossHP("TRÙM KHÔNG GIAN V1 (FINAL)");
                            this.boss.state = 'FIGHTING';
                            this.boss.mesh.position.set(0, 10, -40);
                            this.boss.mesh.scale.set(10, 10, 10);
                            this.boss.shootCount = 0;
                            this.boss.shootTimer = 0;
                        }
                    }
                }
            } else if (this.gamePlayState === 'BOSS') {
                if (this.boss) {
                    this.boss.update(delta, this.player.mesh.position);
                    this.enemyManager.update(delta, this.player.mesh.position);

                    const combatEnemies = [this.boss, ...this.enemyManager.enemies];
                    this.combat.update(this.player, combatEnemies, this.asteroidSystem.asteroids, this.explosionSystem, this.particleSystem);
                    this.uiManager.updateBossHP(this.boss.hp, this.boss.maxHP);

                    if (this.boss.state === 'RETREATING') {
                        this.uiManager.hideBossHP();
                    }

                    if (this.boss.isDead) {
                        this.nextLevel();
                    }
                }
            }
            this.uiManager.update(this.player, this.currentLevelKey, delta);
        }

        // --- CẬP NHẬT CAMERA ---
        if (this.stateManager.isGameStarted && this.player && this.player.mesh) {
            this.sceneController.update(delta, this.player.mesh);
            this.background.update(delta, this.player.mesh.position);
        } else {
            this.background.update(delta);
        }
    }
}
