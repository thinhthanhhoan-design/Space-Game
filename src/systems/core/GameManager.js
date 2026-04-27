import * as THREE from 'three';
import { SceneController } from './SceneController.js'; // Nhập lớp quản lý cảnh 3D (Camera, Ánh sáng, Renderer)
import { GameLoop } from './GameLoop.js'; // Nhập lớp vòng lặp điều khiển tiến trình trò chơi (60fps)
import gsap from 'gsap';
import { StateManager } from './StateManager.js'; // Nhập lớp quản lý các trạng thái game (Intro, Playing, v.v.)
import { Intro } from '../ui/Intro.js'; // Nhập hệ thống UI giới thiệu và hoạt cảnh đầu game
import { Player } from '../player/Player.js'; // Nhập lớp Người chơi để khởi tạo phi thuyền UETE-3637
import { Background } from '../environment/Background.js'; // Nhập hệ thống môi trường, nền vũ trụ, tinh vân
import { CinematicEffects } from '../effects/CinematicEffects.js';
import { ProjectileSystem } from '../core/ProjectileSystem.js';
import { EnemyManager } from '../enemy/Enemy.js';
import { Boss, Boss2, Boss3 } from '../enemy/Boss.js';
import { AsteroidSystem } from '../environment/AsteroidSystem.js';
import { Combat } from '../player/Combat.js';
import { UIManager } from '../ui/UIManager.js';
import { ExplosionSystem } from '../effects/Explosion.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';

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

        // Kết nối ItemSystem với UI, Camera và AsteroidSystem để hiển thị thông báo và hiệu ứng
        this.player.itemSystem.setUIManager(this.uiManager);
        this.player.itemSystem.setCamera(this.sceneController.camera);
        this.player.itemSystem.setAsteroidSystem(this.asteroidSystem);

        this.boss = null;
        this.currentLevelKey = 'LEVEL_1'; // Theo dõi màn chơi hiện tại

        this.gamePlayState = 'WAVES'; // 'WAVES', 'ASTEROIDS', 'BOSS'

        // --- ITEM SPAWN SYSTEM ---
        this.itemSpawnTimer = 0;
        this.itemSpawnInterval = CONFIG.ITEMS.SPAWN_INTERVAL || 6.5;
        // --- AUDIO SYSTEM (THÊM MỚI Ở ĐÂY) ---
        // ==========================================
        // Dùng camera từ sceneController vì nó đã được khởi tạo ở đầu hàm
        this.musicSystem = new MusicSystem(this.sceneController.camera); 
        this.musicSystem.init(); // Tải file nhạc nền
        
        // Bắt sự kiện click để phát nhạc (Tránh bị trình duyệt chặn Autoplay)
        window.addEventListener('click', () => {
            this.musicSystem.play();
        }, { once: true });
        // --- DEBUG SHORTCUTS ---
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyK') {
                this.handleSkip();
            }
        });
    }

    handleSkip() {
        const now = Date.now();
        if (this.lastSkipTime && now - this.lastSkipTime < 1500) return; // Chống spam phím K (Tăng lên 1.5s để tránh skip đúp)
        this.lastSkipTime = now;

        console.log(">>> [K] SMART SKIP TRIGGERED");

        // KIỂM TRA TẢI TÀI NGUYÊN (Asset Guard)
        if (!assetLoader.isLoaded) {
            console.warn("[K] Chờ chút, tài nguyên đang nạp...");
            if (this.uiManager) this.uiManager.showMessage("Đang tải dữ liệu, vui lòng đợi...", "#ffaa00", 2000);
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
            this.player.resetControls(); // Reset phím và góc nghiêng ngay khi vào game
            
            this.currentLevelKey = 'LEVEL_1';
            this.player.itemSystem.setLevel(this.currentLevelKey);
            this.gamePlayState = 'WAVES';
            this.enemyManager.startWaveSystem(2, 1);
            return;
        }

        // 2. Skip Waves -> Next Wave (Hoặc Boss nếu là wave cuối)
        if (this.gamePlayState === 'WAVES') {
            console.log("[K] Skipping Current Wave...");
            this.player.resetControls(); 
            this.enemyManager.clearAllEnemies(false); // Đổi thành false để chỉ bỏ qua 1 đợt
            return;
        }

        // 3. Skip Boss -> Next Level
        if (this.gamePlayState === 'BOSS' && this.boss) {
            console.log("[K] Killing Boss...");
            this.boss.takeDamage(99999); // Diệt Boss
            return;
        }

        // 4. Skip Transition/Tunnel
        if (this.gamePlayState === 'TRANSITION') {
            console.log("[K] Skipping Tunnel...");
            if (this.cinematicEffects) this.cinematicEffects.stopAll();
            this.finishTransition(); // Hàm này sẽ được gọi sau khi tunnel kết thúc
            return;
        }
    }

    nextLevel() {
        if (this.currentLevelKey === 'LEVEL_1') {
            this.currentLevelKey = 'LEVEL_2';
        } else if (this.currentLevelKey === 'LEVEL_2') {
            this.currentLevelKey = 'LEVEL_3';
        } else {
            this.gamePlayState = 'VICTORY';
            return;
        }

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
        const levelNum = parseInt(this.currentLevelKey.split('_')[1]);
        this.enemyManager.resetAndStartWaveSystem(2, levelNum);
    }

    init() { // Hàm khởi tạo chính để nạp tài nguyên và bắt đầu khởi chạy luồng game
        // Bắt đầu nạp ngầm toàn bộ Model (Background Preloading)
        assetLoader.preloadAllModels(() => {
            console.log("--- TẤT CẢ MODEL ĐÃ SẴN SÀNG ---");
            // Sau khi nạp xong model tàu, mới khởi tạo mesh cho Player
            if (this.player) this.player.initMesh();
        });

        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG; // Lấy đường dẫn ảnh nền vũ trụ từ file cấu hình chung
        this.background.init(this.sceneController.scene, bgUrl); // Truyền cảnh và đường dẫn ảnh để Background nạp textures

        // Bắt đầu chuỗi hoạt động của phần giới thiệu (Intro)
        this.intro.init((logoPoints) => { // Khi Intro nạp chữ xong, nhận lại mảng điểm logoPoints
            const checkModel = setInterval(() => { // Thiết lập bộ đếm thời gian hỏi định kỳ 100ms
                if (this.player.mesh) { // Kiểm tra nếu mô hình 3D chiếc máy bay đã được tải xong từ server
                    clearInterval(checkModel); // Nếu tàu đã xuất hiện thì ngừng việc kiểm tra lặp lại
                    // Thực hiện hiệu ứng chuyển cảnh mượt mà từ màn hình Intro vào góc nhìn sau tàu (HỘI TỤ HẠT -> TÀU XUẤT HIỆN)
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => {

                        // Đảm bảo tàu được hiển thị trực quan ngay bây giờ
                        this.player.mesh.visible = true;

                        // Kích hoạt hiệu ứng sao bay sượt qua camera tạo tốc độ Warp
                        this.cinematicEffects.startSpeedLines();

                        // Đợi 1 giây sau khi tàu hiện lên để người chơi chiêm ngưỡng, sau đó mới chạy film và lời thoại
                        setTimeout(() => {
                            // SAU KHI TÀU XUẤT HIỆN -> CHẠY SHORT FILM (CÁC CẢNH QUAY CAMERA & LỜI THOẠI)
                            this.cinematicEffects.runShortFilm(CONFIG.CINEMATIC.SHOTS, () => {

                                // SAU KHI KẾT THÚC SHORT FILM -> KÍCH HOẠT HỐ ĐEN (CLIMAX)
                                this.cinematicEffects.warningEffect();
                                this.cinematicEffects.showText("CẢNH BÁO: Phát hiện lỗ hổng không gian khổng lồ!", 2.5);

                                setTimeout(() => {
                                    // Tắt sao bay để dồn sự chú ý vào hố đen
                                    this.cinematicEffects.stopSpeedLines();

                                    this.cinematicEffects.triggerBlackHole(this.player.mesh, () => {
                                        // SAU KHI XUYÊN QUA HỐ ĐEN -> CHẠY HIỆU ỨNG ĐƯỜNG HẦM
                                        this.cinematicEffects.startTunnelEffect(this.player.mesh, () => {
                                            // KẾT THÚC ĐƯỜNG HẦM -> BẮT ĐẦU GAMEPLAY THỰC SỰ
                                            this.stateManager.setGameStarted(true);
                                            this.uiManager.show(); // Hiển thị HUD người chơi
                                            this.enemyManager.startWaveSystem(2, 1); // Bắt đầu Màn 1 (2 wave)

                                            // Hiệu ứng nhiễu nhiệt động cơ bằng ô vuông (Đã tạm ẩn vì lỗi hình khối)
                                            // this.explosionSystem.attachEngineHeat(this.player.mesh);
                                        });
                                    });
                                }, 1500);

                            });
                        }, 1000);
                    }); // Kết thúc callback hàm chuyển cảnh
                } // Kết thúc kiểm tra model
            }, 100); // Tần suất kiểm tra là 0.1 giây một lần
        }); // Kết thúc callback khởi tạo intro

        this.gameLoop.start(); // Chính thức kích hoạt vòng lặp game liên tục (requestAnimationFrame)
    } // Kết thúc hàm nạp tài nguyên

    update(elapsedTime, delta) { // Hàm cập nhật logic game
        this.uiManager.updateFPS(delta); // Luôn cập nhật FPS ở mọi trạng thái

        if (!this.stateManager.isGameStarted) {
            this.intro.update(elapsedTime); // Chỉ cập nhật Intro khi game chưa bắt đầu
        } else { // Khi game đã bắt đầu (PLAYING)
            if (this.player && this.player.mesh) { // Đảm bảo mô hình tàu đã sẵn sàng
                this.player.mesh.visible = true;
                let currentEnemies = [];
                if (this.gamePlayState === 'WAVES') {
                    currentEnemies = this.enemyManager.enemies;
                } else if (this.gamePlayState === 'BOSS' && this.boss) {
                    currentEnemies = [this.boss, ...this.enemyManager.enemies];
                }
                //this.player.update(currentEnemies); // Gọi logic điều khiển tàu, truyền list quái vào để vẽ tâm ngắm
                //this.uiManager.update(this.player, this.enemyManager.killCount || 0); // Liên tục cập nhật HUD máu, đạn
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
                    this.explosionSystem.spawnShipImpact(this.player.mesh.position); // Hiệu ứng khói/lửa khi trúng đạn
                    this.explosionSystem.startWarning(0.4); // Nháy đỏ nhẹ màn hình khi bị thương
                }

                // --- Cập nhật Items tự do (Bay từ xa tới tương đương quái) ---
                this.itemSpawnTimer += delta;
                if (this.itemSpawnTimer > this.itemSpawnInterval) {
                    this.itemSpawnTimer = 0;
                    // Danh sách item với trọng số (SHIELD, HEALTH và SÚNG xuất hiện nhiều hơn)
                    const itemTypes = [
                        'HEALTH', 'HEALTH', 
                        'AMMO', 
                        'SHIELD', 'SHIELD', 'SHIELD', 
                        'WEAPON_2', 'WEAPON_2', // Tăng tỉ lệ Súng 2
                        'WEAPON_3', 'WEAPON_3', // Tăng tỉ lệ Súng 3
                        'WEAPON_LOCK', 
                        'ASTEROID_ITEM'
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
                            if (this.currentLevelKey === 'LEVEL_1') {
                                this.boss = new Boss(this.sceneController.scene, this.projectileSystem, this.player.itemSystem);

                                // Hiệu ứng CẢNH BÁO trước khi Boss vào trận
                                this.explosionSystem.startWarning(3.0);
                                this.sceneController.triggerShake(0.35, 3.0); // Giảm rung xuống 0.35 cho dễ nhìn hơn
                                if (this.uiManager.showBossHP) this.uiManager.showBossHP("TRÙM KHÔNG GIAN V1");

                                this.boss.onRetreatComplete = () => {
                                    console.log("Boss 1 đã bỏ chạy. Sinh lại Wave quái 1!");
                                    if (this.uiManager.hideBossHP) this.uiManager.hideBossHP(); // Ẩn thanh máu khi đổi phase
                                    this.gamePlayState = 'WAVES';
                                    this.enemyManager.resetAndStartWaveSystem(1, 1); // 1 wave ở Màn 1
                                };
                            } else if (this.currentLevelKey === 'LEVEL_2') {
                                this.boss = new Boss2(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.enemyManager);

                                // Hiệu ứng CẢNH BÁO
                                this.explosionSystem.startWarning(3.0);
                                this.sceneController.triggerShake(0.5, 3.0); 
                                if (this.uiManager.showBossHP) this.uiManager.showBossHP("KẺ HỦY DIỆT V2");
                            } else if (this.currentLevelKey === 'LEVEL_3') {
                                this.boss = new Boss3(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.player);

                                // Hiệu ứng CẢNH BÁO
                                this.explosionSystem.startWarning(3.0);
                                this.sceneController.triggerShake(0.6, 3.0); 
                                if (this.uiManager.showBossHP) this.uiManager.showBossHP("CHÚA TỂ BÓNG TỐI V3");
                            }
                        } else {
                            // Boss quay trở lại (chỉ áp dụng cho Boss 1 phase 2)
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
                        this.enemyManager.update(delta, this.player.mesh.position); // Cập nhật cả quái do Boss sinh ra
                        
                        const combatEnemies = [this.boss, ...this.enemyManager.enemies];
                        this.combat.update(this.player, combatEnemies, this.asteroidSystem.asteroids, this.explosionSystem, this.particleSystem);
                        this.uiManager.updateBossHP(this.boss.hp, this.boss.maxHP);

                        if (this.boss.state === 'RETREATING') {
                            this.uiManager.hideBossHP();
                        }

                        if (this.boss.isDead) {
                            this.uiManager.hideBossHP();
                            this.explosionSystem.spawnBossExplosion(this.boss.mesh.position);
                            this.sceneController.triggerShake(1.5, 0.8);
                            this.nextLevel();
                        }
                    }
                }
            }
            this.uiManager.update(this.player, this.currentLevelKey);
        } // Kết thúc khối phân nhánh trạng thái

        // --- CẬP NHẬT CAMERA (Camera Update) ---
        if (this.stateManager.isGameStarted && this.player && this.player.mesh) {
            this.sceneController.update(delta, this.player.mesh);
            this.background.update(delta, this.player.mesh.position);
        } else {
            this.background.update(delta);
        }
    }
}

