import * as THREE from 'three';

export class MusicSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        
        this.bgMusic = new THREE.Audio(this.listener);
        this.levelUpSound = new THREE.Audio(this.listener);
        this.victorySound = new THREE.Audio(this.listener);
        this.gameOverSound = new THREE.Audio(this.listener);
        
        this.isLoaded = false;
    }

    init() {
        const audioLoader = new THREE.AudioLoader();
        
        // Tải nhạc nền
        audioLoader.load('/audio/music/nen_game.mp3', (buffer) => {
            this.bgMusic.setBuffer(buffer);
            this.bgMusic.setLoop(true);
            this.bgMusic.setVolume(0.4); 
            this.isLoaded = true;
            console.log('🎵 Nhạc nền đã sẵn sàng!');
        });

        // Tải âm thanh lên cấp
        audioLoader.load('/audio/music/level_up.mp3', (buffer) => {
            this.levelUpSound.setBuffer(buffer);
            this.levelUpSound.setVolume(0.7);
        });

        // Tải âm thanh chiến thắng
        audioLoader.load('/audio/music/victory.mp3', (buffer) => {
            this.victorySound.setBuffer(buffer);
            this.victorySound.setVolume(0.8);
        });

        // Tải âm thanh thất bại
        audioLoader.load('/audio/music/gameover.mp3', (buffer) => {
            this.gameOverSound.setBuffer(buffer);
            this.gameOverSound.setVolume(0.8);
        });
    }

    play() {
        if (this.isLoaded && !this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
    }

    playLevelUpSound() {
        if (this.levelUpSound.buffer) {
            if (this.levelUpSound.isPlaying) this.levelUpSound.stop();
            this.levelUpSound.play();
        }
    }

    playVictorySound() {
        if (this.victorySound.buffer) {
            if (this.bgMusic.isPlaying) this.bgMusic.stop(); // Dừng nhạc nền khi thắng
            this.victorySound.play();
        }
    }

    playGameOverSound() {
        if (this.gameOverSound.buffer) {
            if (this.bgMusic.isPlaying) this.bgMusic.stop(); // Dừng nhạc nền khi thua
            this.gameOverSound.play();
        }
    }
}