import * as THREE from 'three'; 

export class GameLoop {
    constructor(sceneController, gameManager) {
        this.sceneController = sceneController;
        this.gameManager = gameManager;
        
        // Polyfill cho tương lai (Three.js bản r163+ đưa Timer vào core)
        if (THREE.Timer) {
            this.timer = new THREE.Timer();
            console.log("🛠️ GameLoop: Đang sử dụng THREE.Timer (Stable Core) để đồng bộ thời gian.");
        } else {
            this.clock = new THREE.Clock();
            console.log("🛠️ GameLoop: Đang sử dụng THREE.Clock (Legacy).");
        }
    }

    start() {
        const animate = (timestamp) => {
            requestAnimationFrame(animate);
            
            let delta, elapsedTime;
            
            if (this.timer) {
                this.timer.update(timestamp);
                delta = this.timer.getDelta();
                elapsedTime = this.timer.getElapsed();
            } else {
                delta = this.clock.getDelta();
                elapsedTime = this.clock.getElapsedTime();
            }
            
            // Logic cập nhật trung tâm
            this.gameManager.update(elapsedTime, delta);
            this.sceneController.render();
        };
        animate();
    }
}
