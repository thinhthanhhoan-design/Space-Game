import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { modelCache } from '../../utils/ModelCache.js';
import gsap from 'gsap';

export class MusicSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.sounds = {};
        this.isLoaded = false;
        this.playQueue = false;
    }

    // Khởi tạo và nạp âm thanh từ modelCache
    init() {
        const paths = CONFIG.AUDIO.PATHS;
        for (const key of Object.keys(paths)) {
            const buffer = modelCache.getAudioBuffer(key);
            if (buffer) {
                const audio = new THREE.Audio(this.listener);
                audio.setBuffer(buffer);
                
                if (['NEN_GAME', 'NEN_INTRO', 'LEVEL_2', 'LEVEL_3'].includes(key)) {
                    audio.setLoop(true);
                }

                const vol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
                audio.setVolume(vol);
                
                this.sounds[key] = audio;
            }
        }
        this.isLoaded = true;
        if (this.playQueue) this.play();
    }

    /**
     * Phát âm thanh theo key trong CONFIG
     */
    async playSound(key, forceRestart = true) {
        if (this.listener.context.state === 'suspended') {
            await this.listener.context.resume();
        }

        const audio = this.sounds[key];
        if (!audio || !audio.buffer) {
            console.error(`MusicSystem: Không tìm thấy buffer cho ${key}`);
            return;
        }

        const vol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
        audio.setVolume(vol);

        if (forceRestart && audio.isPlaying) {
            audio.stop();
        }

        if (!audio.isPlaying) {
            audio.play();
        }
    }

    /**
     * Phát nhạc nền chính
     */
    play() {
        const bgm = this.sounds['NEN_GAME'];
        if (!bgm || bgm.isPlaying) return;

        this.fadeOut('NEN_INTRO', 1.5);

        if (this.listener.context.state === 'suspended') {
            this.listener.context.resume().catch(() => {});
        }

        const vol = Number(CONFIG.AUDIO.NEN_GAME) || 0.2;
        bgm.setVolume(vol);

        if (this.isLoaded) {
            if (!bgm.isPlaying) {
                bgm.play();
            }
        } else {
            this.playQueue = true;
        }
    }

    /**
     * Dừng toàn bộ nhạc nền
     */
    stop() {
        const musicKeys = ['NEN_GAME', 'NEN_INTRO', 'LEVEL_2', 'LEVEL_3'];
        musicKeys.forEach(key => {
            const audio = this.sounds[key];
            if (audio && audio.isPlaying) {
                audio.stop();
            }
        });
    }

    /**
     * Chuyển đổi nhạc nền có hiệu ứng fade
     */
    playBGM(key, fadeDuration = 1.5) {
        if (!this.sounds[key]) return;

        const musicKeys = ['NEN_GAME', 'NEN_INTRO', 'LEVEL_2', 'LEVEL_3'];
        musicKeys.forEach(mKey => {
            if (mKey !== key) {
                this.fadeOut(mKey, fadeDuration);
            }
        });

        const bgm = this.sounds[key];
        if (!bgm.isPlaying) {
            const vol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
            bgm.setVolume(0);
            bgm.play();
            
            const target = { volume: 0 };
            gsap.to(target, {
                volume: vol,
                duration: fadeDuration,
                onUpdate: () => {
                    bgm.setVolume(target.volume);
                }
            });
        }
    }

    /**
     * Giảm âm lượng nhạc và dừng
     */
    fadeOut(key, duration = 1.5) {
        const audio = this.sounds[key];
        if (audio && audio.isPlaying) {
            const target = { volume: audio.getVolume() }; 
            
            gsap.to(target, {
                volume: 0,
                duration: duration,
                onUpdate: () => {
                    audio.setVolume(target.volume);
                },
                onComplete: () => {
                    audio.stop();
                    const originalVol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
                    audio.setVolume(originalVol);
                }
            });
        }
    }

    /**
     * Phát nhạc nền Intro
     */
    async playIntroMusic() {
        this.stop(); 
        await this.playSound('NEN_INTRO');
    }

    // --- Legacy methods ---
    playLevelUpSound() {
        this.playSound('CHUYEN_MAN');
    }

    playVictorySound() {
        if (this.sounds['NEN_GAME']) this.sounds['NEN_GAME'].stop();
        this.playSound('VICTORY');
    }

    playGameOverSound() {
        if (this.sounds['NEN_GAME']) this.sounds['NEN_GAME'].stop();
        this.playSound('GAMEOVER');
    }

    playStartSound() {
        this.playSound('HIEU_UNG_START');
    }
}