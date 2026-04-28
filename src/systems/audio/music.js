import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { modelCache } from '../../utils/ModelCache.js';
import gsap from 'gsap';

export class MusicSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        // Chứa tất cả các đối tượng Audio nạp từ CONFIG
        this.sounds = {};

        this.isLoaded = false;
        this.playQueue = false;
    }

    init() {
        console.log('📦 [MusicSystem] Bắt đầu kết nối bộ nhớ đệm âm thanh...');
        const paths = CONFIG.AUDIO.PATHS;
        for (const key of Object.keys(paths)) {
            const buffer = modelCache.getAudioBuffer(key);
            if (buffer) {
                const audio = new THREE.Audio(this.listener);
                audio.setBuffer(buffer);
                
                if (key === 'NEN_GAME' || key === 'NEN_INTRO') audio.setLoop(true);

                const vol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
                audio.setVolume(vol);
                
                this.sounds[key] = audio;
                console.log(`✅ [MusicSystem] Loaded sound: ${key} (Vol: ${vol})`);
            } else {
                console.warn(`⚠️ [MusicSystem] Missing buffer for: ${key}`);
            }
        }
        this.isLoaded = true;
        if (this.playQueue) this.play();
    }

    /**
     * Phát một âm thanh bất kỳ dựa trên Key trong CONFIG
     */
    async playSound(key, forceRestart = true) {
        console.log(`🔍 [MusicSystem] Requesting play: ${key}`);
        
        // ĐÁNH THỨC AUDIOCONTEXT
        if (this.listener.context.state === 'suspended') {
            console.log('💤 [MusicSystem] AudioContext is suspended, resuming...');
            await this.listener.context.resume();
        }
        console.log(`🔊 [MusicSystem] AudioContext state: ${this.listener.context.state}`);

        const audio = this.sounds[key];
        if (!audio || !audio.buffer) {
            console.error(`❌ [MusicSystem] Không thể phát: ${key}. Buffer: ${audio ? 'Exists' : 'Missing'}`);
            return;
        }

        console.log(`🎵 [MusicSystem] Buffer duration for ${key}: ${audio.buffer.duration}s`);

        const vol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
        audio.setVolume(vol);

        if (forceRestart && audio.isPlaying) {
            audio.stop();
        }

        if (!audio.isPlaying) {
            console.log(`▶️ [MusicSystem] Calling audio.play() for ${key} at volume ${vol}`);
            audio.play();
        }
    }

    /**
     * Logic phát nhạc nền (Hỗ trợ hàng chờ)
     */
    play() {
        const bgm = this.sounds['NEN_GAME'];
        if (!bgm) return;

        // Nếu nhạc nền chính đang phát rồi thì thôi, không dừng/phát lại làm gì
        if (bgm.isPlaying) return;

        this.fadeOut('NEN_INTRO', 1.5); // Làm nhỏ dần nhạc Intro (nếu đang phát) trước khi vào Game

        // ĐÁNH THỨC AUDIOCONTEXT một cách an toàn
        if (this.listener.context.state === 'suspended') {
            // Chỉ cố gắng resume nếu đã có tương tác người dùng, tránh gây lỗi Console
            this.listener.context.resume().catch(() => {
                // Im lặng nếu bị trình duyệt chặn, sẽ thử lại ở lần click sau
            });
        }

        // Cập nhật volume real-time
        const vol = Number(CONFIG.AUDIO.NEN_GAME) || 0.2;
        bgm.setVolume(vol);

        if (this.isLoaded) {
            if (!bgm.isPlaying) {
                bgm.play();
                console.log(`[MusicSystem] 🔊 Đang phát BGM: Vol ${vol}`);
            }
        } else {
            this.playQueue = true;
        }
    }

    /**
     * Dừng các bản nhạc nền (không dừng hiệu ứng âm thanh)
     */
    stop() {
        const musicKeys = ['NEN_GAME', 'NEN_INTRO'];
        musicKeys.forEach(key => {
            const audio = this.sounds[key];
            if (audio && audio.isPlaying) {
                audio.stop();
            }
        });
        console.log('[MusicSystem] 🔇 Đã dừng các bản nhạc nền.');
    }

    /**
     * Làm nhỏ dần âm lượng của một bản nhạc rồi dừng hẳn
     */
    fadeOut(key, duration = 1.5) {
        const audio = this.sounds[key];
        if (audio && audio.isPlaying) {
            // Lấy âm lượng hiện tại bằng hàm chuẩn của Three.js
            const target = { volume: audio.getVolume() }; 
            
            gsap.to(target, {
                volume: 0,
                duration: duration,
                onUpdate: () => {
                    audio.setVolume(target.volume);
                },
                onComplete: () => {
                    audio.stop();
                    // Reset lại volume chuẩn trong CONFIG sau khi dừng để lần sau phát lại ko bị 0
                    const originalVol = CONFIG.AUDIO[key] !== undefined ? Number(CONFIG.AUDIO[key]) : 0.5;
                    audio.setVolume(originalVol);
                }
            });
        }
    }

    /**
     * Phát nhạc nền Intro (Khi logo vỡ ra hoặc tụ lại)
     */
    async playIntroMusic() {
        console.log('🎬 [MusicSystem] Starting Intro Music: NEN_INTRO');
        
        // Đảm bảo dừng hẳn các nhạc cũ trước khi nhạc mới bùng nổ
        this.stop(); 
        
        await this.playSound('NEN_INTRO');
    }

    // --- CÁC HÀM TƯƠNG THÍCH NGƯỢC (LEGACY METHODS) ---
    // Giúp các file khác không bị lỗi khi gọi tên hàm cũ

    playLevelUpSound() {
        this.playSound('LEVEL_UP');
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