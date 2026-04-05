import { SceneController } from './SceneController.js';
import { GameLoop } from './GameLoop.js';
import { StateManager } from './StateManager.js';
import { Intro } from '../ui/Intro.js';
import { Player } from '../player/Player.js';
import { Background } from '../environment/Background.js';

import { CONFIG } from '../../utils/CONFIG.JS';

export class GameManager {
    constructor() {
        this.sceneController = new SceneController();
        this.stateManager = new StateManager();
        this.gameLoop = new GameLoop(this.sceneController, this);
        
        this.intro = new Intro(this.sceneController);
        this.player = new Player(this.sceneController.scene);
        this.background = new Background();
        // AsteroidSystem đã bị gỡ bỏ theo yêu cầu
    }

    init() {
        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG;
        this.background.init(this.sceneController.scene, bgUrl);
        
        this.intro.init((logoPoints) => {
            const checkModel = setInterval(() => {
                if (this.player.mesh) {
                    clearInterval(checkModel);
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => {
                        this.stateManager.setGameStarted(true);
                    });
                }
            }, 100);
        });

        this.gameLoop.start();
    }

    update(elapsedTime, delta) {
        if (!this.stateManager.isGameStarted) {
            this.intro.update(elapsedTime);
            if (this.player.mesh) this.player.mesh.visible = false;
        } else {
            if (this.player.mesh) {
                this.player.mesh.visible = true;
                this.player.update();

                // --- HORIZON BANKING (WORLD ROLL) ---
                const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
                let xRatio = this.player.mesh.position.x / envX;
                xRatio = Math.max(-1.8, Math.min(1.8, xRatio));
                
                const targetBgRoll = -xRatio * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT;
                this.background.setRoll(targetBgRoll, CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS);
            }
        }

        // --- CAMERA UPDATE ---
        if (this.stateManager.isGameStarted) {
            this.sceneController.update(delta, this.player.mesh);
        }
        
        this.background.update();
    }
}
