import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';

export class SceneController {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020205, 0.002);

        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 250);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }

        this.setupLights();
        
        // Cấu trúc cho Screen Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = new THREE.Vector3();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
    }

    triggerShake(intensity = 0.5, duration = 0.4) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    update(delta, playerMesh) {
        // 1. Logic Rung Màn Hình (Screen Shake)
        if (this.shakeDuration > 0) {
            this.shakeDuration -= delta;
            const currentIntensity = this.shakeIntensity * (this.shakeDuration / 0.4); // Giảm dần theo thời gian
            this.shakeOffset.set(
                (Math.random() - 0.5) * currentIntensity,
                (Math.random() - 0.5) * currentIntensity,
                (Math.random() - 0.5) * currentIntensity
            );
        } else {
            this.shakeOffset.set(0, 0, 0);
        }

        // 2. Camera Follow Logic (Chỉ chạy khi game đã bắt đầu và có tàu)
        if (playerMesh) {
            const targetPos = new THREE.Vector3().copy(playerMesh.position);
            const offset = CONFIG.CAMERA.OFFSET;
            
            // Tính toán vị trí camera đích
            const targetCameraPosition = new THREE.Vector3(
                targetPos.x + offset.x,
                targetPos.y + offset.y,
                targetPos.z + offset.z
            );

            // Lerp để camera đuổi theo mượt mà
            this.camera.position.lerp(targetCameraPosition, CONFIG.CAMERA.FOLLOW_LERP);
            
            // Áp dụng shake offset sau khi đã di chuyển camera
            this.camera.position.add(this.shakeOffset);
            
            // Luôn nhìn về phía trước máy bay một chút (Dynamic LookAt)
            const lookAtPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z - 10);
            this.camera.lookAt(lookAtPos);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
