import * as THREE from 'three';

export class GameLoop {
    constructor(sceneController, gameManager) {
        this.sceneController = sceneController;
        this.gameManager = gameManager;
        this.clock = new THREE.Clock();
    }

    start() {
        const animate = () => {
            requestAnimationFrame(animate);
            const elapsedTime = this.clock.getElapsedTime();
            
            // Central update logic
            this.gameManager.update(elapsedTime);
            
            this.sceneController.render();
        };
        animate();
    }
}
