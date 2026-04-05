import { SceneController } from './SceneController.js';
import { GameLoop } from './GameLoop.js';
import { StateManager } from './StateManager.js';
import { Intro } from '../ui/Intro.js';
import { Player } from '../player/Player.js';
import { Background } from '../environment/Background.js';

export class GameManager {
    constructor() {
        this.sceneController = new SceneController();
        this.stateManager = new StateManager();
        this.gameLoop = new GameLoop(this.sceneController, this);
        
        this.intro = new Intro(this.sceneController);
        this.player = new Player(this.sceneController.scene);
        this.background = new Background();
    }

    init() {
        // Init Background
        this.background.init(this.sceneController.scene, '/textures/background.png');
        
        // Init Intro và chờ Player load xong để bắt đầu Transition
        this.intro.init((logoPoints) => {
            const checkModel = setInterval(() => {
                if (this.player.mesh) { // Kiểm tra player model đã load chưa
                    clearInterval(checkModel);
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => {
                        this.stateManager.setGameStarted(true);
                    });
                }
            }, 100);
        });

        // Bắt đầu vòng lặp game
        this.gameLoop.start();
    }

    update(elapsedTime) {
        // Xử lý game theo trạng thái
        if (!this.stateManager.isGameStarted) {
            this.intro.update(elapsedTime);
            if (this.player.mesh) this.player.mesh.visible = false; 
        } else {
            if (this.player.mesh) this.player.mesh.visible = true;
            if (this.player.update) this.player.update();
        }
        
        // Luôn luôn update background
        this.background.update();
    }
}
