export const GAME_STATE = {
    INTRO: 'INTRO',
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

export class StateManager {
    constructor() {
        this.currentState = GAME_STATE.INTRO;
        this.isGameStarted = false;
    }

    setGameStarted(status) {
        this.isGameStarted = status;
        if (status) {
            this.currentState = GAME_STATE.PLAYING;
        }
    }
}
