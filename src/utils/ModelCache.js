import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CONFIG } from './CONFIG.JS';

export class ModelCache {
    constructor() {
        this.modelLoader = new GLTFLoader();
        this.audioLoader = new THREE.AudioLoader();
        
        this.models = new Map();
        this.audioBuffers = new Map();
        
        this.isReady = false;
        this.progress = 0;
    }

    /**
     * Nạp toàn bộ tài nguyên: Âm thanh trước, Model sau
     */
    async preloadAll(onProgress) {
        console.log("[ModelCache] Bắt đầu nạp tài nguyên...");

        // BƯỚC 1: Nạp ÂM THANH (Ưu tiên số 1)
        await this.preloadAudio((p) => {
            if (onProgress) onProgress(p * 0.4); // Âm thanh chiếm 40% tiến trình
        });

        // BƯỚC 2: Nạp MODELS
        await this.preloadModels((p) => {
            if (onProgress) onProgress(0.4 + p * 0.6); // Models chiếm 60% tiến trình
        });

        this.isReady = true;
        console.log("[ModelCache] Toàn bộ tài nguyên đã sẵn sàng và được Cache!");
    }

    async preloadAudio(onProgress) {
        const audioPaths = CONFIG.AUDIO.PATHS;
        const entries = Object.entries(audioPaths);
        const total = entries.length;
        if (total === 0) return;

        let loaded = 0;
        const promises = entries.map(([key, path]) => {
            return new Promise((resolve) => {
                this.audioLoader.load(path, (buffer) => {
                    this.audioBuffers.set(key, buffer);
                    loaded++;
                    if (onProgress) onProgress(loaded / total);
                    resolve();
                }, undefined, (err) => {
                    console.error(`[ModelCache] Lỗi nạp âm thanh ${key}:`, err);
                    resolve();
                });
            });
        });

        return Promise.all(promises);
    }

    async preloadModels(onProgress) {
        const modelsToLoad = {
            'ship': CONFIG.ASSETS.MODELS.PLAYER_V1,
            'enemy_1': CONFIG.ASSETS.MODELS.ENEMY_1,
            'boss_1': CONFIG.ASSETS.MODELS.BOSS_1,
            'boss_2': CONFIG.ASSETS.MODELS.BOSS_2,
            'boss_3': CONFIG.ASSETS.MODELS.BOSS_3,
            'asteroid': CONFIG.ASSETS.MODELS.ASTEROID
        };

        const entries = Object.entries(modelsToLoad).filter(([_, path]) => path && path !== "PROCEDURAL");
        const total = entries.length;
        if (total === 0) return;

        let loaded = 0;
        const promises = entries.map(([name, path]) => {
            return new Promise((resolve) => {
                this.modelLoader.load(path, (gltf) => {
                    this.models.set(name, gltf.scene);
                    loaded++;
                    if (onProgress) onProgress(loaded / total);
                    resolve();
                }, undefined, (err) => {
                    console.warn(`[ModelCache] Lỗi nạp model ${name}:`, err);
                    resolve();
                });
            });
        });

        return Promise.all(promises);
    }

    /**
     * Lấy model đã clone (Dùng SkeletonUtils để an toàn)
     */
    getModel(name) {
        const source = this.models.get(name);
        if (!source) return null;
        return SkeletonUtils.clone(source);
    }

    /**
     * Lấy audio buffer đã nạp
     */
    getAudioBuffer(key) {
        return this.audioBuffers.get(key);
    }
}

export const modelCache = new ModelCache();
