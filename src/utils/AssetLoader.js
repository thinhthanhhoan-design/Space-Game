import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CONFIG } from './CONFIG.JS';

class AssetLoader {
    constructor() {
        this.isLoaded = false;
        // Global cache for assets accessible anywhere
        window.GameAssets = {
            models: {}
        };
        // Initialize LoadingManager and GLTFLoader with manager for centralized tracking
        this.manager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.manager);
        // Generic error handler for loading resources
        this.manager.onError = (url) => {
            console.error(`❌ [AssetLoader] Error loading resource: ${url}`);
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
        // Filter out procedural or undefined models
        const entries = Object.entries(modelsToLoad).filter(([name, path]) => path && path !== "PROCEDURAL");
        // Use LoadingManager to detect when all models are loaded
        this.manager.onLoad = () => {
            this.isLoaded = true;
            console.log("🚀 [AssetLoader] All models loaded and ready!");
            if (onCompleteCallback) onCompleteCallback();
        };
        // Load each model silently
        entries.forEach(([name, path]) => {
            this.loader.load(path, (gltf) => {
                window.GameAssets.models[name] = gltf.scene;
                console.log(`📦 [AssetLoader] Loaded: ${name}`);
            }, undefined, (err) => {
                console.warn(`⚠️ Failed to load model ${name}, continuing...`);
            });
        });
        // If there are no models to load, trigger the onLoad manually
        if (entries.length === 0) {
            this.manager.onLoad();
        }
    }

    /**
     * Nhân bản Model bằng SkeletonUtils để tránh lỗi chia sẻ xương/vật liệu
     * @param {string} modelName - Tên model trong GameAssets
     */
    cloneModel(modelName) {
        // Kiểm tra xem model này có được cấu hình là PROCEDURAL hay không
        const configPath = CONFIG.ASSETS.MODELS[modelName.toUpperCase()] || 
                           CONFIG.ASSETS.MODELS[modelName];
                           
        if (configPath === "PROCEDURAL") return null;

        const source = window.GameAssets.models[modelName];
        if (!source) {
            console.warn(`[AssetLoader] Không tìm thấy model ${modelName} trong cache.`);
            return null;
        }
        return SkeletonUtils.clone(source);
    }
}

export const assetLoader = new AssetLoader();
