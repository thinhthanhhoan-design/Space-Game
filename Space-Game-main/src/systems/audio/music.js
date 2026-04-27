import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export class MusicSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.audioLoader = new THREE.AudioLoader();
        this.bgm = {
            intro: new THREE.Audio(this.listener),
            battle: new THREE.Audio(this.listener)
        };
        this.sfx = {};
        this.ready = false;
        this.currentBgm = null;
        this.pendingUnlock = false;
        this.bgmBaseVolume = {
            intro: 0.72,
            battle: 0.82
        };
        // Bật mặc định để user chỉ cần chạy game vẫn có SFX rõ ràng,
        // không phụ thuộc việc đã chuẩn bị file âm thanh riêng hay chưa.
        this.forceSynthForSfx = true;
        this.introNoiseLoopTimer = null;
        this.lastLaserSfxAt = 0;
    }

    init() {
        const soundMap = {
            bgm_intro_signal_loss: [CONFIG.ASSETS.SOUNDS.BGM_INTRO_SIGNAL_LOSS, '/audio/music/nen_game.mp3'],
            bgm_battle_main: [CONFIG.ASSETS.SOUNDS.BGM_BATTLE_MAIN, '/audio/music/nen_game.mp3'],
            sfx_game_start_click: [CONFIG.ASSETS.SOUNDS.SFX_GAME_START_CLICK, '/audio/music/nen_game.mp3'],
            sfx_ship_take_damage: [CONFIG.ASSETS.SOUNDS.SFX_SHIP_TAKE_DAMAGE, '/audio/music/nen_game.mp3'],
            sfx_enemy_or_asteroid_explode: [CONFIG.ASSETS.SOUNDS.SFX_ENEMY_OR_ASTEROID_EXPLODE, '/audio/music/nen_game.mp3'],
            sfx_boss_final_explode: [CONFIG.ASSETS.SOUNDS.SFX_BOSS_FINAL_EXPLODE, '/audio/music/nen_game.mp3'],
            sfx_black_hole_suction: [CONFIG.ASSETS.SOUNDS.SFX_BLACK_HOLE_SUCTION, '/audio/music/nen_game.mp3'],
            sfx_intro_signal_noise: [CONFIG.ASSETS.SOUNDS.SFX_INTRO_SIGNAL_NOISE, '/audio/music/nen_game.mp3'],
            sfx_laser_shoot: [CONFIG.ASSETS.SOUNDS.SFX_LASER, '/audio/music/nen_game.mp3']
        };

        const loadTasks = Object.entries(soundMap).map(([key, urls]) => this.loadAudioByKey(key, urls));
        Promise.all(loadTasks).finally(() => {
            this.ready = true;
            console.log('🎵 Audio system initialized');
            if (this.pendingUnlock && !this.currentBgm) {
                this.playStartSequence();
            }
        });
    }

    playSynthSfx(key = 'default') {
        const ctx = this.listener?.context;
        if (!ctx) return;
        const freqMap = {
            sfx_game_start_click: 740,
            sfx_ship_take_damage: 220,
            sfx_enemy_or_asteroid_explode: 160,
            sfx_boss_final_explode: 95,
            sfx_black_hole_suction: 280,
            sfx_intro_signal_noise: 860
        };
        const freq = freqMap[key] || 440;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
    }

    loadAudioByKey(key, urls = []) {
        return new Promise((resolve) => {
            const candidates = Array.isArray(urls) ? urls.filter(Boolean) : [urls].filter(Boolean);
            if (candidates.length === 0) {
                resolve();
                return;
            }

            const tryLoad = (index) => {
                if (index >= candidates.length) {
                    resolve();
                    return;
                }

                this.audioLoader.load(
                    candidates[index],
                    (buffer) => {
                        if (key.startsWith('bgm_intro')) {
                            this.bgm.intro.setBuffer(buffer);
                            this.bgm.intro.setLoop(true);
                            this.bgm.intro.setVolume(this.bgmBaseVolume.intro);
                        } else if (key.startsWith('bgm_battle')) {
                            this.bgm.battle.setBuffer(buffer);
                            this.bgm.battle.setLoop(true);
                            this.bgm.battle.setVolume(this.bgmBaseVolume.battle);
                        } else {
                            const sfx = new THREE.Audio(this.listener);
                            sfx.setBuffer(buffer);
                            sfx.setLoop(false);
                            sfx.setVolume(0.75);
                            this.sfx[key] = sfx;
                        }
                        resolve();
                    },
                    undefined,
                    () => tryLoad(index + 1)
                );
            };

            tryLoad(0);
        });
    }

    ensureAudioContext() {
        const ctx = this.listener?.context;
        if (!ctx || ctx.state !== 'suspended') return Promise.resolve();
        return ctx.resume().catch(() => {});
    }

    playIntroBgm() {
        if (this.currentBgm === this.bgm.intro || !this.bgm.intro.buffer) return;
        this.ensureAudioContext().finally(() => {
            this.stopBgm();
            this.bgm.intro.play();
            this.currentBgm = this.bgm.intro;
        });
    }

    playBattleBgm() {
        if (this.currentBgm === this.bgm.battle || !this.bgm.battle.buffer) return;
        this.ensureAudioContext().finally(() => {
            this.stopBgm();
            this.bgm.battle.play();
            this.currentBgm = this.bgm.battle;
        });
    }

    stopBgm() {
        if (this.bgm.intro.isPlaying) this.bgm.intro.stop();
        if (this.bgm.battle.isPlaying) this.bgm.battle.stop();
        this.currentBgm = null;
    }

    playSfx(key, volume = 0.8) {
        this.ensureAudioContext().finally(() => {
            const source = this.sfx[key];
            // Ducking nhẹ nhạc nền để SFX nghe rõ hơn.
            const activeBgm = this.currentBgm;
            const originalVolume = activeBgm?.getVolume?.() ?? null;
            const shouldDuck = !this.forceSynthForSfx;
            if (shouldDuck && activeBgm && originalVolume !== null) {
                activeBgm.setVolume(Math.max(0.35, originalVolume * 0.7));
            }

            if (this.forceSynthForSfx || !source || !source.buffer) {
                this.playSynthSfx(key);
            } else {
                if (source.isPlaying) source.stop();
                source.setVolume(volume);
                source.play();
            }

            if (shouldDuck && activeBgm && originalVolume !== null) {
                setTimeout(() => {
                    activeBgm.setVolume(originalVolume);
                }, 180);
            }
        });
    }

    playStartSequence() {
        this.playSfx('sfx_game_start_click', 0.9);
        this.playIntroBgm();
    }

    switchToBattleMusic() {
        this.playBattleBgm();
    }

    playShipDamaged() {
        this.playSfx('sfx_ship_take_damage', 0.75);
    }

    playEnemyOrAsteroidExplode() {
        this.playSfx('sfx_enemy_or_asteroid_explode', 0.8);
    }

    playBossFinalExplosion() {
        this.playSfx('sfx_boss_final_explode', 0.95);
    }

    playIntroSignalNoise() {
        this.playSfx('sfx_intro_signal_noise', 0.65);
    }

    playBlackHoleSuction() {
        this.playSfx('sfx_black_hole_suction', 0.85);
    }

    startIntroSignalNoiseLoop() {
        if (this.introNoiseLoopTimer) return;
        this.introNoiseLoopTimer = setInterval(() => {
            this.playSfx('sfx_intro_signal_noise', 0.45);
        }, 650);
    }

    stopIntroSignalNoiseLoop() {
        if (!this.introNoiseLoopTimer) return;
        clearInterval(this.introNoiseLoopTimer);
        this.introNoiseLoopTimer = null;
    }

    playLaserShot() {
        const now = performance.now();
        if (now - this.lastLaserSfxAt < 80) return; // chống spam âm bị bể tiếng
        this.lastLaserSfxAt = now;
        this.playSfx('sfx_laser_shoot', 0.42);
    }

    unlockAudio() {
        this.pendingUnlock = true;
        this.ensureAudioContext().finally(() => {
            if (!this.ready) return;
            if (!this.currentBgm) {
                this.playStartSequence();
            }
        });
    }
}