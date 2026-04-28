import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

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
        const audioLoader = new THREE.AudioLoader();
        const paths = CONFIG.AUDIO.PATHS;
        const totalSounds = Object.keys(paths).length;
        let loadedCount = 0;

        // TỰ ĐỘNG NẠP TẤT CẢ ÂM THANH KHAI BÁO TRONG CONFIG
        for (const [key, path] of Object.entries(paths)) {
            const audio = new THREE.Audio(this.listener);
            this.sounds[key] = audio;

            audioLoader.load(path, (buffer) => {
                audio.setBuffer(buffer);
                
                // Thiết lập Loop nếu là nhạc nền
                if (key === 'NEN_GAME') {
                    audio.setLoop(true);
                }

                // Cài đặt Volume ban đầu từ CONFIG
                const vol = Number(CONFIG.AUDIO[key]) || 0.5;
                audio.setVolume(vol);

                loadedCount++;
                if (key === 'NEN_GAME') {
                    this.isLoaded = true;
                    console.log(`🎵 [MusicSystem] Nhạc nền (${key}) đã sẵn sàng!`);
                    if (this.playQueue) this.play();
                }

                if (loadedCount === totalSounds) {
                    console.log('📦 [MusicSystem] Toàn bộ âm thanh đã được nạp thành công!');
                }
            });
        }
    }

    /**
     * Phát một âm thanh bất kỳ dựa trên Key trong CONFIG
     */
    playSound(key, forceRestart = true) {
        const audio = this.sounds[key];
        if (!audio || !audio.buffer) return;

        // Cập nhật âm lượng real-time từ CONFIG trước khi phát
        const vol = Number(CONFIG.AUDIO[key]) || 0.5;
        audio.setVolume(vol);

        if (forceRestart && audio.isPlaying) {
            audio.stop();
        }

        if (!audio.isPlaying) {
            audio.play();
        }
    }

    /**
     * Logic phát nhạc nền (Hỗ trợ hàng chờ)
     */
    play() {
        const bgm = this.sounds['NEN_GAME'];
        if (!bgm) return;

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
     * Dừng nhạc nền
     */
    stop() {
        const bgm = this.sounds['NEN_GAME'];
        if (bgm && bgm.isPlaying) {
            bgm.stop();
            console.log('[MusicSystem] 🔇 Đã dừng nhạc nền.');
        }
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
}