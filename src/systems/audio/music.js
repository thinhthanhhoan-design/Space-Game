import * as THREE from 'three';

// Đây chính là lúc bạn "đặt tên" cho khối code này là MusicSystem
export class MusicSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.bgMusic = new THREE.Audio(this.listener);
        this.isLoaded = false;
    }

    init() {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/audio/music/nen_game.mp3', (buffer) => {
            this.bgMusic.setBuffer(buffer);
            this.bgMusic.setLoop(true);
            this.bgMusic.setVolume(0.5); 
            this.isLoaded = true;
            console.log('🎵 Nhạc nền đã sẵn sàng!');
        });
    }

    play() {
        if (this.isLoaded && !this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
    }
}