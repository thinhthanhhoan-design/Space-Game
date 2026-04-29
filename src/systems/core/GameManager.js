import * as THREE from 'three';
import { SceneController } from './SceneController.js';
import { GameLoop } from './GameLoop.js';
import gsap from 'gsap';
import { StateManager } from './StateManager.js';
import { Intro } from '../ui/Intro.js';
import { Story } from '../ui/Story.js';
import { Player } from '../player/Player.js';
import { Background } from '../environment/Background.js';
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
import { Crosshair } from '../ui/Crosshair.js';
import { ScoreSystem } from '../player/Score.js';
import { Splash } from '../ui/Splash.js';
import { modelCache } from '../../utils/ModelCache.js';
import { CONFIG } from '../../utils/CONFIG.JS';
import { MusicSystem } from '../audio/music.js';

export class GameManager {
    constructor() {
        this.sceneController = new SceneController();
        this.stateManager = new StateManager();
        this.gameLoop = new GameLoop(this.sceneController, this);

        this.intro = new Intro(this.sceneController);
        this.player = new Player(this.sceneController.scene);
        this.background = new Background();

        this.musicSystem = new MusicSystem(this.sceneController.camera);
        
        this.cinematicEffects = new CinematicEffects(this.sceneController.scene, this.sceneController.camera, this.musicSystem);
        this.projectileSystem = new ProjectileSystem(this.sceneController.scene);
        this.enemyManager = new EnemyManager(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.musicSystem);
        this.asteroidSystem = new AsteroidSystem(this.sceneController.scene);
        this.combat = new Combat();
        this.explosionSystem = new ExplosionSystem(this.sceneController.scene, this.sceneController.camera);
        this.particleSystem = new ParticleSystem(this.sceneController.scene);
        this.uiManager = new UIManager();
        this.endingUI = new EndingUI();

        // Cấu hình liên kết giữa các hệ thống
        this.player.setMusicSystem(this.musicSystem);
        this.player.itemSystem.setUIManager(this.uiManager);
        this.player.itemSystem.setCamera(this.sceneController.camera);
        this.player.itemSystem.setAsteroidSystem(this.asteroidSystem);
        this.player.itemSystem.setScoreCallback((amt) => this.scoreSystem.addScore(amt));

        this.boss = null;
        this._bossHandled = false;
        this.currentLevelKey = 'LEVEL_1';
        this.gamePlayState = 'WAVES';
        this.isGameOver = false;
        this._victoryTriggered = false;
        this.hasPlayedStoryLV2 = false;
        
        this.scoreSystem = new ScoreSystem();

        this.itemSpawnTimer = 0;
        this.itemSpawnInterval = CONFIG.ITEMS.SPAWN_INTERVAL || 6.5;

        new Splash(() => {
            if (this.musicSystem) {
                this.musicSystem.play();
            }
            this.startIntroSequence();
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyK') {
                this.handleSkip();
            }
        });
    }

    // Chuỗi kịch bản mở đầu game
    startIntroSequence() {
        if (this._introStarted) return;
        this._introStarted = true;

        this.intro.init((logoPoints) => {
            const checkModel = setInterval(() => {
                if (this.player.mesh) {
                    clearInterval(checkModel);
                    if (this.musicSystem) this.musicSystem.fadeOut('NEN_GAME', 3.5);
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, this.musicSystem, () => {
                        if (this.stateManager.isGameStarted) return;
                        this.player.mesh.visible = true;

                        if (this.musicSystem) this.musicSystem.playIntroMusic();

                        this.cinematicEffects.startSpeedLines();
                        setTimeout(() => {
                            if (this.stateManager.isGameStarted) return;

                            this.cinematicEffects.runShortFilm(CONFIG.CINEMATIC.SHOTS, () => {
                                if (this.stateManager.isGameStarted) return;
                                this.cinematicEffects.warningEffect();
                                this.cinematicEffects.showText(CONFIG.STRINGS.WARNING_BLACKHOLE, 2.5);
                                setTimeout(() => {
                                    if (this.stateManager.isGameStarted) return;

                                    this.cinematicEffects.stopAll();
                                    this.cinematicEffects.triggerBlackHole(this.player.mesh, () => {
                                        if (this.stateManager.isGameStarted) return;

                                        if (this.musicSystem) this.musicSystem.playSound('CHUYEN_MAN');
                                        this.cinematicEffects.startTunnelEffect(this.player.mesh, () => {
                                            if (this.stateManager.isGameStarted) return;
                                            this.stateManager.setGameStarted(true);
                                            this.uiManager.show();
                                            this.enemyManager.startWaveSystem(1);
                                            if (this.musicSystem) this.musicSystem.play();
                                        });
                                    });
                                }, 1500);
                            });
                        }, 1000);
                    });
                }
            }, 100);
        }, () => {
            if (this.musicSystem) {
                this.musicSystem.playStartSound();
                this.musicSystem.play();
            }
        });
    }

    // Xử lý bỏ qua (Skip) phim/intro
    handleSkip() {
        const now = Date.now();
        if (this.lastSkipTime && now - this.lastSkipTime < 1500) return;
        this.lastSkipTime = now;

        if (!this.stateManager.isGameStarted) {
            if (this.cinematicEffects) this.cinematicEffects.stopAll();
            if (this.intro) this.intro.abort();

            this.stateManager.setGameStarted(true);
            this.uiManager.show();
            if (this.player.mesh) this.player.mesh.visible = true;
            this.player.resetControls();

            this.currentLevelKey = 'LEVEL_1';
            this.player.itemSystem.setLevel(this.currentLevelKey);
            this.gamePlayState = 'WAVES';
            this.enemyManager.startWaveSystem(1);
            if (this.musicSystem) this.musicSystem.play();
            return;
        }

        if (this.gamePlayState === 'WAVES') {
            this.player.resetControls();
            this.enemyManager.clearAllEnemies(false);
            return;
        }

        if (this.gamePlayState === 'BOSS' && this.boss) {
            this.boss.takeDamage(99999);
            return;
        }

        if (this.gamePlayState === 'TRANSITION') {
            if (this.cinematicEffects) this.cinematicEffects.stopAll();
            this.finishTransition();
            return;
        }
    }

    // Chuyển màn sau khi tiêu diệt Boss
    nextLevel() {
        if (this._bossHandled) return;
        this._bossHandled = true;

        this.uiManager.hideBossHP();
        if (this.explosionSystem) {
            this.explosionSystem.spawnBossExplosion(this.boss.mesh.position);
        }
        this.sceneController.triggerShake(1.5, 0.8);

        const explosionDelay = 2000;

        setTimeout(() => {
            if (this.currentLevelKey === 'LEVEL_1') {
                if (!this.hasPlayedStoryLV2) {
                    this.hasPlayedStoryLV2 = true;
                    const story = new Story();
                    story.play('LV1_INTRO', () => {
                        this.startLevelTransition('LEVEL_2');
                        this.cinematicEffects?.showText("LEVEL 2 - CẨN THẬN!", 3);
                    });
                }
            } else if (this.currentLevelKey === 'LEVEL_2') {
                const story = new Story();
                story.playLevel3Transition(this, () => {
                    this.startLevelTransition('LEVEL_3');
                    this.cinematicEffects?.showText(CONFIG.STORY.LV2_TRANSITION.ui_text, 3);
                });
            } else {
                if (this._victoryTriggered) return;
                this._victoryTriggered = true;

                this.gamePlayState = 'VICTORY';
                this.uiManager.hide();
                const victoryStory = new Story();
                this.musicSystem.playVictorySound();
                victoryStory.playVictoryEnding(() => {
                    this.endingUI.show('WIN', this.scoreSystem.getFinalScore(), this.scoreSystem.getTime());
                });
            }
        }, explosionDelay);
    }

    // Bắt đầu hiệu ứng chuyển màn
    startLevelTransition(nextLevelKey) {
        this.currentLevelKey = nextLevelKey;
        this.uiManager.showMessage(`TIẾN VÀO ${this.currentLevelKey.replace(/_/g, ' ')}`, "#00ffff", 3000);
        this.gamePlayState = 'TRANSITION';
        if (this.asteroidSystem) this.asteroidSystem.setLevel(this.currentLevelKey);
        if (this.player.itemSystem) this.player.itemSystem.setLevel(this.currentLevelKey);

        if (this.musicSystem) {
            this.musicSystem.playSound('CHUYEN_MAN');
            if (nextLevelKey === 'LEVEL_2') this.musicSystem.playBGM('LEVEL_2');
            if (nextLevelKey === 'LEVEL_3') this.musicSystem.playBGM('LEVEL_3');
        }

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
            this.boss.die(true);
            this.boss = null;
        }
        this._bossHandled = false;
        const levelNum = parseInt(this.currentLevelKey.split('_')[1]);
        this.enemyManager.resetAndStartWaveSystem(levelNum);
    }

    async init() {
        await modelCache.preloadAll();

        if (this.player) this.player.initMesh();
        if (this.musicSystem) this.musicSystem.init();

        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG;
        this.background.init(this.sceneController.scene, bgUrl);

        this.gameLoop.start();
    }

    update(elapsedTime, delta) {
        this.uiManager.updateFPS(delta);

        if (!this.isGameOver && !this._victoryTriggered) {
            this.scoreSystem.updateTime(delta);
        }

        if (!this.stateManager.isGameStarted) {
            this.intro.update(elapsedTime);
            this.background.update(delta);
            return;
        }

        if (this.player && this.player.mesh) {
            // Kiểm tra Game Over
            if (this.player.hp <= 0 && !this.isGameOver) {
                this.isGameOver = true;
                this.uiManager.hide();
                this.musicSystem.playGameOverSound();
                this.endingUI.show('GAME_OVER', this.scoreSystem.getFinalScore(), this.scoreSystem.getTime());
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

            // Hiệu ứng ngân hà xoay theo vị trí tàu
            const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
            let xRatio = this.player.mesh.position.x / envX;
            xRatio = Math.max(-1.8, Math.min(1.8, xRatio));
            const targetBgRoll = -xRatio * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT;
            this.background.setRoll(targetBgRoll, CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS);

            // Cập nhật các hệ thống
            this.projectileSystem.update(delta);
            this.asteroidSystem.update(delta);
            this.explosionSystem.update(delta);

            // Kiểm tra va chạm đạn với người chơi
            const dmg = this.projectileSystem.checkCollision(this.player.mesh, 1.2);
            if (dmg) {
                this.player.takeDamage(dmg);
                if (this.musicSystem) this.musicSystem.playSound('HIEU_UNG_TAU_TRUNG_DON');
                this.sceneController.triggerShake(0.3, 0.2);
                if (this.explosionSystem) {
                    this.explosionSystem.spawnShipImpact(this.player.mesh.position);
                    this.explosionSystem.spawnShockwave(this.player.mesh.position, 0xff0000, 5);
                }
                this.explosionSystem.startWarning(0.4);
            }

            // Spawn vật phẩm định kỳ
            this.itemSpawnTimer += delta;
            if (this.itemSpawnTimer > this.itemSpawnInterval) {
                this.itemSpawnTimer = 0;
                const itemTypes = [
                    'HEALTH', 'HEALTH', 'AMMO', 'SHIELD', 'SHIELD', 'SHIELD',
                    'WEAPON_LOCK', 'ASTEROID_ITEM', 'WEAPON_2', 'WEAPON_2', 'WEAPON_3', 'WEAPON_3'
                ];
                const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                this.player.itemSystem.spawnItem(type);
            }

            // Logic chính theo trạng thái game
            if (this.gamePlayState === 'WAVES') {
                this.enemyManager.update(delta, this.player.mesh.position);
                this.combat.update(this.player, this.enemyManager.enemies, this.asteroidSystem.asteroids, this.explosionSystem, this.particleSystem, this.sceneController, this.musicSystem, (amt) => this.scoreSystem.addScore(amt));

                // Chuyển sang đấu Boss khi hết quái
                if (this.enemyManager.isAllWavesCleared && this.enemyManager.enemies.length === 0) {
                    this.gamePlayState = 'BOSS';
                    if (!this.boss || this.boss.isDead) {
                        this._bossHandled = false;
                        if (this.currentLevelKey === 'LEVEL_1') {
                            this.boss = new Boss(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, 'BOSS_1', this.musicSystem);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.35, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("TRÙM KHÔNG GIAN V1");

                            this.boss.onRetreatComplete = () => {
                                if (this.uiManager.hideBossHP) this.uiManager.hideBossHP();
                                this.gamePlayState = 'WAVES';
                                this.enemyManager.resetAndStartWaveSystem(1, 1);
                            };
                        } else if (this.currentLevelKey === 'LEVEL_2') {
                            this.boss = new Boss2(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.enemyManager, this.musicSystem);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.5, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("KẺ HỦY DIỆT V2");
                        } else if (this.currentLevelKey === 'LEVEL_3') {
                            this.boss = new Boss3(this.sceneController.scene, this.projectileSystem, this.player.itemSystem, this.player, this.musicSystem);
                            this.explosionSystem.startWarning(3.0);
                            this.sceneController.triggerShake(0.6, 3.0);
                            if (this.uiManager.showBossHP) this.uiManager.showBossHP("CHÚA TỂ BÓNG TỐI V3");
                        }
                    } else {
                        // Boss LV1 quay lại cho trận cuối
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
                    this.combat.update(this.player, combatEnemies, this.asteroidSystem.asteroids, this.explosionSystem, this.particleSystem, null, this.musicSystem, (amt) => this.scoreSystem.addScore(amt));
                    this.uiManager.updateBossHP(this.boss.hp, this.boss.maxHP);

                    if (this.boss.state === 'RETREATING') {
                        this.uiManager.hideBossHP();
                    }

                    if (this.boss.isDead) {
                        this.nextLevel();
                    }
                }
            }
            this.uiManager.update(this.player, this.currentLevelKey, delta, this.scoreSystem.getScore());
        }

        if (this.stateManager.isGameStarted && this.player && this.player.mesh) {
            this.sceneController.update(delta, this.player.mesh);
            this.background.update(delta, this.player.mesh.position);
        } else {
            this.background.update(delta);
        }
    }
}
