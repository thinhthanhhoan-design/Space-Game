import { GameManager } from './systems/core/GameManager.js';

// Khởi chạy toàn bộ hệ thống
window.onload = () => {
    const game = new GameManager();
    game.init();
};
