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
            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();
            
            // Central update logic
            this.gameManager.update(elapsedTime, delta);
            
            this.sceneController.render();
        };
        animate();
    }
}
