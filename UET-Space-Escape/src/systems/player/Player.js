import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null; 

        const loader = new GLTFLoader();
        
        // Cập nhật đường dẫn tuyệt đối cho Vite từ public folder an toàn với cả thẻ Script gốc
        const modelUrl = new URL('../../../public/models/plane_1.glb', import.meta.url).href;
        loader.load(
            modelUrl, 
            (glb) => {
                this.mesh = glb.scene;
                this.mesh.scale.set(0.02, 0.02, 0.02); 
                this.mesh.position.y = 0; 
                this.scene.add(this.mesh);
                console.log("Đã tải xong máy bay!");
            },
            undefined, 
            (error) => {
                console.error('Lỗi khi tải mô hình máy bay .glb:', error);
            }
        );

        this.speed = 0.1;
        this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = true;
    }

    onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = false;
    }

    update() {
        if (!this.mesh) return; 

        if (this.keys.KeyW && this.mesh.position.y < 4) this.mesh.position.y += this.speed;
        if (this.keys.KeyS && this.mesh.position.y > -4) this.mesh.position.y -= this.speed;
        if (this.keys.KeyA && this.mesh.position.x > -6) this.mesh.position.x -= this.speed;
        if (this.keys.KeyD && this.mesh.position.x < 6) this.mesh.position.x += this.speed;
        
        if (this.keys.KeyA) this.mesh.rotation.z = 0.2;
        else if (this.keys.KeyD) this.mesh.rotation.z = -0.2;
        else this.mesh.rotation.z = 0; 
    }
}
