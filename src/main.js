import { GameManager } from './systems/core/GameManager.js';

// Khởi chạy hệ thống
window.onload = async () => {
    console.log("[System] Hệ thống đã sẵn sàng. Đang kích hoạt GSA (Geometry Sample & Animation)...");
    
    // Khởi tạo trình quản lý game
    const game = new GameManager(); 
    await game.init(); 

    // Tiếp cận game instance từ console để gỡ lỗi
    window.UET_GAME = game;
};
