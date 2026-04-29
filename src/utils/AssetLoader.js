import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CONFIG } from './CONFIG.JS';

class AssetLoader {
    constructor() {
        this.isLoaded = false;
        // Cache toàn cục cho các tài nguyên
        window.GameAssets = {
            models: {}
        };
        // Khởi tạo LoadingManager và GLTFLoader
        this.manager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.manager);
        
        this.manager.onError = (url) => {
            console.error(`[AssetLoader] Lỗi khi nạp tài nguyên: ${url}`);
        };
    }

    preloadAllModels(onCompleteCallback) {
        const modelsToLoad = {
            'ship': CONFIG.ASSETS.MODELS.PLAYER_V1,
            'enemy_1': CONFIG.ASSETS.MODELS.ENEMY_1,
            'boss_1': CONFIG.ASSETS.MODELS.BOSS_1,
            'boss_2': CONFIG.ASSETS.MODELS.BOSS_2,
            'boss_3': CONFIG.ASSETS.MODELS.BOSS_3,
            'asteroid': CONFIG.ASSETS.MODELS.ASTEROID
        };
        
        const entries = Object.entries(modelsToLoad).filter(([name, path]) => path && path !== "PROCEDURAL");
        
        this.manager.onLoad = () => {
            this.isLoaded = true;
            console.log("[AssetLoader] Hoàn tất nạp toàn bộ mô hình!");
            if (onCompleteCallback) onCompleteCallback();
        };

        entries.forEach(([name, path]) => {
            this.loader.load(path, (gltf) => {
                window.GameAssets.models[name] = gltf.scene;
                console.log(`[AssetLoader] Đã nạp: ${name}`);
            }, undefined, (err) => {
                console.warn(`[AssetLoader] Không thể nạp mô hình ${name}, đang tiếp tục...`);
            });
        });

        if (entries.length === 0) {
            this.manager.onLoad();
        }
    }

    /**
     * Nhân bản Model bằng SkeletonUtils để tránh lỗi chia sẻ xương/vật liệu
     * @param {string} modelName - Tên model trong GameAssets
     */
    cloneModel(modelName) {
        const configPath = CONFIG.ASSETS.MODELS[modelName.toUpperCase()] || 
                           CONFIG.ASSETS.MODELS[modelName];
                           
        if (configPath === "PROCEDURAL") return null;

        const source = window.GameAssets.models[modelName];
        if (!source) {
            console.warn(`[AssetLoader] Không tìm thấy mô hình ${modelName} trong cache.`);
            return null;
        }
        return SkeletonUtils.clone(source);
    }
}

export const assetLoader = new AssetLoader();
