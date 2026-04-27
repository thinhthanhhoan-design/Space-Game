import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './CONFIG.JS';

export class ModelCache {
    constructor() {
        this.loader = new GLTFLoader();
        this.cache = new Map();
        this.totalModels = 0;
        this.loadedCount = 0;
        this.isReady = false;
    }

    preload(onProgress) {
        const modelPaths = [
            CONFIG.ASSETS.MODELS.PLAYER_V1,
            CONFIG.ASSETS.MODELS.ENEMY_1,
            CONFIG.ASSETS.MODELS.BOSS_1,
            CONFIG.ASSETS.MODELS.BOSS_2,
            CONFIG.ASSETS.MODELS.BOSS_3
        ];

        this.totalModels = modelPaths.length;

        const promises = modelPaths.map(path => {
            return new Promise((resolve, reject) => {
                this.loader.load(path, (glb) => {
                    this.cache.set(path, glb);
                    this.loadedCount++;
                    if (onProgress) onProgress(this.loadedCount / this.totalModels);
                    resolve(glb);
                }, undefined, (err) => {
                    console.error(`Lỗi khi tải cache cho model: ${path}`, err);
                    resolve(null); // Vẫn resolve để không làm kẹt luồng preload
                });
            });
        });

        return Promise.all(promises).then(() => {
            this.isReady = true;
            console.log("🚀 ModelCache: Đã tải xong toàn bộ tài nguyên!");
        });
    }

    get(path) {
        const cached = this.cache.get(path);
        if (cached) {
            // Trả về bản clone để có thể dùng nhiều nơi
            return cached.scene.clone();
        }
        return null;
    }
}

export const modelCache = new ModelCache();
